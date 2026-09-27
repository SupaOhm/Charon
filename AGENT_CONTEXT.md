# The Ferryman / Charon: agent context

Updated September 27, 2026 after repository organization. Current rules and game/art paths are unchanged; handoffs live at root v0.3_handoffs/, and decision history lives in notes/Decisions_and_Team_Plan.md.

## Latest checkpoint: workshop art handoff, September 27, 2026

The user requested a prompt for the remaining local workshop materials, then asked to place it with the numbered v0.3 handoffs. v0.3_handoffs/05_ChatGPT_Workshop_Art.md defines that production task: printable soul and memory cards, route board and boat mat, counters and trackers, references, event cards, observation sheets, editable sources, PDFs and a checked ZIP. Proposed output location: outputs/The_Ferryman_Workshop_Kit_v0.3/. Only the handoff prompt was created; the v0.3 physical workshop kit has not been generated.

Art revision 2 already exists under outputs/The_Ferryman_Digital_Demo_v0.3/assets/art/, with its current manifest at assets/assets.js and integration notes at handoff/art.md. It includes revised environments and wraith, resource illustrations, soul portraits, icons and blank frames. VALIDATION_R2.json records 62 loaded catalogue assets with no failed loads in the desktop art preview. This is art-gallery evidence, not playable-game or human workshop validation. Team art approval and physical print/rehearsal checks remain pending. Older statements below that no assets were generated describe the earlier handoff-preparation task and are stale for current art status. Existing v0.2 paper materials must not supply v0.3 rules.

The workshop prompt defaults to one station, English, A4 and single-sided assembly, with two initial soul cohorts plus repeatable continuation sheets. These are proposed production defaults, not confirmed attendance, print specifications or new game limits. Read the current v0.3 decided rules before executing the prompt. No gameplay rules were changed, and no files were pushed or published.

## Immediate context

The user requested that the complete game project and relevant generated files be gathered in E:\Charon for sharing with friends, with agent context included. At transfer, the target was an existing empty Git repository on branch main. The user has since committed the imported files and added CLAUDE.md; inspect current Git history rather than assuming it is still empty. Preserve its .git directory. Do not push or publish.

The user has a seven-member group. Deadline supplied: Monday September 28, 2026, midnight, Asia/Bangkok context. Exact portal timestamp, assessed submission contents, presentation duration, member names and confirmed role assignments remain unknown. Recalculate time remaining when resuming. Prior 'coming week' fields are stale.

The user confirmed endless play and authorized ChatGPT to decide the remaining mechanics. The selected v0.3 browser prototype uses an apprentice carrier/guide, branching multi-destination cycles and cycle-end anger. See outputs/The_Ferryman_v0.3_Decided_Rules.md; it supersedes conflicting older rules and open-question records.

## Read these first

0. outputs/The_Ferryman_v0.3_Decided_Rules.md: authoritative next-version rules. User requirements are separate from Decided by ChatGPT choices. It settles the discussed gameplay gaps; all chosen numerical defaults are untested.

1. README.md and START_HERE.html: shareable entry points.
2. outputs/The_Ferryman_Design_Workbook.md: editable design baseline, v0.2. Quick summary line 11; decisions line 130; trial rules sections 5-10; showcase checkpoint section 17A/C01; playtesting section 18; optional modules section 19; myth sources/adaptations section 20.
3. outputs/The_Ferryman_Digital_Demo/engine.js: executable base rules. app.js contains interaction and save/export; index.html and styles.css provide the interface.
4. outputs/The_Ferryman_Digital_Demo/PLAYTEST_REPORT.md and VALIDATION.md: observed evidence, interpretation, coverage and limitations.
5. outputs/The_Ferryman_Easy_Playguide.pdf: later four-page accessible guide, generated September 25.
6. notes/Decisions_and_Team_Plan.md: all twelve decision IDs and the five requested lists. Includes the September 26 user decisions, owner fields and readiness checkboxes. Other recommendations are not approvals.

