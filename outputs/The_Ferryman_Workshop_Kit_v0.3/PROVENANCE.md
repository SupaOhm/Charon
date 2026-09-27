# Rules, source and artwork provenance

Produced September 27, 2026, kit revision workshop-1. This is a separate v0.3 physical kit. The source rules, old paper kit, digital art, `assets.js`, browser game and other workers' files were preserved. No new game mechanic, balance change, final engine choice or team art approval was made.

## Authority and freshness

The complete [Decided_Rules.md snapshot](source/references/Decided_Rules.md) is authoritative. The [shared contract](source/references/SHARED_CONTRACT.md) supplies stable IDs. Exact source paths, hashes and last commits are in [source_snapshot.json](source/source_snapshot.json).

| Source | SHA-256 | Last source commit |
|---|---|---|
| Decided v0.3 rules | `459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb` | `932a7ac`, 2026-09-27 00:23:32 +0700 |
| Shared contract | `2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a` | `932a7ac`, 2026-09-27 00:23:32 +0700 |
| Active art manifest | `3b5a31edbf41a48153ade5a2fb524657f8a538b4c71c229908ab6c9c186383c1` | `6cf0ee6`, 2026-09-27 11:49:58 +0700 |
| Workshop commission | `2e075aea9bd2c5306b0d13fb2be7bfdb3a284ed21dba90b74a9e9e7cbb1d6ff4` | `6cf0ee6`, 2026-09-27 11:49:58 +0700 |

The commission's older description of art revision 2 as uncommitted is stale: current Git history includes it in `6cf0ee6`. The final workspace check was on merged main at `b863aa8`; all 44 reused assets and nine source references still matched their current repository originals. Filesystem dates were inspected for freshness; copied-file dates are not playtest dates. Earlier v0.2 results do not validate this kit. Historical claims inside the copied rules/handoff documents describe their creation time, not this completed kit.

## Rules-to-components audit

Line numbers below refer to the unchanged bundled rules snapshot. This table maps all numerical rule families and effects used in the sheets. Data lives in [components.json](source/components.json); `extract_rules.py` parses all soul rows, exact memory/event source effects and phase steps. Explicit constants and concise printed wording were checked against the passages below. The source hash is pinned so a later rules revision requires a new audit.

| Rule/value or permission | Rules lines | Complete-PDF pages / structured fields |
|---|---|---|
| Carrier/guide; any destination accepts a soul; only delivering before return is binding | 24-28 | 1, 23-25; soul text |
| Crossing=edge, cycle=return; directed graph; unvisited stops; destination before return | 30-44 | 13, 23-25; `nodes`, `edges` |
| Shore-only boarding, four seats, reversible loading, empty departures; no haven unload or reboarding | 41-44, 99-104 | 14-15, 23-24; `resources.seats` |
| Base fog Shore 0, Elysium 0, Asphodel 1, Tartarus 2, Haven 0 | 46-52 | 13, 19, 24; `nodes[].base_fog` |
| Start light 2/cap 6, obols 2/unlimited, hull 3/cap 3, reprimands 0, no memories | 54-56 | 17, 19, 23-24; `resources`, memory mat |
| Final fog max 0; wraith +1 each; same-cohort conflict +1; protection; fog before hull before reward | 58-68 | 3-9, 13, 15, 19, 23-25; `souls`, `memories` |
| Poet +1 protection with 2+ other souls, Keeper +1 alone; no adjacency effect | 62-64 | 3-5, 14, 24, 31-32; `souls[].protection` |
| Fog greater than light fails; exact zero survives; hull 0 and reprimands 3 fail | 65-78 | 19-20, 23-25, 29; `resources.dismissal_at` |
| Automatic quota 2 obols every third completed cycle; if short keep coins, +1 reprimand, no debt | 80-84, 224-229 | 19-20, 23, 25, 29; `cycle.quota_*` |
| Repair 1 obol for 1 hull at shore/haven, repeat to 3; haven +1 light; surviving return +1 light | 86-91 | 19, 23-25; `actions.repair`, `cycle.recovery_light` |
| Fresh fixed-order S01-S12 cohorts; same-cohort links; refill toward five at setup/return, retain overflow | 93-104, 113-115 | 2-5, 15, 20, 24-25, 31-36; `soul_instances`, `production` |
| W snapshot on departure; S matching partner; normal +1 unless P, separation +1 even with P; anger 3+ becomes wraith and +1 reprimand | 103, 106-117 | 3-5, 18, 20-21, 23-25, 31-32; `cycle.*anger`, `wraith_at_anger` |
| Returned undelivered passenger +1 reprimand, keeps anger, receives no waiting anger; new wraith pressure starts next crossing | 112-115 | 15, 20-21, 23-25 |
| Calm costs 1 obol, shore only, once per cycle, normal-anger protection only; no stacking/removal/refund; expires at return | 119-126 | 18-20, 23-25; `actions.calm` |
| Release at any stop's preparation for 2 light, immediate removal and reprimands -1 min 0; repeat if affordable, zero light legal | 128 | 15, 19, 21, 23-25; `actions.release` |
| All 12 roles, seat values, reward types/amount 1, wishes and memories | 130-147 | 3-9, 31-34; all `souls` and instance records |
| Reward once and +1 wish light; mismatch has no penalty; one memory/source/destination; same-action matching pair earns one Joined each, otherwise Faint | 149-151 | 3-9, 16, 22-25, 31-34; `memory_instances` |
| Empty initial deck; append cohort/soul-ID order, draw to three once per stop, retain hand, recycle discard, free one per crossing, reset only on successful crossing | 153-160 | 2, 6-12, 16, 19, 22-25; `actions.memory`, memory fronts/backs |
| R01 2 protection; R02 1 or 3 if two-seat passenger; R03 1 plus optional normal-anger mark; R04 1 plus cancel all conflicts this crossing; R05 2 plus optional mark; R06 1 | 162-171 | 6-9, 33-34; `memories[].source_effect` and printed `description` |
| R03/R05 target shore remotely, optional target, marks do not stack or prevent separation; no permanent memory deletion | 160-171 | 6-9, 16, 24, 33-34 |
| E01 linked delivery at Elysium +1 light; E02 Messenger at Asphodel optional 1 obol for -1 reprimand, disabled at 0 | 175-184 | 21-22, 26-28; `events[0:2]` |
| E03 Tartarus same-cohort soldiers aboard on entry, optional 1 obol reconciles only that pair for run; E04 haven hull below 3 gains 1 hull | 181-184 | 21-22, 26-28; `events[2:4]` |
| Deterministic events after rewards, in ID order, once/run even declined; reveal condition/effect; optional spoiler knowledge separate from resetting run flags | 173-190 | 21-22, 24-28; `events`, discovery sheet |
| Cycle 3 rocky non-return base -1 min 0 and hull -1; cycle 5 +1 non-return fog; cycle 6 favored Elysium/Asphodel/Tartarus ignores only cycle +1 | 48-52, 192-203 | 13, 19, 25; `cycle.rocky_*`, `modifier*`, `favor_*` |
| Exact arrival and return phase order; dismissal before quota and again after; no optional interruptions or post-failure rescue | 205-232 | 19-25; `phase_order.arrival`, `phase_order.return` |
| Endless run, no supply-exhaustion win, no carried resources/unlocks; reset knowledge optional | 78, 93-97, 186-190 | 2, 15, 25, 28-30, 31-36 |

