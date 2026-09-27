# v0.3 content review

Worker B, September 27, 2026, Asia/Bangkok. This is a source and content-format audit. It is not engine verification, a browser test or a human playtest. The showcase is a proposed excerpt; its duration and route have not been tested.

## Authority and snapshot

- [Decided rules](../../The_Ferryman_v0.3_Decided_Rules.md), sections 1–11 and retained user requirements. SHA-256: `459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb`.
- [Shared contract v1](../../../v0.3_handoffs/SHARED_CONTRACT.md), stable identifiers, content pack, phases and view contract. SHA-256: `2a90fb7c41c0abf086034ef21da23bfdfb7ad5ba343fb08698f44e3ff879528a`.
- [Worker B assignment](../../../v0.3_handoffs/02_ChatGPT_Content.md). SHA-256: `bfc119cf046f51a325d6c6a51e3ca8e9567883519e4522e8885d4f37e66745ae`.

The reviewed sources are committed at repository HEAD `932a7ace3498297ca34887d36f0216f3beb27712` (`docs: organize repository navigation and versioned project guides`, September 27, 2026, 00:23:32 +0700). Their observed local modification time was September 27, 2026, 00:24:54 +0700. These are source provenance facts, not playtest dates. The coordination README's older statement that the specification was untracked describes an earlier snapshot.

The v0.2 workbook, engine, PDFs and recorded tests were not used to validate v0.3 behavior. Numerical defaults remain untested game decisions.

## Rule and number audit

Each row records the statements manually compared with the specified sections. `help.*`, `nodes.*`, `memories.*`, `events.*`, `endings.*` and `tutorial.*` refer to [content.js](../content.js). Repeated statements in the [quick start](QUICK_START.md) and [showcase](SHOWCASE_SCRIPT.md) were checked against the same sources.

