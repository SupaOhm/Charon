'use strict';
const test = require('node:test');
const { E, build, act, actAll, actEmit, reject, view, route, soulView, types, loop, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const anger = (s, id) => s.souls[id].anger;

test('CE-01 anger is applied only when the cycle completes at the starting shore', () => {
  let s = build();
  s = act(s, depart('elysium'));
  s = act(s, { type: 'DELIVER', soulIds: [] });
  assert.ok(s.shore.every(id => anger(s, id) === 0), 'no anger mid-cycle');
  s = act(s, depart('shore'));
  assert.equal(s.cycle, 2);
  assert.equal(s.completedCycles, 1);
  assert.deepEqual(s.shore.map(id => anger(s, id)), [1, 1, 1, 1, 1]);
  assert.equal(s.light, 3);          // fog 0 both ways, +1 cycle recovery
  assert.equal(s.obols, 2);          // no quota yet
  assert.equal(s.reprimands, 0);
});

test('CE-02 calming spends 1 obol and prevents the next normal anger, then expires with the cycle', () => {
  let s = build();
  s = act(s, { type: 'CALM', soulId: 'C01-S03' });
  assert.equal(s.obols, 1);
  assert.equal(soulView(s, 'C01-S03').normalAngerProtected, true);
  s = loop(s);
  assert.equal(anger(s, 'C01-S03'), 0);
  assert.equal(anger(s, 'C01-S01'), 1);
  assert.deepEqual(s.protection, {});
  assert.equal(soulView(s, 'C01-S03').normalAngerProtected, false);
  s = act(s, { type: 'CALM', soulId: 'C01-S03' });     // available again in the next cycle
  assert.equal(s.obols, 0);
  s = loop(s);
  assert.equal(anger(s, 'C01-S03'), 0);
});

test('CE-03 calming limits: once per cycle, needs an obol, shore only, no stacking, does not clear anger', () => {
  let s = build({ shore: [['C01-S01', 1], 'C01-S02', 'C01-S03', 'C01-S04', 'C01-S05'] });
  s = act(s, { type: 'CALM', soulId: 'C01-S01' });
  reject(s, { type: 'CALM', soulId: 'C01-S02' }, 'LIMIT_REACHED');
  assert.equal(view(s).permissions.canCalm, false);
  s = loop(s);
  assert.equal(anger(s, 'C01-S01'), 1);                 // existing anger neither removed nor increased
  reject(build({ obols: 0 }), { type: 'CALM', soulId: 'C01-S02' }, 'INSUFFICIENT_OBOLS');
  reject(build({ nodeId: 'elysium' }), { type: 'CALM', soulId: 'C01-S02' }, 'WRONG_LOCATION');
  reject(build({ protection: { 'C01-S02': 'memory' } }), { type: 'CALM', soulId: 'C01-S02' }, 'ALREADY_PROTECTED');
  reject(build({ passengers: ['C01-S03'] }), { type: 'CALM', soulId: 'C01-S03' }, 'NOT_FOUND');
});

test('CE-04 boarding a calmed soul does not refund the obol', () => {
  let s = act(build(), { type: 'CALM', soulId: 'C01-S03' });
  s = act(s, { type: 'BOARD', soulId: 'C01-S03' });
  assert.equal(s.obols, 1);
  s = act(s, { type: 'UNBOARD', soulId: 'C01-S03' });
  assert.equal(s.obols, 1);
});

test('CE-05 separation: the waiting partner gains 2 anger at return; the undelivered passenger breaks a promise', () => {
  const s = loop(act(build(), { type: 'BOARD', soulId: 'C01-S01' }));   // Mother departs, Child waits, nothing delivered
  assert.equal(anger(s, 'C01-S02'), 2);                                   // 1 normal + 1 separation
  assert.deepEqual(['C01-S03', 'C01-S04', 'C01-S05'].map(id => anger(s, id)), [1, 1, 1]);
  assert.equal(s.reprimands, 1);                                          // Mother's broken promise
  assert.equal(s.stats.brokenPromises, 1);
  assert.deepEqual(s.shore, ['C01-S02', 'C01-S03', 'C01-S04', 'C01-S05', 'C01-S01']);
  assert.equal(anger(s, 'C01-S01'), 0);                                   // returned passenger: no waiting anger
  assert.deepEqual(s.passengers, []);
  assert.equal(s.light, 3);
});

test('CE-06 protection against normal anger does not cancel separation anger', () => {
  let s = act(build(), { type: 'CALM', soulId: 'C01-S02' });
  s = loop(act(s, { type: 'BOARD', soulId: 'C01-S01' }));
  assert.equal(anger(s, 'C01-S02'), 1);            // normal prevented, separation still applied
  assert.equal(anger(s, 'C01-S03'), 1);
});

test('CE-07 a linked partner in another cohort is never separated', () => {
  const s0 = build({ shore: ['C02-S02', 'C01-S03', 'C01-S04', 'C01-S05'], passengers: ['C01-S01'], supplyIndex: 24 });
  const s = loop(s0);
  assert.equal(anger(s, 'C02-S02'), 1);            // normal anger only, no separation
});

test('CE-08 anger 3 becomes a wraith, adds a reprimand, and affects only the next crossing', () => {
  const s0 = build({ shore: [['C01-S02', 2], 'C01-S03', 'C01-S04', 'C01-S05', 'C01-S06'] });
  assert.equal(route(actAll(s0, [depart('elysium'), { type: 'DELIVER', soulIds: [] }]), 'shore').fogDamage, 0);   // return fog before the wraith exists
  const s = loop(s0);
  assert.deepEqual(s.wraiths.map(w => w.id), ['W-C01-S02']);
  assert.equal(s.wraiths[0].sourceSoulId, 'C01-S02');
  assert.equal(s.reprimands, 1);
  assert.ok(!s.shore.includes('C01-S02'));
  assert.equal(s.light, 3);                                                // the finished crossing cost nothing extra
  assert.equal(route(s, 'elysium').fogDamage, 1);                          // next crossing feels the wraith (cycle 2, base 0)
  assert.equal(s.shore.length, 5);                                         // refilled
  assert.equal(anger(s, 'C02-S01'), 0);                                    // new soul is not charged for the finished cycle
  assert.deepEqual(s.shore, ['C01-S03', 'C01-S04', 'C01-S05', 'C01-S06', 'C02-S01']);
});

test('CE-09 a single return can create several wraiths and reprimands without ending the run below three', () => {
  const s = loop(build({ shore: [['C01-S02', 2], ['C01-S03', 2], 'C01-S04', 'C01-S05', 'C01-S06'] }));
  assert.equal(s.wraiths.length, 2);
  assert.equal(s.reprimands, 2);
  assert.equal(s.phase, 'prepare');
});

test('CE-10 undelivered passengers return to the shore keeping anger, each adds a reprimand, and get no waiting anger', () => {
  const s = loop(build({ shore: ['C01-S01', 'C01-S02', 'C01-S04'], passengers: [['C01-S03', 1], 'C01-S07'] }));
  assert.equal(s.reprimands, 2);
  assert.equal(s.stats.brokenPromises, 2);
  assert.equal(anger(s, 'C01-S03'), 1);
  assert.equal(anger(s, 'C01-S07'), 0);
  assert.deepEqual(['C01-S01', 'C01-S02', 'C01-S04'].map(id => anger(s, id)), [1, 1, 1]);
  assert.deepEqual(s.shore, ['C01-S01', 'C01-S02', 'C01-S04', 'C01-S03', 'C01-S07']);
});

test('CE-11 dismissal from broken promises stops the return before quota and recovery', () => {
  const s = loop(build({ cycle: 3, obols: 5, reprimands: 1, shore: ['C01-S01', 'C01-S02', 'C01-S04'],
                         passengers: ['C01-S03', 'C01-S07'] }));
  assert.equal(s.phase, 'ended');
  assert.equal(s.ended.cause, 'dismissal');
  assert.equal(s.ended.summary.detail.step, 'return');
  assert.equal(s.reprimands, 3);
  assert.equal(s.obols, 5);                          // quota due at cycle 3 but never charged
  assert.equal(s.stats.quotasPaid, 0);
  assert.equal(s.stats.missedQuotas, 0);
  assert.equal(s.light, 2);                          // no cycle-end recovery
  assert.equal(s.completedCycles, 3);
  assert.equal(s.cycle, 3);
  assert.equal(s.supplyIndex, 12);                   // no refill
});

test('CE-12 simultaneous causes: transformation plus broken promise reach dismissal before the quota is evaluated', () => {
  const s = loop(build({ cycle: 3, obols: 0, reprimands: 1, shore: [['C01-S02', 2], 'C01-S04', 'C01-S05'], passengers: ['C01-S03'] }));
  assert.equal(s.ended.cause, 'dismissal');
  assert.equal(s.reprimands, 3);                     // 1 + wraith + broken promise; the unaffordable quota adds nothing
  assert.equal(s.stats.missedQuotas, 0);
  assert.equal(s.wraiths.length, 1);
});

test('CE-13 the quota comes due after cycles 3, 6, ... and only then', () => {
  const dueAfter = c => view(build({ cycle: c })).nextQuota;
  assert.deepEqual([1, 2, 3].map(c => dueAfter(c).dueAfterCycle), [3, 3, 3]);
  assert.deepEqual([4, 5, 6].map(c => dueAfter(c).dueAfterCycle), [6, 6, 6]);
  assert.equal(dueAfter(7).dueAfterCycle, 9);
  assert.equal(dueAfter(1).amount, 2);
  [1, 2, 4, 5].forEach(c => assert.equal(loop(build({ cycle: c })).obols, 2, 'no quota after cycle ' + c));
  [3, 6].forEach(c => {
    const s = loop(build({ cycle: c }));
    assert.equal(s.obols, 0, 'exactly enough obols pays the quota after cycle ' + c);
    assert.equal(s.stats.quotasPaid, 1);
    assert.equal(s.reprimands, 0);
    assert.equal(s.phase, 'prepare');
  });
});

test('CE-14 a missed quota keeps existing coins, adds one reprimand, carries no debt, and recovery still applies', () => {
  const s = loop(build({ cycle: 3, obols: 1 }));
  assert.equal(s.obols, 1);
  assert.equal(s.reprimands, 1);
  assert.equal(s.stats.missedQuotas, 1);
  assert.equal(s.light, 3);
  assert.equal(s.cycle, 4);
  assert.equal(s.phase, 'prepare');
  const later = loop(build({ cycle: 6, obols: 3, reprimands: 1 }));     // no accumulated debt
  assert.equal(later.obols, 1);
  assert.equal(later.reprimands, 1);
});

test('CE-15 a missed quota that reaches three reprimands ends the run before recovery', () => {
  const s = loop(build({ cycle: 3, obols: 1, reprimands: 2 }));
  assert.equal(s.ended.cause, 'dismissal');
  assert.equal(s.ended.summary.detail.step, 'quota');
  assert.equal(s.stats.missedQuotas, 1);
  assert.equal(s.reprimands, 3);
  assert.equal(s.light, 2);
  assert.equal(s.cycle, 3);
  assert.equal(s.log.some(e => e.type === 'CYCLE_COMPLETED'), false);
});

test('CE-16 returned passengers beyond five waiting souls are all kept and nothing is drawn', () => {
  const s0 = build({ nodeId: 'elysium', shore: ['C01-S01', 'C01-S02', 'C01-S04', 'C01-S05'], passengers: ['C01-S06', 'C01-S07'] });
  const s = act(s0, depart('shore'));
  assert.equal(s.shore.length, 6);
  assert.equal(s.supplyIndex, 12);
  assert.equal(s.reprimands, 2);
  assert.equal(s.phase, 'prepare');
  assert.deepEqual(['C01-S01', 'C01-S02', 'C01-S04', 'C01-S05'].map(id => anger(s, id)), [1, 1, 1, 1]);
});

test('CE-17 supply continues past the original twelve with fresh cohort IDs', () => {
  const s = loop(build({ supplyIndex: 11, shore: ['C01-S03', 'C01-S04', 'C01-S05'] }));
  assert.deepEqual(s.shore, ['C01-S03', 'C01-S04', 'C01-S05', 'C01-S12', 'C02-S01']);
  assert.equal(s.supplyIndex, 13);
  assert.equal(anger(s, 'C02-S01'), 0);
  const t = loop(build({ supplyIndex: 23, shore: ['C01-S03', 'C01-S04', 'C01-S05'] }));
  assert.deepEqual(t.shore.slice(3), ['C02-S12', 'C03-S01']);
});

test('CE-18 the shore is refilled only after a return, never after boarding or at intermediate stops', () => {
  let s = build();
  s = act(s, { type: 'BOARD', soulId: 'C01-S03' });
  assert.equal(s.shore.length, 4);
  s = act(s, depart('elysium'));
  s = act(s, { type: 'DELIVER', soulIds: ['C01-S03'] });
  s = act(s, depart('asphodel'));
  assert.equal(s.shore.length, 4);
  assert.equal(s.supplyIndex, 12);
  s = act(s, { type: 'DELIVER', soulIds: [] });
  s = act(s, depart('shore'));
  assert.equal(s.shore.length, 5);
  assert.equal(s.supplyIndex, 13);
});

test('CE-19 cycle-end order: return, anger, broken promises, quota, recovery, refill, memory draw', () => {
  const s0 = build({ cycle: 3, obols: 2, nodeId: 'elysium', shore: [['C01-S02', 2], 'C01-S04', 'C01-S05', 'C01-S06'],
                     passengers: ['C01-S03'] });
  const r = actEmit(s0, depart('shore'));
  assert.deepEqual(types(r.emitted), ['DEPART', 'CROSSING_COMPLETED', 'RETURNED', 'ANGER_RESOLVED', 'PROMISES_BROKEN',
    'QUOTA_PAID', 'CYCLE_COMPLETED', 'SHORE_REFILLED', 'MEMORIES_DRAWN']);
  assert.equal(r.state.reprimands, 2);
  assert.equal(r.state.obols, 0);
});

test('CE-20 cycle recovery is capped at six light', () => {
  assert.equal(loop(build({ light: 6 })).light, 6);
});

test('CE-21 reloading a save cannot repeat recovery or any other cycle-end effect', () => {
  const s = loop(build());
  const d = E.deserialize(E.serialize(s));
  assert.equal(d.ok, true);
  assert.deepEqual(d.state, s);
  assert.equal(d.state.light, 3);
});

test('CE-22 anger persists between cycles', () => {
  const s = loop(loop(build()));
  assert.deepEqual(s.shore.map(id => anger(s, id)), [2, 2, 2, 2, 2]);
  assert.equal(s.light, 4);
});

test('CE-23 the return forecast reports known anger, wraiths, broken promises and dismissal', () => {
  const s = build({ reprimands: 1, shore: [['C01-S02', 2], 'C01-S04', 'C01-S05'], passengers: ['C01-S03', 'C01-S06'] });
  const f = view(s).returnForecast;
  assert.equal(f.transformations, 1);
  assert.equal(f.brokenPromisesIfReturnNow, 2);
  assert.equal(f.reprimandsAfterReturn, 4);
  assert.equal(f.dismissalIfReturnNow, true);
  assert.deepEqual(f.waiting.map(w => w.projectedAnger), [3, 1, 1]);
  const codes = f.warnings.map(w => w.code);
  assert.ok(codes.includes('WRAITH_FORMATION') && codes.includes('BROKEN_PROMISES') && codes.includes('DISMISSAL'));
  const calm = act(build({ shore: [['C01-S02', 2], 'C01-S04', 'C01-S05'] }), { type: 'CALM', soulId: 'C01-S02' });
  assert.equal(view(calm).returnForecast.transformations, 0);            // calming updates the warning
});
