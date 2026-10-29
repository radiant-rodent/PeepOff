import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { mergeCatalogMetadata } from "../catalog-metadata.mjs";

const json = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
const additional = json("../unreleased-songs.json");
const overrides = json("../catalog-overrides.json");
const context = { window: {} };
vm.runInNewContext(readFileSync(new URL("../songs.js", import.meta.url), "utf8"), context);
const catalog = JSON.parse(JSON.stringify(context.window.PEEP_SONGS));
const byId = new Map(catalog.map((song) => [String(song.id), song]));
const additions = [
  "unr-300feetbelow", "unr-raveyardshift", "unr-shesaid", "unr-hatemyfuccnlife",
  "unr-deathwish", "unr-lilpoopfreestyle", "unr-nottheone", "unr-tearing",
  "unr-nolove", "unr-ohitslit", "unr-burntdiary", "unr-freebeez", "unr-indisbih",
  "unr-sodium", "unr-zzz", "unr-getfuckedup", "unr-blackclothes",
  "2495371651", "2495371751", "unr-kissmehorsehead",
  "unr-yungdumbgoth", "unr-fuckfame", "unr-unbreakable", "unr-newworldorder",
  "unr-doubtme", "unr-unify", "unr-icantfeelmyface",
];

test("311 valid songs, unique IDs, and playable source metadata", () => {
  assert.equal(catalog.length, 311);
  assert.equal(byId.size, catalog.length);
  assert(!byId.has("unr-dead"));
  for (const song of catalog) {
    assert(String(song.id).length <= 24, `${song.id}: Supabase ID limit`);
    for (const field of ["title", "album", "cover", "link"]) assert(song[field], `${song.id}: ${field}`);
    assert(Number.isFinite(song.dur) && song.dur > 0);
    for (const field of ["cover", "link", "preview"]) {
      if (song[field]) assert.equal(new URL(song[field]).protocol, "https:");
    }
    if (typeof song.id === "string") assert(song.preview, `${song.id}: archive preview required`);
    if (song.previewStart !== undefined) {
      assert(song.previewStart >= 0 && song.previewStart + 30 <= song.dur, `${song.id}: preview bounds`);
    }
  }
});

test("all 27 vocal-qualified additions are present, including hooks and outros", () => {
  assert.equal(additions.length, 27);
  for (const id of additions) assert(byId.has(id), id);
});

test("source entries and canonical project overrides survive regeneration", () => {
  const merged = mergeCatalogMetadata(catalog, additional, overrides);
  assert.deepEqual(merged, catalog);
  assert.equal(additional.length, 91);
  for (const song of additional) assert.deepEqual(byId.get(String(song.id)), song);
  for (const [id, metadata] of Object.entries(overrides)) {
    assert(byId.has(id), `stale override: ${id}`);
    for (const [field, value] of Object.entries(metadata)) assert.equal(byId.get(id)[field], value);
  }
});

test("project names and artwork are paired consistently", () => {
  for (const album of ["ELEMENTAL", "LIVE FOREVER", "LIL PEEP; PART ONE", "CALIFORNIA GIRLS", "Come Over When You're Sober, Pt. 1", "DIAMONDS"]) {
    const songs = catalog.filter((song) => song.album === album);
    assert(songs.length > 0, album);
    // LIVE FOREVER's existing re-release artwork includes two crops. All other
    // normalized projects use precisely the same artwork URL for every song.
    if (album !== "LIVE FOREVER") assert.equal(new Set(songs.map((song) => song.cover)).size, 1, album);
  }
  assert.equal(catalog.filter((song) => song.album === "ELEMENTAL").length, 4);
  assert.equal(catalog.filter((song) => song.album === "Mall Musicc").length, 18);
});

test("ID merge preserves different recordings sharing a title", () => {
  assert.equal(byId.get("2445215695").album, "DIAMONDS");
  assert.equal(byId.get("unr-kissmehorsehead").title, "Kiss Me (feat. Horse Head)");
  const input = [{ id: 1, title: "Kiss Me", album: "DIAMONDS" }];
  const curated = [{ id: "2", title: "Kiss Me", album: "Kiss Me" }];
  const result = mergeCatalogMetadata(input, curated, { 1: { id: "wrong", album: "Updated" } });
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 1);
  assert.equal(input[0].album, "DIAMONDS");
});

test("numeric/string copies of the same ID merge once with curated metadata", () => {
  const result = mergeCatalogMetadata([{ id: 123, title: "API" }], [{ id: "123", title: "Curated" }]);
  assert.deepEqual(result, [{ id: "123", title: "Curated" }]);
});
