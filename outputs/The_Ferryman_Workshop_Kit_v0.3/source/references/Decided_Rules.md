# The Ferryman v0.3: decided prototype rules

## Authority and status

The user confirmed endless play and explicitly authorized ChatGPT to make and record the remaining decisions. All resolutions, numerical defaults and content specifications below are **Decided by ChatGPT**, except the user requirements listed separately. These are implementation decisions for the next prototype, not evidence of balance or human approval of the finished game.

This document takes precedence over conflicting earlier decision entries and v0.2 trial rules. The browser demo, PDFs, paper kit and ZIP files still contain the old game. Recording this document does not update them. Implement the next version separately and retain the old version for comparison.

## User requirements retained

- Experience priority: responsibility, then strategic play, then survival pressure.
- Player character: an apprentice Charon.
- Endless runs until failure; branching travel with multiple destinations and events at stops. Reject one destination per boat.
- Lantern light replaces Standing/patience; start with 2 light. Fog drains it and grateful souls restore it.
- Memories relate to transported souls, cost nothing to play, and are limited to one per crossing.
- Obols can calm a waiting soul at most once per crossing. Latest currency instruction also assigns obols to Hades' quotas.
- Wraith release is voluntary and costs 2 light.
- Anger increases only upon completing a cycle by returning to the starting shore.
- Souls have advisory destination wishes: a bonus for matching and no punishment for mismatch.
- Conditional events are hidden until encountered; reveal their effects and conditions afterward.
- No boat upgrades, permanent memory removal, forgetting or resource/content unlock progression between runs.
- Fixed-order supply built from 12 soul templates; refill the waiting shore toward five.

## 1. D02: apprentice authority

**Decided by ChatGPT:** the apprentice is a carrier and guide, not a judge of souls' moral worth. The destination gates in this game accept any passenger. Route choice concerns the passenger's preference and the journey, not assigning deserved punishment. This is an explicit fictional adaptation.

Boarding creates one binding promise: deliver the passenger to any destination before returning to the starting shore. A preferred destination remains advisory and does not create an additional binding promise. Declining to board is not itself a broken promise.

## 2. D03: map, crossings and cycles

**Decided by ChatGPT:** one crossing is one edge between stops. One cycle is the complete trip from the starting shore back to that shore. Use the word cycle throughout the UI; shift is only a narrative synonym, not a separate timer.

Use this small directed map for the first build:

- Starting shore -> Elysium, Asphodel or Tartarus.
- From any destination -> an unvisited destination, the haven if not yet visited, or the starting shore.
- Haven -> an unvisited destination or the starting shore.
- A destination and the haven may each be visited at most once per cycle. The starting shore can be reached only to finish the cycle. No self-loops or mid-cycle returns to visited stops.
- At least one destination must be visited before returning. A cycle therefore has a bounded number of crossings, while the run has unlimited cycles.
- At a destination, the player chooses which aboard souls disembark. Remaining passengers continue with the boat. A delivered soul cannot reboard.
- Only the starting shore boards new souls. This resolves the earlier proposal for multiple persistent waiting shores without adding location bookkeeping.
- The boat has four seats. Two-seat souls retain their printed capacity. Capacity is checked before departure. No paid route access, destination tolls or Tartarus service income in v0.3; coins are used for quotas, calming and repairs below.
- Empty departures remain legal. They consume crossings and cycles normally and give no passenger rewards.

### Route numbers

Each outgoing edge has base fog determined by its destination: Elysium 0, Asphodel 1, Tartarus 2, haven 0, starting shore 0. These are starting prototype values, not a claim of balance.

From cycle 3 onward, each non-return edge has a second, explicitly marked rocky variant. It has base fog reduced by 1, minimum 0, but causes 1 hull damage after successful fog resolution. It goes to the same stop. The ordinary variant remains available. Return edges are never rocky.

Show final fog danger as one prominent number for each selectable route. Show a hull-damage icon separately on rocky variants; one fog number must not hide another failure risk. Include a breakdown on request.

## 3. D04/D06: resources, survival and failure