Production-only numbers are identified in [COMPONENT_INVENTORY.md](COMPONENT_INVENTORY.md): two cohorts, counter denominations/counts, paper size, typography, card size, ledger row count and reprint batch size do not modify game rules. Observation/feedback prompts are neutral authored workshop text; no results or participant quotations were invented.

## Artwork and type

[asset_manifest.json](source/asset_manifest.json) records the exact upstream path, hash and raster dimensions for **44 reused assets: 23 PNGs and 21 SVG icons**. Copies are byte-identical to the active digital art. Unused copied icons were removed only from this new kit. The original art files are untouched.

- Raster reuse: S01-S12 portraits; apprentice and ferry; five revision-2 environments; revision-2 reaching wraith; obol/light token paintings; shared revision-2 memory reverse.
- The earlier agent generated the raster art using built-in `image_gen`, as recorded in the preserved [first-pass provenance](source/references/PROVENANCE.json) and [revision-2 provenance](source/references/PROVENANCE_R2.json). This workshop task generated no new raster illustration and used no web imagery.
- All paintings retain opaque backgrounds and original aspect ratios. Portraits and environments are contained, not cropped. The wraith's hand remains inside the frame. Small symbols use vector SVGs. Labels, numbers and rules are selectable PDF text.
- Raster originals are bundled at their source resolution. PDF embeddings are proportionally resampled in memory to approximately 450 dpi; the measured minimum is **449.6 dpi**, recorded per placement in `validation/layout.json`. Source images were not overwritten. Token source paintings are 1254 x 1254 pixels.
- New work consists of editable page layout, pale frames, ruled fields, cut lines, typographic labels, vector capacity/resource/status layouts and the composed table overview. The existing blank digital frames were unnecessary for the readable print layout, so no unused frames are bundled.
- Bitstream Vera regular, bold and italic are copied from the available ReportLab runtime. The [font license](assets/fonts/bitstream-vera-license.txt) is included. Fonts used in all PDFs are embedded. No remote font is required.

The [myth and visual notes](source/references/MYTH_AND_VISUAL_NOTES.md) remain the art interpretation reference. Haven is an original game location. The apprentice is a carrier, not a moral judge. These assets remain prototype art pending team approval; file readiness is not an approval of final art direction or an independent licensing audit.
