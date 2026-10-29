// Curated entries take precedence over API metadata without changing song IDs.
// Match by ID, not title: the Horse Head and DIAMONDS songs called "Kiss Me"
// are different recordings and must both survive a catalog refresh.
export function mergeCatalogMetadata(streaming, additional, overrides = {}) {
  const songs = new Map(streaming.map((song) => [String(song.id), { ...song }]));
  for (const song of additional) {
    songs.set(String(song.id), { ...song });
  }
  return [...songs.values()].map((song) => ({
    ...song,
    ...(overrides[String(song.id)] || {}),
    id: song.id,
  }));
}
