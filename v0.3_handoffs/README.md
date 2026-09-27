# Four-worker handoff pack for Charon v0.3

Prepared September 27, 2026. This pack assigns work; it does not start agents or generate the game.

This folder lives at the repository root: `v0.3_handoffs/`. See the [project guide](../README.md), [decided rules](../outputs/The_Ferryman_v0.3_Decided_Rules.md) and [decision history](../notes/Decisions_and_Team_Plan.md).

Use two ChatGPT Astra conversations for images and content, and two Claude conversations for implementation. This follows the user's available accounts and preferred allocation, not a model benchmark or a claim about plan entitlements. Each person runs their own conversation and passes files through the coordinator.

## Allocation

| Worker | Conversation | Owns | Handoff prompt |
|---|---|---|---|
| A | ChatGPT Astra with image-generation tools available | Generated art and asset manifest | 01_ChatGPT_Art.md |
| B | ChatGPT Astra | Narrative, UI copy and editable playguide | 02_ChatGPT_Content.md |
| C | Claude | Pure game engine, rules data, serialization and engine tests | 03_Claude_Engine.md |
| D | Claude | Browser interface, integration, browser QA and final package | 04_Claude_UI_Integration.md |

D is the integration owner, not a fifth worker. The human coordinator distributes this packet, resolves rule questions and collects deliverables. No worker silently changes approved mechanics.

## Workshop follow-up

[05_ChatGPT_Workshop_Art.md](05_ChatGPT_Workshop_Art.md) covers the remaining physical v0.3 workshop kit: printable cards, board and mats, counters and trackers, references, event cards and observation sheets. It reuses the delivered revision 2 artwork and defines a separate output folder, print checks and packaging requirements. This is a follow-up production prompt, not an additional worker in the four-worker browser-game allocation. The prompt's existence does not mean the workshop kit has been generated.

## What to give each conversation

Paste that worker's prompt as the task. Attach or grant access to:

1. `outputs/The_Ferryman_v0.3_Decided_Rules.md`, the authoritative game rules.
2. This directory's `SHARED_CONTRACT.md` and the selected worker prompt.
3. `AGENT_CONTEXT.md` and `AGENTS.md` for current context and working constraints.
4. Optional references listed inside the worker prompt. Give C and D the old demo folder as a reference, clearly labeled v0.2. Give A existing art references if available.

When using a chat without repository access, upload the files. `E:\Charon` is a path on the coordinator's computer, not automatically accessible in another person's chat. Ask the worker to return real downloadable files/a ZIP if its tools support them; otherwise use the prompt's full-file fallback. Do not assume Claude Pro supplies a terminal, local repository or browser automation: use available tools and report execution limitations honestly.

Use separate working copies or branches to avoid concurrent writes. Local branch suggestions: `codex/v03-art`, `codex/v03-content`, `codex/v03-engine`, `codex/v03-ui`. Do not push, force-push or delete remote branches. The coordinator handles any remote sharing. If separate machines are used, preserve the relative directory layout in every returned ZIP.

## Parallel order

All four can begin immediately with the same rules and contract snapshot.

- A supplies the essential art first. D uses placeholders until it arrives.
- B supplies `content.js` first, then the quick guide. D uses fallback English labels until it arrives.
- C supplies a minimal real `createGame/getView/dispatch` implementation first, then the complete engine and evidence. D builds against the frozen API using fixtures in its own directory in the meantime.
- D owns the interface from the start. Once C is available, replace fixtures with the actual engine; integrate A and B files at their fixed paths, run browser checks, then package.
- Failed rule tests go to C; interface/integration failures to D; copy mismatches to B; image defects to A. Each author changes their owned files. D copies revised deliverables but does not silently repair another owner's mechanics.

Fixtures must be visibly labeled development fixtures and never shipped as working gameplay. Art/content delivery does not block real engine integration. A playable placeholder build comes before visual polish.

## Single source of truth and freshness

The v0.3 specification was untracked when this pack was prepared; its local modification time was September 26, 2026 at 23:55:51. This is a document timestamp, not playtest evidence. Distribute one identical copy to all workers. Record a SHA-256 of that copy in each delivery note when file tools are available; otherwise record the exact provided filename/version and disclose that no hash was computed.

The contract below is an implementation interface, not new game mechanics. If a worker finds a contradiction in the rules, report the precise section and continue independent work. Route any required rule choice through the coordinator. Do not import v0.2 mechanics just because the old source already implements them.

## Ownership and integration

All game-relative paths below are under `outputs/The_Ferryman_Digital_Demo_v0.3/`.

| Owner | Allowed files |
|---|---|
| A | `assets/art/**`, `assets/assets.js`, `handoff/art.md` |
| B | `content.js`, `docs/QUICK_START.md`, `docs/SHOWCASE_SCRIPT.md`, `docs/CONTENT_REVIEW.md`, `handoff/content.md` |
| C | `engine.js`, `rules-data.js`, `tests/engine/**`, `verification/engine/**`, `docs/ENGINE_API.md`, `handoff/engine.md` |
| D | `index.html`, `app.js`, `styles.css`, `ui/**`, `tests/integration/**`, `verification/browser/**`, `README.md`, `RELEASE_NOTES.md`, `handoff/integration.md` |

D can assemble copies of everyone's finished files and create `outputs/The_Ferryman_Digital_Demo_v0.3.zip`. The original author remains responsible for changes to copied owned files. Only the coordinator updates the root workbook, decided rules and AGENT_CONTEXT.md after integrating the reported facts. Preserve the entire v0.2 demo and ZIP.

Every delivery note includes files, interface/version, rules snapshot, what was actually checked, commands/results or other evidence, known issues, and what D must do next. A lack of tool access is a limitation, not a test pass.

## Finish line

The integrated game implements v0.3, uses the real engine, loads local content/assets, and includes demonstrated engine and browser checks. All failures and missing coverage are disclosed. The ZIP must contain the same verified version as the delivered folder. A human team member still needs to rehearse/play it; automated evidence does not prove enjoyment or balance. Hosting and submission are outside this handoff.