**Decided by ChatGPT:** start with 2 light, 2 obols, hull integrity 3 of 3, zero reprimands, and no memories. Light is capped at 6; obols have no cap. Resource gains above the light cap are lost. Hull is fixed-capacity condition, not an upgrade track.

For a selected edge:

`fog damage = max(0, base fog + cycle modifier + active wraith count + soldier conflict - passenger protection - memory protection)`

- Soldier conflict is +1 for each same-cohort opposing soldier pair aboard, unless canceled by Accord or that pair's reconciliation event. Separate cohort identities never create accidental links or conflicts.
- Passenger protection is +1 for each aboard Poet with at least two other aboard souls, and +1 for a Keeper who is the only aboard soul. Effects do not depend on seating adjacency in this version.
- Memories protect only the upcoming crossing unless their card explicitly marks a waiting soul for the cycle-end anger update.
- If damage exceeds current light, the run ends before arrival. Otherwise subtract damage. Exactly zero light survives, including after paying to release a wraith.
- Apply rocky-edge hull damage next. Hull at zero ends the run before arrival and before rewards.
- Passenger rewards and wish bonuses occur only after surviving the edge. They cannot rescue a failed crossing.
- No hidden event deals immediate lethal resource damage in this starter event set. It may offer an optional clearly priced action.

### Failure conditions

The run ends immediately on the first of:

1. Fog damage exceeds available light: the lantern cannot sustain the crossing.
2. Hull reaches zero: the boat sinks.
3. Reprimands reach 3: Charon ends the apprenticeship.

The run summary records completed cycles, delivered souls and their destinations, memories earned, wraiths formed/released, missed quotas and the failure cause. No victory screen occurs when the original supply is exhausted. Finishing a cycle is a checkpoint.

### Quotas: resolution of the earlier contradiction

**Decided by ChatGPT:** retain the user's latest quota instruction, replacing the earlier exclusion and the finite two-quota limit. Hades requires 2 obols after every third completed cycle, indefinitely. Quotas do not escalate.

Pay automatically during the cycle-end sequence when affordable. If fewer than 2 obols are available, keep existing coins, record one missed quota and add one reprimand. No debt accumulates and nonpayment is not a separate immediate defeat; repeated neglect can produce dismissal. Show the next due cycle and amount continuously. This is fictional game administration, not a mythology accuracy claim.

### Repairs and recovery

- At the haven or starting shore, spend 1 obol to restore 1 hull, repeatable up to hull 3. Disable the action at full hull or insufficient funds. Repair is maintenance, never an upgrade.
- Arriving at the haven restores 1 light, once per cycle.
- Completing a cycle restores 1 light after surviving all cycle-end failure checks. No repeated recovery is available by remaining at a stop or reloading a save.
- No rest action reduces reprimands. Releasing a wraith reduces reprimands by 1, minimum zero, as the explicit way to repair past harm.

## 4. D08: endless supply, boarding and anger

**Decided by ChatGPT:** the starting supply is a fixed sequence of 12 templates. When its queue is exhausted, append another cohort of the same 12 templates in the same order on the next refill that requires a card. Every instance has a fresh ID, such as C02-S01, and represents a different deceased person, not a previously delivered soul returning to life. Display profession/role and cohort identity; narrative names may differ later without changing rules.

This explicitly replaces the earlier finite total of 12 with an endless sequence of 12-template cohorts. Links and soldier conflict connect only matching members within one cohort. Rewards and memories are granted once per soul instance.

- At setup, fill the starting shore to five waiting souls.
- At the beginning of a later cycle, after all return processing, refill to five. Do not refill after moving a soul into the boat during preparation and do not refill at intermediate stops.
- Persist waiting souls and their anger between cycles. Newly drawn souls start at zero anger and are not charged for the just-finished cycle.
- Loading is reversible until departure. Calming, memories and other paid actions are explicit confirmed actions; boarding changes do not refund them.
- When leaving the starting shore, snapshot all waiting soul IDs. Mark a waiting linked partner for separation if their matching partner departs aboard. Tentative boarding does not create a separation mark.
- Passengers cannot be discarded or unloaded at the haven. At destinations, any selected passengers may be delivered without a mismatch penalty.