The longer outputs/The_Ferryman_Project_Handoff_Prompt.md is preserved as a historical detailed handoff. Its old C: workspace and Downloads paths describe the original environment. This file supersedes those location and repository statements. Existing game and print deliverables remain in outputs/; coordination lives in v0.3_handoffs/ and notes/. Original files were copied without modifying their historical content.

## Completed artifacts

- Workbook v0.2: editable Markdown and previously verified 53-page PDF, quick summary page 2, paper showcase pages 36-39. No final workbook DOCX exists.
- Paper kit: 13-page Print_and_Play_Kit.pdf; 5-page Presentation_Art_Boards.pdf; four PNG illustrations; four editable SVG assets plus instructions and artwork prompts. Location: outputs/The_Ferryman_Paper_Mockup_Art/.
- Browser demo build 0.2.1 implementing the base trial, with local artwork, preview, journal, notes, browser save/reload and JSON export. No install, framework or account needed to play. Source is under outputs/The_Ferryman_Digital_Demo/; a packaged demo ZIP is not currently present in outputs/.
- Full agent playtest report, standalone opinion, optional repeatable rule tests and policy experiments, saved browser logs.
- Easy playguide and complete earlier handoff prompt.
- No actual human group playtest, final team approval or completed course submission is known.

## Core trial rules, for orientation

Use the workbook and engine for precise implementation. The following is a summary, not permission to change them.

- Six crossings, four seats, start with two obols and three Standing. Fixed supply S01-S12; refill the shore to five. All information visible, no random events.
- Legacy implemented trial only: each boat uses one destination. This restriction is explicitly rejected for the selected new design. Legacy route values: Elysium toll one obol, base pressure zero; Asphodel no toll, pressure one; Tartarus no toll, pressure two, plus one service obol after a nonempty arrival. All souls are eligible for all routes in this old trial.
- Departure costs must be affordable before arrival. Standing pays memory cost and pressure; exactly enough Standing survives. Arrival rewards cannot rescue a pressure failure.
- Quotas of three obols follow arrivals on crossings three and six. Pressure failure occurs before arrival; quota failure retains arrival rewards and stops before decay.
- Waiting souls receive one normal refusal; separating an available linked pair adds one extra refusal to the waiting partner. Three refusals create a persistent wraith, adding pressure from the next crossing. No appeasement in the base trial.
- Recall up to two memories from a deterministic queue; play at most one for one Standing. New memories enter by source-soul ID. Discard the played card first, then unplayed cards left to right. Recycle oldest discard first when needed.
- R01 protects two; R02 protects three if a two-seat passenger boards; R03 prevents a waiting soul's normal refusal; R04 cancels the soldiers' conflict and protects one; R05 protects two and prevents normal refusal; R06 protects one. Target prevention does not cancel separation refusal.
- Mother/Child and Musician/Listener earn joint memories only when delivered together. Poet protects one with at least two other passengers. Keeper protects one when alone. Red/Blue Soldier conflict adds one pressure once per boat.
- Empty boats remain legal and still face pressure, costs, quotas and waiting-soul decay. No Tartarus service income on empty arrivals.
- Optional events, wishes, route locks, upgrades, forgetting and metaprogression are off.

## Evidence and limits

Recorded September 18 evidence:
- verification/demo-test-results.json: 32 passed, zero failed.
- verification/demo_design_experiments.json: seven deliberate deterministic policies and two branch probes. These are not independent players or statistical balance evidence.
- verification/browser/all-souls-run.json: actual guided browser run won, 12 delivered, zero wraiths, five obols, two Standing. All souls arrived by crossing four; five and six were empty.
- verification/browser/pressure-failure-run.json: actual deliberately warned loss on crossing three, six delivered, one wraith, eight obols, two Standing. Elysium and Asphodel previews survived the same departure; the Tartarus loss was avoidable.
- verification/browser/ui-observations.json: UI text including route previews and an explicitly labelled aborted control test.

Browser tests covered a complete success, pressure failure, targets, save/reload, downloaded exports, reset, future-card reference and a narrow 390x844 viewport. Fixes included scrolling in the tall preview, removal of animated scrolling, a complete card reference and terminal wording. No new browser playtest was performed just by transferring files.

