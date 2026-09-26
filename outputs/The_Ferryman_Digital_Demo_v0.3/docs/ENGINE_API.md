# Charon v0.3 engine API

Engine `0.3.0`, contract version 1, rules snapshot `outputs/The_Ferryman_v0.3_Decided_Rules.md` (SHA-256 `797bc491e428ecf802dc4c9c4d05c6309636a916d5eb0b45b0f275c404fdeaae`). Everything here matches `v0.3_handoffs/SHARED_CONTRACT.md`; additions are marked **(additive)**.

## Loading

Browser, classic scripts in this order: `rules-data.js`, `engine.js` (then art, content, app). They create `globalThis.CharonRules` (additive) and `globalThis.CharonEngine`. Node: `const E = require('./engine.js')` (it requires `./rules-data.js` itself). No DOM, storage, clock, network or `Math.random`. Never mutates inputs.

## Functions

| Call | Returns |
|---|---|
| `createGame({ seed })` | State. `seed` is an integer 0..4294967295 (default 1); anything else throws `RangeError`. |
| `getView(state)` | View (below). Pure. |
| `dispatch(state, action)` | `{ ok, state, error, emitted }`. On failure: `ok:false`, the **same state object**, `error:{code,message}`, `emitted:[]`. On success: `ok:true`, a **new** state, `error:null`, `emitted` = log entries produced by this action. |
| `serialize(state)` | JSON string `{schemaVersion:1, rulesVersion:'0.3', state}`. |
| `deserialize(text)` | `{ ok, state, error }`. Rejects non-JSON, wrong schema/rules version, and any state that fails full consistency validation (see API-08). Never partially loads. |
| `previewDelivery(state, soulIds)` **(additive)** | `{ ok, error, deliveries:[...], totals:{obolsGained,lightGained,lightLost,lightAfter,memories:[{memoryId,templateId,sourceSoulId}]} }`. Use this for the tentative delivery selection; it applies the light cap and the Faint/Joined choice exactly as the confirmed action will. It deliberately excludes hidden event effects. |
| `getLegalActions(state)` **(additive)** | Array of fully formed actions the engine would accept right now (`DELIVER` is listed only with an empty selection; build other selections yourself and check with `previewDelivery`). |
| `replay({ seed }, actions)` **(additive)** | Deterministic re-run; `{ ok, state, error, failedIndex, emitted }`. `state.actionLog` is the accepted-action list, so `replay({seed:state.seed}, state.actionLog)` rebuilds a run. |
| `version`, `rules` **(additive)** | Version numbers and the frozen rules data. |

## Actions (canonical, unchanged from the contract)

```js
{ type: 'BOARD', soulId }                      // prepare, at shore
{ type: 'UNBOARD', soulId }                    // prepare, at shore
{ type: 'CALM', soulId }                       // prepare, at shore, once per cycle, 1 obol
{ type: 'RELEASE_WRAITH', wraithId }           // prepare, any stop, 2 light
{ type: 'REPAIR' }                             // prepare, shore or haven, 1 obol per hull point
{ type: 'PLAY_MEMORY', memoryId, targetSoulId: null }   // prepare; target only for Recollection / Joined Memory
{ type: 'DEPART', to: 'elysium', variant: 'normal' }    // prepare; variant 'rocky' from cycle 3
{ type: 'DELIVER', soulIds: [] }               // deliver phase, exactly once per destination arrival
{ type: 'RESOLVE_EVENT', eventId, accept: true }        // event phase
```

Extra keys are ignored. `variant` may be omitted (means `normal`). Error codes: `INVALID_ACTION`, `UNKNOWN_ACTION`, `INVALID_INPUT`, `INVALID_STATE`, `RUN_ENDED`, `WRONG_PHASE`, `WRONG_LOCATION`, `NOT_FOUND`, `ALREADY_ABOARD`, `CAPACITY`, `LIMIT_REACHED`, `INSUFFICIENT_OBOLS`, `INSUFFICIENT_LIGHT`, `ALREADY_PROTECTED`, `HULL_FULL`, `INVALID_TARGET`, `ILLEGAL_ROUTE`, `EVENT_UNAFFORDABLE`, `INTERNAL`. Save errors: `INVALID_SAVE`, `UNSUPPORTED_SCHEMA`, `UNSUPPORTED_RULES`. Show `error.message` to players; switch on `code` only for logic.