| Copy checked | Statements checked | Exact rules source |
|---|---|---|
| Title, intro, destination prose, tutorial T01, both guides | Apprentice carrier/guide; any destination accepts any passenger; no moral judgment; explicitly fictional adaptation. | §1, lines 24–28; retained user requirements, lines 11–13. |
| `help.promises`, `help.wishes`, tutorial T01/T04, quick start §§1/3/5 | Leaving shore with a passenger commits to delivery anywhere before return. Declining passage is not a broken promise. A wish mismatch adds no penalty, anger or reprimand. | §1, lines 26–28; §4, lines 113–117; §6, line 149. |
| Node keys and names; `help.crossing/cycle/routes`; quick start §2 | Five node IDs; crossing is one edge; cycle ends at shore; starting edges go only to destinations; onward choices use unvisited destinations/haven; at least one destination; at most one visit per destination/haven in a cycle. | §2, lines 30–42; contract Stable identifiers. |
| `help.boarding`, tutorial T02, quick start §1, showcase passenger choice | Four seats; two-seat passengers retain capacity; origin-only boarding; reversible loading before departure; paid actions and played memories are not refunded by boarding changes; empty departures legal; no boarding refill. | §2, lines 42–44; §4, lines 99–104. |
| Quick start initial resources; `help.light/hull/failure/memory` | Start at 2 light, 2 obols, hull 3 of 3, zero reprimands and no memories; light cap 6. No setup recovery. | §3, line 56; §6, line 155; §9 Setup, lines 209–211. |
| `help.light/crossing/hull/failure`, endings, tutorial T03, quick start §3, showcase route speech | Fog damage greater than light fails; exactly zero survives. Fog resolves before rocky hull damage. Hull at zero fails before arrival. Rewards/events cannot rescue failure. Dismissal at 3 reprimands. | §3, lines 60–76; §9, lines 215–220 and 232. |
| `help.passengerEffects`, memory Accord | Each Poet gives 1 protection with at least two other souls aboard; a solitary Keeper gives 1 protection. Each same-cohort opposing soldier pair adds 1 fog unless canceled. Occupied seats are not the soul count. | §3, lines 62–63; §6 Accord, line 167. |
| `help.delivery/wishes/pairs`, tutorial T04, quick start §3 | One complete delivery selection per destination, including none; others continue; no haven unloading or reboarding after delivery. Printed flame/coin grants 1 light/obol, plus 1 light per matched wish. One memory per delivered soul. No repeated reward for that instance. | §2, lines 41–44; §4, lines 97 and 104; §6, lines 132–151; §9, line 216; contract Engine API/Phases. |
| `help.pairs`, quick start §3, showcase delivery speech | Matching cohort Mother/Child or Musician/Listener disembark together in one action for Joined instead of Faint, one per soul. Separate delivery gives Faint with no retroactive replacement. | §6, lines 150–151. |
| `help.anger/supply/promises/returnOrder`, tutorial T02/T06/T07, quick start §5, showcase return speech | Anger changes only at return. Departure waiting snapshot gets 1 normal anger if still waiting/unprotected; marked waiting partner gets 1 additional separation anger. At 3 or more, transform and add 1 reprimand per soul. Return passengers keep anger, gain no waiting anger for that cycle, and add 1 reprimand each. New refill souls gain no past-cycle anger. | §4, lines 99–117; §9 Return, lines 224–230. |
| `help.supply/pairs`, quick start §§1/5 | Fill/refill toward five; fixed twelve-template cohorts; new IDs represent new deceased people; within-cohort links/conflicts; retain waiting anger; keep overflow above five and draw only below five. | §4, lines 95–114. |
| `help.calming/memoryTargets`, quick start §§2/4 | Calm costs 1 obol, one waiting non-wraith soul, once before starting-shore departure. No existing anger removal, separation protection or intermediate-stop calming. Protected targets disabled, no stacking, no refund after boarding, expire at return even if unused. | §5, lines 121–126; §6, line 171. |
| `help.wraiths`, tutorial T05, quick start §§2/5 | Each active wraith adds 1 fog, including return edges. New wraiths affect only later crossings. Voluntary release during preparation at any stop costs 2 light, immediately removes one, reduces reprimands by 1 to minimum zero, repeats if affordable, allows zero light, cannot rescue an ended run. | §3 formula, line 60; §4, line 115; §5, line 128; §8, line 203; §9, lines 219 and 230–232. |
| `help.quota/returnOrder`, tutorial T06, quick start §5, showcase return speech | Automatically pay 2 obols after every third completed cycle, indefinitely. If unaffordable, retain coins, record one missed quota, add 1 reprimand, no debt. Anger and broken promises precede quota; check dismissal before and after quota; no optional interruption. | §3 Quotas, lines 80–84; §9 Return, lines 225–228. |
| `nodes.haven`, `help.hull/recovery/returnOrder`, quick start §§2/3/5 | Repair at shore/haven: 1 obol for 1 hull, repeat to hull 3, only when damaged/affordable. Haven restores 1 light once per cycle. Return recovery is 1 light only after failure checks. No repeated recovery by waiting or reloading. | §3 Repairs and recovery, lines 88–91; §9, lines 216 and 228. |
| `help.memory/memoryTargets`, tutorial T03/T05, quick start §4 | New cards enter bottom of draw pile in cohort/soul-ID order; draw to three once per stop after arrivals/events; keep unplayed cards; recycle shuffled discard; one free play per upcoming crossing, discard after playing, no extra draw or redraw at same stop; allowance resets only after successful crossing and does not accumulate. No permanent removal. | §6 Memory circulation, lines 155–171; §9, lines 216–219 and 229. |
| `help.routes/escalation`, quick start §6 | No destination toll or Tartarus service income. Cycles 1–2 ordinary; rocky non-return alternatives from cycle 3 reduce base fog by 1 to minimum zero, then cause 1 hull damage after fog survival. From cycle 5 add 1 non-return fog including haven. Cycle 6 starts Elysium/Asphodel/Tartarus rotation, ignoring only that +1 modifier at the favored destination. Return edges have zero base/cycle fog and no rocky variant; wraith/passenger effects remain. No unbounded route escalation claim. | §2, lines 43 and 48–52; §8, lines 194–203. |
| `help.discovery/saving`, tutorial T07, quick start §6 | Hidden events revealed on encounter or explicit spoiler-reference access; each event once per run; declined offers still count as discovery and triggering. Resume preserves a run; New run resets mechanical state and event flags. Optional discovery annotations grant no mechanical bonus; clear separately without resetting a run's triggers. | §7, lines 175–190; §10, line 241; contract View/Content pack. |
| `help.returnOrder/failure`, endings, tutorial T06/T07, quick start §5 | Failed return has no cycle-end actions. Completed cycle is counted before shore processing. Anger, transformations, broken promises, dismissal, quota, dismissal, marks cleared, recovery, next cycle, refill, draw. Failure stops later effects. No sixth-cycle victory or win for cohort exhaustion. | §3, lines 72–78; §9 Return, lines 224–232. |

