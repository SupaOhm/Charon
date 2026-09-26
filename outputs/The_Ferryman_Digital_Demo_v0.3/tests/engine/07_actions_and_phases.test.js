'use strict';
const test = require('node:test');
const { E, build, act, actAll, reject, view, route, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const deliver = ids => ({ type: 'DELIVER', soulIds: ids });
const release = id => ({ type: 'RELEASE_WRAITH', wraithId: 'W-' + id });

const everyAction = () => [
  { type: 'BOARD', soulId: 'C01-S01' }, { type: 'UNBOARD', soulId: 'C01-S03' }, { type: 'CALM', soulId: 'C01-S01' },
  release('C01-S06'), { type: 'REPAIR' }, { type: 'PLAY_MEMORY', memoryId: 'M-C01-S09', targetSoulId: null },
  depart('asphodel'), deliver([]), { type: 'RESOLVE_EVENT', eventId: 'E02', accept: false }
];

test('RL-01 releasing a wraith costs 2 light, removes it immediately, cuts one reprimand and updates previews', () => {
  const s0 = build({ light: 4, wraiths: ['C01-S06'], reprimands: 2 });
  assert.equal(route(s0, 'elysium').fogDamage, 1);
  assert.equal(view(s0).wraiths[0].canRelease, true);
  const s = act(s0, release('C01-S06'));
  assert.equal(s.light, 2);
  assert.equal(s.reprimands, 1);
  assert.deepEqual(s.wraiths, []);
  assert.equal(s.stats.wraithsReleased, 1);
  assert.equal(route(s, 'elysium').fogDamage, 0);
});

test('RL-02 spending down to exactly zero light is legal; one light short is not', () => {
  const s = act(build({ light: 2, wraiths: ['C01-S06'] }), release('C01-S06'));
  assert.equal(s.light, 0);
  assert.equal(s.reprimands, 0);                                   // never below zero
  const short = build({ light: 1, wraiths: ['C01-S06'], reprimands: 1 });
  const e = reject(short, release('C01-S06'), 'INSUFFICIENT_LIGHT');
  assert.match(e.message, /2 light/);
  assert.equal(view(short).wraiths[0].canRelease, false);
  assert.match(view(short).wraiths[0].disabledReason, /light/);
  assert.equal(view(short).permissions.canRelease, false);
});

test('RL-03 release is repeatable while affordable and needs no other limit', () => {
  let s = build({ light: 6, wraiths: ['C01-S06', 'C01-S07', 'C01-S08'], reprimands: 2 });
  s = actAll(s, [release('C01-S06'), release('C01-S07'), release('C01-S08')]);
  assert.equal(s.light, 0);
  assert.equal(s.reprimands, 0);
  assert.equal(s.stats.wraithsReleased, 3);
});

test('RL-04 release works at any stop during preparation, not during delivery or event phases, and is validated', () => {
  const at = build({ nodeId: 'asphodel', light: 3, wraiths: ['C01-S06'] });
  assert.equal(act(at, release('C01-S06')).wraiths.length, 0);
  reject(build({ nodeId: 'asphodel', phase: 'deliver', wraiths: ['C01-S06'], light: 4 }), release('C01-S06'), 'WRONG_PHASE');
  reject(at, { type: 'RELEASE_WRAITH', wraithId: 'W-C01-S09' }, 'NOT_FOUND');
  reject(at, { type: 'RELEASE_WRAITH' }, 'INVALID_INPUT');
});

test('RL-05 a run that already ended cannot be rescued by a release', () => {
  const dead = act(build({ light: 1, wraiths: ['C01-S06'] }), depart('tartarus'));
  assert.equal(dead.phase, 'ended');
  reject(dead, release('C01-S06'), 'RUN_ENDED');
});

test('RP-01 repair restores one hull per obol at the shore or haven, never above three', () => {
  let s = build({ hull: 1, obols: 5 });
  s = actAll(s, [{ type: 'REPAIR' }, { type: 'REPAIR' }]);
  assert.equal(s.hull, 3);
  assert.equal(s.obols, 3);
  reject(s, { type: 'REPAIR' }, 'HULL_FULL');
  assert.equal(view(s).permissions.canRepair, false);
  const h = act(build({ nodeId: 'haven', visited: ['elysium', 'haven'], hull: 2, obols: 1 }), { type: 'REPAIR' });
  assert.equal(h.hull, 3);
  assert.equal(h.obols, 0);
});

test('RP-02 repair is refused at destinations, when broke, and outside preparation', () => {
  reject(build({ nodeId: 'elysium', hull: 1 }), { type: 'REPAIR' }, 'WRONG_LOCATION');
  reject(build({ hull: 1, obols: 0 }), { type: 'REPAIR' }, 'INSUFFICIENT_OBOLS');
  assert.match(view(build({ hull: 1, obols: 0 })).permissions.repairDisabledReason, /obol/);
  reject(build({ nodeId: 'elysium', phase: 'deliver', hull: 1 }), { type: 'REPAIR' }, 'WRONG_PHASE');
});

test('PH-01 no phase skipping: the delivery phase accepts only DELIVER', () => {
  const s = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S03'], hand: [['R01', 'C01-S09']], wraiths: ['C01-S06'], light: 4, hull: 2 });
  everyAction().filter(a => a.type !== 'DELIVER' && a.type !== 'RESOLVE_EVENT').forEach(a => reject(s, a, 'WRONG_PHASE'));
  reject(s, { type: 'RESOLVE_EVENT', eventId: 'E02', accept: false }, 'WRONG_PHASE');
  assert.equal(act(s, deliver([])).phase, 'prepare');
});

test('PH-02 the preparation phase rejects DELIVER and RESOLVE_EVENT', () => {
  const s = build();
  reject(s, deliver([]), 'WRONG_PHASE');
  reject(s, { type: 'RESOLVE_EVENT', eventId: 'E01', accept: true }, 'WRONG_PHASE');
});

test('PH-03 the event phase accepts only RESOLVE_EVENT', () => {
  const s = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1 }), deliver([]));
  assert.equal(s.phase, 'event');
  everyAction().filter(a => a.type !== 'RESOLVE_EVENT').forEach(a => reject(s, a, 'WRONG_PHASE'));
});

