# Handoff: Worker C, rules engine (Charon v0.3)

## Identification

| | |
|---|---|
| Engine version | 0.3.0 (`CharonEngine.version.engine`) |
| Contract | `v0.3_handoffs/SHARED_CONTRACT.md` version 1, implemented as written; additions are additive and listed in `docs/ENGINE_API.md` |
| Rules snapshot | `outputs/The_Ferryman_v0.3_Decided_Rules.md`, SHA-256 `797bc491e428ecf802dc4c9c4d05c6309636a916d5eb0b45b0f275c404fdeaae` (computed with `sha256sum` on this working copy) |
| Save schema | `schemaVersion: 1`, `rulesVersion: '0.3'` |
| Built with | Node v24.11.0, win32 x64. No dependencies installed. |

## Files delivered (all under `outputs/The_Ferryman_Digital_Demo_v0.3/`)

- `rules-data.js`, `engine.js`
- `docs/ENGINE_API.md`
- `tests/engine/helpers.js` and `01_api_and_saves` ... `08_replay_and_invariants` `.test.js` (126 tests)
- `verification/engine/RULE_MATRIX.md`, `run-verification.cjs`, `policy-experiments.cjs`, `engine-test-results.json`, `policy-experiment-results.json`
- `handoff/engine.md` (this file)

Nothing outside those paths was created or changed. `git status` before finishing showed only the new `outputs/The_Ferryman_Digital_Demo_v0.3/` folder untracked; no other worker's files were present or touched. The v0.2 demo is untouched.

## What was actually run

