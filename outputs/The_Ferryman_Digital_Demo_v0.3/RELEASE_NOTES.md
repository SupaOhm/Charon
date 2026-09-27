# Release notes: The Ferryman v0.3 browser prototype

Build date: 2026-09-27. Package: `outputs/The_Ferryman_Digital_Demo_v0.3.zip`.

## Versions

| Part | Version | Source |
|---|---|---|
| Rules | v0.3 decided rules, SHA-256 `459d7a85...cdfb` (LF file; `797bc491...adea` is the same text with CRLF line endings) | `../The_Ferryman_v0.3_Decided_Rules.md` |
| Contract | v1, SHA-256 `2a90fb7c...528a` | `v0.3_handoffs/SHARED_CONTRACT.md` |
| Engine | 0.3.0, save schema 1 | Worker C, commit `d39a6a5` |
| Content | 0.3, English | Worker B, merged in `6314b3a` |
| Art | 0.3, revision art-r2 (62 manifest entries) | Worker A, commit `6cf0ee6` |
| Interface | 0.3.0 | Worker D |

## What is in this build

- Endless run on a five-stop map with multiple destinations per cycle, haven and return.
- Boarding, calming, delivery with a preview, free memories with optional marks, repairs, wraith release, rocky routes, cycle-end forecast, three failure endings, no victory screen.
- Hidden events revealed when they happen, with a separate spoiler reference kept across runs and a Clear discoveries control.
- Automatic save and resume, New run, JSON export and import.

## Evidence (agent automation, not human play)

| Check | Result |
|---|---|
| Engine tests `node --test "tests/engine/*.test.js"` | 126 / 126 pass (Node v26.8.1, macOS) |
| Integration checks `tests/integration/integration-check.cjs` | 15 / 15 pass |
| Browser flows `tests/integration/browser-flows.cjs` (real engine, clicks, headless Chrome) | 30 / 30 pass |

## Known limits

- No human playtest, balance, enjoyment, real-phone or multi-browser evidence.
- Engine worker's scripted "courier" policy survived 60 cycles with no wraiths (`verification/engine/policy-experiment-results.json`). The default numbers may be easy for a player who delivers every cycle. This is a team question; nothing was rebalanced.
- Art is about 67 MB of full-size PNGs; first load from disk is slower than it needs to be.
- The ZIP leaves out Worker A's two archival art-pack ZIPs (`assets/art/*.zip`, 121 MB). They are not used by the game and remain in the repository folder.
