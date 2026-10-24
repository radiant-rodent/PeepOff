(() => {
  "use strict";

  const URL = (window.PEEPOFF_SUPABASE_URL || "").replace(/\/+$/, "");
  const KEY = window.PEEPOFF_SUPABASE_ANON_KEY || "";
  const configured = Boolean(URL && KEY);

  const isLocalEnv = () => {
    try {
      const h = window.location.hostname;
      const p = window.location.protocol;
      return p === "file:" || h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local");
    } catch {
      return false;
    }
  };

  const urlParams = (typeof window !== "undefined" && window.location && window.location.search)
    ? new URLSearchParams(window.location.search)
    : null;
  const forceLive = urlParams && urlParams.get("live") === "1";
  const forceTest = urlParams && (urlParams.get("test") === "1" || urlParams.get("local") === "1");
  const isTestMode = !forceLive && (forceTest || window.PEEPOFF_LOCAL_TEST === true || isLocalEnv());

  if (isTestMode) {
    console.info("🛡️ PeepOff Local Test Mode Active — Live database protected. No votes will be sent to Supabase.");
  }

  const PENDING_KEY = isTestMode ? "peepoff-test-votes-pending" : "peepoff-votes-pending";
  const CACHE_KEY = isTestMode ? "peepoff-test-stats-cache" : "peepoff-stats-cache";
  const TEST_COMMITTED_KEY = "peepoff-test-votes-committed";

  const FLUSH_DELAY = 4000;
  const RETRY_DELAY = 15000;
  const BASE_RATING = 1500;

  const empty = () => ({ picks: 0, tournaments: 0, songs: {}, champions: {} });
  const clone = (obj) => JSON.parse(JSON.stringify(obj));

  let data = empty();
  let testCommitted = empty();
  let pending = { votes: [], champions: [] };
  let listeners = [];
  let flushTimer = null;
  let flushing = false;
  let offline = false;
  let lastSync = 0;

  function notify() {
    for (const fn of listeners) {
      try {
        fn();
      } catch {}
    }
  }

  function pendingCount() {
    return pending.votes.length + pending.champions.length;
  }

  function addInto(target, votes, champions, sign) {
    for (const v of votes) {
      const w = String(v.w);
      const l = String(v.l);
      const wr = target.songs[w] || (target.songs[w] = { w: 0, l: 0 });
      wr.w += sign * v.s;
      const lr = target.songs[l] || (target.songs[l] = { w: 0, l: 0 });
      lr.l += sign * v.s;
      target.picks += sign * v.s;
      if (!wr.w && !wr.l) delete target.songs[w];
      if (!lr.w && !lr.l) delete target.songs[l];
    }
    for (const c of champions) {
      const id = String(c.id);
      target.champions[id] = (target.champions[id] || 0) + sign * c.s;
      target.tournaments += sign * c.s;
      if (!target.champions[id]) delete target.champions[id];
    }
  }

  function view() {
    const out = clone(data);
    if (isTestMode) {
      for (const [id, rec] of Object.entries(testCommitted.songs)) {
        const cur = out.songs[id] || (out.songs[id] = { w: 0, l: 0 });
        cur.w += rec.w;
        cur.l += rec.l;
      }
      for (const [id, count] of Object.entries(testCommitted.champions)) {
        out.champions[id] = (out.champions[id] || 0) + count;
      }
      out.picks += testCommitted.picks;
      out.tournaments += testCommitted.tournaments;
    }
    addInto(out, pending.votes, pending.champions, 1);
    return out;
  }

  function persist() {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch {}
  }

  function cacheSave() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {}
  }

  function testCommittedSave() {
    if (isTestMode) {
      try {
        localStorage.setItem(TEST_COMMITTED_KEY, JSON.stringify(testCommitted));
      } catch {}
    }
  }

  function restore() {
    try {
      const p = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (p && Array.isArray(p.votes) && Array.isArray(p.champions)) pending = p;
    } catch {}
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c && c.songs) data = c;
    } catch {}
    if (isTestMode) {
      try {
        const t = JSON.parse(localStorage.getItem(TEST_COMMITTED_KEY) || "null");
        if (t && t.songs) testCommitted = t;
      } catch {}
    }
  }

  async function rest(path, init) {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      ...(init || {}),
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        ...((init && init.headers) || {}),
      },
    });
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function load() {
    if (!configured || typeof fetch !== "function") return null;
    try {
      const [stats, rows, titles] = await Promise.all([
        rest("global_stats?select=picks,tournaments"),
        rest("standings?select=song_id,wins,losses"),
        rest("champion_totals?select=song_id,titles"),
      ]);
      const next = empty();
      if (stats && stats[0]) {
        next.picks = stats[0].picks || 0;
        next.tournaments = stats[0].tournaments || 0;
      }
      for (const r of rows || []) next.songs[String(r.song_id)] = { w: r.wins, l: r.losses };
      for (const r of titles || []) next.champions[String(r.song_id)] = r.titles;
      data = next;
      offline = false;
      lastSync = Date.now();
      cacheSave();
      notify();
      return data;
    } catch {
      offline = true;
      notify();
      return null;
    }
  }

  function schedule(delay = FLUSH_DELAY) {
    if (flushTimer !== null) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, delay);
  }

  async function flush() {
    if (flushing || !configured || typeof fetch !== "function") return;
    if (!pendingCount()) return;
    flushing = true;
    notify();

    if (isTestMode) {
      // In local test mode: DO NOT send POST to live Supabase!
      // Safely commit pending votes locally so standings and Elo update.
      const votes = pending.votes.slice();
      const champions = pending.champions.slice();
      addInto(testCommitted, votes, champions, 1);
      pending.votes.splice(0, votes.length);
      pending.champions.splice(0, champions.length);
      offline = false;
      lastSync = Date.now();
      persist();
      testCommittedSave();
      flushing = false;
      notify();
      return;
    }

    const votes = pending.votes.slice();
    const champions = pending.champions.slice();
    try {
      if (votes.length) {
        await rest("votes", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(
            votes.map((v) => ({ winner_id: String(v.w), loser_id: String(v.l), weight: v.s }))
          ),
        });
        pending.votes.splice(0, votes.length);
        addInto(data, votes, [], 1);
      }
      if (champions.length) {
        await rest("champions", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(champions.map((c) => ({ song_id: String(c.id), weight: c.s }))),
        });
        pending.champions.splice(0, champions.length);
        addInto(data, [], champions, 1);
      }
      offline = false;
      lastSync = Date.now();
      persist();
      cacheSave();
    } catch {
      offline = true;
      schedule(RETRY_DELAY);
    } finally {
      flushing = false;
      notify();
    }
  }

  function recordPick(winnerId, loserId, sign = 1) {
    pending.votes.push({ w: String(winnerId), l: String(loserId), s: sign });
    persist();
    schedule();
    notify();
  }

  function recordChampion(id, sign = 1) {
    pending.champions.push({ id: String(id), s: sign });
    persist();
    schedule();
    notify();
  }

  function resetTestData() {
    if (!isTestMode) return;
    testCommitted = empty();
    pending = { votes: [], champions: [] };
    persist();
    testCommittedSave();
    notify();
  }

  function ratingOf(rec) {
    return Math.round(BASE_RATING + 400 * Math.log10((rec.w + 2) / (rec.l + 2)));
  }

  function standings() {
    const v = view();
    const rows = Object.entries(v.songs).map(([id, rec]) => ({
      id,
      w: rec.w,
      l: rec.l,
      matches: rec.w + rec.l,
      rating: ratingOf(rec),
      winRate: rec.w / (rec.w + rec.l),
      titles: v.champions[id] || 0,
    }));
    rows.sort((a, b) => {
      if ((a.matches === 0) !== (b.matches === 0)) return a.matches === 0 ? 1 : -1;
      return b.rating - a.rating || b.matches - a.matches || a.id.localeCompare(b.id);
    });
    return { tournaments: v.tournaments, picks: v.picks, rows };
  }

  window.PeepOffStats = {
    recordPick,
    recordChampion,
    resetTestData,
    load,
    flush,
    standings,
    onUpdate(fn) {
      listeners.push(fn);
      return () => {
        listeners = listeners.filter((f) => f !== fn);
      };
    },
    get status() {
      return {
        configured,
        flushing,
        offline,
        lastSync,
        pending: pendingCount(),
        testMode: isTestMode,
      };
    },
  };

  restore();
  if (pendingCount() > 0) schedule(1500);
})();
