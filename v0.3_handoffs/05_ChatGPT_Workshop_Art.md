# Handoff prompt: The Ferryman v0.3 workshop art and print kit

Prepared September 27, 2026 for the local, in-person game-test workshop.

This file is a handoff prompt, not evidence that the workshop kit has been produced. Copy the prompt below into the production task, or ask an agent with access to E:\Charon to execute this file.

---

## Your task and authorized scope

Create the remaining physical workshop components for The Ferryman v0.3. Deliver actual editable source files, print-ready PDFs, previews and a checked ZIP. A list of prompts, isolated illustrations or screenshots of imagined components is not completion.

The user has already commissioned environments, portraits, currencies and gameplay icons. The missing work is assembling those assets into usable tabletop materials. Prioritize legibility, correct rules, easy handling and quick reset. Do not spend the task regenerating finished illustrations.

Default to one complete station kit for a facilitated in-person test. Use English, matching the current rules. Paper size, station count and print budget have not been confirmed. Proceed with A4, ordinary home/office printing, single-sided assembly and low-ink text panels as practical production defaults. State these assumptions in the kit README. Do not invent a confirmed workshop date, attendance count or session length.

This prompt authorizes producing the kit, without another general confirmation. Ask only about a genuinely blocking contradiction or unavailable required source. Ordinary layout and production choices can be resolved and documented.

## Repository boundaries

- Repository: E:\Charon. Read AGENTS.md and AGENT_CONTEXT.md first.
- Other workers may be building the browser engine, content and UI. Inspect current files and Git status before writing. Preserve unrelated and uncommitted work.
- Own new deliverables under outputs/The_Ferryman_Workshop_Kit_v0.3/. Use work/workshop-kit-v0.3/ for temporary generation, extracted data and render checks.
- A shareable ZIP may be created at outputs/The_Ferryman_Workshop_Kit_v0.3.zip.
- Do not overwrite the old paper kit, digital art, assets.js, rules, browser game or another worker's files. Reuse artwork through references or copies into the new kit.
- If the new output directory already exists, inspect it and continue compatible work rather than overwriting blindly.
- Do not rebalance, introduce mechanics, decide final team art approval, push, publish, delete remote branches or launch other agents.
- Use PowerShell literal paths and UTF-8 on Windows. Do not install dependencies without separate authorization. Use available PDF/document skills and bundled tooling when applicable.
- Keep existing source art intact. Do not use broad cleanup or recursive deletion.
- Record actual completion, limitations and remaining work in the kit handoff. Append a concise checkpoint to AGENT_CONTEXT.md when finished, preserving other workers' updates.

## Read these sources in order

All paths below are relative to the repository root.

1. AGENT_CONTEXT.md for project context and boundaries. Its older "no assets generated" and similar historical statements are stale for art completion. Read the latest dated checkpoints.
2. outputs/The_Ferryman_v0.3_Decided_Rules.md, the authoritative rules. Read the whole file.
3. v0.3_handoffs/SHARED_CONTRACT.md for stable IDs: S01-S12, R01-R06, E01-E04 and node names.
4. outputs/The_Ferryman_Digital_Demo_v0.3/handoff/art.md for the delivered art, print-relevant limitations and crop guidance.
5. outputs/The_Ferryman_Digital_Demo_v0.3/assets/assets.js, the active art manifest.
6. In that game's assets/art/ directory: MYTH_AND_VISUAL_NOTES.md, PROVENANCE_R2.json, PROVENANCE.json and VALIDATION_R2.json.
7. Inspect actual artwork and icons before composing the kit. preview.html provides an art catalogue, not a playable game or printable kit.

Do not derive current mechanics from outputs/The_Ferryman_Design_Workbook.md, the old digital demo, old playguide, or outputs/The_Ferryman_Paper_Mockup_Art/Print_and_Play_Kit.pdf. These contain v0.2 material. They may be historical layout references only.

Freshness at preparation, oldest first:

