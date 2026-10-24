(() => {
  "use strict";

  const CATALOG = window.PEEP_SONGS || [];
  const TOTAL = CATALOG.length;
  const KEY = "peepoff-v1-" + TOTAL;
  const AUDIO_KEY = "peepoff-audio";
  const MAX_UNDO = 40;

  const $ = (id) => document.getElementById(id);
  const els = {
    game: $("game"),
    champion: $("champion"),
    roundLabel: $("roundLabel"),
    matchLabel: $("matchLabel"),
    leftLabel: $("leftLabel"),
    progressFill: $("progressFill"),
    song: [$("songA"), $("songB")],
    art: [$("artA"), $("artB")],
    title: [$("titleA"), $("titleB")],
    album: [$("albumA"), $("albumB")],
    dur: [$("durA"), $("durB")],
    play: [$("playA"), $("playB")],
    undoBtn: $("undoBtn"),
    restartBtn: $("restartBtn"),
    againBtn: $("againBtn"),
    champArt: $("champArt"),
    champTitle: $("champTitle"),
    champAlbum: $("champAlbum"),
    champStats: $("champStats"),
    footerCount: $("footerCount"),
    toast: $("toast"),
    volumeSlider: $("volumeSlider"),
    muteBtn: $("muteBtn"),
    globalBtn: $("globalBtn"),
    backBtn: $("backBtn"),
    leaderboard: $("leaderboard"),
    lbRows: $("lbRows"),
    lbSummary: $("lbSummary"),
    lbStatus: $("lbStatus"),
  };

  const Stats = window.PeepOffStats || {
    recordPick() {},
    recordChampion() {},
    load() {},
    flush() {},
    resetTestData() {},
    standings: () => ({ tournaments: 0, picks: 0, rows: [] }),
    onUpdate() {},
    status: {},
  };

  const byTrackId = new Map();
  for (const s of CATALOG) {
    byTrackId.set(String(s.id), s);
    byTrackId.set(s.id, s);
  }
  const sinking = byTrackId.get("1143684982");
  if (sinking) {
    byTrackId.set("unr-wordsyouhearonasinki", sinking);
  }
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let state = null;
  let undoStack = [];
  let pickLog = [];
  let uiView = "game";
  let lbTimer = null;
  let locked = false;
  let playingIdx = null;
  let playingSongId = null;
  let audioLoading = false;
  let previewTimer = null;
  let playToken = 0;
  let audio = null;
  let volume = 0.9;
  let muted = false;
  const previewCache = new Map();

  try {
    const prefs = JSON.parse(localStorage.getItem(AUDIO_KEY) || "");
    if (typeof prefs.volume === "number" && prefs.volume >= 0 && prefs.volume <= 1) volume = prefs.volume;
    muted = prefs.muted === true;
  } catch {}

  const fmtDur = (sec) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- tournament state ---------- */

  function freshState() {
    return {
      current: shuffle([...CATALOG.keys()]),
      playable: [],
      bye: null,
      matchIdx: 0,
      winners: [],
      round: 0,
      played: 0,
      champion: null,
    };
  }

  function beginRound() {
    state.round++;
    state.playable = shuffle(state.current.slice());
    state.bye = null;
    if (state.playable.length > 1 && state.playable.length % 2 === 1) {
      state.bye = state.playable.pop();
    }
    state.matchIdx = 0;
    state.winners = [];
  }

  function currentMatch() {
    const i = state.matchIdx * 2;
    return [state.playable[i], state.playable[i + 1]];
  }

  function validSnapshot(s) {
    if (!s || !Array.isArray(s.current) || !Array.isArray(s.playable) || !Array.isArray(s.winners)) return false;
    const ids = [...s.current, ...s.playable, ...s.winners];
    if (s.bye !== null && s.bye !== undefined) ids.push(s.bye);
    if (s.champion !== null && s.champion !== undefined) ids.push(s.champion);
    return ids.every((x) => Number.isInteger(x) && x >= 0 && x < TOTAL);
  }

  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ state, undo: undoStack.slice(-MAX_UNDO), pickLog: pickLog.slice(-MAX_UNDO) })
      );
    } catch {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!validSnapshot(data.state)) return null;
      undoStack = Array.isArray(data.undo) ? data.undo.filter(validSnapshot) : [];
      pickLog = Array.isArray(data.pickLog)
        ? data.pickLog.filter((p) => p && Number.isInteger(p.winner) && Number.isInteger(p.loser))
        : [];
      return data.state;
    } catch {
      return null;
    }
  }

  function pushUndo() {
    undoStack.push(JSON.parse(JSON.stringify(state)));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
  }

  /* ---------- gameplay ---------- */

  function pick(which) {
    if (locked || state.champion !== null) return;
    const [a, b] = currentMatch();
    if (a === undefined || b === undefined) return;
    locked = true;
    stopPreview();

    const winner = which === 0 ? a : b;
    const loser = which === 0 ? b : a;
    els.song[which].classList.add("winner");
    els.song[1 - which].classList.add("loser");
    pushUndo();
    Stats.recordPick(CATALOG[winner].id, CATALOG[loser].id);

    window.setTimeout(() => {
      state.winners.push(winner);
      state.matchIdx++;
      state.played++;
      let crowned = null;

      if (state.matchIdx * 2 >= state.playable.length) {
        const next = state.winners.slice();
        if (state.bye !== null) next.push(state.bye);
        if (next.length === 1) {
          state.current = next;
          state.champion = next[0];
          crowned = next[0];
        } else {
          state.current = next;
          beginRound();
        }
      }

      pickLog.push({ winner, loser, crowned });
      if (pickLog.length > MAX_UNDO) pickLog.shift();
      if (crowned !== null) Stats.recordChampion(CATALOG[crowned].id);

      for (const el of els.song) el.classList.remove("winner", "loser");
      save();
      render();
      locked = false;
    }, 280);
  }

  function undo() {
    if (locked || !undoStack.length) return;
    const rec = pickLog.pop();
    if (rec) {
      Stats.recordPick(CATALOG[rec.winner].id, CATALOG[rec.loser].id, -1);
      if (rec.crowned !== null && rec.crowned !== undefined) {
        Stats.recordChampion(CATALOG[rec.crowned].id, -1);
      }
    }
    state = undoStack.pop();
    stopPreview();
    save();
    render();
    toast("Undid last pick");
  }

  function restart() {
    state = freshState();
    beginRound();
    undoStack = [];
    pickLog = [];
    stopPreview();
    save();
    render();
  }

  /* ---------- rendering ---------- */

  function render() {
    els.undoBtn.disabled = undoStack.length === 0;
    if (uiView === "global") {
      els.game.hidden = true;
      els.champion.hidden = true;
      els.leaderboard.hidden = false;
      renderLeaderboard();
      return;
    }
    els.leaderboard.hidden = true;
    const hasChampion = state.champion !== null;
    els.game.hidden = hasChampion;
    els.champion.hidden = !hasChampion;
    if (hasChampion) renderChampion(state.champion);
    else renderMatch();
  }

  function timeAgo(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return `${s}s ago`;
    return `${Math.round(s / 60)}m ago`;
  }

  function updateLbStatus() {
    const st = Stats.status || {};
    let text = "Connecting…";
    if (st.configured === false) text = "Stats sync not configured in this build";
    else if (st.flushing) text = "Syncing…";
    else if (st.offline) text = "Offline — showing last synced data";
    else if (st.pending) text = "Votes queued to sync";
    else if (st.lastSync) text = `Live · updated ${timeAgo(st.lastSync)}`;

    if (st.testMode) {
      els.lbStatus.innerHTML =
        '<span class="lb-test-badge" title="Running locally: votes stay on your machine and are never sent to the live database">🧪 Local test mode</span> ' +
        '<span class="muted">· Live DB protected</span> ' +
        '<button id="resetTestBtn" class="lb-reset-btn" type="button" title="Clear local test picks and reset leaderboard baseline">Reset test picks</button>';
      const resetBtn = $("resetTestBtn");
      if (resetBtn && !resetBtn.dataset.bound) {
        resetBtn.dataset.bound = "1";
        resetBtn.addEventListener("click", () => {
          Stats.resetTestData();
          toast("Local test picks cleared");
        });
      }
      return;
    }

    els.lbStatus.textContent = text;
    els.lbStatus.classList.toggle("offline", Boolean(st.offline));
  }

  let lastLeaderboardHtml = "";

  function renderLeaderboard() {
    const { tournaments, picks, rows } = Stats.standings();
    const ratedRows = rows.filter((r) => r.matches > 0);
    const played = ratedRows.length;
    els.lbSummary.textContent =
      `${tournaments} ${tournaments === 1 ? "tournament" : "tournaments"} · ` +
      `${picks} ${picks === 1 ? "pick" : "picks"} · ${played} of ${TOTAL} songs played`;

    const ratedIds = new Set(ratedRows.map((r) => String(r.id)));
    const unratedSongs = CATALOG
      .filter((s) => !ratedIds.has(String(s.id)))
      .sort((a, b) => a.title.localeCompare(b.title));

    let html = ratedRows
      .map((r, i) => {
        const s = byTrackId.get(String(r.id)) || byTrackId.get(r.id);
        const title = s ? s.title : `Unknown (${esc(r.id)})`;
        const album = s ? s.album : "";
        const cover = s ? s.cover : "";
        const pct = Math.round(r.winRate * 100);
        const sub = [`${pct}% win rate`, `${r.w}\u2013${r.l}`, r.titles ? `${r.titles} ${r.titles === 1 ? "title" : "titles"}` : ""]
          .filter(Boolean)
          .join(" \u00b7 ");
        return (
          `<div class="lb-row${i < 3 ? " top" : ""}">` +
          `<span class="lb-rank">${i + 1}</span>` +
          `<span class="lb-song">` +
          `<div class="lb-artwrap">` +
          `<img class="lb-art" src="${esc(cover)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='apple-touch-icon.png';" />` +
          `<button class="lb-play" type="button" data-id="${esc(r.id)}" title="Play preview" aria-label="Play preview for ${esc(title)}">` +
          `<span class="ico">&#9654;</span>` +
          `</button>` +
          `</div>` +
          `<span class="lb-names">` +
          `<span class="lb-title">${esc(title)}</span>` +
          `<span class="lb-album">${esc(album)}</span>` +
          `<span class="lb-sub">${esc(sub)}</span>` +
          `</span></span>` +
          `<span class="lb-rating">${r.rating}</span>` +
          `<span class="lb-win"><span class="lb-bar"><i style="width:${pct}%"></i></span><span class="lb-pct">${pct}%</span></span>` +
          `<span class="lb-record">${r.w}\u2013${r.l}</span>` +
          `<span class="lb-titles">${r.titles || ""}</span>` +
          `</div>`
        );
      })
      .join("");

    if (unratedSongs.length > 0) {
      html +=
        `<div class="lb-category-divider">` +
        `<div class="lb-category-title">` +
        `<span class="lb-category-tag">UNRATED</span>` +
        `<span class="lb-category-count">${unratedSongs.length} ${unratedSongs.length === 1 ? "song" : "songs"} awaiting votes</span>` +
        `</div>` +
        `<p class="lb-category-desc">These songs haven't been picked in a tournament yet. Vote on them in a bracket to give them their first ranking!</p>` +
        `</div>`;

      html += unratedSongs
        .map((s) => {
          return (
            `<div class="lb-row lb-unrated-row">` +
            `<span class="lb-rank muted">—</span>` +
            `<span class="lb-song">` +
            `<div class="lb-artwrap">` +
            `<img class="lb-art" src="${esc(s.cover)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='apple-touch-icon.png';" />` +
            `<button class="lb-play" type="button" data-id="${esc(s.id)}" title="Play preview" aria-label="Play preview for ${esc(s.title)}">` +
            `<span class="ico">&#9654;</span>` +
            `</button>` +
            `</div>` +
            `<span class="lb-names">` +
            `<span class="lb-title">${esc(s.title)}</span>` +
            `<span class="lb-album">${esc(s.album)}</span>` +
            `<span class="lb-sub muted">Unrated · 0–0</span>` +
            `</span></span>` +
            `<span class="lb-rating lb-unrated-label">Unrated</span>` +
            `<span class="lb-win"><span class="lb-bar"><i style="width:0%"></i></span><span class="lb-pct muted">—</span></span>` +
            `<span class="lb-record muted">0–0</span>` +
            `<span class="lb-titles muted">—</span>` +
            `</div>`
          );
        })
        .join("");
    }

    if (lastLeaderboardHtml !== html) {
      els.lbRows.innerHTML = html;
      lastLeaderboardHtml = html;
    }
    updateLbStatus();
    updatePlayButtonUI();
  }

  function openGlobal() {
    uiView = "global";
    render();
    Stats.load();
    Stats.flush();
    window.clearInterval(lbTimer);
    lbTimer = window.setInterval(() => Stats.load(), 20000);
  }

  function closeGlobal() {
    uiView = "game";
    window.clearInterval(lbTimer);
    lbTimer = null;
    render();
  }

  function renderMatch() {
    const [a, b] = currentMatch();
    [a, b].forEach((id, i) => {
      const s = CATALOG[id];
      els.art[i].onerror = () => {
        els.art[i].onerror = null;
        els.art[i].src = "apple-touch-icon.png";
      };
      els.art[i].src = s.cover;
      els.art[i].alt = `${s.title} — ${s.album}`;
      els.title[i].textContent = s.title;
      els.album[i].textContent = s.album;
      els.dur[i].textContent = fmtDur(s.dur);
      els.song[i].setAttribute("aria-label", `Pick ${s.title} by ${s.album}`);
    });
    updatePlayButtonUI();

    const matchesThisRound = state.playable.length >> 1;
    els.roundLabel.textContent = `Round ${state.round}`;
    els.matchLabel.textContent = `Match ${state.matchIdx + 1} of ${matchesThisRound}`;
    els.leftLabel.textContent = `${state.current.length - state.matchIdx} songs left`;
    els.progressFill.style.width = `${(state.played / (TOTAL - 1)) * 100}%`;
  }

  function renderChampion(id) {
    const s = CATALOG[id];
    els.champArt.src = s.cover;
    els.champArt.alt = `${s.title} — ${s.album}`;
    els.champTitle.textContent = s.title;
    els.champAlbum.textContent = s.album;
    els.champStats.textContent = `Survived ${state.round} rounds and ${state.played} picks out of ${TOTAL} songs.`;
  }

  /* ---------- previews & audio playback ---------- */

  let jsonpN = 0;
  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "__peepoffCb" + ++jsonpN;
      const script = document.createElement("script");
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("timeout"));
      }, 10000);
      function cleanup() {
        window.clearTimeout(timer);
        delete window[cb];
        script.remove();
      }
      window[cb] = (data) => {
        cleanup();
        resolve(data);
      };
      script.onerror = () => {
        cleanup();
        reject(new Error("network"));
      };
      script.src = `${url}${url.includes("?") ? "&" : "?"}output=jsonp&callback=${cb}`;
      document.head.appendChild(script);
    });
  }

  async function getPreview(song) {
    if (song.preview) return song.preview;
    const trackId = song.id;
    const hit = previewCache.get(trackId);
    if (hit && Date.now() - hit.at < 8 * 60 * 1000) return hit.url;
    const data = await jsonp(`https://api.deezer.com/track/${trackId}`);
    if (!data || !data.preview) throw new Error("no preview");
    previewCache.set(trackId, { url: data.preview, at: Date.now() });
    return data.preview;
  }

  function applyVolume() {
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
    els.volumeSlider.value = String(volume);
    els.muteBtn.classList.toggle("muted", muted || volume === 0);
    els.muteBtn.setAttribute("aria-pressed", String(muted));
    els.muteBtn.title = muted ? "Unmute (M)" : "Mute (M)";
    els.muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  function saveAudioPrefs() {
    try {
      localStorage.setItem(AUDIO_KEY, JSON.stringify({ volume, muted }));
    } catch {}
  }

  function getAudio() {
    if (!audio) {
      audio = new Audio();
      audio.preload = "none";
      audio.addEventListener("ended", () => {
        stopPreview();
      });
      audio.addEventListener("pause", () => {
        updatePlayButtonUI();
      });
      audio.addEventListener("play", () => {
        updatePlayButtonUI();
      });
      applyVolume();
    }
    return audio;
  }

  function updatePlayButtonUI() {
    // 1. Update match buttons
    const [a, b] = (state && state.playable && state.matchIdx !== undefined) ? currentMatch() : [null, null];
    [a, b].forEach((idx, i) => {
      const btn = els.play[i];
      if (!btn) return;
      const s = idx !== null && idx !== undefined ? CATALOG[idx] : null;
      const isThisPlaying = s && playingSongId !== null && String(s.id) === String(playingSongId) && audio && !audio.paused;
      const isThisLoading = s && playingSongId !== null && String(s.id) === String(playingSongId) && audioLoading;
      btn.classList.toggle("loading", isThisLoading);
      btn.classList.toggle("playing", isThisPlaying);
      btn.disabled = isThisLoading;
      const ico = btn.querySelector(".ico");
      if (ico) ico.textContent = isThisPlaying ? "\u275a\u275a" : "\u25b6";
    });

    // 2. Update leaderboard buttons
    if (els.lbRows) {
      const lbButtons = els.lbRows.querySelectorAll(".lb-play");
      lbButtons.forEach((btn) => {
        const id = btn.getAttribute("data-id");
        const isThisPlaying = id && playingSongId !== null && String(id) === String(playingSongId) && audio && !audio.paused;
        const isThisLoading = id && playingSongId !== null && String(id) === String(playingSongId) && audioLoading;
        btn.classList.toggle("loading", isThisLoading);
        btn.classList.toggle("playing", isThisPlaying);
        btn.disabled = isThisLoading;
        const ico = btn.querySelector(".ico");
        if (ico) ico.textContent = isThisPlaying ? "\u275a\u275a" : "\u25b6";
      });
    }
  }

  function stopPreview() {
    playToken++;
    audioLoading = false;
    playingSongId = null;
    playingIdx = null;
    window.clearTimeout(previewTimer);
    previewTimer = null;
    if (audio) {
      audio.pause();
    }
    updatePlayButtonUI();
  }

  async function togglePlaySong(song, matchIndex = null) {
    if (!song) return;
    const player = getAudio();
    const songId = String(song.id);

    if (playingSongId === songId && !player.paused) {
      stopPreview();
      return;
    }

    stopPreview();
    const token = ++playToken;
    playingSongId = songId;
    playingIdx = matchIndex;
    audioLoading = true;
    updatePlayButtonUI();

    try {
      const url = await getPreview(song);
      if (token !== playToken) return;

      player.src = url;
      const startOffset = Number(song.previewStart || song.start || 0);

      let seeked = false;
      const applySeek = () => {
        if (!seeked && startOffset > 0) {
          seeked = true;
          try { player.currentTime = startOffset; } catch {}
        }
      };

      if (startOffset > 0) {
        player.addEventListener("loadedmetadata", applySeek, { once: true });
      }

      await player.play();
      if (token !== playToken) {
        player.pause();
        return;
      }

      if (startOffset > 0 && player.currentTime < startOffset) {
        applySeek();
      }

      audioLoading = false;
      updatePlayButtonUI();

      // Enforce 30-second preview limit (standard Deezer preview length)
      window.clearTimeout(previewTimer);
      previewTimer = window.setTimeout(() => {
        if (token === playToken && playingSongId === songId) {
          stopPreview();
        }
      }, 30000);
    } catch {
      if (token !== playToken) return;
      stopPreview();
      toast("Couldn't load the preview — are you online?");
    }
  }

  function togglePlay(i) {
    const [a, b] = currentMatch();
    const song = CATALOG[i === 0 ? a : b];
    if (song) togglePlaySong(song, i);
  }

  /* ---------- toast ---------- */

  let toastTimer = null;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    requestAnimationFrame(() => els.toast.classList.add("show"));
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
      window.setTimeout(() => {
        els.toast.hidden = true;
      }, 220);
    }, 2200);
  }

  /* ---------- wiring ---------- */

  els.song.forEach((el, i) => {
    el.addEventListener("click", () => pick(i));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick(i);
      }
    });
  });

  els.play.forEach((btn, i) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay(i);
    });
  });

  els.volumeSlider.addEventListener("input", () => {
    volume = Number(els.volumeSlider.value);
    if (volume > 0) muted = false;
    applyVolume();
    saveAudioPrefs();
  });

  els.muteBtn.addEventListener("click", () => {
    muted = !muted;
    applyVolume();
    saveAudioPrefs();
  });

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement) {
      if (t.tagName === "TEXTAREA" || t.isContentEditable) return;
      if (t.tagName === "INPUT") {
        if (t.type !== "range") return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;
      }
    }
    if (e.key === " " || e.key === "Enter") return;
    if (e.key === "ArrowLeft" || e.key === "1") pick(0);
    else if (e.key === "ArrowRight" || e.key === "2") pick(1);
    else if (e.key === "q" || e.key === "Q") togglePlay(0);
    else if (e.key === "w" || e.key === "W") togglePlay(1);
    else if (e.key === "m" || e.key === "M") {
      muted = !muted;
      applyVolume();
      saveAudioPrefs();
    } else if (e.key === "z" || e.key === "Z") undo();
  });

  els.globalBtn.addEventListener("click", () => {
    if (uiView === "global") closeGlobal();
    else openGlobal();
  });
  els.backBtn.addEventListener("click", closeGlobal);
  els.lbRows.addEventListener("click", (e) => {
    const btn = e.target.closest(".lb-play");
    if (!btn) return;
    e.stopPropagation();
    const id = btn.getAttribute("data-id");
    const song = byTrackId.get(id);
    if (song) togglePlaySong(song);
  });
  Stats.onUpdate(() => {
    if (uiView === "global") renderLeaderboard();
  });

  els.undoBtn.addEventListener("click", undo);
  els.restartBtn.addEventListener("click", () => {
    if (window.confirm("Start a fresh bracket? Current progress will be lost.")) restart();
  });
  els.againBtn.addEventListener("click", () => restart());

  /* ---------- boot ---------- */

  function init() {
    if (TOTAL < 2) {
      document.querySelector(".wrap").innerHTML = "<p>Could not load the song catalog.</p>";
      return;
    }
    els.footerCount.textContent = `${TOTAL} songs · complete catalog`;
    applyVolume();
    state = load();
    if (!state) {
      state = freshState();
      beginRound();
      save();
    }
    render();
  }

  init();
})();
