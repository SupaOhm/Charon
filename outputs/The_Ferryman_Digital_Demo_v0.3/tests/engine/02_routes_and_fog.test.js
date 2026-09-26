'use strict';
const test = require('node:test');
const { E, build, act, actAll, reject, view, route, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const deliverNone = { type: 'DELIVER', soulIds: [] };

test('RT-01 from the starting shore only the three destinations are reachable', () => {
  const v = view(build());
  assert.deepEqual(v.routes.map(r => r.to), ['elysium', 'asphodel', 'tartarus']);
  reject(build(), depart('haven'), 'ILLEGAL_ROUTE');
  reject(build(), depart('shore'), 'ILLEGAL_ROUTE');
});

test('RT-02 from a destination: other destinations, the haven and the return are listed; the current stop is not', () => {
  const v = view(build({ nodeId: 'elysium' }));
  assert.deepEqual(v.routes.map(r => r.to), ['asphodel', 'tartarus', 'haven', 'shore']);
  assert.ok(v.routes.every(r => r.legal));
});

test('RT-03 visited stops cannot be revisited within a cycle; the haven at most once', () => {
  const s = build({ nodeId: 'haven', visited: ['elysium', 'haven'] });
  const v = view(s);
  assert.equal(route(s, 'elysium').legal, false);
  assert.match(route(s, 'elysium').disabledReason, /already visited/);
  assert.equal(route(s, 'asphodel').legal, true);
  assert.equal(route(s, 'shore').legal, true);
  assert.ok(!v.routes.some(r => r.to === 'haven'));
  reject(s, depart('elysium'), 'ILLEGAL_ROUTE');
  const s2 = build({ nodeId: 'tartarus', visited: ['haven', 'tartarus'] });
  assert.equal(route(s2, 'haven').legal, false);
  reject(s2, depart('haven'), 'ILLEGAL_ROUTE');
});

test('RT-04 a full multi-destination cycle: three destinations, haven, return, with the exact light path', () => {
  let s = build({ light: 6 });
  s = act(s, depart('elysium'));                     // fog 0 -> 6
  s = act(s, deliverNone);
  s = act(s, depart('asphodel'));                    // fog 1 -> 5
  s = act(s, deliverNone);
  s = act(s, depart('tartarus'));                    // fog 2 -> 3
  s = act(s, deliverNone);
  assert.equal(s.light, 3);
  s = act(s, depart('haven'));                       // fog 0, haven recovery +1 -> 4
  assert.equal(s.phase, 'prepare');                  // the haven needs no DELIVER
  assert.equal(s.light, 4);
  s = act(s, depart('shore'));                       // return fog 0, cycle recovery +1 -> 5
  assert.equal(s.cycle, 2);
  assert.equal(s.completedCycles, 1);
  assert.equal(s.light, 5);
  assert.equal(s.nodeId, 'shore');
  assert.deepEqual(s.visited, []);
});

test('RT-05 the return is only possible from a destination or the haven, so at least one destination is visited', () => {
  const s = build();
  assert.ok(!view(s).routes.some(r => r.to === 'shore'));
  reject(s, depart('shore'), 'ILLEGAL_ROUTE');
  const s2 = act(s, depart('elysium'));
  assert.equal(s2.phase, 'deliver');
  reject(s2, depart('shore'), 'WRONG_PHASE');       // and only after the mandatory delivery action
});

test('RT-06 rocky variants unlock in cycle 3, for non-return edges only', () => {
  const c2 = build({ cycle: 2, nodeId: 'elysium' });
  assert.ok(view(c2).routes.every(r => r.variant === 'normal'));
  reject(c2, depart('asphodel', 'rocky'), 'ILLEGAL_ROUTE');
  const c3 = build({ cycle: 3, nodeId: 'elysium' });
  const listed = view(c3).routes.map(r => r.to + ':' + r.variant);
  assert.deepEqual(listed, ['asphodel:normal', 'asphodel:rocky', 'tartarus:normal', 'tartarus:rocky',
                            'haven:normal', 'haven:rocky', 'shore:normal']);
  reject(c3, depart('shore', 'rocky'), 'ILLEGAL_ROUTE');
  assert.equal(route(c3, 'haven', 'rocky').hullDamage, 1);
});

test('RT-07 escalation schedule: base fog, rocky reduction, +1 from cycle 5, favored destination from cycle 6', () => {
  // [cycle, normal fog for elysium/asphodel/tartarus, rocky fog for the same]
  const table = [
    [1, [0, 1, 2], null], [2, [0, 1, 2], null],
    [3, [0, 1, 2], [0, 0, 1]], [4, [0, 1, 2], [0, 0, 1]],
    [5, [1, 2, 3], [1, 1, 2]],
    [6, [0, 2, 3], [0, 1, 2]],   // Elysium favored
    [7, [1, 1, 3], [1, 0, 2]],   // Asphodel favored
    [8, [1, 2, 2], [1, 1, 1]],   // Tartarus favored
    [9, [0, 2, 3], [0, 1, 2]],   // rotation repeats
    [10, [1, 1, 3], [1, 0, 2]],  // Asphodel again
    [12, [0, 2, 3], [0, 1, 2]]   // Elysium again (cycles 6, 9, 12)
  ];
  table.forEach(([cycle, normal, rocky]) => {
    const s = build({ cycle, light: 6 });
    ['elysium', 'asphodel', 'tartarus'].forEach((d, i) => {
      assert.equal(route(s, d).fogDamage, normal[i], 'cycle ' + cycle + ' ' + d + ' normal');
      if (rocky) {
        assert.equal(route(s, d, 'rocky').fogDamage, rocky[i], 'cycle ' + cycle + ' ' + d + ' rocky');
        assert.equal(route(s, d, 'rocky').hullDamage, 1);
      }
    });
    // haven edge (from a destination) and return edge
    const at = build({ cycle, light: 6, nodeId: 'elysium' });
    const havenExpected = cycle >= 5 ? 1 : 0;   // haven is never the favored destination
    assert.equal(route(at, 'haven').fogDamage, havenExpected, 'cycle ' + cycle + ' haven');
    assert.equal(route(at, 'shore').fogDamage, 0, 'cycle ' + cycle + ' return');
    assert.equal(route(at, 'shore').breakdown.cycleModifier, 0);
  });
});

test('RT-08 favored destination rotates from cycle 6 and is null before', () => {
  const fav = c => view(build({ cycle: c })).favorableDestinationId;
  assert.deepEqual([1, 2, 3, 4, 5].map(fav), [null, null, null, null, null]);
  assert.deepEqual([6, 7, 8, 9, 10, 11].map(fav), ['elysium', 'asphodel', 'tartarus', 'elysium', 'asphodel', 'tartarus']);
  assert.equal(route(build({ cycle: 6 }), 'elysium').breakdown.favorableApplied, true);
});

test('RT-09 exactly zero light survives a crossing (fog equals light)', () => {
  const s = act(build({ light: 1 }), depart('asphodel'));
  assert.equal(s.phase, 'deliver');
  assert.equal(s.light, 0);
  assert.equal(s.ended, null);
});

test('RT-10 fog greater than light ends the run before arrival with no reward or event', () => {
  const s0 = build({ light: 1, passengers: ['C01-S02'] });
  const pv = route(s0, 'tartarus');
  assert.equal(pv.lethal, true);
  assert.equal(pv.failureCause, 'fog');
  assert.equal(pv.lightAfter, null);
  const s = act(s0, depart('tartarus'));
  assert.equal(s.phase, 'ended');
  assert.equal(s.ended.cause, 'fog');
  assert.equal(s.nodeId, 'shore');                  // never arrived
  assert.equal(s.light, 1);                         // the unpaid crossing does not spend light
  assert.equal(s.obols, 2);
  assert.equal(s.stats.delivered.length, 0);
  assert.deepEqual(s.eventsTriggered, []);
  reject(s, { type: 'DELIVER', soulIds: ['C01-S02'] }, 'RUN_ENDED');
});

test('RT-11 rocky sinking ends the run before arrival rewards', () => {
  const s0 = build({ cycle: 3, hull: 1, light: 5, passengers: ['C01-S01'] });
  const pv = route(s0, 'elysium', 'rocky');
  assert.equal(pv.fogDamage, 0);
  assert.equal(pv.failureCause, 'sinking');
  assert.equal(pv.hullAfter, 0);
  assert.equal(pv.lethal, true);
  const s = act(s0, depart('elysium', 'rocky'));
  assert.equal(s.ended.cause, 'sinking');
  assert.equal(s.hull, 0);
  assert.equal(s.light, 5);
  assert.equal(s.obols, 2);
  assert.equal(s.stats.delivered.length, 0);
  assert.equal(s.stats.memoriesEarned, 0);
  assert.equal(s.hand.length + s.draw.length, 0);
});

test('RT-12 rocky crossing with hull 2 survives and lands at hull 1 after fog is paid', () => {
  const s = act(build({ cycle: 3, hull: 2, light: 5 }), depart('tartarus', 'rocky'));   // fog 1, hull -1
  assert.equal(s.phase, 'deliver');
  assert.equal(s.light, 4);
  assert.equal(s.hull, 1);
});

test('RT-13 fog failure is evaluated before hull damage', () => {
  const s = act(build({ cycle: 3, hull: 1, light: 0 }), depart('tartarus', 'rocky'));   // fog 1 > light 0
  assert.equal(s.ended.cause, 'fog');
  assert.equal(s.hull, 1);
  assert.equal(route(build({ cycle: 3, hull: 1, light: 0 }), 'tartarus', 'rocky').failureCause, 'fog');
});

test('RT-14 active wraiths add one fog each to every edge, including the return', () => {
  const s = build({ wraiths: ['C01-S06', 'C01-S07'], light: 6 });
  assert.deepEqual(['elysium', 'asphodel', 'tartarus'].map(d => route(s, d).fogDamage), [2, 3, 4]);
  const at = build({ wraiths: ['C01-S06', 'C01-S07'], light: 6, nodeId: 'elysium' });
  assert.equal(route(at, 'shore').fogDamage, 2);
  assert.equal(route(at, 'shore').breakdown.wraithPressure, 2);
});

test('RT-15 a failed return crossing triggers no cycle-end processing at all', () => {
  const s = act(build({ cycle: 3, nodeId: 'elysium', light: 0, obols: 9, wraiths: ['C01-S06'], passengers: ['C01-S03'],
    shore: [['C01-S01', 2], 'C01-S02'] }), depart('shore'));
  assert.equal(s.ended.cause, 'fog');
  assert.equal(s.completedCycles, 2);
  assert.equal(s.reprimands, 0);
  assert.equal(s.obols, 9);                         // no quota
  assert.equal(s.souls['C01-S01'].anger, 2);         // no anger
  assert.equal(s.stats.brokenPromises, 0);
});

test('RT-16 same-cohort Red and Blue Soldiers add one fog; other cohorts never conflict', () => {
  const same = build({ passengers: ['C01-S04', 'C01-S06'], light: 6 });
  assert.equal(route(same, 'elysium').fogDamage, 1);
  assert.equal(route(same, 'elysium').breakdown.conflictPressure, 1);
  const cross = build({ passengers: ['C01-S04', 'C02-S06'], light: 6, supplyIndex: 24 });
  assert.equal(route(cross, 'elysium').fogDamage, 0);
  assert.equal(route(cross, 'elysium').breakdown.conflictPressure, 0);
});

test('RT-17 Accord cancels the soldier conflict and gives 1 protection for that crossing', () => {
  const s0 = build({ passengers: ['C01-S04', 'C01-S06'], light: 6, hand: [['R04', 'C01-S04']] });
  assert.equal(route(s0, 'asphodel').fogDamage, 2);           // base 1 + conflict 1
  const s = act(s0, { type: 'PLAY_MEMORY', memoryId: 'M-C01-S04', targetSoulId: null });
  const r = route(s, 'asphodel');
  assert.equal(r.fogDamage, 0);                               // base 1 + conflict 0 - protection 1
  assert.equal(r.breakdown.conflictPressure, 0);
  assert.equal(r.breakdown.memoryProtection, 1);
});

test('RT-18 passenger protection: Poet needs two other aboard souls, Keeper must be alone', () => {
  const fog = passengers => route(build({ passengers, light: 6 }), 'tartarus').fogDamage;   // base 2
  assert.equal(fog(['C01-S05']), 2, 'Poet alone');
  assert.equal(fog(['C01-S05', 'C01-S07']), 2, 'Poet with one other');
  assert.equal(fog(['C01-S05', 'C01-S07', 'C01-S03']), 1, 'Poet with two others');
  assert.equal(fog(['C01-S10']), 1, 'Keeper alone');
  assert.equal(fog(['C01-S10', 'C01-S07']), 2, 'Keeper with company');
  assert.equal(fog(['C01-S05', 'C02-S05', 'C01-S07', 'C01-S03']), 0, 'two Poets each protect');
});

test('RT-19 memory protection amounts per the memory table (Tartarus base 2)', () => {
  const fog = (tid, extra) => {
    const s = build({ light: 6, hand: [[tid, 'C01-S09']], passengers: extra || [] });
    const p = act(s, { type: 'PLAY_MEMORY', memoryId: 'M-C01-S09', targetSoulId: null });
    return route(p, 'tartarus');
  };
  assert.equal(fog('R01').fogDamage, 0);                       // Steadiness 2
  assert.equal(fog('R02').fogDamage, 1);                       // Vigil 1
  assert.equal(fog('R02', ['C01-S08']).fogDamage, 0);          // Vigil 3 with a two-seat soul aboard
  assert.equal(fog('R02', ['C01-S08']).breakdown.memoryProtection, 3);
  assert.equal(fog('R03').fogDamage, 1);                       // Recollection 1
  assert.equal(fog('R05').fogDamage, 0);                       // Joined 2
  assert.equal(fog('R06').fogDamage, 1);                       // Faint 1
});

test('RT-20 protection cannot heal: a zero-damage crossing gains nothing from a played card', () => {
  const s = act(build({ light: 3, hand: [['R01', 'C01-S09']] }), { type: 'PLAY_MEMORY', memoryId: 'M-C01-S09', targetSoulId: null });
  const after = act(s, depart('elysium'));
  assert.equal(after.light, 3);
});

test('RT-21 the memory protection applies to the upcoming crossing only', () => {
  let s = build({ light: 6, hand: [['R01', 'C01-S09']] });
  s = act(s, { type: 'PLAY_MEMORY', memoryId: 'M-C01-S09', targetSoulId: null });
  s = actAll(s, [depart('asphodel'), deliverNone]);           // base 1, protected -> 0
  assert.equal(s.light, 6);
  assert.equal(route(s, 'tartarus').fogDamage, 2);            // protection gone on the next crossing
});

test('RT-22 exact light survives release cost and later zero-fog crossing (light 2 -> 0 -> Elysium)', () => {
  let s = build({ light: 2, wraiths: ['C01-S06'], reprimands: 1 });
  s = act(s, { type: 'RELEASE_WRAITH', wraithId: 'W-C01-S06' });
  assert.equal(s.light, 0);
  s = act(s, depart('elysium'));
  assert.equal(s.phase, 'deliver');
  assert.equal(s.light, 0);
});
