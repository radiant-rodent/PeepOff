# PeepOff

A for-fun bracket for Lil Peep's discography: two songs show up, you pick the better one, the winner moves on, the loser is out. Repeat until one song is left.

**[Play it → radiant-rodent.github.io/PeepOff](https://radiant-rodent.github.io/PeepOff/)**

![The match screen](screenshots/match.png)

All 221 tracks are in the draw, and the pairings get re-shuffled every round, so no two brackets play out the same. A full run is 220 picks. Deezer serves 30-second previews, so you can actually listen before deciding.

<img src="screenshots/mobile.png" width="300" alt="PeepOff on a phone">

## The global board

Every pick is also counted on a shared leaderboard, ranked Elo-style (1500 = average). Play enough and it turns into a rough community ranking of his best songs.

![The global leaderboard](screenshots/leaderboard.png)

## Keyboard

`1` / `2` or `←` / `→` to vote · `Q` / `W` to preview the left/right song · `M` to mute · `Z` to undo. Progress saves automatically, so you can close the tab mid-bracket and pick it back up later.

## How it's put together

Static files on GitHub Pages. No server, no build step, no framework.

- `songs.js` — the catalog, generated from the Deezer API (see `update-songs.mjs`)
- `app.js` — bracket, voting, previews, local save
- `stats.js` — the shared leaderboard
- `.github/workflows/deploy.yml` — builds and deploys on every push

The leaderboard is a JSON blob on a Telegraph page that the browser writes to directly; `stats.js` batches picks and retries when you're offline. The write token is injected at deploy time from a repo secret rather than living in the source.

### Run it locally

Open `index.html`. That's it.

For the global board, copy `stats-config.example.js` to `stats-config.js` and add a token — without it the game still works and votes just queue up locally.

### Refresh the catalog

```bash
node update-songs.mjs
```

## Notes

Fan project, not affiliated with Lil Peep's estate. Only released, streamable tracks are included — the unreleased leaks aren't on any streaming service, so they're not in here.
