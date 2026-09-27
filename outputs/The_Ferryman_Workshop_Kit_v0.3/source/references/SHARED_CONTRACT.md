# Charon v0.3 shared integration contract, version 1

This is a software interface and file-format agreement. Game behavior comes exclusively from `outputs/The_Ferryman_v0.3_Decided_Rules.md`. Ownership is defined in README.md. Do not alter this contract independently; send a specific amendment to the coordinator and both code workers first. Compatible additional fields are allowed, but must be documented.

## Runtime and files

Use plain classic JavaScript scripts, no required framework, build step, CDN, npm install, account, network request or remote fonts. D loads scripts in this order: `rules-data.js`, `engine.js`, `assets/assets.js`, `content.js`, `app.js`. Art/content may temporarily be absent during development; app.js must provide labeled local placeholders and functional fallback copy. The engine itself must never require art or prose packs.

Use relative local paths, including image URLs. Prefer tool-approved local HTTP for automated browser verification; direct-file opening may be documented for humans only if actually checked. Do not bypass a browser tool restriction.

## Stable identifiers

- Nodes: `shore`, `elysium`, `asphodel`, `tartarus`, `haven`.
- Soul templates: `S01` through `S12` exactly as the rules table.
- Memories: `R01` Steadiness, `R02` Vigil, `R03` Recollection, `R04` Accord, `R05` Joined Memory, `R06` Faint Memory.
- Events: `E01` through `E04` exactly as the rules table.
- Soul instance IDs carry cohort and template, e.g. `C01-S01`; memory instances have separate stable unique IDs and a `sourceSoulId`. Never identify a soul instance by role label alone.
- Rule data owns seats, rewards, preferences, effects and event predicates. Content owns only labels, descriptions and flavor. Art owns only paths, crop metadata and alt text.

## Engine API, owned by C

Expose `globalThis.CharonEngine` in the browser and `module.exports` in Node. State is JSON-serializable, with no DOM, time, storage or network dependencies and no mutation of caller-owned inputs. Use a state-held seeded PRNG only for memory recycling, not soul arrivals.

```js
CharonEngine.createGame({ seed: 1 }); // -> State
CharonEngine.getView(state);         // -> View, defined below
CharonEngine.dispatch(state, action); // -> { ok, state, error, emitted }
CharonEngine.serialize(state);      // -> JSON string with schemaVersion
CharonEngine.deserialize(text);     // -> { ok, state, error }
```

On invalid actions, return `ok:false`, unchanged state, and `error:{code,message}`. On success, `error:null` and `emitted` is an array of structured log entries. Validate all inputs. Deserialization rejects malformed or unsupported saves with a useful message; do not partially load or overwrite a working run.

Use these canonical action shapes:

```js
{ type: 'BOARD', soulId }
{ type: 'UNBOARD', soulId }
{ type: 'CALM', soulId }
{ type: 'RELEASE_WRAITH', wraithId }
{ type: 'REPAIR' } // one paid hull point per action
{ type: 'PLAY_MEMORY', memoryId, targetSoulId: null /* or an ID */ }
{ type: 'DEPART', to: 'elysium', variant: 'normal' /* or 'rocky' */ }
{ type: 'DELIVER', soulIds: [] } // explicit complete selection, including none
{ type: 'RESOLVE_EVENT', eventId, accept: true /* or false */ }
```

No dispatch action can change approved constants. New Run is `createGame`, not an action that secretly carries state. D may manage tentative delivery selections in UI state until a single DELIVER action.

Phases are `prepare`, `deliver`, `event`, `ended`. C handles automatic arrival, recovery, draw and return ordering. User-choice events pause in `event`; automatic events resolve without extra confirmation. At destination arrival, `deliver` requires one DELIVER action, including an empty list, before the engine evaluates events and draws. Haven does not require DELIVER. No prepare actions may skip delivery or event resolution. Preserve arrival snapshots until all eligible events are evaluated.

### View contract

The UI consumes this public projection, not private State internals:

```js
{
  schemaVersion: 1, phase: 'prepare', nodeId: 'shore',
  cycle: 1, completedCycles: 0,
  resources: { light: 2, lightMax: 6, obols: 2,
               hull: 3, hullMax: 3, reprimands: 0, reprimandsMax: 3 },
  capacity: { used: 0, max: 4 },
  nextQuota: { dueAfterCycle: 3, amount: 2 },
  favorableDestinationId: null,
  shore: [], passengers: [], wraiths: [], hand: [],
  memoryCounts: { draw: 0, discard: 0, total: 0 },
  routes: [], pendingEvent: null, discoveredEventIds: [],
  returnForecast: { waiting: [], transformations: 0,
                    brokenPromisesIfReturnNow: 0, reprimandsAfterReturn: 0,
                    dismissalIfReturnNow: false, warnings: [] },
  permissions: { canDeliver: false, canRepair: false, canCalm: true },
  history: [], ended: null
}
```