| Source | Last Git commit date | Filesystem modified |
|---|---|---|
| Latest earlier demo-results commit bfaf880 | 2026-09-25 21:20:08 +0700 | Historical v0.2 evidence |
| v0.3 decided rules | 2026-09-27 00:23:32 +0700 | 2026-09-26 23:55:51 +0700 |
| Shared contract | 2026-09-27 00:23:32 +0700 | 2026-09-27 00:07:02 +0700 |
| AGENT_CONTEXT.md, before this handoff checkpoint | 2026-09-27 00:23:32 +0700 | 2026-09-27 00:19:32 +0700 |
| Art revision 2 handoff | Uncommitted | 2026-09-27 10:44:53 +0700 |

POSSIBLY STALE: the earlier root context predates art delivery; v0.2 print materials are not v0.3 rule authority. Recheck Git history and modification dates before relying on sources. Do not treat a recent copy timestamp as a new playtest. If authoritative rules have changed, regenerate from their current contents and document the difference rather than freezing this snapshot.

## Existing artwork to reuse

Resolve current paths through assets/assets.js. The active catalogue contains 20 images, 36 SVG icons and 6 components, recorded in VALIDATION_R2.json counts.

- Five revised environments: shore-r2.png, elysium-r2.png, asphodel-r2.png, tartarus-r2.png and haven-r2.png.
- Apprentice and ferry: apprentice.png and boat.png.
- Threat: wraith-r2.png, the furious reaching spirit. Do not revert to the passive first-pass wraith.
- Soul portraits: S01.png through S12.png.
- Resources: obol-token-r2.png and light-token-r2.png.
- Shared memory reverse: memory-back-r2.png.
- Icons: assets/art/icons/, including resources, hazards, actions, destinations and R01-R06.
- Blank frames: assets/art/components/soulFrame.svg, memoryFrame.svg and routeFrame.svg.

The paintings have opaque backgrounds. They are not transparent cutouts. Keep portraits contained, retain the wraith's reaching hand, and review environment crops. Token paintings are actually 1254 x 1254 pixels. Use vector icons for small printed symbols.

Retain the painted/engraved atmosphere, worn bronze, silver obols and amber lantern. The five environments must remain visibly different in composition. Use pale, high-contrast text areas for print rather than filling every sheet with dark ink. Color must not be the only rules cue.

Souls are individuals. The apprentice carries and guides them, not judges their moral worth. Haven is an original game location. Follow MYTH_AND_VISUAL_NOTES.md for adaptations and source boundaries.

## Deliverables, in production order

### 1. Soul cards

Create finished, printable fronts for S01-S12 using the current soul table at decided rules lines 132-151.

Each card needs:
- Role, portrait, template ID and clearly writable or printed cohort/instance ID.
- Seat requirement, reward type and amount, preferred destination and resulting memory.
- Explicit linked-partner or opposing-soldier identity where applicable.
- Poet/Keeper passenger protection text where applicable.
- A readable anger track and room for temporary status markers without covering rules.

Use repeated complete cohorts to support continued play. Default to two uniquely labeled cohorts, 24 soul instances, as a starter print batch, not a run limit. Provide repeatable cohort sheets and blank ID fields for further supply. Same-cohort relationships must remain unambiguous. Never reuse an active/waiting instance or imply delivered individuals return to life.

### 2. Route board and boat/play mat

Create a readable five-location board using the existing environments, with a current-location marker and visited markers. An A4 board is required; an optional tiled enlargement may be added if needed for table readability.

Represent the actual directed travel rules, not an attractive but incorrect map. No shore-to-haven departure, repeated intermediate stop or boarding away from the shore. Show the return-to-shore route clearly.

Distinguish base fog from final calculated fog. Include ordinary/rocky route selection, a separate hull-damage warning, and a writable final-fog preview. Include the cycle escalation/favored-destination reference without suggesting that rocky variants exist from setup.

Provide:
- A boat mat showing four-seat capacity; two-seat passengers must visibly occupy two seats or use an unmistakable capacity marker.
- Waiting shore with overflow space, source queue and delivered-soul area.
- Active-wraith area retaining source identity.
- Memory draw pile, hand, discard and unused reserve areas.

Do not create an accidental shore cap of five, a maximum soul supply, or a new seating-adjacency rule through layout.

### 3. Currency, resource tracks and status pieces

Create cuttable obol counters and an overflow tally option, since obols have no rules cap. Specify denominations and quantities as printing choices, not new mechanics.

