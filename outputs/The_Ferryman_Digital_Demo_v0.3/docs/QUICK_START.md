# The Ferryman: Apprentice Charon

You carry and guide the dead. You do not judge their worth. Deliver the souls you take aboard, listen to their wishes, and plan for those left waiting. This is a fictional adaptation of underworld mythology.

This guide describes the decided v0.3 rules. Content checks are complete; engine integration and browser verification are still required. See [CONTENT_REVIEW.md](CONTENT_REVIEW.md).

## 1. Begin at the starting shore

A new run starts with **2 light, 2 obols, hull 3 of 3, zero reprimands and no memories**. Light cannot exceed 6. Five souls wait at the shore. The boat has four seats; some souls need two.

Read the seat cost, reward, preferred destination, anger and cohort identity on each soul. Board only here. Change your selection freely before departure; confirmed paid actions and played memories are not undone by changing it. The shore does not refill when someone boards. Empty departures are legal.

Taking a soul away from the shore promises delivery to **any destination before returning**. Declining passage is not a broken promise. A destination wish is advisory: matching it gives a bonus, and missing it has no penalty.

## 2. Prepare and choose a crossing

A **crossing** is one edge between stops. A **cycle** is the journey from the starting shore back to it.

- From the starting shore, choose Elysium, Asphodel or Tartarus.
- From a destination, choose an unvisited destination, the unvisited haven or the starting shore.
- From the haven, choose an unvisited destination or the starting shore.

Visit at least one destination before returning. Visit each destination and the haven at most once per cycle.

Before departing, read the **final fog damage**, any separate hull damage and the return forecast. These describe known consequences; hidden arrival events are not part of the fog preview. Even a return edge can have fog danger from wraiths or passengers.

Available preparation actions:

- **Calm:** At the starting shore, spend 1 obol on one waiting soul to prevent its normal anger increase at the coming return. Use this at most once before leaving the shore. It does not remove existing anger or prevent separation anger. Protection expires at return, does not stack, and cannot be bought for an already protected soul. Boarding that soul later gives no refund.
- **Repair:** At the starting shore or haven, spend 1 obol to restore 1 hull. Repeat while affordable, up to hull 3.
- **Release wraith:** At any stop, voluntarily spend 2 light to remove one active wraith immediately and reduce reprimands by 1, to a minimum of zero. Repeat if affordable. Spending down to zero light is legal.
- **Play memory:** Play one card at most before the next crossing, for no resource cost.

## 3. Survive, then deliver

Fog damage greater than current light ends the run before arrival. Otherwise subtract it. **Exactly zero light survives.** Apply any rocky-edge hull damage next. Hull at zero ends the run before arrival. No arrival reward or event can rescue either failure.

At a destination, choose everyone who will disembark in **one confirmed delivery action**, or choose **Continue without delivery**. Other passengers remain aboard. They can leave at another destination in the same cycle. Delivered souls cannot reboard. The haven does not board or unload passengers.

Each delivered soul grants its printed reward: a flame gives 1 light, a coin gives 1 obol. Matching its wish adds 1 light. The light cap still applies. Each delivered soul also grants one memory.

Matching Mother/Child or Musician/Listener partners earn Joined Memory only if they disembark together in that same action. Otherwise each earns Faint Memory, with no later replacement. Links apply only within one cohort.

Resolve any revealed arrival events, then draw memories once and prepare again. Haven arrival restores 1 light, once per cycle. Waiting or reloading does not repeat recovery.

## 4. Use memories

New memories enter the bottom of the draw pile in cohort and soul-ID order. After arrival rewards and events, draw until your hand has three cards or none remain. Keep unplayed cards. When the draw pile empties, shuffle the discard pile for reuse.

Play at most one memory before each crossing, then discard it. You do not draw again at that stop or redraw that played card there. The play allowance resets after a successful crossing; unused allowance does not accumulate. Memories are never permanently removed.

| Memory | Upcoming crossing |
|---|---|
| Steadiness | 2 fog protection. |
| Vigil | 1 fog protection, increased to 3 if any aboard soul uses two seats. |
| Recollection | 1 fog protection; optionally protect one waiting shore soul from normal anger at return. |
| Accord | 1 fog protection; cancel all same-cohort opposing soldier conflicts for this crossing. |
| Joined Memory | 2 fog protection; optionally protect one waiting shore soul from normal anger at return. |
| Faint Memory | 1 fog protection. |

Recollection and Joined Memory can mark the waiting shore from any stop. Their fog protection works without a target. Normal-anger protection does not stack or prevent separation anger and expires at return. Protection reduces fog damage; it does not heal light.

## 5. Return and resolve the cycle

**Anger changes only when you return to the starting shore. It does not rise on intermediate crossings.**

1. Survive the return edge. A failed return triggers no cycle-end processing.
2. Count the completed cycle. Souls left waiting at departure gain 1 normal anger if still waiting and unprotected. A waiting linked partner whose matching partner left aboard gains 1 additional separation anger. At 3 anger or more, a soul becomes a wraith and adds 1 reprimand. Each active wraith adds 1 fog danger from the next crossing onward.
3. Each undelivered passenger returns to the waiting shore and adds 1 broken-promise reprimand. It keeps existing anger but gets no waiting anger for this cycle. Check dismissal: 3 reprimands end the run.
4. **After every third completed cycle**, automatically pay a quota of 2 obols if affordable. Otherwise keep existing coins, record a missed quota and add 1 reprimand, with no debt. Check dismissal again. Quotas recur indefinitely.
5. If still in play, clear cycle marks, recover 1 light, begin the next cycle, refill toward five and draw memories once. New arrivals start at zero anger and get none for the past cycle. Keep all overflow passengers if the shore exceeds five; draw only when below five.

No repair, release or other optional action can interrupt the return checks. Dismissal stops later processing, including recovery. New cohorts repeat the twelve role templates with fresh IDs; they are different people. The run has no final cycle or victory for exhausting a cohort.

## 6. Read changing routes and manage your run

From cycle 3, non-return routes offer rocky alternatives: 1 less base fog, to a minimum of zero, followed by 1 hull damage. From cycle 5, non-return edges, including haven edges, gain 1 fog. From cycle 6, the favored destination ignores that extra fog. It rotates Elysium, Asphodel, Tartarus, beginning with Elysium on cycle 6. Return edges have neither rocky variants nor the cycle fog modifier. Always read the current preview.

**Resume** continues a saved run. **New run** resets resources, souls, memories and event triggers. Nothing earned grants a mechanical advantage in a new run.

Event conditions and effects become visible when encountered, or when you explicitly open the spoiler reference. Optional saved discovery annotations are a separate knowledge reference. **Clear discoveries** clears those annotations; it does not reset the active run or its event triggers.

Full rules: [The Ferryman v0.3 decided rules](../../The_Ferryman_v0.3_Decided_Rules.md).