Each soul view has `id,templateId,cohort,seats,reward:{kind:'coin'|'flame',amount:1},preferredDestinationId,anger,partnerId,conflictPartnerId,normalAngerProtected,separationMarked,canBoard,canUnboard,canCalm,disabledReasons:[]`. Booleans must reflect phase, capacity, currency and action limits. Unavailable actions remain visible where useful, with reasons from the engine.

Each wraith view has `id,sourceSoulId,templateId,canRelease,disabledReason`. Each memory view has `id,templateId,sourceSoulId,canPlay,validTargetIds,disabledReason`; C accepts a null target when the rules allow protection without a waiting target.

Each route view has `to,variant,fogDamage,hullDamage,lightAfter,hullAfter,lethal,failureCause,legal,disabledReason,breakdown`. `breakdown` exposes baseFog, cycleModifier, wraithPressure, conflictPressure, passengerProtection and memoryProtection. Use null for post-arrival predictions not guaranteed by the rules; do not include secret event effects in a fog preview. Route selection alone does not mutate engine state. Engine-generated returnForecast distinguishes known waiting anger from conditional future deliveries rather than claiming every future route has the same dismissal outcome.

`pendingEvent` is null or `{eventId,canAccept,acceptDisabledReason,canDecline}`. Event prose comes from content.js or fallback labels. `ended` is null or `{cause:'fog'|'sinking'|'dismissal',summary:{...}}`. Summaries and history come from C and include the statistics required by the specification. D renders them, never reconstructs rewards or failure calculations.

C writes actual public API examples and documents any compatible extension in docs/ENGINE_API.md. D may use its own `ui/fixtures.js` until C delivers, but fixtures must not be used in the final build.

## Content pack, owned by B

`content.js` is a UTF-8 classic script assigning a plain data object to `globalThis.CHARON_CONTENT`. No functions, fetch, DOM calls or dynamic HTML. Render strings as text, never raw HTML. Use this structure:

```js
globalThis.CHARON_CONTENT = {
  version: '0.3', language: 'en',
  title: 'The Ferryman: Apprentice Charon',
  intro: '',
  nodes: { shore:{name:'',description:''} /* all five node IDs */ },
  souls: { S01:{name:'Mother',flavor:'',memoryFlavor:''} /* all 12 */ },
  memories: { R01:{name:'Steadiness',description:''} /* all six */ },
  events: { E01:{title:'',body:'',condition:'',effect:'',acceptLabel:'',declineLabel:''} /* four */ },
  ui: { board:'Board',unboard:'Unboard',depart:'Depart',deliver:'Deliver selected',
        deliverNone:'Continue without delivery',calm:'Calm',release:'Release wraith',
        repair:'Repair',playMemory:'Play memory',newRun:'New run',resume:'Resume',
        exportRun:'Export run',clearDiscoveries:'Clear discoveries' },
  help: { crossing:'',cycle:'',anger:'',light:'',calming:'',wishes:'',quota:'',memory:'',discovery:'' },
  endings: { fog:{title:'',body:''},sinking:{title:'',body:''},dismissal:{title:'',body:''} },
  tutorial: [{id:'T01',title:'',body:''}]
};
```

Additional UI keys may be agreed with D and have fallback labels. No number in prose overrides rules-data.js. Event condition text must appear only after discovery or in an explicitly opened spoiler reference, never accidentally on an undiscovered card.

## Art pack, owned by A

Essential keys: `apprentice`, `boat`, `wraith`, `shore`, `elysium`, `asphodel`, `tartarus`, `haven`. Optional portrait keys: `S01` through `S12`.

`assets/assets.js` assigns `globalThis.CHARON_ASSETS = {version:'0.3',images:{...}}`. Each image entry is `{src:'assets/art/shore.png',alt:'...',width:1536,height:1024,fit:'cover',position:'center'}` with actual dimensions and actual file extension. Values shown here are examples, not required generation dimensions. All files must exist at those relative paths. No base64 blobs or expiring remote URLs in the manifest.

Generate backgrounds without baked-in UI/text. D supplies resource icons and numeric overlays as accessible HTML/CSS, not generated text. Missing art must fall back to labeled shapes without affecting mechanics.

## Integration checks

C owns numerical rules and meaningful engine tests. D independently compares the implementation with the specification and tests the real browser flows. Neither can claim human enjoyment, tested balance or real-device coverage from automation. A and B report asset/copy checks, not gameplay validation. Every worker returns an exact file list and an evidence-backed status.