Create tracks/markers for:
- Light 0-6, hull 0-3 and reprimands 0-3.
- Current cycle, completed cycles, next quota and favored destination.
- Current location, visited stops, ordinary/rocky route.
- Anger, active wraiths, waiting-at-departure snapshot, separation and normal-anger protection.
- Calming used this cycle, memory played this crossing and draw already completed at this stop.
- Reconciled soldier pair, with both cohort and identity retained.
- Event resolved this run.

Use distinct shapes, labels and icons. Consolidate bookkeeping on a facilitator tracker when that is clearer than many loose tokens. Include blank/reprintable extras and a component inventory. Finite token supplies must not silently cap an endless rule.

### 4. Playable memory cards

Create all six effect designs, R01-R06, with exact current effects. They are free to play and limited to one per crossing. Include source soul name/ID and delivery destination.

Supply enough instances for the starter soul batch, not merely six cards total. Every delivered soul earns its own memory. Provide Faint/Joined alternatives for each linked soul; only the earned alternative enters the run. Both partners delivered together each receive their own Joined memory. Keep unused alternatives outside the active draw/discard system.

Provide repeatable source-label fields/templates for later cohorts. All active memories must use an identical back so their reverse does not reveal effect or source. Make single-sided sleeve/backing assembly sufficient; duplex printing must be optional.

### 5. Player reference and facilitator materials

Create a concise player quick-reference sheet plus a separate facilitator sheet covering:
- Setup, supply order, resource starting values and all action costs/permissions.
- Fog calculation, rocky damage and the distinction between crossing and cycle.
- Destination delivery, reward/preference bonuses, event timing and memory draw/play.
- Exact return-to-shore resolution order.
- All failure conditions and the fact that zero light can survive.
- Quotas, recovery, repairs, calming, releasing wraiths and later-cycle changes.
- How to track departure snapshots, protected souls and same-cohort links.
- Setup/reset checklist, print/cut/assembly guide and component counts.

Keep facilitator-only event triggers out of the ordinary player reference. Include a clearly labeled optional spoiler reference. Do not require browser code or an online account to run the physical kit.

### 6. Event cards and discovery record

Create E01-E04 from the current event table. Give the facilitator trigger conditions and the player a reveal card containing its effect and any paid choice. Preserve the arrival-before-delivery snapshot needed by Old Feud.

Track whether each event has resolved during this run, even if the optional offer was declined. Keep optional discovery knowledge separate from run state. Do not shuffle these as random events or imply hidden events can inflict new lethal penalties.

### 7. Workshop observation and feedback sheet

Create a printable form with:
- Kit/rules version, session identifier, date and facilitator.
- Start/end time, completed cycles, delivered souls, failure cause or "session stopped", and notable game state.
- Rules questions, symbol misunderstandings, facilitator interventions and relevant choices.
- Short neutral feedback prompts about clarity, responsibility, difficult decisions and tedious bookkeeping.
- Separate spaces for observed behavior, player comments and proposed revisions.

A workshop time limit can stop observation but must not become a new victory condition. Do not prefill results, invent participant feedback or claim balance from a rehearsal.

## Rule traps to check explicitly

Read the full rules; this checklist is not a substitute.

- Start with 2 light, 2 obols, hull 3 and 0 reprimands. Light caps at 6.
- Fog greater than available light fails; exactly zero remaining light survives. Hull 0 and reprimands 3 end the run.
- Base fog follows destination: Elysium 0, Asphodel 1, Tartarus 2, haven 0, shore 0. Final fog also includes the current modifiers and protection.
- Rocky alternatives begin at cycle 3. The fog modifier begins at cycle 5; favored destinations begin at cycle 6. Return edges never receive rocky or cycle-fog modifiers.
- Quota is 2 obols after every third completed cycle. Insufficient funds keep the coins and add one reprimand, without debt.
- Anger happens only on completed return. Normal-anger protection does not prevent separation anger. Transformations occur at anger 3 and add reprimands.
- Undelivered passengers returning to shore cause broken-promise reprimands. Preferred-destination mismatch alone does not.
- Repair at shore/haven costs 1 obol per hull. Release at a stop costs 2 light and reduces reprimands by one.
- Calming at shore costs 1 obol, once before that cycle's departure, and prevents normal anger rather than removing existing anger.
- Memories are free, one per crossing; draw to three once per stop. Preserve hand and shuffle discarded memories when needed.
- Souls arrive in fixed template order with fresh cohort IDs. Refill toward five only at the appropriate setup/return step, retaining overflow.
- A preference match grants +1 light. Passenger rewards happen after surviving the crossing.
- No destination toll, Tartarus service income, Standing, upgrades, finite victory, random event draw or permanent memory removal.

