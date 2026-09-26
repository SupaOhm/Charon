# Rule-to-test matrix (engine, v0.3)

Spec: `outputs/The_Ferryman_v0.3_Decided_Rules.md` (section numbers below). Tests: `tests/engine/*.test.js`; the test ID is the first token of each test name. `run-verification.cjs` fails if an ID listed here has no passing test, or a test is missing from this file. Expected values in the tests are derived by hand from the spec text, not from engine formulas. Status of each row is whatever the last recorded `engine-test-results.json` says; see `handoff/engine.md` for the run that produced it.

| Rule | Spec § | Test IDs |
|---|---|---|
| Opening state: 2 light, 2 obols, hull 3, 0 reprimands, five waiting souls, cycle 1, no memories | 3, 4, 9 Setup | API-01, MEM-15 |
| Opening route fog 0/1/2 in cycle 1, no rocky variants | 2, 8 | API-02 |
| createGame validates its seed and options | Contract | API-03 |
| Stable public API: createGame, getView, dispatch, serialize, deserialize; invalid actions leave state unchanged | Contract | API-04, API-05, API-06, API-07 |
| Constants cannot be altered by any action | 3, Contract | API-09 |
| Save/load: schema version, malformed and inconsistent saves rejected, no partial load | 11, Contract | API-07, API-08, CE-21 |
| Hidden event predicates absent from normal view until triggered | 7 | API-10, EV-17 |
| Ended run: cause and summary, no legal actions | 3 Failure | API-11, PH-04 |
| Directed map: shore to three destinations; destinations to unvisited destination, haven, or shore | 2 | RT-01, RT-02, RT-05 |
| Visited-node restrictions; haven once per cycle; no self loops | 2 | RT-03 |
| Multi-destination travel in one cycle with exact light path | 2, 9 | RT-04, BD-05 |
| Rocky variants from cycle 3, non-return edges only, 1 hull damage | 2 | RT-06, RT-07, RT-11, RT-12 |
| Escalation: base fog, rocky base reduction, +1 from cycle 5, favored destination rotation from cycle 6 | 2, 8 | RT-07, RT-08 |
| Fog formula: wraith pressure on every edge including return | 3 | RT-14 |
| Soldier conflict, same cohort only | 3, 4, 6 | RT-16, EV-11 |
| Passenger protection (Poet, Keeper) | 3 | RT-18 |
| Memory protection amounts and Accord conflict cancel | 6 | RT-17, RT-19, MEM-14 |
| Zero-damage crossing gains nothing from protection | 6 | RT-20 |
| Protection lasts one crossing only | 3, 6 | RT-21 |
| Exact zero light survives (crossing, release) | 3, 5 | RT-09, RT-22, RL-02 |
| Fog failure before arrival, before rewards and events | 3 | RT-10, RT-13, PH-04 |
| Hull failure (rocky sinking) after fog and before rewards | 3 | RT-11, RT-13 |
| Return-edge failure: no cycle-end actions | 9 Returning 1 | RT-15 |
| Origin-only loading; reversible until departure | 2, 4 | BD-02, BD-04 |
| Four seats; two-seat souls keep capacity; capacity validated at dispatch | 2 | BD-01, PH-05 |
| Boarding validation | 4 | BD-03 |
| Separation mark created at departure, not by tentative boarding | 4 | BD-04 |
| Different delivery subsets at successive stops | 2 | BD-05 |
| One confirmed DELIVER, empty delivery legal | 9 step 2 | BD-06 |
| Replayed or double-clicked delivery cannot duplicate rewards | Contract | BD-07 |
| Delivery selection validation | Contract | BD-08 |
| Haven: no delivery, no unloading | 4, 9 | BD-09 |
| Joined Memory only when cohort partners disembark together; Faint otherwise, no retroactive change | 6 | BD-10, BD-11, BD-16 |
| Linked pairs across cohorts are not linked | 4 | BD-11, CE-07, EV-02 |
| Advisory wishes: bonus when matched, no penalty otherwise | 6 | BD-05, BD-12 |
| Reward accounting per soul; full-cap losses; obols uncapped | 3, 6 | BD-05, BD-13, BD-14 |
| Memory instances source-linked; draw-pile order cohort then template | 6 | MEM-12, BD-15 |
| Delivered souls leave play permanently | 2, 4 | BD-17 |
| Anger only on completed return | 4, 9 | CE-01, CE-22 |
| Calming: cost, once per cycle, shore only, expiry, no refund, no stacking | 5 | CE-02, CE-03, CE-04, MEM-09 |
| Protected normal anger but not separation | 4 | CE-05, CE-06 |
| Wraith at anger 3, reprimand, next-crossing timing | 4, 9 | CE-08, CE-09 |
| Undelivered passengers: broken-promise reprimands, keep anger, no waiting anger | 4 | CE-10 |
| Dismissal before quota and recovery; simultaneous causes | 3, 9 Returning 3-4 | CE-11, CE-12, CE-15 |
| Recurring quota after cycles 3, 6, ...; missed quota; no debt | 3 | CE-13, CE-14, CE-15 |
| Recovery capped; recovery only after surviving checks | 3, 9 | CE-01, CE-11, CE-20 |
| Refill toward five only at cycle start; overflow preserved | 4, 9 | CE-16, CE-18 |
| Endless supply with distinct cohort IDs beyond the first twelve | 4 | CE-17, RPL-06 |
| Cycle-end order | 9 Returning | CE-19 |
| Return forecast (anger, transformations, broken promises, dismissal warnings) | 4 last para | CE-23 |
| Memory draw to three once per stop; discard recycling; not permanent removal | 6 | MEM-01, MEM-03, MEM-05 |
| Seeded discard shuffle | 6, Contract | MEM-04, RPL-01 |
| Free memory play, one per crossing, allowance reset after crossing | 6 | MEM-02 |
| Recollection / Joined marks: waiting target, from any stop, expiry, invalid targets | 6 | MEM-06, MEM-07, MEM-08, MEM-10, MEM-11, MEM-16 |
| Memories only during preparation | 9 step 5 | MEM-13 |
| Voluntary wraith release: cost, immediate, reprimand reduction, repeatable, not after end | 5 | RL-01, RL-02, RL-03, RL-04, RL-05 |
| Repairs at shore/haven only, one hull per obol | 3 | RP-01, RP-02 |
| Haven recovery, once per cycle, capped | 3 | RT-04, EV-16 |
| E01 Shared Farewell | 7 | EV-01, EV-02, EV-03 |
| E02 Unfinished Message (choice, snapshot, once, disabled states) | 7 | EV-04, EV-05, EV-06, EV-07, EV-08, EV-09 |
| E03 Old Feud (entry snapshot, reconciliation scope, once) | 7 | EV-10, EV-11, EV-12, EV-13 |
| E04 The Broken Landing | 7 | EV-14, EV-15 |
| Events never lethal or anger-changing in the starter set | 3, 7 | EV-18 |
| Phase order and no phase skipping | 9, Contract | PH-01, PH-02, PH-03 |
| Dispatch validates regardless of UI state; view flags agree with dispatch | Contract | PH-05, PH-06 |
| Determinism and replay; no ambient state | Contract | RPL-01, RPL-02, RPL-04, RPL-05 |
| Whole-engine invariants under randomized play | 11 | RPL-03, RPL-06 |