test('PH-04 a terminal failure permits no further action or reward of any kind', () => {
  const dead = act(build({ light: 1, passengers: ['C01-S02'], hand: [['R01', 'C01-S09']], wraiths: ['C01-S06'] }), depart('tartarus'));
  assert.equal(dead.phase, 'ended');
  everyAction().forEach(a => reject(dead, a, 'RUN_ENDED'));
  reject(dead, { type: 'FLY' }, 'UNKNOWN_ACTION');
  assert.equal(dead.obols, 2);
  assert.equal(dead.stats.delivered.length, 0);
});

test('PH-05 dispatch validates even when a UI would have disabled the control', () => {
  const full = build({ passengers: ['C01-S01', 'C01-S04'] });
  reject(full, { type: 'BOARD', soulId: 'C01-S02' }, 'CAPACITY');
  reject(build({ obols: 0 }), { type: 'CALM', soulId: 'C01-S01' }, 'INSUFFICIENT_OBOLS');
  reject(build({ cycle: 2, nodeId: 'elysium' }), depart('asphodel', 'rocky'), 'ILLEGAL_ROUTE');
});

test('PH-06 every action the engine lists as legal really is accepted, and every disabled view flag is really refused', () => {
  const states = [build(), build({ nodeId: 'elysium', hull: 2, hand: [['R03', 'C01-S09']], wraiths: ['C01-S06'], light: 4 }),
    build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S03'] })];
  states.forEach(s => {
    E.getLegalActions(s).forEach(a => assert.equal(E.dispatch(s, a).ok, true, JSON.stringify(a)));
    view(s).shore.filter(x => !x.canBoard).forEach(x => assert.equal(E.dispatch(s, { type: 'BOARD', soulId: x.id }).ok, false));
    view(s).routes.filter(r => !r.legal).forEach(r => assert.equal(E.dispatch(s, depart(r.to, r.variant)).ok, false));
  });
});
