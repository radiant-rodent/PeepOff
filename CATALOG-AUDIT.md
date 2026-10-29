# Catalog audit — 2026-10-29

## Implemented follow-up

The catalog now contains **311 songs**: the previous 284 entries plus **all 27 vocal-qualified additions**. Peep must actually contribute vocals; hooks, choruses, and outros qualify, not just separate verses. Existing catalog entries were not removed or merged.

### Added after checking the estate's lyrics

| Song | Peep's credited section |
| --- | --- |
| 300 Feet Below | Verse 1 |
| Raveyard Shift | Verse 2 |
| She Said | Verse 1 |
| Hate My Fucc'n Life | Verse 2 |
| DEATHWISH | Verse 1 |
| Lil Poop Freestyle | Verse (solo Peep recording) |
| Not the One | Verse (solo Peep recording; SinceWhen is the producer) |
| Tearing | Verse 2 |
| No Love | Verse 1 |
| Oh Its Lit | Verse 2 |
| Burnt Diary | Verse 1 |
| Freebee'z | Verse |
| In Dis Bih (Bih) | Verse 1 |
| Sodium | Verse 3 |
| ZZZ | Verses 2 and 3 |
| Get Fucked Up | Verse 1 |
| Black Clothes | Verse 1 |
| Lost in the Mail | Verse 2 |
| SDI22 | Verse |
| Kiss Me (with Horse Head) | Verse 2 |

The reference links for these tracks appear in the original findings below. The four added *Mall Musicc* tracks have their lyrics linked from the project's tracklist; the *Elemental* tracklist links the “Deathwish” lyrics.

### Also added after the vocal-contribution clarification

| Song | Peep's credited contribution |
| --- | --- |
| Yung Dumb Goth | Peep is credited on the chorus; Boy Froot has the verse |
| Fuck Fame | Peep is credited on the chorus; Lil Tracy has the verse |
| Unbreakable | Peep's section is credited as an outro, not a separate verse |
| NEWWORLDORDER | Peep is credited on the chorus; Ski Mask and Tracy have the verses |
| Doubt Me | Peep has the intro/chorus and backing vocals on Eddy Baker's verse, not his own verse |
| Unify | Peep is credited on the chorus; Agoff has the verse |
| I Can't Feel My Face | Peep has the intro/chorus/outro; KirbLaGoop and Mackned have the verses |

These seven were initially held back under the stricter separate-verse requirement. They are now included because Peep contributes vocals. All **18 Mall Musicc tracks** are now in the draw. The estate's lyric credits for all seven were checked, and each archived MP3 was downloaded temporarily and decoded to verify duration, validity, and recording tags.

### Metadata and source handling