A double-clicked or replayed `DELIVER` / `RESOLVE_EVENT` is rejected with `WRONG_PHASE` and changes nothing.

## Phases

`prepare` (board, calm, memory, repair, release, choose route) -> `DEPART` -> arrival at a destination gives `deliver` -> one `DELIVER` -> automatic events, or `event` if a choice event is pending -> memory draw to three -> `prepare`. The haven skips `deliver` (its light recovery is automatic). Returning to the shore runs the whole cycle-end sequence inside the single `DEPART` dispatch and lands in `prepare`, or `ended`. `ended` accepts nothing.

## View

Every field in the contract's View is present with the contract's shapes. Additions:

```js
view.rulesVersion            // '0.3'
view.nextQuota.cyclesUntilDue
view.memoryCounts.hand
view.visited                 // stops visited this cycle
view.calmUsed, view.memoryPlayedThisCrossing, view.playedMemory
view.arrival                 // null, or { nodeId, aboardIds, deliveredIds } during deliver/event
view.permissions.{repairDisabledReason, calmDisabledReason, canRelease, canDepart, canPlayMemory, canResolveEvent}
```

`view.history` is the last 200 public log entries. Full log is `state.log`.

### Soul view (shore and passengers)

Real output of `getView(createGame({seed:1})).shore[0]`:

```json
{"id":"C01-S01","templateId":"S01","cohort":1,"role":"Mother","seats":2,"reward":{"kind":"flame","amount":1},
 "preferredDestinationId":"elysium","anger":0,"partnerId":"C01-S02","conflictPartnerId":null,
 "normalAngerProtected":false,"protectedBy":null,"separationMarked":false,"separationRisk":false,
 "canBoard":true,"canUnboard":false,"canCalm":true,"disabledReasons":[]}
```

Additive: `role` (English role name from rules data; content.js still owns display names), `protectedBy` (`'calm'|'memory'|null`), `separationRisk` (true while a waiting linked partner would be marked if the boat left now; `separationMarked` becomes true only after departure, per the rules). `canBoard/canUnboard/canCalm` and `disabledReasons` are computed by the same validators `dispatch` uses.

### Routes

Empty outside `prepare`. From the shore: three destinations. From a destination: other unvisited destinations, the haven if unvisited, and the shore. Visited stops are listed with `legal:false` and a reason. From cycle 3 each non-return edge also has a `variant:'rocky'` entry. Real output for `routes[1]` in a new game:

```json
{"to":"asphodel","variant":"normal","isReturn":false,"fogDamage":1,"hullDamage":0,"lightAfter":1,"hullAfter":3,
 "lethal":false,"failureCause":null,"legal":true,"disabledReason":null,
 "breakdown":{"baseFog":1,"cycleModifier":0,"wraithPressure":0,"conflictPressure":0,
              "passengerProtection":0,"memoryProtection":0,"rawFog":1,"favorableApplied":false}}
```

`fogDamage` is `max(0, rawFog)`. `lightAfter` is light after paying fog, before arrival rewards, and is `null` when fog alone is lethal. `hullAfter` is `null` when fog is lethal, otherwise hull minus rocky damage (0 means the boat sinks). `failureCause` is `'fog'` or `'sinking'` (fog is checked first). The preview never includes hidden event effects or arrival rewards. `breakdown.rawFog` and `favorableApplied` are additive.

### Return forecast

```json
{"waiting":[{"soulId":"C01-S01","currentAnger":0,"normalAnger":1,"separationAnger":0,"projectedAnger":1,"willTransform":false}],
 "transformations":0,"brokenPromisesIfReturnNow":0,"reprimandsAfterReturn":0,"dismissalIfReturnNow":false,
 "warnings":[],"quotaDueAtReturn":false,"quotaShortfallAtReturn":false,"assumesNoFurtherDeliveries":true}
```

Known waiting anger is exact for the current boarding, protections and marks. `brokenPromisesIfReturnNow` counts souls currently aboard; if the player delivers them before returning it drops, which is why the flag `assumesNoFurtherDeliveries` is set and no future route is assumed. **`warnings` is an array of objects** `{code, message, count?|amount?}` with codes `WRAITH_FORMATION`, `BROKEN_PROMISES`, `QUOTA_DUE`, `QUOTA_UNAFFORDABLE`, `DISMISSAL`. Render `message`. (The contract left the element type open.)

