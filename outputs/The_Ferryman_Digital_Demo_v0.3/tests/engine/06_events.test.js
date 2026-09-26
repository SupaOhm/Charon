'use strict';
const test = require('node:test');
const { E, build, act, actAll, actEmit, reject, view, route, types, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const deliver = ids => ({ type: 'DELIVER', soulIds: ids });
const resolve = (eventId, accept) => ({ type: 'RESOLVE_EVENT', eventId, accept });

test('EV-01 E01 Shared Farewell: a linked pair delivered together at Elysium gives +1 light after their rewards', () => {
  const s0 = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S01', 'C01-S02'], light: 1 });
  const r = actEmit(s0, deliver(['C01-S01', 'C01-S02']));
  assert.equal(r.state.light, 6);                                  // 1 + (2 + 2) rewards + 1 event
  assert.equal(r.state.phase, 'prepare');                          // automatic: no confirmation
  assert.deepEqual(r.state.eventsTriggered, ['E01']);
  assert.equal(view(r.state).pendingEvent, null);
  assert.deepEqual(view(r.state).discoveredEventIds, ['E01']);
  assert.deepEqual(types(r.emitted), ['SOUL_DELIVERED', 'SOUL_DELIVERED', 'DELIVERY_CONFIRMED', 'EVENT_TRIGGERED',
    'EVENT_RESOLVED', 'MEMORIES_DRAWN']);
});

test('EV-02 E01 does not fire for separate deliveries, a lone partner, other stops, other cohorts', () => {
  const at = (node, pass, sel, extra) => act(build(Object.assign({ nodeId: node, phase: 'deliver', passengers: pass, light: 0, supplyIndex: 24 }, extra || {})), deliver(sel));
  assert.deepEqual(at('elysium', ['C01-S01', 'C01-S02'], ['C01-S01']).eventsTriggered, []);
  assert.deepEqual(at('asphodel', ['C01-S01', 'C01-S02'], ['C01-S01', 'C01-S02']).eventsTriggered, []);
  assert.deepEqual(at('elysium', ['C01-S01', 'C02-S02'], ['C01-S01', 'C02-S02']).eventsTriggered, []);
  assert.deepEqual(at('elysium', ['C01-S03'], ['C01-S03']).eventsTriggered, []);
});

test('EV-03 events fire at most once per run', () => {
  const s = act(build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S11', 'C01-S12'], light: 0, eventsTriggered: ['E01'] }),
    deliver(['C01-S11', 'C01-S12']));
  assert.equal(s.light, 3);                                        // 0 + Musician (flame 1 + wish 1) + Listener (wish 1), no E01 bonus
  assert.deepEqual(s.eventsTriggered, ['E01']);
});

test('EV-04 E02 Unfinished Message pauses for a choice; payment reduces one reprimand; hand draws afterward', () => {
  const s0 = build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1, obols: 2 });
  let s = act(s0, deliver(['C01-S09']));                           // Messenger delivered at this arrival still counts
  assert.equal(s.phase, 'event');
  assert.deepEqual(view(s).pendingEvent, { eventId: 'E02', canAccept: true, acceptDisabledReason: null, canDecline: true });
  assert.deepEqual(s.hand, []);                                    // draw waits for the event to resolve
  reject(s, depart('haven'), 'WRONG_PHASE');
  reject(s, { type: 'REPAIR' }, 'WRONG_PHASE');
  reject(s, { type: 'BOARD', soulId: 'C01-S01' }, 'WRONG_PHASE');
  reject(s, deliver([]), 'WRONG_PHASE');
  assert.equal(s.obols, 3);                                        // Messenger coin
  s = act(s, resolve('E02', true));
  assert.equal(s.obols, 2);
  assert.equal(s.reprimands, 0);
  assert.equal(s.phase, 'prepare');
  assert.deepEqual(s.hand, ['M-C01-S09']);
  assert.equal(s.ended, null);
});