- Applied canonical project names and matching covers to the 11 audited entries, and normalized the existing lowercase “live forever” album label. Streaming overrides live in `catalog-overrides.json`; archive corrections live in `unreleased-songs.json`.
- Reconciled all 11 archived artwork differences listed below with the estate's corresponding single artwork, including the “Down for You” cover/label inconsistency. The ambiguous “Fishscale” image was left alone.
- Every existing ID and existing audio source was preserved. No votes or championship history were changed. Both distinct “Kiss Me” songs remain separate.
- All 25 new archive audio files were downloaded temporarily and decoded as MP3s to verify file validity, duration, and recording tags; both new Deezer previews were also downloaded and decoded. Full audio is not checked into the repository.
- Five archive sources are standalone files in [the Mall Musicc archive](https://archive.org/details/peep-froot-musicc). Twenty are individually accessible MP3 members of [the When I Die You'll Love Me compilation](https://archive.org/details/lil-peep-when-i-die-youll-love-me-mp-3-compilation). The compilation name is not used as the songs' album metadata.
- ZIP-member responses do not support HTTP byte ranges. The player buffers only those sources as typed audio Blobs before seeking, keeps at most two in memory, and aborts pending downloads when playback is stopped/switched. The normal 30-second limit still applies.
- Archive preview offsets are configured excerpts, not word-aligned or transcription-verified verse boundaries.
- Numeric IDs `2495371651` and `2495371751` use the streaming album *Limosa Nostra Act 5* with its corresponding cover and dynamically resolved Deezer previews.
- Added offline catalog/merge regression tests. The footer now says “curated catalog,” not “complete catalog.”

The original audit findings below describe the pre-addition 284-song snapshot; resolved issues are retained as a record of what changed.

## Scope and limits

- Compared the current 284-song catalog with the [estate's music index](https://lilpeep.com/pages/music), all 26 linked project tracklists (199 tracklist rows, including repeated songs/versions), and 120 singles/features listings.
- Downloaded and visually reviewed 108 catalog-versus-estate artwork pairs for matched releases. These are comparisons, not 108 unique songs; album artwork is shared and the index contains some repeat releases.
- The initial audit was read-only. The implementation and validation work performed afterward is recorded above.
- The estate index is not an exhaustive list of every leak, feature, or recent release. A title match alone also cannot establish that two recordings are identical. Missing-track candidates need verified audio, duration, and a working preview before inclusion.
- Different artwork is not automatically wrong: an original single, album release, and later re-release can legitimately have different covers.

## Missing-track candidates

27 estate-listed songs are not represented by an identifiable catalog entry after accounting for the obvious naming aliases below. This count excludes intentionally collapsed OG/remix variants. It is a metadata-level comparison, not an audio-fingerprint claim.

### Incomplete projects: six songs

The [Mall Musicc tracklist](https://lilpeep.com/pages/mall-musicc-lyrics) contains 18 songs; the catalog contains the first 13 and lacks:

1. 300 Feet Below (with Boy Froot & Yung Rhubarb)
2. Raveyard Shift (with Boy Froot)
3. She Said (with Boy Froot)
4. Yung Dumb Goth (with Boy Froot)
5. Hate My Fucc'n Life (with Boy Froot)

The [Elemental tracklist](https://lilpeep.com/pages/elemental-lyrics) contains four songs; the catalog has three of them under standalone-song album labels and lacks:

6. DEATHWISH (with JGRXXN & Ghostemane)

### Singles/features: 21 songs

| Song | Collaborator(s) | Estate reference |
| --- | --- | --- |
| Lil Poop Freestyle | — | [Track](https://lilpeep.com/pages/lil-poop-freestyle-lyrics) |
| Fuck Fame | Lil Tracy | [Track](https://lilpeep.com/pages/fuck-fame-w-lil-tracy-lyrics) |
| Not the One | SinceWhen | [Track](https://lilpeep.com/pages/not-the-one-w-since-when-lyrics) |
| Unbreakable | Craig Xen | [Track](https://lilpeep.com/pages/unbreakable-w-craig-xen-lyrics) |
| Tearing | Drippin So Pretty | [Track](https://lilpeep.com/pages/tearing-w-drippin-so-pretty-lyrics) |
| NEWWORLDORDER | Ski Mask the Slump God & Lil Tracy | [Track](https://lilpeep.com/pages/newworldorder-w-ski-mask-the-slump-god-and-lil-tracy-lyrics) |
| No Love | Mikey Cortez | [Track](https://lilpeep.com/pages/no-love-w-mikey-cortez-lyrics) |
| Doubt Me | Eddy Baker | [Track](https://lilpeep.com/pages/doubt-me-feat-eddy-baker-lyrics) |
| Oh Its Lit | Fat Nick | [Track](https://lilpeep.com/pages/oh-its-lit-w-fat-nick-lyrics) |
| Burnt Diary | Kaiyko & Pageant Queen | [Track](https://lilpeep.com/pages/burnt-diary-w-kaiyko-pageant-queen-lyrics) |
| Freebee'z | KirbLaGoop | [Track](https://lilpeep.com/pages/freebeez-w-kirblagoop-lyrics) |
| Unify | Agoff | [Track](https://lilpeep.com/pages/unify-w-agoff-lyrics) |
| In Dis Bih (Bih) | Lil Tracy & Thouxanbanfauni | [Track](https://lilpeep.com/pages/in-dis-bih-bih-w-lil-tracy-thouxanbanfauni-lyrics) |
| Sodium | Mackned | [Track](https://lilpeep.com/pages/sodium-w-mackned-lyrics) |
| ZZZ | Milkavelli | [Track](https://lilpeep.com/pages/zzz-w-milkavelli-lyrics) |
| I Can't Feel My Face | KirbLaGoop & Mackned | [Track](https://lilpeep.com/pages/i-cant-feel-my-face-w-kirblagoop-mackned-lyrics) |
| Get Fucked Up | Marty Baller | [Track](https://lilpeep.com/pages/get-fucked-up-w-marty-baller-lyrics) |
| Black Clothes | Cold Hart | [Track](https://lilpeep.com/pages/black-clothes-w-cold-hart-lyrics) |
| Lost in the Mail | Ricky Hil | [Track](https://lilpeep.com/pages/lost-in-the-mail-w-ricky-hil) |
| SDI22 | Ricky Hil | [Track](https://lilpeep.com/pages/sdi22-w-ricky-hil) |
| Kiss Me | Horse Head | [Track](https://lilpeep.com/pages/kiss-me-w-horse-head-lyrics) |

**Title collision:** the existing `2445215695` / “Kiss Me” is the ILOVEMAKONNEN collaboration on *DIAMONDS*. It does not cover the separate Horse Head song. Future deduplication must consider collaborators/recording identity, not only normalized titles.

**Already represented, not new omissions:** “Niagara (Waterfall)” is present as “Niagara (feat. Lil Peep),” and “Family” is represented as “family (bonus track).” “4AM IN LA” is present too. Differences in collaboration formatting should not create new entries.

## Album labels and artwork need a consistent release policy

These songs appear on estate-listed projects but currently use standalone-song album labels:

| Current song(s) | Estate project |
| --- | --- |
| ghost boy | LIL PEEP; PART ONE |
| nuts; haunt u; flannel | LIVE FOREVER |
| beamer boy | CALIFORNIA GIRLS |
| Words You Hear On a Sinking Ship; Bitch I'ma Kill You; Sleepy Hollow | ELEMENTAL |
| Benz Truck; The Brightside | Come Over When You're Sober, Pt. 1 |
| November | DIAMONDS |

The existing generator intentionally favors earlier releases, which can select a single before its album. That is a valid release choice, not necessarily incorrect data. If the intended UI groups songs by their canonical project, all 11 entries above need album-label normalization and artwork chosen for that same project.

Do not change only the album name and leave an unrelated single/re-release cover. Conversely, features on another artist's album (for example “Niagara” on *Rituals*) should not be relabeled simply because the estate index also lists the song individually.

## Archived artwork that differs from the estate reference

These 11 archived entries have visibly different artwork from their corresponding estate listing and should be reconciled under the chosen release policy:

| Entry | Current artwork | Estate artwork |
| --- | --- | --- |
| Every Weekend | Tropical/landscape illustration | Taco illustration |
| Waste of Time | Green forest | Black title graphic with head outline |
| Lil Yung | Artist logo | Blue-toned room photograph |
| Pussy | Garfield illustration | Minimal white cover with blurred central image |
| The Kronik | Black/white/red collage | “CHILLINONIT” illustration |
| Down for You | *The Second 2 Season* album cover | Hallway photograph |
| backseat | Music-video still | Person lying on a bed |
| lil peep lil tracy | Letterboxed concert still | Different, pink-lit concert photograph |
| overdose | Generic Smokeasac logo | Photograph of people seated together |
| Oh | Outdoor photograph | Indoor group photograph |
| Mud On My Gucci | Peep photograph | Drawing of two figures |

“Down for You” is a clear **album-label/cover pairing inconsistency**: the image explicitly names *The Second 2 Season*, while the catalog's album field says “Down For You.” Either retain the album release and name it accordingly after verification, or use the estate's standalone artwork with the standalone label.

**Additional source ambiguity:** “Fishscale” uses a red-doorway photograph in the catalog, but the estate index uses the exact same dark photograph as “On the Floor.” Because the source itself repeats the image across different songs, verify the linked track/original release before automatically replacing this one.

## Artwork differences that are not established mistakes

- *Garden*: the streamable release uses the rose/fence image; the estate project listing uses the original forest artwork.
- “Dreams & Nightmares”: the estate index itself includes both its original artwork and the 2023 re-release cover; the catalog matches the 2023 cover.
- “October,” “Love Letter,” “i crash, u crash,” “stop the car,” “Last Fall,” “No Respect Freestyle,” “Benz Truck Pt. 2,” “u don't know me,” and “Cocaina Pearls” differ from the estate index, but their catalog covers come from their selected Deezer releases. Do not treat a re-release or album cover as a broken image just because it differs from an original single.
- *Dead Broke*: the artwork is the same illustration with different borders/cropping, not a different album.
- Most matched core-project artwork agrees visually: *feelz*, *LIL PEEP; PART ONE*, *Mall Musicc*, *Romeo's Regrets*, *LIVE FOREVER*, *Vertigo*, *CALIFORNIA GIRLS*, *crybaby*, *Teen Romance*, *Castles*, *HELLBOY*, *Castles II*, both standard *Come Over When You're Sober* albums, *Goth Angel Sinner*, *Everybody's Everything*, *Friends*, *High Fashion*, *DIAMONDS*, the COWYS2 OG cover, and *HATE ME*.

## Version and duplicate review

- Seven *COWYS2 OG* recordings and the OG “Spotlight” / “Hate Me” recordings are not separate entries. Their standard counterparts are present. This follows the current generator's stated alternate-version collapsing policy, so they are not counted as missing songs above.
- “I've Been Waiting (Original/OG Version)” appears on both *Everybody's Everything* and *DIAMONDS*. The catalog contains the Fall Out Boy version, not an explicitly identified original-version entry. Decide whether distinct versions should be separate before adding it, and do not add one copy per album.
- `unr-heavenscent` (“Heaven Scent,” 130 seconds) and `4274030672` (“heaven sent,” 143 seconds) are a potential duplicate/alternate-edit pair. The official 2026 release uses “heaven sent.” Different durations alone do not prove these are different songs. Compare audio before merging, deleting, or moving votes.
- `4138917411` (“Us,” 145 seconds) and `unr-lilpeepliltracy` (“lil peep lil tracy,” 146 seconds) are another alias/duplicate candidate. The original [Peep upload](https://soundcloud.com/lil_peep/lil-peep-lil-tracy-prod-cortex-sincewhen) and [estate lyrics](https://lilpeep.com/pages/lil-peep-lil-tracy-w-lil-tracy-lyrics) credit the same collaboration/producers associated with the streaming “Us” release. Confirm by audio before merging or moving votes.
- `update-songs.mjs` deduplicates mainly by normalized title. This risks merging different songs with the same title (the two “Kiss Me” collaborations) while failing to merge spelling aliases (“Heaven Scent” / “heaven sent”).

## Recommended next pass

1. Audio-check the Heaven Sent and Us/lil peep lil tracy pairs before touching their leaderboard history. They remain unchanged.
2. Resolve the estate index's ambiguous Fishscale/On the Floor artwork reuse against the original uploads.
3. Keep the vocal-contribution rule for future additions: hook/outro collaborations qualify, but an artist credit alone is not proof of an actual Peep vocal part.