### Cycle-end anger and dismissal

Only on return to the starting shore:

- Each soul in the departure waiting snapshot that is still waiting gains 1 anger, unless protected against normal anger by calming or a memory.
- Each marked separated waiting partner gains an additional 1 anger. Normal-anger protection does not cancel separation anger. Both increments occur only here.
- At anger 3 or more, transform the soul into a wraith, remove it from the waiting shore and add one reprimand. A single return can produce several transformations and reprimands.
- An undelivered aboard soul has had its binding delivery promise broken. Add one reprimand per such soul and return it to the waiting shore, retaining its existing anger. It was not in the waiting snapshot and gets no waiting anger for that cycle.
- If returned passengers make the shore exceed five, keep them all and draw no new souls until below five. Never delete overflow souls.
- New wraiths affect the next crossing after this return, never the crossing that has already finished.

Expose predicted return anger, transformations and reprimands during departure planning. Warnings update when passengers, protection or routes change. Missing a preferred destination never adds anger or reprimands by itself.

## 5. Calming and D07 wraith release

**Decided by ChatGPT:** calming costs 1 obol, selects one waiting non-wraith soul, and prevents its next normal anger increase at the imminent cycle completion. It does not remove existing anger, prevent separation anger or release an existing wraith.

- Calming is available only while preparing at the starting shore, capped once before the outgoing crossing. It is not remotely available at other stops.
- Since this map has one starting-shore departure per cycle, the once-per-crossing limit yields at most one calming action per cycle. Do not silently add actions at intermediate stops.
- Protection lasts until this cycle's anger update and then expires, even if unused. The action is disabled when the target already has normal-anger protection. If the player later boards the calmed soul, the coin is not refunded.
- A memory may protect a different waiting soul. Protection on the same soul does not stack.

At any stop during preparation, voluntarily pay 2 light to release one active wraith. Repeat if affordable; no extra per-crossing limit. Remove the wraith immediately, reduce reprimands by 1 if above zero, and recompute previews. Spending down to zero light is legal. A run that already ended cannot be rescued by a release action.

## 6. D05/D10: souls, wishes and memories

**Decided by ChatGPT:** use these 12 templates per cohort. Coin/flame quantities are one each where shown. These are complete v0.3 defaults and supersede reward ambiguities in older prose.

| ID | Soul role | Seats | Reward | Preferred destination | Memory |
|---|---|---:|---|---|---|
| S01 | Mother | 2 | Flame | Elysium | Faint / Joined |
| S02 | Child | 1 | Flame | Elysium | Faint / Joined |
| S03 | Merchant | 1 | Coin | Tartarus | Vigil |
| S04 | Red Soldier | 2 | Coin | Tartarus | Accord |
| S05 | Poet | 1 | Flame | Asphodel | Recollection |
| S06 | Blue Soldier | 1 | Coin | Asphodel | Accord |
| S07 | Cook | 1 | Flame | Asphodel | Recollection |
| S08 | Mason | 2 | Coin | Elysium | Vigil |
| S09 | Messenger | 1 | Coin | Asphodel | Steadiness |
| S10 | Keeper | 2 | Flame | Tartarus | Steadiness |
| S11 | Musician | 1 | Flame | Elysium | Faint / Joined |
| S12 | Listener | 1 | Coin | Elysium | Faint / Joined |

- Delivering grants the printed reward, plus 1 light if the destination matches the preference, once per soul instance. No per-stop cap; the lantern cap still applies.
- Grant one memory per delivered soul instance. Each memory records its source name/ID and delivery destination even when its effect shares a template with another soul.
- Mother/Child and Musician/Listener each grant Joined instead of Faint only when both matching cohort partners disembark together in the same action. Otherwise each grants Faint; no retroactive replacement.

### Memory circulation