test('EV-05 E02 also fires for a Messenger who is still aboard, and declining changes nothing', () => {
  let s = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1, obols: 2 }), deliver([]));
  assert.equal(s.phase, 'event');
  const before = { o: s.obols, r: s.reprimands, l: s.light, h: s.hull };
  s = act(s, resolve('E02', false));
  assert.deepEqual({ o: s.obols, r: s.reprimands, l: s.light, h: s.hull }, before);
  assert.deepEqual(s.eventsTriggered, ['E02']);                    // recorded even though declined
  assert.deepEqual(s.passengers, ['C01-S09']);
});

test('EV-06 E02 payment is disabled with no reprimand to reduce or no obol to pay', () => {
  const noRep = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 0 }), deliver([]));
  assert.equal(view(noRep).pendingEvent.canAccept, false);
  assert.match(view(noRep).pendingEvent.acceptDisabledReason, /reprimand/);
  reject(noRep, resolve('E02', true), 'EVENT_UNAFFORDABLE');
  const noObol = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1, obols: 0 }), deliver([]));
  assert.equal(view(noObol).pendingEvent.canAccept, false);
  reject(noObol, resolve('E02', true), 'EVENT_UNAFFORDABLE');
  const s = act(noObol, resolve('E02', false));
  assert.equal(s.phase, 'prepare');
});

test('EV-07 replayed, mistargeted or malformed event actions are rejected without effect', () => {
  const s0 = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1, obols: 2 }), deliver([]));
  reject(s0, resolve('E01', true), 'NOT_FOUND');
  reject(s0, { type: 'RESOLVE_EVENT', eventId: 'E02', accept: 'yes' }, 'INVALID_INPUT');
  reject(s0, { type: 'RESOLVE_EVENT', accept: true }, 'INVALID_INPUT');
  const s1 = act(s0, resolve('E02', true));
  reject(s1, resolve('E02', true), 'WRONG_PHASE');                 // double click cannot pay twice
  assert.equal(s1.obols, 1);
  assert.equal(s1.reprimands, 0);
});

test('EV-08 E02 is once per run: a later Messenger at Asphodel triggers nothing', () => {
  const s = act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C02-S09'], reprimands: 1, supplyIndex: 24, eventsTriggered: ['E02'] }), deliver([]));
  assert.equal(s.phase, 'prepare');
});

test('EV-09 E02 needs Asphodel and a Messenger', () => {
  assert.equal(act(build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1 }), deliver([])).phase, 'prepare');
  assert.equal(act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S03'], reprimands: 1 }), deliver([])).phase, 'prepare');
});

test('EV-10 E03 Old Feud: both soldiers aboard on entry triggers it even if one disembarks; payment reconciles the pair', () => {
  let s = build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S04', 'C01-S06'], light: 3 });
  s = act(s, deliver(['C01-S04']));                                // Red Soldier leaves, Blue stays
  assert.equal(s.phase, 'event');
  assert.equal(view(s).pendingEvent.eventId, 'E03');
  assert.equal(view(s).pendingEvent.canAccept, true);
  const obols = s.obols;
  s = act(s, resolve('E03', true));
  assert.equal(s.obols, obols - 1);
  assert.deepEqual(s.reconciledCohorts, [1]);
  assert.deepEqual(s.eventsTriggered, ['E03']);
});

test('EV-11 reconciliation removes only that cohort pair\'s conflict for the rest of the run', () => {
  const fine = build({ passengers: ['C01-S04', 'C01-S06'], light: 6, reconciled: [1] });
  assert.equal(route(fine, 'elysium').breakdown.conflictPressure, 0);
  const other = build({ passengers: ['C02-S04', 'C02-S06'], light: 6, reconciled: [1], supplyIndex: 24 });
  assert.equal(route(other, 'elysium').breakdown.conflictPressure, 1);
});