Direct file URL navigation was blocked by the prior browser automation policy. Local HTTP was tested. Do not bypass that restriction or claim automated direct-file launch, real-device, multi-browser, full accessibility or human playtest coverage. The old localhost8765 address is not a hosted site and may no longer be running. Teammates open their own local copy.

## Open decisions and recommended priorities

Current implementation target: outputs/The_Ferryman_v0.3_Decided_Rules.md. The user explicitly said the run is endless and delegated remaining decisions to ChatGPT. All delegated resolutions are labeled Decided by ChatGPT. Earlier proposals are now selected only as specified in this authoritative document.

- D01: responsibility, strategy, survival, in that order (user).
- D02: apprentice Charon (user); carrier/guide, not judge (ChatGPT).
- D03: multi-destination branching travel (user); crossing = edge, cycle = return to start, origin-only boarding, small directed stop graph (ChatGPT).
- D04: lantern starts at 2 (user), cap 6, fog damage greater than light fails; exact zero survives (ChatGPT).
- D05: soul-linked free memories, one per crossing (user); draw to three once per stop, retain hand, shuffle discard when needed, no permanent removal; exact card table in spec (ChatGPT).
- D06: endless and three failure categories (user); hull starts/max 3, sink at 0, dismissal at 3 reprimands; quota 2 obols every third completed cycle, insufficient coins add 1 reprimand without debt (ChatGPT, resolving conflicting quota statements in favor of latest quota request). One light recovered after surviving each return; haven also restores one.
- D07: voluntary release for 2 light (user); repeatable at stops if affordable, immediate removal and 1 fewer reprimand (ChatGPT).
- D08: anger ONLY on completed return to starting shore (user). Normal +1, separation +1 at return, transform at 3 and add reprimand; snapshot waiting souls at departure, no anger for new refill; undelivered passengers add broken-promise reprimands and return to shore; overflow retained (ChatGPT).
- Supply: refill origin toward five after return, not mid-cycle; continuous fixed sequence of fresh 12-template cohorts, distinct IDs and within-cohort links. Delivered souls never return; templates describe different people (ChatGPT).
- Calming: 1 obol protects one waiting soul's normal anger at imminent return, not separation; once before starting-shore departure, expires after return (ChatGPT resolution of user action/cap).
- D09: hidden conditional stop events then reveal (user); four starter events, no surprise lethal damage, optional persistent public knowledge reference, trigger flags reset per run (ChatGPT). This reference is explicit exception to literal no persistent data; no mechanical unlock or carried resources.
- D10: advisory preferences, no mismatch penalty (user); +1 light per matched delivered soul, exact template preferences in spec (ChatGPT).
- D11: no upgrades, memory culling/forgetting or between-run resources/content unlocks (user); within-run memories grow, discard recycling is not removal (ChatGPT clarification).
- Escalation: rocky route alternatives from cycle 3; +1 non-return fog from cycle 5; rotating favored destination bypasses modifier from cycle 6. Capped numerical escalation; no promised forced eventual loss (ChatGPT).
- D12: next prototype is local turn-based plain HTML/CSS/JS with existing temporary art, click/tap controls, node map, exact upcoming-crossing fog previews and explicit hull hazard icons (ChatGPT). Final commercial engine/art decisions remain deferred and do not block this prototype.

All rules above are decisions, not implementation or validated balance. The old demo, paper kit, PDFs and ZIP still contain v0.2. Before updating them, implement v0.3 separately, test the specified phase order and boundary cases, then synchronize requested artifacts. Do not carry old tests/results forward as v0.3 evidence. No code was changed or game played in the decision-recording task.

Most urgent observations are ending pace (two empty late turns in the guided win), late-earned memories never reaching the hand, and Faint Memory's cost cancelling its protection in one recorded comparison. Route resource tradeoffs work in the tested examples; narrative identity remains a team question. Full rescue is possible under several fixed policies; this does not prove ease for new players.