- Start with empty hand, draw pile and discard pile. Add new memories to the bottom of the draw pile in soul-ID order, with cohort number before template number.
- Once per stop, at the start of preparation after arrivals/events, draw until the hand contains three or no cards remain. Preserve unplayed cards. Drawing is not repeatable at the same stop after playing a card.
- When the draw pile empties, shuffle the discard pile into a new draw pile. A seeded shuffle in the browser makes recorded runs reproducible; paper uses a physical shuffle. Soul arrival order remains fixed.
- Play at most one card before the next crossing, for no resource cost, then discard it. It cannot be drawn again at that same stop.
- Reset the memory-play allowance only after a crossing is successfully completed. Unused allowance never accumulates. At setup, drawing an empty pile still uses that stop's single draw phase.
- Discarding is temporary recycling, not permanent removal or forgetting. No memory culling, upgrades, equipment slots or additional archive system.

| Memory | Effect for upcoming crossing |
|---|---|
| Steadiness | 2 protection. |
| Vigil | 1 protection; increase to 3 if any aboard soul uses two seats. |
| Recollection | 1 protection; optionally mark one waiting starting-shore soul to prevent normal anger at this cycle's return. |
| Accord | 1 protection and cancel all same-cohort Red/Blue soldier conflicts for this crossing. |
| Joined Memory | 2 protection; optionally mark one waiting starting-shore soul to prevent normal anger at this cycle's return. |
| Faint Memory | 1 protection. |

Recollection/Joined can target the visible waiting shore from any stop through remembrance. Protection marks expire at cycle completion; multiple marks on one soul do not stack. The base crossing protection applies even without a valid waiting target. Protection cannot heal light or produce coins; a zero-damage crossing may not benefit from playing a card. Do not promise every card helps in every state.

## 7. D09/D11: events and discovery

**Decided by ChatGPT:** hidden conditions trigger on arrival at intermediate stops before preparation and memory draw. Resolve all matching events in the table order below, at most once per event template per run. They are deterministic, not random. Record the condition when triggered regardless of whether an offered action is accepted.

| ID | Hidden trigger | Revealed event and effect |
|---|---|---|
| E01 | Arrive at Elysium with at least one linked pair delivered together at this arrival | Shared Farewell: gain 1 light. |
| E02 | Arrive at Asphodel with a Messenger still aboard or delivered at this arrival | Unfinished Message: optionally pay 1 obol to reduce reprimands by 1, minimum zero. Declining has no effect. |
| E03 | Arrive at Tartarus with both same-cohort soldiers aboard on entry, even if one disembarks here | Old Feud: optionally pay 1 obol to reconcile this pair for the rest of the run, removing only their conflict pressure. Declining has no effect. |
| E04 | Arrive at the haven with hull below 3 | The Broken Landing: gain 1 hull up to 3. |

All event effects apply after normal delivery rewards. E02's paid choice is disabled at zero reprimands. No event changes anger outside the cycle-end update. New condition/effect text appears on the involved soul's detail panel and the event logbook.

### Persistence resolution

No game resources, souls, memories, hull, reprimands, upgrades or content unlocks carry into a new run. All event trigger-once flags reset each run.

The event logbook is a **knowledge reference**, not progression: all entries are accessible in a separate spoiler reference from the outset. A player may choose to keep discovered entries visible across runs; this grants no mechanical bonus or exclusive access. On paper, retaining the reference is optional, with no required per-run bookkeeping. The digital prototype remembers discovery annotations locally and provides a clear-discoveries option. This is the explicitly selected exception to literal zero persistent data, reconciling the user's request to plan around learned events.

## 8. D06: endless escalation

**Decided by ChatGPT:** number cycles starting at 1. No enemy or route value rises without a cap.

| Cycles | Change |
|---|---|
| 1-2 | Base route fog and ordinary edges. |
| 3-4 | Rocky alternatives become available, trading lower base fog for hull damage. |
| 5 onward | Add 1 fog to every non-return edge, including haven edges; rocky reduction applies to base fog before this modifier. |
| 6 onward | Keep the above ceiling. Rotate each cycle's favorable destination Elysium, Asphodel, Tartarus, repeating. Edges entering it ignore the +1 cycle fog modifier that cycle. Cycle 6 favors Elysium. |

