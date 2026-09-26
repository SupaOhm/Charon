/*
 * The Ferryman v0.3 rules data. Owner: Worker C.
 * Source of truth: outputs/The_Ferryman_v0.3_Decided_Rules.md (sections cited inline).
 * Classic script: assigns globalThis.CharonRules in the browser, module.exports in Node.
 * Pure data, deep-frozen. Labels, prose and art live in content.js / assets.js, never here.
 */
(function (root, factory) {
  'use strict';
  var rules = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = rules;
  root.CharonRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function deepFreeze(o) {
    Object.getOwnPropertyNames(o).forEach(function (k) {
      var v = o[k];
      if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
    });
    return Object.freeze(o);
  }

  var RULES = {
    rulesVersion: '0.3',
    contractVersion: 1,
    schemaVersion: 1,

    // Sections 3, 4, 9.
    constants: {
      startLight: 2, lightMax: 6,
      startObols: 2,
      hullStart: 3, hullMax: 3,
      reprimandsMax: 3,             // reaching this ends the run
      seats: 4,
      shoreTarget: 5,               // refill toward five
      cohortSize: 12,
      angerLimit: 3,                // anger >= 3 becomes a wraith
      quotaEveryCycles: 3, quotaAmount: 2,
      calmCost: 1, calmsPerCycle: 1,
      releaseLightCost: 2,
      repairCost: 1, repairHull: 1,
      havenLight: 1,                // section 3 "Repairs and recovery"
      cycleEndLight: 1,
      handSize: 3,
      memoryPlaysPerCrossing: 1,
      wishBonusLight: 1,
      rockyFromCycle: 3, rockyBaseReduction: 1, rockyHullDamage: 1,
      fogEscalationFromCycle: 5, fogEscalationAmount: 1,
      favorableFromCycle: 6
    },

    nodes: ['shore', 'elysium', 'asphodel', 'tartarus', 'haven'],
    destinations: ['elysium', 'asphodel', 'tartarus'],
    // Section 2 route numbers: base fog by destination.
    baseFog: { shore: 0, elysium: 0, asphodel: 1, tartarus: 2, haven: 0 },
    // Section 8: favorable destination rotation, starting with Elysium in cycle 6.
    favorableRotation: ['elysium', 'asphodel', 'tartarus'],

    // Section 6. reward.kind: 'coin' -> obols, 'flame' -> light.
    souls: {
      S01: { role: 'Mother',       seats: 2, reward: { kind: 'flame', amount: 1 }, preferred: 'elysium',  partner: 'S02', memory: 'faint-joined' },
      S02: { role: 'Child',        seats: 1, reward: { kind: 'flame', amount: 1 }, preferred: 'elysium',  partner: 'S01', memory: 'faint-joined' },
      S03: { role: 'Merchant',     seats: 1, reward: { kind: 'coin',  amount: 1 }, preferred: 'tartarus', partner: null,  memory: 'R02' },
      S04: { role: 'Red Soldier',  seats: 2, reward: { kind: 'coin',  amount: 1 }, preferred: 'tartarus', partner: null,  conflict: 'S06', memory: 'R04' },
      S05: { role: 'Poet',         seats: 1, reward: { kind: 'flame', amount: 1 }, preferred: 'asphodel', partner: null,  memory: 'R03', aboardProtection: { kind: 'poet', minOthers: 2, amount: 1 } },
      S06: { role: 'Blue Soldier', seats: 1, reward: { kind: 'coin',  amount: 1 }, preferred: 'asphodel', partner: null,  conflict: 'S04', memory: 'R04' },
      S07: { role: 'Cook',         seats: 1, reward: { kind: 'flame', amount: 1 }, preferred: 'asphodel', partner: null,  memory: 'R03' },
      S08: { role: 'Mason',        seats: 2, reward: { kind: 'coin',  amount: 1 }, preferred: 'elysium',  partner: null,  memory: 'R02' },
      S09: { role: 'Messenger',    seats: 1, reward: { kind: 'coin',  amount: 1 }, preferred: 'asphodel', partner: null,  memory: 'R01' },
      S10: { role: 'Keeper',       seats: 2, reward: { kind: 'flame', amount: 1 }, preferred: 'tartarus', partner: null,  memory: 'R01', aboardProtection: { kind: 'keeper', amount: 1 } },
      S11: { role: 'Musician',     seats: 1, reward: { kind: 'flame', amount: 1 }, preferred: 'elysium',  partner: 'S12', memory: 'faint-joined' },
      S12: { role: 'Listener',     seats: 1, reward: { kind: 'coin',  amount: 1 }, preferred: 'elysium',  partner: 'S11', memory: 'faint-joined' }
    },
    supplyOrder: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12'],

    // Faint / Joined memory choice (section 6).
    jointMemory: { alone: 'R06', together: 'R05' },

    // Section 6 memory table. protection is for the upcoming crossing only.
    memories: {
      R01: { name: 'Steadiness',    protection: 2 },
      R02: { name: 'Vigil',         protection: 1, protectionIfTwoSeatAboard: 3 },
      R03: { name: 'Recollection',  protection: 1, marksWaiting: true },
      R04: { name: 'Accord',        protection: 1, cancelsSoldierConflict: true },
      R05: { name: 'Joined Memory', protection: 2, marksWaiting: true },
      R06: { name: 'Faint Memory',  protection: 1 }
    },

    // Section 7. Predicates are data; the engine interprets kinds. Table order is evaluation order.
    events: {
      E01: { name: 'Shared Farewell',    node: 'elysium',  predicate: { kind: 'linkedPairDeliveredTogether' },
             choice: false, effect: { kind: 'gainLight', amount: 1 } },
      E02: { name: 'Unfinished Message', node: 'asphodel', predicate: { kind: 'templateInArrivalSnapshot', templateId: 'S09' },
             choice: true,  effect: { kind: 'payObolReduceReprimand', cost: 1, amount: 1 } },
      E03: { name: 'Old Feud',           node: 'tartarus', predicate: { kind: 'soldierPairInArrivalSnapshot' },
             choice: true,  effect: { kind: 'payObolReconcilePair', cost: 1 } },
      E04: { name: 'The Broken Landing', node: 'haven',    predicate: { kind: 'hullBelow', value: 3 },
             choice: false, effect: { kind: 'gainHull', amount: 1 } }
    },
    eventOrder: ['E01', 'E02', 'E03', 'E04'],

    // Section 2 directed map. Visited-node restrictions are applied by the engine.
    edges: {
      shore:    ['elysium', 'asphodel', 'tartarus'],
      elysium:  ['asphodel', 'tartarus', 'haven', 'shore'],
      asphodel: ['elysium', 'tartarus', 'haven', 'shore'],
      tartarus: ['elysium', 'asphodel', 'haven', 'shore'],
      haven:    ['elysium', 'asphodel', 'tartarus', 'shore']
    }
  };

  return deepFreeze(RULES);
});
