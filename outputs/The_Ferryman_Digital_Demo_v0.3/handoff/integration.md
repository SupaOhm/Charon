# Worker D handoff: interface, integration and release (Charon v0.3)

Date: 2026-09-27. Status: **integrated and browser-checked by automation. Not human-tested.**

## Package

- Folder: `outputs/The_Ferryman_Digital_Demo_v0.3/`
- ZIP: `outputs/The_Ferryman_Digital_Demo_v0.3.zip` (folder minus Worker A's archival `assets/art/*.zip`; see "Packaging").
- Launch: double-click `index.html`, or `python3 -m http.server 8000 --bind 127.0.0.1` in the folder and open `http://127.0.0.1:8000/`.

## Versions and snapshot

| Part | Version / source |
|---|---|
| Rules | SHA-256 `459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb` (LF). Worker C's `797bc491...` is the same text with CRLF endings: converting LF to CRLF reproduces it. |
| Contract | v1, SHA-256 `2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a` |
| Engine | 0.3.0, schema 1 (commit `d39a6a5`), used unchanged |
| Content | 0.3 (merged `6314b3a`), used unchanged |
| Art | 0.3, art-r2, 62 entries (commit `6cf0ee6`), used unchanged |
| Interface | 0.3.0 |

## Files I own

`index.html`, `app.js`, `styles.css`, `tests/integration/integration-check.cjs`, `tests/integration/browser-flows.cjs`, `tests/integration/results.json`, `verification/browser/README.md`, `verification/browser/runs/` (results, 16 screenshots, an exported run), `README.md`, `RELEASE_NOTES.md`, `handoff/integration.md`.

No file owned by A, B or C was edited. No `ui/` fixtures remain; the release has no simulated-gameplay path.

## Integration choices

- Scripts load in contract order. The UI calls only `createGame`, `getView`, `dispatch`, `serialize`, `deserialize` and the documented additive `previewDelivery`. It reads `CharonRules.souls[..].memory` once, read-only, to name the memory a soul will give.
- All legality, disabled reasons, fog, hull, forecasts, rewards and endings come from the engine view. Log entries are data; `app.js` words them using content names.
- Automatic events (E01, E04) show a revealed card with no buttons. Choice events (E02, E03) use `pendingEvent` flags and reasons.
- Event conditions appear only after discovery or in the spoiler view of the Event reference.
- Storage: run in `charon.v03.run`; discoveries in `charon.v03.discoveries`. An unreadable stored save moves to `charon.v03.run.rejected`. A bad imported file leaves the current run alone.
- Lethal departures and predicted dismissal need a confirmation dialog.

## Checks run (macOS arm64, Node v26.8.1, local headless Google Chrome)

| Command | Result |
|---|---|
| `node --test "tests/engine/*.test.js"` | 126 / 126 pass |
| `node tests/integration/integration-check.cjs` | 15 / 15 pass |
| `node tests/integration/browser-flows.cjs` | 30 / 30 pass |
| ZIP extracted to a scratch folder: SHA-256 of every file compared with the source folder | 132 of 132 match; no v0.2 files inside |
| Same three suites run inside the extracted copy | 126/126, 15/15, 30/30 |

`verification/engine/run-verification.cjs` also passed (126/126, matrix complete); it rewrites Worker C's `engine-test-results.json`, so I restored that file with git rather than change C's evidence.

Browser coverage, step by step: `verification/browser/README.md`.

## Independent spec review (UI against the rules, not relying on C's tests)

Checked in the browser against the saved engine state: start values (rules 3); multi-stop cycle and no return before a destination (2); anger only at return, calm and memory-mark protection, forecast equal to result (4, 5); new refill souls start at 0 (4); free memory, one per crossing (6); exact zero light survives (3); wraith fog applies after the return, release costs 2 light and removes 1 reprimand, unaffordable blocked (5); rocky variants from cycle 3 with separate hull damage (2, 8); haven E04 (7); repairs (3); quota paid after cycle 3 (3); three failure causes with summaries and no victory screen (3); event reveal and spoiler reference with independent reset (7).

Observations for the team (no change made):

1. Worker C's scripted courier survived 60 cycles with no wraiths. The defaults may be easy for a player who delivers every cycle.
2. Delivering Mother and Child at Elysium at cycle 1 takes light 2 to 6; E01's extra light is then lost at the cap. Legal under the rules, but E01 rarely helps early.
3. C's recorded interpretations (fog-lethal crossing leaves light unchanged; rocky haven edges) are visible in play and look consistent with the rules.

## Defects found and fixed during integration (all UI)

- Ended screen showed the stop's boarding description and cycle hints: hidden once the run ends.
- Three test-script mistakes corrected (haven E04 already repairs the hull; visited stop not re-offered; forecast counts passengers still aboard). None was a game defect.

## Packaging

- `zip -r -X` of the folder, excluding `assets/art/*.zip` (Worker A's own archival art packs, 121 MB, not loaded by the game; they stay in the repository) and `.DS_Store`.
- Size about 91 MB, over GitHub's 50 MB warning and near its 100 MB per-file limit. Decide before committing it; sharing it outside Git may be easier.
- After this note was written the ZIP was rebuilt and re-compared so it contains this final text.

## Outstanding

- No human playtest. A teammate must play at least one full run and the showcase script.
- Not checked: real phones, Safari, Firefox, Edge, Windows, screen readers, full keyboard-only play.
- Active art is ~67 MB of full-size PNG; a lighter web copy would speed loading (Worker A's call).
- Committing and sharing the ZIP is the coordinator's decision (see size below).

## Coordinator update for AGENT_CONTEXT.md

September 27, 2026, Worker D: v0.3 interface built and integrated with the delivered engine (0.3.0), content (0.3) and art (art-r2) without editing their files. Automated evidence on macOS/headless Chrome: engine 126/126, integration 15/15, browser flows 30/30 covering the handoff list, including all three failure endings, save/export/import, event reference reset and the E02/E03 choice events. Package `outputs/The_Ferryman_Digital_Demo_v0.3.zip` excludes A's archival art ZIPs. No human playtest, real-device or multi-browser test yet; balance remains untested (C's courier policy survived 60 cycles). v0.2 preserved.