| Check | Command (from `outputs/The_Ferryman_Digital_Demo_v0.3/`) | Result |
|---|---|---|
| All engine tests | `node --test "tests/engine/*.test.js"` | **PASS**, 126 of 126 |
| Tests plus matrix cross-check | `node verification/engine/run-verification.cjs` | **PASS**: 126/126 tests, 126 matrix IDs, none missing, none unlisted; writes `engine-test-results.json` (records Node version and each test's status) |
| Scripted policy experiments | `node verification/engine/policy-experiments.cjs` | Ran to completion, no rejected actions, no stalls (see below); writes `policy-experiment-results.json` |
| Engine loads as classic browser scripts | Loaded `rules-data.js` then `engine.js` into a bare `node:vm` context with no `module` or `require`, created a game, serialized and deserialized it | **PASS**, but this simulates the browser global path; it is not a real browser |
| Ambient-state scan | `grep` of `engine.js` and `rules-data.js` for `Date.`, `Math.random`, `localStorage`, `window`, `fetch`, `XMLHttp` | No hits (the one "document" hit was the word "documented" in a comment) |
| Real browser, real device, human playtest | not performed | **NOT_RUN** |

Test files use `node:test` and `node:assert`, need no install, and the expected values are hand-derived from the spec text. One test (RPL-03) drives 60 random seeds, up to 300 steps each, checking after every step that the state round-trips through serialize/deserialize, resources stay in range, each soul exists in exactly one place, memories are conserved and terminal states are frozen. Its first run found a real defect (a memory mark on a soul who then boarded produced a state the loader rejected). It was fixed in `engine.js` and pinned by MEM-16. I did not change any expected value to make a test pass; five other first-run failures were mistakes in my test arithmetic and expectations (the cycle-12 favored destination, a discard-recycling expectation, the Musician/Listener light total, an error-code ordering, and forgetting that the delivery preview correctly hides the E01 bonus), each corrected against the spec text.

Coverage of the requested boundary list: zero-light release (RL-02, RT-22), simultaneous cycle-end causes (CE-11, CE-12, CE-15), newly formed wraith timing (CE-08), linked pair across cohorts (CE-07, BD-11, EV-02), supply rollover beyond 12 (CE-17, RPL-06), multiple destination drop-offs (BD-05), empty delivery (BD-06), no phase skipping (PH-01..03), protected anger vs separation (CE-05, CE-06), memory draw once (MEM-01), full-cap gains (BD-13), rocky sinking before reward (RT-11), quota cycles (CE-13), missed quota dismissal (CE-15), event accept/decline/repeat (EV-04..08, EV-12), malformed saves (API-08), deterministic replay (RPL-01, RPL-02). Full mapping in `verification/engine/RULE_MATRIX.md`.

## Policy experiments (automated, not playtests, not balance evidence)

`policy-experiment-results.json`, 30 seeds each, capped at 60 completed cycles:

- `idle_never_boards`: dismissed after exactly 3 completed cycles in 30 of 30 runs (five waiting souls per cycle turn into wraiths).
- Four "courier" scripts (my own simple policy: board the angriest waiting souls, sail to the destination most passengers prefer, deliver, come home): all 30 runs of each reached the 60-cycle cap with zero wraiths formed and no failure.

Two honest readings. First, the four courier variants gave identical aggregates, so they do not really differ; do not treat them as four strategies. Second, a simple policy surviving 60 cycles with no wraiths under these untested numbers suggests the current defaults may apply little pressure to a player who delivers every cycle. The spec says no promise of eventual failure is made, and I have not changed any number. This is a question for the team's human playtest, not something I decided.

## Current limitations and open points

- The 11 interpretations of underspecified spots are listed at the bottom of `RULE_MATRIX.md`. None needs a decision to proceed; each is one line to change. The two worth a glance: rocky routes also exist on haven edges (Section 2 says "each non-return edge"), and a fog-lethal crossing leaves light unchanged (Section 3 "otherwise subtract damage").
- I found no genuine conflict inside the rules document or against the contract.
- With E01-E04 each tied to a different stop, at most one event can match per arrival. The queue and ID-order path for several simultaneous events exists but is unreachable with the starter set, so it is untested.
- Shore overflow beyond five cannot happen in legal play; it is tested with a constructed state (CE-16).
- `state.log` is never trimmed, so very long runs make large saves (`view.history` is capped at 200).
- Not implemented on purpose (out of engine scope): the cross-run discovery reference (D's localStorage), all UI text, art and prose.
- Early checkpoint: I cannot message Worker D or the coordinator from this session. The interface D needs (`createGame`, `getView`, `dispatch`) was working from the first engine draft and the API document reflects the final, tested behavior, so hand over the whole folder rather than waiting for anything further.

## Contract deviations and additions D needs to know

No breaking changes. Read `docs/ENGINE_API.md`; the items that matter for integration:

1. `returnForecast.warnings` is an array of objects `{code, message, ...}`, not strings.
2. New optional helpers: `previewDelivery(state, soulIds)` (use it for the tentative delivery selection), `getLegalActions(state)`, `replay(...)`.
3. Extra view fields: `role`, `protectedBy`, `separationRisk` on souls; `rawFog` and `favorableApplied` in route breakdown; `visited`, `arrival`, `calmUsed`, `permissions.*DisabledReason`.
4. Routes are `[]` outside the `prepare` phase. A lethal route is still selectable and `legal:true`; warn with `lethal` and `failureCause`.
5. IDs: souls `C01-S01`, wraiths `W-C01-S01`, memories `M-C01-S01`.
6. The global for rules data is `CharonRules` (the contract did not name one).

## What D must do next

1. Copy `rules-data.js` and `engine.js` beside `index.html` and load them first, in the contract order.
2. Replace `ui/fixtures.js` with real `getView`/`dispatch`; render `error.message` on rejected actions; render `emitted` and `view.history` entries from their `type` and fields (they contain data, not prose).
3. Run browser flows for the phases in `ENGINE_API.md`: delivery selection through `previewDelivery`, event choice, return-forecast warnings, the ended summary.
4. Send any rule mismatch to C with the action list; `replay({seed}, state.actionLog)` reproduces a run exactly, so attach `state.actionLog` and `state.seed` to any bug report.
