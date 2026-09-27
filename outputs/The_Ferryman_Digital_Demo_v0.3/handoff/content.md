# Worker B content handoff

Prepared September 27, 2026, Asia/Bangkok. The English content pack and editable guides are complete against the decided v0.3 rules. This delivery does not establish that a playable v0.3 build exists. No game mechanics were changed.

## Delivered files

All paths are relative to the repository root.

1. `outputs/The_Ferryman_Digital_Demo_v0.3/content.js`
2. `outputs/The_Ferryman_Digital_Demo_v0.3/docs/QUICK_START.md`
3. `outputs/The_Ferryman_Digital_Demo_v0.3/docs/SHOWCASE_SCRIPT.md`
4. `outputs/The_Ferryman_Digital_Demo_v0.3/docs/CONTENT_REVIEW.md`
5. `outputs/The_Ferryman_Digital_Demo_v0.3/handoff/content.md`

The pack was created first. The remaining documents are Markdown. No PDF or print-kit work was performed. Full game packaging belongs to D.

## Frozen source snapshot

| Source | SHA-256 |
|---|---|
| `outputs/The_Ferryman_v0.3_Decided_Rules.md` | `459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb` |
| `v0.3_handoffs/SHARED_CONTRACT.md` v1 | `2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a` |
| `v0.3_handoffs/02_ChatGPT_Content.md` | `bfc119cf046f51a325d6c6a51e3ca8e9567883519e4522e8885d4f37e66745ae` |

Repository HEAD at source review: `932a7ace3498297ca34887d36f0216f3beb27712`, committed September 27, 2026, 00:23:32 +0700. Source modification times were 00:24:54 +0700 that day. These dates identify files, not new playtests. A later change to any rules or contract requires another copy audit. The [content review](../docs/CONTENT_REVIEW.md) traces the statements to exact sections and lines.

## Interface and delivered keys

Classic UTF-8 script, one assignment to `globalThis.CHARON_CONTENT`, version `0.3`, language `en`. No functions, DOM access, HTML, network calls or dependencies.

- `title`, `intro`.
- `nodes`: `shore`, `elysium`, `asphodel`, `tartarus`, `haven`.
- `souls`: `S01`–`S12`, each with name, flavor and source-memory flavor.
- `memories`: `R01`–`R06`, with the contract's names and exact effect descriptions.
- `events`: `E01`–`E04`, each with title, narrative body, condition, effect and accept/decline label fields.
- `ui`: all 13 required labels, no additional keys.
- `help`: all nine required keys and 15 compatible additions listed below.
- `endings`: `fog`, `sinking`, `dismissal`, each with distinct cause-specific text.
- `tutorial`: seven ordered steps, `T01`–`T07`.

Additional help keys: `boarding`, `promises`, `delivery`, `pairs`, `passengerEffects`, `memoryTargets`, `wraiths`, `hull`, `recovery`, `returnOrder`, `supply`, `routes`, `escalation`, `failure`, `saving`. These are prose fields only, documented compatible additions under contract v1. No added UI keys or API actions require a contract amendment.

## Actual checks

Executed from the repository root:

```sh
node --check outputs/The_Ferryman_Digital_Demo_v0.3/content.js
node work/v03-content/check-content.cjs
```

Both exited 0. The content checker passed 11 groups with zero failures: plain JSON data inside the global assignment; isolated classic-script execution; exact key/field coverage; source role names; automatic/optional event label shape; UTF-8 and text scans; local document links; source hashes. It verified 5 nodes, 12 souls, 6 memories, 4 events, 13 UI labels, 9 required plus 15 additional help entries, 3 endings and 7 tutorial steps. All 12 local Markdown links resolved.

Local helper/results: `work/v03-content/check-content.cjs` and `work/v03-content/check-results.json`. They are scratch verification files, not required game dependencies or part of the five-file content pack. The JSON records `checkedAt`, `checksPassed`, `coverage`, `sourceHashes` and hashes of the delivered files. See [CONTENT_REVIEW.md](../docs/CONTENT_REVIEW.md) for the manual rule/number audit, legacy-concept audit and exact limitations. Static spoiler checks do not establish correct UI hiding.

The repository and terminal were available. Node.js v25.9.0 was available without installing anything. No browser was used. No engine action, gameplay run, route simulation or human playtest was executed. No safe-route, measured timing, balance, enjoyment, real-device or submission claim is made.

## Integration instructions for D

1. Load scripts in the contract order: `rules-data.js`, `engine.js`, `assets/assets.js`, `content.js`, `app.js`. Preserve fallback copy while other packs are absent. Read `CHARON_CONTENT`; the content file intentionally does not export an ES module or CommonJS module.
2. Render strings as text. Use stable node/template IDs for lookup, and keep cohort/instance IDs visible from the engine. Attach `memoryFlavor` using the memory's source soul, without treating a repeated role label as the same person or an extra effect.
3. Keep undiscovered event text out of cards, tooltips, accessible descriptions and the default logbook. Show it only for a discovered entry or when the player explicitly opens the spoiler reference. Saved discovery annotations may reveal known entries without changing the run's trigger flags. Do not automatically expose this handoff or the spoiler table in CONTENT_REVIEW as player help.
4. E01 and E04 are automatic: their choice labels are intentionally empty. Do not create confirmation, accept or decline buttons for them. For E02/E03, use the engine's `pendingEvent` permissions and disabled reason; never infer affordability or mutate resources from prose. Render their `body`, `condition` and `effect` separately after reveal.
5. Bind failure text to `view.ended.cause`. Show the actual engine summary alongside it. The generic dismissal copy deliberately makes no claim about which particular action caused the reprimands. Do not substitute a win screen at a cycle checkpoint.
6. Place `help.promises`, `help.wishes` and `help.anger` where boarding and delivery choices need them. The return forecast must keep known waiting anger distinct from the conditional effect of bringing current passengers back undelivered. Display fog damage and hull risk separately.
7. Use engine state and permissions for numeric badges, costs, targets and warnings. Source prose numbers document this snapshot; they do not override `rules-data.js`. Make the required help and relevant additional help available through click/tap controls.
8. Verify separate save/resume, New run and Clear discoveries flows against the copy. Clearing discovery annotations must not restart a run or reset its event-trigger flags. Compare the integrated game with the quick start, then rehearse the proposed showcase using live previews. No launch instructions or safe-route claim have been validated by B.
9. Include these files when assembling the verified v0.3 build and its matching ZIP. C owns engine checks; D owns integration/browser evidence; a human team member still needs to rehearse and play.

## Open items and coordinator handoff

No copy ambiguity or missing content key remains against the recorded rules and contract. Implementation and presentation remain unverified. The quick start is a rules guide, not evidence of a currently runnable build.

Coordinator context note: Worker B delivered the five files above; no rule, engine, art or v0.2 change was made. Remaining work is C/D integration, engine and browser verification, spoiler-gating checks and a human rehearsal. Full game packaging remains with D. Numerical defaults remain untested for balance. Retain the full source hashes and actual check results when updating the root project context.
