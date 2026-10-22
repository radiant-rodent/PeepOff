-- ============================================================
--  PeepOff leaderboard - Supabase schema
--  Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
--  Model: append-only. Anonymous clients (no sign-in, no verification)
--  can only INSERT weighted rows and SELECT the aggregate views.
--  Nothing can be updated or deleted, and the raw rows are never exposed.
-- ============================================================

-- ---------- live votes ----------
-- one row per pick; weight is +1 for a pick, -1 when a pick is undone

create table if not exists public.votes (
  id         bigint generated always as identity primary key,
  winner_id  text     not null,
  loser_id   text     not null,
  weight     smallint not null default 1,
  created_at timestamptz not null default now(),
  constraint votes_weight_ck   check (weight in (-1, 1)),
  constraint votes_distinct_ck check (winner_id <> loser_id),
  constraint votes_length_ck   check (char_length(winner_id) <= 24 and char_length(loser_id) <= 24)
);

-- one row per finished tournament (the song that won the whole bracket)

create table if not exists public.champions (
  id         bigint generated always as identity primary key,
  song_id    text     not null,
  weight     smallint not null default 1,
  created_at timestamptz not null default now(),
  constraint champions_weight_ck check (weight in (-1, 1)),
  constraint champions_length_ck check (char_length(song_id) <= 24)
);

-- ---------- imported history ----------
-- Optional. seed.sql fills these with the totals from the old leaderboard,
-- so the board carries over instead of starting from zero.

create table if not exists public.legacy_songs (
  song_id text primary key,
  wins    int not null default 0,
  losses  int not null default 0,
  titles  int not null default 0
);

create table if not exists public.legacy_meta (
  id          int primary key default 1,
  tournaments int not null default 0,
  constraint legacy_meta_single_row check (id = 1)
);

-- ---------- lock everything down ----------

alter table public.votes        enable row level security;
alter table public.champions    enable row level security;
alter table public.legacy_songs enable row level security;
alter table public.legacy_meta  enable row level security;

-- clients may append, nothing else
drop policy if exists "append votes" on public.votes;
create policy "append votes" on public.votes
  for insert to anon, authenticated with check (true);

drop policy if exists "append champions" on public.champions;
create policy "append champions" on public.champions
  for insert to anon, authenticated with check (true);

grant insert on public.votes, public.champions to anon, authenticated;

-- ---------- read side: aggregates only ----------
-- These views deliberately run with the owner's rights, which is what lets
-- anonymous clients read the totals without any access to the underlying rows.
-- (Supabase's linter will flag "security definer view" here - that is intended.)

create or replace view public.standings as
select song_id,
       sum(wins)::int   as wins,
       sum(losses)::int as losses
from (
  select winner_id as song_id, weight as wins, 0::int as losses from public.votes
  union all
  select loser_id, 0, weight from public.votes
  union all
  select song_id, wins, losses from public.legacy_songs
) t
group by song_id
having sum(wins) + sum(losses) > 0;

create or replace view public.champion_totals as
select song_id, sum(titles)::int as titles
from (
  select song_id, sum(weight)::int as titles from public.champions group by song_id
  union all
  select song_id, titles from public.legacy_songs
) t
group by song_id
having sum(titles) > 0;

create or replace view public.global_stats as
select
  (select coalesce(sum(weight), 0) from public.votes)::int
    + (select coalesce(sum(wins), 0) from public.legacy_songs)::int as picks,
  (select coalesce(sum(weight), 0) from public.champions)::int
    + coalesce((select tournaments from public.legacy_meta where id = 1), 0)   as tournaments;

grant select on public.standings, public.champion_totals, public.global_stats to anon, authenticated;

-- make the new views visible to the REST API straight away
notify pgrst, 'reload schema';