## Spec points that were underspecified (interpretations, reported to the coordinator)

These are the choices the engine had to make where the spec is silent. None changes a number. Each is a one-line change if the coordinator decides otherwise.

1. **Resources after a fog-lethal crossing.** Section 3 says "otherwise subtract damage", so a lethal crossing leaves light unchanged (tests RT-10, RT-13). The summary records the fog that could not be paid.
2. **Rocky haven edges.** Section 2 gives rocky variants to "each non-return edge", so the haven edge is rocky from cycle 3 (RT-06, EV-15). Elysium rocky has base fog 0 either way, so it is strictly worse than normal there.
3. **Shore to haven.** Section 2's map lists only the three destinations from the shore, so the haven is reachable only from a destination (RT-01).
4. **Vigil and other memory protection are evaluated at departure** from the current passengers, not at play time (MEM-14). Playing Vigil and then boarding a two-seat soul therefore counts.
5. **Dismissal check at the return** counts reprimands after both transformations and broken promises (CE-09, CE-11), and completed cycles is incremented even when the run ends there (Section 9 Returning step 2). The current-cycle counter is not.
6. **Return forecast** assumes no further deliveries before returning ("if you returned now"), and includes a missed quota in `reprimandsAfterReturn` when the return would complete a third cycle with fewer than 2 obols. Conditional future deliveries are not guessed (CE-23).
7. **Protection marks on a soul that then boards** stay in state but have no effect (an aboard soul is not in the waiting snapshot); they are removed on delivery. Found by fuzzing, covered by MEM-16.
8. **Overflow beyond five waiting souls** cannot arise from legal play: the shore is topped up to five before boarding and boarding only removes souls, so at most five can be back. It is exercised with a constructed state (CE-16) and is honored if a future rule change makes it reachable.
9. **Each starter event has its own stop**, so at most one event can match per arrival. The queue, ID-order and choice-pause machinery is general but the multi-event ordering path is not reachable with E01-E04 (documented, not tested).
10. **Wraith and memory IDs.** Wraith `W-<soulId>`; memory `M-<soulId>` (one memory per soul instance, so unique and stable). Both are additive to the contract's "stable unique IDs".
11. **Memory draw with fewer than three cards available** stops when both piles are empty; the reshuffle happens only when a card is needed and the draw pile is empty (MEM-03).