## Soul identity and flavor audit

All twelve `souls` entries have exactly `name`, `flavor` and `memoryFlavor`. Flavor is invented for this adaptation. It promises no additional effect or event outcome. Reused template prose describes a new member of each cohort, with no personal name or claim that a delivered soul returns.

| Keys | Checked names and source |
|---|---|
| S01, S02, S03, S04 | Mother, Child, Merchant, Red Soldier; §6 soul table, lines 136–139. |
| S05, S06, S07, S08 | Poet, Blue Soldier, Cook, Mason; §6 soul table, lines 140–143. |
| S09, S10, S11, S12 | Messenger, Keeper, Musician, Listener; §6 soul table, lines 144–147. |

The showcase's opening trio uses S01 Mother (2 seats, Elysium wish), S02 Child (1 seat, Elysium wish) and S03 Merchant (1 seat, Tartarus wish): four seats total. Their availability follows the fixed-order opening refill (§4, lines 95–99). This is a source-derived demonstration choice, not evidence of a tested route. Runtime seat/reward/preference data remains C's responsibility.

## Memory audit

The stable R IDs come from the contract. Every description is limited to the upcoming crossing except its explicit cycle-end protection mark. Memory source flavor does not change the mechanical description.

| Key | Checked description | Exact rules source |
|---|---|---|
| R01 Steadiness | 2 fog protection. | §6, line 164. |
| R02 Vigil | 1 fog protection; 3 if any aboard soul uses two seats. | §6, line 165. |
| R03 Recollection | 1 fog protection; optional waiting-shore normal-anger protection, targetable from any stop, no separation protection. | §6, lines 166 and 171. |
| R04 Accord | 1 fog protection; cancel all same-cohort opposing soldier conflicts for that crossing. | §6, line 167. |
| R05 Joined Memory | 2 fog protection; same optional waiting-shore protection as Recollection. | §6, lines 168 and 171. |
| R06 Faint Memory | 1 fog protection. | §6, line 169. |

Crossing protection works without a target; marks expire at return and do not stack. Protection does not heal light or grant obols and need not help a zero-damage crossing (§6, line 171).

## Event audit: integration spoilers

This audit is for integration review. Do not place this table in an automatically opened player guide. In the game, show an entry's narrative, condition and effect only after discovery or inside the explicitly opened spoiler reference. No event conditions are included in the quick start, tutorial or ordinary soul flavor.

| Key | Trigger checked | Effect and controls checked | Exact rules source |
|---|---|---|---|
| E01 Shared Farewell | Elysium arrival with at least one matching linked pair delivered together at that arrival. | Automatic +1 light after delivery rewards, capped normally. Empty accept/decline labels; no choice buttons. | §7, lines 175–179 and 184; §3, line 56. |
| E02 Unfinished Message | Asphodel arrival with a Messenger still aboard or delivered here. | Optional 1 obol to remove 1 reprimand, minimum zero. Disabled without funds or at zero reprimands. Decline has no effect. Labels: Pay 1 obol / Decline. | §7, lines 180 and 184; contract pendingEvent permissions. |
| E03 Old Feud | Tartarus entry with both opposing soldiers of one cohort aboard, even if either is delivered here. | Optional 1 obol reconciles only that pair for the rest of the run. No retroactive fog refund or general conflict immunity. Decline has no effect. Labels: Pay 1 obol / Decline. | §7, line 181; §9, lines 215–217; contract pendingEvent permissions. |
| E04 The Broken Landing | Haven arrival with hull below 3. | Automatic +1 hull, capped at 3, after haven recovery. Empty accept/decline labels; no choice buttons. | §7, line 182; §9, lines 216–217. |