### Hand

`{id, templateId, sourceSoulId, deliveredTo, takesTarget, canPlay, validTargetIds, disabledReason}`. `validTargetIds` lists waiting shore souls for Recollection/Joined Memory and is empty for the other cards; a `null` target is always accepted where the card allows one.

### Pending event and ending

`pendingEvent: { eventId, canAccept, acceptDisabledReason, canDecline }`. `discoveredEventIds` grows only when an event actually triggers. `ended` is `{cause:'fog'|'sinking'|'dismissal', summary}` where `summary` holds `cause, detail, completedCycles, cycleReached, crossings, delivered:{total, byDestination, wishMatches, souls[]}, memoriesEarned, wraithsFormed, wraithsReleased, wraithsActive, missedQuotas, quotasPaid, brokenPromises, final:{light,obols,hull,reprimands}`. `detail` says which step ended it: fog gives the route and full breakdown, sinking the hull damage, dismissal `step:'return'|'quota'`.

## Log entries (`emitted`, `state.log`, `view.history`)

Each entry: `{seq, type, cycle, nodeId, ...fields}`. Types: `SETUP, SHORE_REFILLED, MEMORIES_DRAWN, BOARDED, UNBOARDED, CALMED, WRAITH_RELEASED, REPAIRED, MEMORY_PLAYED, DEPART, CROSSING_COMPLETED, CROSSING_FAILED, ARRIVED, HAVEN_RECOVERY, SOUL_DELIVERED, DELIVERY_CONFIRMED, EVENT_TRIGGERED, EVENT_RESOLVED, RETURNED, ANGER_RESOLVED, PROMISES_BROKEN, QUOTA_PAID, QUOTA_MISSED, CYCLE_COMPLETED, RUN_ENDED`. Per-soul reward accounting is one `SOUL_DELIVERED` entry per soul (`reward, wishMatched, wishBonus, obolsGained, lightGained, lightLost, memoryId, memoryTemplateId, jointDelivery`). Undiscovered event conditions appear only in `EVENT_TRIGGERED`, after the event fires. Entries carry data, not prose; content.js owns wording.

Example, real output of `dispatch` for a `DELIVER` of `['C01-S01']` at Elysium (first two entries):

```json
[{"seq":8,"type":"SOUL_DELIVERED","cycle":1,"nodeId":"elysium","soulId":"C01-S01","templateId":"S01","cohort":1,
  "destinationId":"elysium","reward":{"kind":"flame","amount":1},"wishMatched":true,"wishBonus":1,"obolsGained":0,
  "lightGained":2,"lightLost":0,"memoryId":"M-C01-S01","memoryTemplateId":"R06","jointDelivery":false},
 {"seq":9,"type":"DELIVERY_CONFIRMED","cycle":1,"nodeId":"elysium","soulIds":["C01-S01"],"count":1}]
```

## IDs

Souls `C<cohort>-S<template>` (`C01-S01`, `C02-S12`, `C10-S03`; cohort is at least two digits). Wraiths `W-<soulId>`. Memories `M-<soulId>`: one memory per delivered soul instance, so unique and stable, with `sourceSoulId` and `deliveredTo` recorded. Never key UI by role name.

## State notes for D

State is plain JSON. Do not edit it; treat it as opaque and read through `getView`. It keeps growing by roughly 20-40 log entries per cycle, so a very long run produces a large save; `view.history` is capped, `state.log` is not. The PRNG (`state.rng`) is one uint32 in state and is used only when the memory discard pile is reshuffled. Soul arrival order never depends on it.

## Behavior D should know

- One `DEPART` from a destination back to the shore performs the full cycle-end sequence (anger, transformations, broken promises, dismissal check, quota, recovery, refill, memory draw). Read the resulting `emitted` log for a summary to show.
- A lethal route is still legal to select (the rules ask for deliberate confirmation). `routes[i].lethal` and `failureCause` tell you to warn.
- After `ended`, `dispatch` rejects everything with `RUN_ENDED`. New Run is `createGame`.
- Discovery annotations across runs are D's concern (localStorage); the engine keeps only per-run trigger-once flags in state.
