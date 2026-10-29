-- ============================================================
--  PeepOff leaderboard - merge the retired "dead" entry into "hair dye"
--
--  "dead" (unr-dead) was a duplicate of "hair dye" (3571272611).
--  Run this once in the Supabase SQL editor (Dashboard -> SQL Editor)
--  with a role that can update/delete rows. Safe to re-run.
--
--  stats.js already aliases unr-dead -> 3571272611 on the client, so
--  the board looks correct even before this migration is applied.
--  Running it moves the stored rows for good.
-- ============================================================

begin;

-- 1. A dead-vs-hair-dye pick becomes a self-match once both sides share
--    an id, which would violate votes_distinct_ck. Drop those rows first.
delete from public.votes
where (winner_id = 'unr-dead' and loser_id = '3571272611')
   or (winner_id = '3571272611' and loser_id = 'unr-dead');

-- 2. Re-point the remaining live history.
update public.votes
set winner_id = '3571272611'
where winner_id = 'unr-dead';

update public.votes
set loser_id = '3571272611'
where loser_id = 'unr-dead';

update public.champions
set song_id = '3571272611'
where song_id = 'unr-dead';

-- 3. Merge imported totals (if either row exists) and drop the retired row.
insert into public.legacy_songs (song_id, wins, losses, titles)
select '3571272611',
       sum(wins)::int,
       sum(losses)::int,
       sum(titles)::int
from public.legacy_songs
where song_id in ('unr-dead', '3571272611')
having count(*) > 0
on conflict (song_id) do update
set wins   = excluded.wins,
    losses = excluded.losses,
    titles = excluded.titles;

delete from public.legacy_songs where song_id = 'unr-dead';

commit;