For the deadline, prioritize clear rules, a physical rehearsal and reset, complete components and synchronized material versions. Run the baseline with a teammate before selecting one substantial mechanical experiment. Do not silently rebalance because an agent found a winning plan.

Suggested seven responsibilities, not confirmed assignments: coordinator/submission; rules; playtests; balance/demo verification; physical components; narrative/visuals; presentation/rehearsal. Confirm requirements and exact timing first. Aim for a ready package Sunday September 27 evening, with remaining time reserved for final checks and submission.

## Archive and source provenance

sources/Concept_Report_Extracted.txt and sources/concept_pages/ preserve the cached source text and four rendered pages. The original The_Ferryman_Concept_Report.pdf was absent from its former Downloads location at transfer, so do not claim the original PDF was copied.

archive/Production_Work.zip preserves the 335 pre-transfer files from work/, including build scripts, the template resource, source caches, research, render evidence and superseded drafts. Read archive/README.md. Older resume notes and incomplete drafts in that archive are historical and can contradict the final files. Never treat them as the current instructions or approved rules.

## Repository organization checkpoint

September 27, 2026: root README.md and START_HERE.html now distinguish the decided v0.3 design from the existing playable v0.2 build. outputs/README.md and notes/README.md map deliverables and history. The decision log moved from the root to notes/Decisions_and_Team_Plan.md; its relative links were repaired. The user's prior move of v0.3_handoffs/ to the root was retained, and worker prompt references now match. The missing collectiveThoughts.md source is labeled absent, not reconstructed. Game, artwork, PDF, evidence, archive and tool-state paths remain unchanged. Staging was not intentionally modified. temp/ remains ignored local scratch; new temporary work belongs in work/.

## Next action

September 27, 2026: prepared v0.3_handoffs/ with four copy/paste handoff prompts, a coordination README and a shared API/content/asset contract. User allocation: two ChatGPT Astra conversations for art and content; two Claude conversations for engine/tests and UI/integration/browser QA. Worker D owns final assembly; file ownership is non-overlapping. Distribute the exact same v0.3 rules and contract to every worker. This task only wrote handoff materials; no workers were launched and no game/assets were generated. Next-generation code target is a separate outputs/The_Ferryman_Digital_Demo_v0.3/ folder, preserving v0.2. Chat-only environments receive attachments and return complete files; actual tool access and executed checks must be disclosed, not assumed from subscriptions.

The requested decision recording is complete. The next authorized scope must be read from the user's current request; this task did not implement a new game. The v0.3 rules are ready to use for implementation, followed by automated/browser checks and human playtesting. Preserve the old prototype as a comparison. Do not push or publish. Update this context when implementation or validation occurs.

## Worker B content handoff

September 27, 2026: the user explicitly assigned the work in v0.3_handoffs/02_ChatGPT_Content.md. Completed outputs/The_Ferryman_Digital_Demo_v0.3/content.js, docs/QUICK_START.md, docs/SHOWCASE_SCRIPT.md, docs/CONTENT_REVIEW.md and handoff/content.md. The content pack covers five stops, twelve soul templates, six memories, four events, thirteen required UI labels, nine required help entries plus fifteen documented additions, three failure causes and seven tutorial steps. The recorded rules SHA-256 is 459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb; contract v1 SHA-256 is 2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a. No mechanics were changed.

Node.js v25.9.0 syntax/load and content-format verification passed: eleven check groups, zero failures. Local scratch evidence is work/v03-content/check-results.json; the five-file handoff records commands, coverage, source sections and integration instructions. These are content checks only. No engine, browser or human playtest was performed, and the showcase route and duration remain unverified. Event text must remain hidden until discovery or explicit spoiler-reference access. C/D implementation and integration checks, browser verification, human rehearsal and D's full game package remain outstanding. Existing v0.2 artifacts and the rules/contract were preserved. This context note records the handoff as required by AGENTS.md; other workers' deliverables were not edited.