Trace every printed value/effect to the current rules. If a rule needed for a component is actually ambiguous, report the exact passage instead of inventing a mechanic.

## Print and file requirements

Use these default production targets unless source constraints make another choice necessary:

- A4 pages, printer-safe margins of at least 10 mm, consistent card size, cut lines and a labeled 50 mm calibration line.
- Aim for 63 x 88 mm cards where readable. Enlarge components or move secondary prose to a keyed reference rather than shrinking essential text below 10 pt; prefer 11-12 pt for rule text.
- Keep essential text and symbols safely inside cut edges. Do not depend on full-bleed printing.
- All labels, numbers and rules must be typeset as editable/selectable text, not generated inside raster art. Use vector shapes/icons for frames and counters.
- Keep image aspect ratios correct and record effective print resolution. Review the actual print size, not only an enlarged screen view.
- Use restrained artwork areas and light text panels. Check grayscale readability and symbol/label distinctions.
- Include "v0.3 workshop prototype" on relevant sheets. Never use em dashes.
- Use local, available fonts and embed them in PDFs where supported. No remote fonts or expiring image URLs.
- If a genuinely missing raster illustration is necessary, use the available image-generation tool and record its provenance. Prefer the existing art and simple authored vector pieces.

Suggested output structure, with equivalent clearly documented names acceptable:

outputs/The_Ferryman_Workshop_Kit_v0.3/
- README.md
- Print_and_Play_Workshop_v0.3.pdf, the complete kit
- print/, separate PDFs for soul cards, memories, board/mats, tokens/trackers, references, events and observation sheets
- source/, editable layouts, structured component data and reproducible generation scripts
- assets/, only reused/new assets needed by the source package
- previews/, rendered sheets and at least one complete table-layout overview
- COMPONENT_INVENTORY.md, exact quantities, print page ranges, dimensions and reprint instructions
- PROVENANCE.md, art reuse/new art and rules-to-components mapping
- VALIDATION.md, actual checks, failures fixed and remaining limitations
- handoff.md, delivered/missing items, readiness and physical rehearsal requirements

## Required checks before delivery

1. Build a structured source-of-truth table from the current rules and cross-check soul stats, memory effects, event triggers, action costs, route values and phase order across every sheet.
2. Ensure the starter batch has unique soul IDs, valid pair relationships, adequate memory alternatives and an explicit way to continue beyond the batch.
3. Render every PDF page to images using available tooling. Inspect every page for clipping, overlap, unreadable text, missing art, broken glyphs, unsafe cuts and misplaced backs.
4. Check A4 dimensions, card dimensions, page counts, inventory totals, calibration line and assembly instructions. Distinguish actual checks from recommended future checks.
5. Check representative grayscale renders, small icons and rule text at intended print scale. Fix problems and rerender affected sheets.
6. Walk through setup, boarding including a two-seat soul, travel, delivery, memory use, a return, a wraith, a quota and reset using the generated materials. Check that every required state has a place to be recorded. Label this an agent component/rules walkthrough, not a human playtest.
7. Include a physical print/rehearsal checklist. Actual printer alignment, handling, table readability and human playtesting remain NOT_RUN unless someone actually performs them.
8. Rebuild the ZIP after final edits. Verify its files match the delivered sources/PDFs and exclude temporary renders, unrelated files and the ZIP itself. Preserve final preview images and validation evidence in the delivery.
9. Mark each deliverable READY, NEEDS_REVISION or NOT_GENERATED with reasons. READY means it passed the recorded file/layout checks, not final team approval or validated balance.

Finish by linking the complete PDF, ZIP, preview and handoff. Report exactly what exists and what still needs a physical check. Do not claim the kit is generated if only the instructions or designs have been described.