Return edges always have base fog 0 and cycle modifier 0, but still face active wraith pressure and passenger effects. The haven and repairs remain available. Persistent anger, wraiths, obligations and memory composition create further difficulty rather than unbounded stat inflation. No promise is made that every future state is survivable or that eventual failure is inevitable under perfect play.

## 9. Complete phase order

**Decided by ChatGPT:** use this order without exceptions unless explicitly specified above.

### Setup

Initialize resources and cycle 1; fill starting shore to five; prepare. Do not grant cycle-end recovery at setup.

### At a destination or haven

1. Arrive after surviving fog and hull damage.
2. At a destination, choose all souls to deliver in one confirmed action. Grant printed rewards, wish bonuses and memories once. At the haven, grant its once-per-cycle recovery instead.
3. Evaluate and resolve arrival events in ID order, using both arrival passenger snapshot and delivery results.
4. Draw memories to three once.
5. Prepare: release wraiths, repair where available, select next edge, optionally play one memory. These actions update the preview. Calming/boarding are starting-shore only.
6. Confirm departure, apply fog, then any rocky hull damage. A failure stops here. Otherwise arrive and continue.

### Returning to the starting shore

1. Survive the return edge using the currently active wraiths. If failed, no cycle-end actions occur.
2. Increment completed cycles. Resolve anger for the departure waiting snapshot, separation marks and transformations; add their reprimands.
3. Return undelivered passengers to the shore; add their broken-promise reprimands. Check dismissal now. If dismissed, stop without paying quotas or receiving recovery.
4. Settle quota if the completed-cycle count is divisible by 3; check dismissal again. No optional actions can interrupt steps 2-4.
5. Clear cycle marks, grant 1 light recovery, increment current cycle, reset visited stops, and display the next cycle's modifier/quota information.
6. Refill toward five using continuous fixed-order cohorts. Draw memories to three once.
7. Prepare: board, calm at most one waiting soul, repair, release wraiths, choose route and optionally play one memory. On confirmed departure, capture waiting and separation snapshots.

No action applies anger mid-cycle. No later reward, release or repair can undo an already-triggered failure. The UI must warn about known lethal departures and predicted dismissal at return; allow deliberate confirmation rather than silently choosing a safe move.

## 10. D12: next prototype scope and presentation

**Decided by ChatGPT:** build the next prototype as a local browser game with plain HTML/CSS/JavaScript, using the current dependency-free approach. Use a turn-based node map, boat occupancy display and click/tap boarding and drop-off controls. No real-time steering or spatial balance simulation in this version. This settles prototype implementation scope, not a commercial production engine or final art direction.

- Show lantern light, obols, hull and reprimands in a compact boat/status display, with cycle number and next quota.
- Soul cards use a coin/flame for reward, plus seat icons, preferred destination, link/conflict symbols and anger marks. Detail panels contain memory and event text. Do not hide actionable rules behind hover-only controls.
- Route cards show one final fog number, any hull damage and reachable stop. Exact fog preview concerns the upcoming crossing; undiscovered arrival events remain hidden.
- Save/resume preserves the current run. New Run resets it. Discovery reference is managed separately.
- Use existing local assets as temporary art with text labels; no new asset licensing assumption or final art approval.
- Paper rules can use this same phase order. Updating the printed kit and PDFs is a later synchronization deliverable, not accomplished by this decision record.

## 11. Implementation and validation boundary

The gameplay gaps raised in the current discussion are decided for v0.3. All ChatGPT-selected values are test defaults. Changing them after evidence is a revision, not proof the original choice was correct.

Before calling the next build verified, test: multi-destination drop-offs; cycle-only anger and separation; no anger for new refill souls; cohort rollover and scoped links; free-memory draw/discard limits; calming expiry; exact-zero light; unaffordable wraith release; immediate wraith removal; hull failure before rewards; quota/reprimand ordering; advisory wish mismatch; event reveal/once-per-run behavior; independent run reset versus knowledge reference; and failure stopping later rewards.

Then complete browser runs and a human paper rehearsal. Existing v0.2 evidence does not validate v0.3. No new game code, art, PDFs, packaged demo or playtest result is created by this document.