The user subsequently requested a pull request for this completed content work. This request authorizes publishing this task's branch for review. The PR branch is codex/v03-content, targeting purin-kan/Charon:main from the SupaOhm fork because the authenticated account has read access to the upstream repository. The review contains the five content deliverables and this context note. Merge, deployment and course submission remain outside this request.

The user then explicitly authorized merging PR #1 (https://github.com/purin-kan/Charon/pull/1) and pulling the latest upstream changes into local main. At this merge handoff, the authenticated account has WRITE access, GitHub reports the PR mergeable with no reported CI checks, and the reviewed content files still match their recorded validation hashes. Merge authorization supersedes the earlier publishing restriction for this PR only. Engine/browser verification, human rehearsal, deployment and submission are not completed by merging the content pack.

## Workshop kit implementation checkpoint

September 27, 2026: the user explicitly requested implementation of v0.3_handoffs/05_ChatGPT_Workshop_Art.md. Completed outputs/The_Ferryman_Workshop_Kit_v0.3/ and outputs/The_Ferryman_Workshop_Kit_v0.3.zip. This supersedes the earlier checkpoint's statement that the v0.3 physical kit was not generated. The complete PDF has 36 A4 pages, with ten matching section PDFs: 24 unique starter soul cards, 32 memory-front alternatives and 24 identical backs, directed board and three mats, 20 obol counters, 48 status pieces, four tracker/ledger sheets, player/facilitator references, four event faces and covers, discovery/observation forms, and six continuation pages. The continuation batch supplies 12 fresh-cohort souls, 16 memory alternatives and 12 backs; printed quantities never cap the endless rules. Defaults remain one station, English, A4 and single-sided assembly, not confirmed attendance or print budget.

Editable Python layouts, structured JSON, 44 needed reused art assets, local licensed fonts, nine source snapshots, all 36 page previews, grayscale samples, a station overview, inventory, provenance, validation and handoff are included. Rules SHA-256 remains 459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb. No mechanics, original artwork, old kit, browser game or other worker files were changed. The final repository check was on main at b863aa8; all reused assets and source references still matched their current originals. No dependencies were installed, agents delegated, or files pushed/published during this workshop task.

Recorded checks: eight automated source/PDF check groups passed with zero failures; all 11 PDFs rendered (72 pages including section duplicates), all 36 section pages pixel-matched the complete PDF; all master pages visually inspected, with affected pages checked again after revisions. Minimum text is 10 pt, actual glyphs fit 10 mm page margins, calibration vectors measure 50 mm, cards are 63 x 88 mm and minimum embedded image resolution is 449.6 dpi. Thirteen bounded agent component/rules walkthrough checks passed, covering setup through reset and constructed failure/event states. These are file/layout and agent desk checks, not browser tests or human playtests. The ZIP was rebuilt and its exact contents, CRC and file bytes checked against the final delivery; PACKAGE_MANIFEST.json and validation/package_check.json record current counts and hashes.

All requested file deliverables are marked READY in the kit handoff. Physical printer alignment, actual-size legibility, cutting/handling, memory-back opacity, table readability and human rehearsal remain NOT_RUN. Use kit VALIDATION.md and the blank observation/feedback forms for those checks. No enjoyment, balance, final team art approval, publishing or submission completion is claimed. New temporary work is under work/workshop-kit-v0.3/. Any approved later rule/layout change must rebuild the sources, PDFs, previews, evidence and ZIP together.

The user subsequently requested syncing main with upstream changes and opening a PR for the workshop kit. This explicitly authorizes publishing the workshop branch for review, superseding the general no-push restriction for this task. The branch is codex/v03-workshop-kit, targeting purin-kan/Charon:main. The review includes the complete kit, its verified ZIP and this context checkpoint. Merge, deployment and course submission are not part of this request.

Local main was fast-forwarded to upstream 0e06ce2, which adds Worker D's browser interface, integration checks and browser evidence. That commit leaves the workshop rules/art sources unchanged. The workshop PR branch starts from this synchronized main; those integration files are preserved as upstream work and are not changes introduced by the workshop PR.