All four are deterministic, in E01–E04 order, once per event template per run. Declining does not preserve an offer for later. Conditions are recorded on triggering. Events apply after normal rewards and before memory draw. No hidden event causes immediate lethal resource damage; none changes anger outside the return update (§3, line 68; §7, lines 175–184; §9, lines 216–218).

## Legacy-concept audit

| Old concept checked | Current copy |
|---|---|
| Patience or Standing resource | Uses light. |
| Paid memories | Free play, at most one per upcoming crossing. |
| Anger on every edge | Return-only normal and separation anger. |
| Final crossing 6 | Endless cycles; cycle 6 only starts the favored-destination rotation. |
| Two total quotas | 2 obols every third completed cycle, indefinitely. |
| Mandatory destination wishes | Bonus for matching, no mismatch penalty. |
| Single destination per boat | Multiple destination stops and selective delivery. |
| Boat upgrades | Hull repairs to its existing cap. |
| Permanent memory deletion | Discard recycling, no permanent removal. |

No listed legacy behavior is presented as v0.3 behavior in the content pack or either player document. This table names obsolete concepts solely to document the audit.

## Format and extension contract

The pack assigns one plain data object to `globalThis.CHARON_CONTENT`, version `0.3`, language `en`. Required IDs: five nodes, S01–S12, R01–R06, E01–E04; three endings keyed `fog`, `sinking`, `dismissal`; tutorial T01–T07. All 13 required UI labels and all nine required help keys are present. No extra UI keys require agreement with D.

The following compatible `help` fields are additional display strings: `boarding`, `promises`, `delivery`, `pairs`, `passengerEffects`, `memoryTargets`, `wraiths`, `hull`, `recovery`, `returnOrder`, `supply`, `routes`, `escalation`, `failure`, `saving`. D may place them in relevant detail/help panels. They do not add actions or rule constants. The engine remains authoritative for availability, costs, calculations and warnings. Render all strings as text, never raw HTML.

## Executed checks and limitations

Executed locally with Node.js v25.9.0 on September 27, 2026, Asia/Bangkok:

```sh
node --check outputs/The_Ferryman_Digital_Demo_v0.3/content.js
node work/v03-content/check-content.cjs
```

Syntax check: exit 0. The local content checker completed 11 check groups with zero failures. It parsed the assignment as JSON data, executed the classic script in an isolated Node VM and compared the resulting global object. It also checked required fields, stable IDs, source role names, automatic-event empty labels, UTF-8, absence of em dashes and HTML, local Markdown link targets, and unchanged source hashes.

Recorded coverage: 5 nodes, 12 souls, 6 memories, 4 events, 13 UI labels, 9 required help keys plus 15 documented additions, 3 endings and 7 tutorial steps. All 12 local Markdown links resolved. A static scan found no event titles or complete condition strings in ordinary content or the two player documents; manual review also checked those documents for trigger spoilers. This does not test whether D's interface hides event text correctly.

Local evidence is in `work/v03-content/check-results.json`, fields `status`, `checksPassed`, `checksFailed`, `coverage`, `sourceHashes` and `deliveredFiles`. The helper and results are local scratch evidence, outside the five deliverables; the results include file hashes for the checked copy. The statement tables above record the manual semantic review, which is separate from the format checker. The checker does not evaluate mechanics.

No unresolved rules ambiguity required a content decision. §§7 and 9 jointly establish that arrival events follow the single delivery action and use entry/delivery snapshots; the event text preserves that distinction. All copy is ready for integration review against the recorded snapshot.

Not verified here: C's engine behavior and save format; D's content loading, event hiding, screen layout, accessible controls, failure routing, save/resume or clear-discoveries behavior; any launch method; the showcase route; human understanding, enjoyment or balance. C and D must test implementation separately, followed by human rehearsal.
