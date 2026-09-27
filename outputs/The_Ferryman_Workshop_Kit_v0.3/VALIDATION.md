# Validation record

Executed September 27, 2026 for v0.3 workshop-1. **File/layout readiness: PASS. Physical printing and human rehearsal: NOT_RUN.** These checks do not establish enjoyment, balance, printer alignment, table readability, browser behavior or submission completion.

## Executed checks

| Check | Actual result | Evidence |
|---|---|---|
| Structured rules and source tables | 12 soul rows, six exact source memory effects and four exact event trigger/effect rows match; printed summaries audited against rules | [static_checks.json](validation/static_checks.json), [rules mapping](PROVENANCE.md) |
| Cohorts and memory capacity | 24 unique starter soul IDs; same-cohort reciprocal links/opponents; 32 unique memory alternatives, at most 24 earned, 24 common backs | `static_checks.json` |
| Directed graph | 19 directed edges; correct base fog; no shore-to-haven or self-loop; printed visited gate | `static_checks.json` |
| PDF counts, size, fonts and text | 11 PDFs: 36-page complete kit plus ten section PDFs totaling 36 pages; all A4; embedded fonts, selectable text, version/calibration labels, no replacement glyphs or em dashes | `static_checks.json` |
| Actual PDF geometry | All 36 master pages measured; minimum extracted text 10 pt; glyphs within 10 mm margins; actual calibration vector is 50.0 mm on every page | `static_checks.json` |
| Layout geometry and art | 63 x 88 mm cards, 3 mm card safety, no detected content overlaps; contained raster placements, minimum embedded effective resolution 449.6 dpi | [layout.json](validation/layout.json), [overlaps.json](validation/overlaps.json) |
| Spoiler separation and backs | Player sheet excludes event titles/triggers; 24 starter backs share image, size and layout; continuation uses the same back function | `static_checks.json`, source layout |
| Source preservation | All 44 reused art copies and nine reference snapshots retain recorded SHA-256 hashes | `static_checks.json`, source manifests |
| Every PDF rendered | 72 total rendered pages: 36 complete plus 36 section pages; every section page pixel-matches its complete-PDF counterpart at 150 dpi | [render_checks.json](validation/render_checks.json) |
| Visual inspection | All 36 complete pages inspected; affected page bodies re-inspected after revisions; page 9 checked separately at full render resolution | [visual_review.json](validation/visual_review.json), [sheet previews](previews/) |
| Grayscale and station overview | Pages 3, 7, 13 and 18 inspected for text, small icons, counters, cut lines and distinctions independent of color; overview inspected | `visual_review.json`, `previews/grayscale-*.png`, [overview](previews/table-layout-overview.png) |
| Agent component/rules walkthrough | 13 checks passed: setup, boarding/calm, travel/delivery, memory use/recycling, return/refill, wraith/release, separation/overflow, quota, fog/hull boundaries, escalation/repair, events, continuation and reset | [walkthrough report](validation/COMPONENT_WALKTHROUGH.md), [JSON evidence](validation/component_walkthrough.json) |
| ZIP contents and integrity | Every archived payload file compared byte-for-byte with the delivered source, PDF, preview and evidence files; CRC, exact file set and SHA-256 checked | [PACKAGE_MANIFEST.json](PACKAGE_MANIFEST.json), `validation/package_check.json` outside ZIP |

The automated static result is **8 check groups passed, 0 failed**. The desk walkthrough is **13 checks passed, 0 failed**. It uses the generated PDF fields and bounded arithmetic on a sample opening sequence plus separately constructed boundary states. It is not a game-engine test, physical manipulation trial or human playtest. See the evidence files for exact fields and scope.

## Revisions made during checking

- Corrected the status-sheet heading to rectangles, matching its 20 x 24 mm pieces.
- Clarified automatic quota payment when affordable on the player reference.
- Added cycle 3/5/6 escalation reminders to the route board and explicit legal empty departures to the facilitator sheet.
- Moved all footers 0.5 mm inward after actual glyph measurement found a 0.38 mm intrusion into the requested 10 mm margin. The final measurement passes on all pages.
- Rerendered all PDFs after the changes and rechecked the altered page bodies. A perceived missing character at spread-preview scale was checked on the full-resolution page; no missing PDF glyph was found.

The overlap scan compares recorded semantic content bounds; it is not an exhaustive optical detector. Visual review supplements it. Type size and physical geometry are measured in PDF points/mm. A screen preview cannot establish actual print-size readability on an unknown printer or calibrated physical display.

## Reproduction

Production used the already available Python 3.12 runtime with ReportLab, Pillow, pypdf and pdfplumber, plus local Poppler tools. No dependencies were installed. Commands and source responsibilities are in [source/README.md](source/README.md). Scratch renders and paired review spreads were kept under `work/workshop-kit-v0.3/`, outside the deliverable. The ZIP retains final previews and evidence, not scratch duplicates, font caches, bytecode or itself.

## Physical print and rehearsal checklist

All boxes below are deliberately unfilled. Record the actual printer, paper, settings, date and tester when performed.

- [ ] Print one soul sheet, memory front/back sheet, resource/status sheet and board at A4 100%. Measure the 50 mm line and one 63 x 88 mm card in both axes. Check printer clipping and consistent scaling before printing the batch.
- [ ] Cut sample cards/counters. Check 3 mm text safety, readable 10 pt essentials, small grayscale icons and writable status/ID fields at normal viewing distance.
- [ ] Assemble several memories with identical opaque backs/stock/sleeves. Check that source, effect, alternative choice, glue marks or thickness cannot be identified from the reverse. Duplex remains optional and untested.
- [ ] Check two-seat handling with a 2ND SEAT marker and matching slot number; confirm no seating-adjacency rule is implied.
- [ ] Lay out the full station. Confirm players can read/reach the board, resources and hand; waiting overflow and wraith source cards remain visible. The preview is an arrangement guide, not a measured table footprint.
- [ ] Rehearse setup, snapshot, delivery, memory draw/play/discard, return, wraith formation/release, quota and reset with printed pieces. Check pencil erasability and facilitator bookkeeping time. Use additional ledger sheets whenever rows fill.
- [ ] Rehearse fresh cohort IDs and memory alternatives; verify source order and that no delivered person returns within a run. Check that fixed counter quantities never cap values.
- [ ] Keep event triggers private by default; reveal the correct event, record declined offers as resolved, and reset run flags separately from optional knowledge.
- [ ] Conduct a human session using blank pages 29-30. Record observed behavior separately from player comments and proposed revisions. Record a time stop as session stopped, not victory.
- [ ] Have the team review rules clarity and prototype art. Record any approved revision before changing mechanics; rebuild sources, PDFs, previews and ZIP together afterward.

No human feedback, workshop date, participant count, printer success, balance conclusion or final team approval has been inferred or prefilled.