test('EV-12 declining the feud leaves the conflict pressure in place', () => {
  let s = act(build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S04', 'C01-S06'], light: 4 }), deliver([]));
  s = act(s, resolve('E03', false));
  assert.deepEqual(s.reconciledCohorts, []);
  assert.equal(route(s, 'haven').breakdown.conflictPressure, 1);
  let t = act(build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S04', 'C01-S06'], light: 4 }), deliver([]));
  t = act(t, resolve('E03', true));
  assert.equal(route(t, 'haven').breakdown.conflictPressure, 0);
});

test('EV-13 E03 needs Tartarus and same-cohort soldiers aboard on entry', () => {
  assert.equal(act(build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S04', 'C02-S06'], supplyIndex: 24 }), deliver([])).phase, 'prepare');
  assert.equal(act(build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S04'] }), deliver([])).phase, 'prepare');
  assert.equal(act(build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S04', 'C01-S06'] }), deliver([])).phase, 'prepare');
});

test('EV-14 E04 The Broken Landing heals one hull at the haven, after the haven light recovery', () => {
  const r = actEmit(build({ nodeId: 'elysium', hull: 2, light: 2 }), depart('haven'));
  assert.equal(r.state.hull, 3);
  assert.equal(r.state.light, 3);
  assert.equal(r.state.phase, 'prepare');
  assert.deepEqual(r.state.eventsTriggered, ['E04']);
  assert.deepEqual(types(r.emitted), ['DEPART', 'CROSSING_COMPLETED', 'ARRIVED', 'HAVEN_RECOVERY', 'EVENT_TRIGGERED', 'EVENT_RESOLVED', 'MEMORIES_DRAWN']);
});

test('EV-15 E04 does not fire at full hull, but a rocky haven crossing lowers hull first and so arms it', () => {
  const full = act(build({ nodeId: 'elysium', hull: 3 }), depart('haven'));
  assert.deepEqual(full.eventsTriggered, []);
  const rocky = act(build({ cycle: 3, nodeId: 'elysium', hull: 3, light: 4 }), depart('haven', 'rocky'));
  assert.deepEqual(rocky.eventsTriggered, ['E04']);
  assert.equal(rocky.hull, 3);                                     // rocky damage 1, event heal 1
  const again = act(build({ nodeId: 'elysium', hull: 2, eventsTriggered: ['E04'] }), depart('haven'));
  assert.equal(again.hull, 2);                                     // once per run
});

test('EV-16 the haven grants 1 light on arrival, capped at six', () => {
  assert.equal(act(build({ nodeId: 'elysium', light: 6 }), depart('haven')).light, 6);
  assert.equal(act(build({ nodeId: 'elysium', light: 3 }), depart('haven')).light, 4);
});

test('EV-17 undiscovered event conditions stay out of the view; the log reveals them only once triggered', () => {
  const s0 = build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1 });
  assert.ok(!JSON.stringify(view(s0)).includes('E02'));
  assert.ok(!JSON.stringify(view(s0).history).includes('templateInArrivalSnapshot'));
  const s = act(s0, deliver([]));
  const entry = s.log.find(e => e.type === 'EVENT_TRIGGERED');
  assert.equal(entry.eventId, 'E02');
  assert.ok(entry.predicate);
  assert.deepEqual(view(s).discoveredEventIds, ['E02']);
});

test('EV-18 no starter event ever removes light, hull or obols without a choice, and none touches anger', () => {
  const cases = [
    build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S01', 'C01-S02'], light: 2 }),
    build({ nodeId: 'elysium', hull: 1 })
  ];
  const a = act(cases[0], deliver(['C01-S01', 'C01-S02']));
  assert.ok(a.light >= cases[0].light);
  const b = act(cases[1], depart('haven'));
  assert.ok(b.hull >= 1 && b.light >= cases[1].light);
  const c = build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C01-S09'], reprimands: 1, shore: [['C01-S01', 1]] });
  const c2 = act(act(c, deliver([])), resolve('E02', true));
  assert.equal(c2.souls['C01-S01'].anger, 1);
});
