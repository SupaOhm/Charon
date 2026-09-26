'use strict';
const test = require('node:test');
const { E, build, act, actAll, actEmit, reject, view, soulView, types, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const deliver = ids => ({ type: 'DELIVER', soulIds: ids });

test('BD-01 the boat has four seats and two-seat souls keep their capacity', () => {
  let s = build();
  s = act(s, { type: 'BOARD', soulId: 'C01-S01' });            // Mother, 2 seats
  s = act(s, { type: 'BOARD', soulId: 'C01-S04' });            // Red Soldier, 2 seats
  assert.deepEqual(view(s).capacity, { used: 4, max: 4 });
  const e = reject(s, { type: 'BOARD', soulId: 'C01-S02' }, 'CAPACITY');
  assert.match(e.message, /seat/i);
  assert.equal(soulView(s, 'C01-S02').canBoard, false);
  assert.ok(soulView(s, 'C01-S02').disabledReasons.some(r => /seat/i.test(r)));
  s = act(s, { type: 'UNBOARD', soulId: 'C01-S04' });
  s = act(s, { type: 'BOARD', soulId: 'C01-S02' });
  assert.deepEqual(view(s).capacity, { used: 3, max: 4 });
});

test('BD-02 boarding exists only at the starting shore during preparation', () => {
  const atStop = build({ nodeId: 'elysium' });
  reject(atStop, { type: 'BOARD', soulId: 'C01-S01' }, 'WRONG_LOCATION');
  assert.ok(view(atStop).shore.every(x => !x.canBoard && x.disabledReasons.length > 0));
  const inDeliver = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S03'] });
  reject(inDeliver, { type: 'BOARD', soulId: 'C01-S01' }, 'WRONG_PHASE');
  reject(inDeliver, { type: 'UNBOARD', soulId: 'C01-S03' }, 'WRONG_PHASE');
});

test('BD-03 boarding validates the soul: unknown, already aboard, wraith', () => {
  const s = act(build({ wraiths: ['C01-S06'] }), { type: 'BOARD', soulId: 'C01-S03' });
  reject(s, { type: 'BOARD', soulId: 'C01-S03' }, 'ALREADY_ABOARD');
  reject(s, { type: 'BOARD', soulId: 'C09-S03' }, 'NOT_FOUND');
  reject(s, { type: 'BOARD', soulId: 'W-C01-S06' }, 'NOT_FOUND');
  reject(s, { type: 'UNBOARD', soulId: 'C01-S05' }, 'NOT_FOUND');
});

test('BD-04 tentative boarding creates no separation mark; departure does', () => {
  let s = build();
  s = act(s, { type: 'BOARD', soulId: 'C01-S01' });
  assert.deepEqual(s.separationMarks, []);
  assert.equal(soulView(s, 'C01-S02').separationMarked, false);
  assert.equal(soulView(s, 'C01-S02').separationRisk, true);   // engine-computed warning for the UI
  s = act(s, { type: 'UNBOARD', soulId: 'C01-S01' });
  assert.equal(soulView(s, 'C01-S02').separationRisk, false);
  s = act(s, { type: 'BOARD', soulId: 'C01-S01' });
  s = act(s, depart('elysium'));
  assert.deepEqual(s.separationMarks, ['C01-S02']);
  assert.deepEqual(s.waitingSnapshot, ['C01-S02', 'C01-S03', 'C01-S04', 'C01-S05']);
});

test('BD-05 different delivery subsets at successive stops, with exact reward accounting', () => {
  let s = build({ light: 3, obols: 2, shore: ['C01-S09', 'C01-S10'], passengers: ['C01-S02', 'C01-S03', 'C01-S07'] });
  s = act(s, depart('elysium'));                                // fog 0, light 3
  s = act(s, deliver(['C01-S02']));                             // Child: flame +1, Elysium wish +1
  assert.equal(s.light, 5);
  assert.deepEqual(s.passengers, ['C01-S03', 'C01-S07']);
  s = act(s, depart('asphodel'));                               // fog 1 -> 4
  s = act(s, deliver(['C01-S07']));                             // Cook: flame +1, Asphodel wish +1
  assert.equal(s.light, 6);
  assert.deepEqual(s.passengers, ['C01-S03']);
  s = act(s, depart('tartarus'));                               // fog 2 -> 4
  s = act(s, deliver(['C01-S03']));                             // Merchant: coin +1, Tartarus wish +1 light
  assert.equal(s.light, 5);
  assert.equal(s.obols, 3);
  assert.deepEqual(s.passengers, []);
  assert.deepEqual(s.stats.delivered.map(d => [d.soulId, d.destinationId]),
    [['C01-S02', 'elysium'], ['C01-S07', 'asphodel'], ['C01-S03', 'tartarus']]);
  assert.deepEqual(s.hand, ['M-C01-S02', 'M-C01-S07', 'M-C01-S03']);
  assert.deepEqual(s.hand.map(id => s.memories[id].templateId), ['R06', 'R03', 'R02']);
});

test('BD-06 an empty delivery is a legal confirmed action that keeps everyone aboard', () => {
  const s0 = build({ passengers: ['C01-S03'] });
  let s = act(s0, depart('elysium'));
  assert.equal(view(s).permissions.canDeliver, true);
  const r = actEmit(s, deliver([]));
  assert.equal(r.state.phase, 'prepare');
  assert.deepEqual(r.state.passengers, ['C01-S03']);
  assert.equal(r.state.obols, 2);
  assert.equal(r.state.light, 2);
  assert.ok(types(r.emitted).includes('DELIVERY_CONFIRMED'));
  assert.ok(!types(r.emitted).includes('SOUL_DELIVERED'));
});

test('BD-07 replayed or double-clicked delivery cannot duplicate rewards', () => {
  const s0 = act(build({ passengers: ['C01-S03'], light: 3 }), depart('tartarus'));
  const s1 = act(s0, deliver(['C01-S03']));
  const obolsAfter = s1.obols, lightAfter = s1.light, memories = s1.stats.memoriesEarned;
  reject(s1, deliver(['C01-S03']), 'WRONG_PHASE');
  reject(s1, deliver([]), 'WRONG_PHASE');
  assert.equal(s1.obols, obolsAfter);
  assert.equal(s1.light, lightAfter);
  assert.equal(s1.stats.memoriesEarned, memories);
  // even on the original pre-delivery state object a second dispatch is a fresh valid action, not a mutation of s1
  assert.equal(E.dispatch(s0, deliver(['C01-S03'])).state.obols, obolsAfter);
});

test('BD-08 delivery validates its selection', () => {
  const s = act(build({ passengers: ['C01-S03', 'C01-S07'], light: 4 }), depart('asphodel'));
  reject(s, deliver(['C01-S05']), 'NOT_FOUND');
  reject(s, deliver(['C01-S03', 'C01-S03']), 'INVALID_INPUT');
  reject(s, { type: 'DELIVER' }, 'INVALID_INPUT');
  reject(s, { type: 'DELIVER', soulIds: 'C01-S03' }, 'INVALID_INPUT');
  reject(s, { type: 'DELIVER', soulIds: [3] }, 'INVALID_INPUT');
});

test('BD-09 the haven needs no delivery, allows none, and passengers cannot leave there', () => {
  let s = build({ nodeId: 'elysium', passengers: ['C01-S03'], light: 4 });
  s = act(s, depart('haven'));
  assert.equal(s.phase, 'prepare');
  assert.equal(s.nodeId, 'haven');
  assert.deepEqual(s.passengers, ['C01-S03']);
  reject(s, deliver(['C01-S03']), 'WRONG_PHASE');
  reject(s, { type: 'UNBOARD', soulId: 'C01-S03' }, 'WRONG_LOCATION');
  assert.equal(view(s).permissions.canDeliver, false);
});

test('BD-10 linked pairs delivered in the same action earn Joined Memory for both souls', () => {
  ['C01-S01/C01-S02', 'C01-S11/C01-S12'].forEach(pair => {
    const [a, b] = pair.split('/');
    let s = build({ nodeId: 'elysium', phase: 'deliver', passengers: [a, b], light: 0 });
    s = act(s, deliver([a, b]));
    assert.deepEqual(s.stats.delivered.length, 2);
    assert.deepEqual([s.memories['M-' + a].templateId, s.memories['M-' + b].templateId], ['R05', 'R05'], pair);
    assert.equal(s.memories['M-' + a].sourceSoulId, a);
    assert.equal(s.memories['M-' + b].sourceSoulId, b);
    assert.equal(s.memories['M-' + a].deliveredTo, 'elysium');
  });
});

test('BD-11 separate deliveries give Faint Memory with no retroactive replacement; cross-cohort pairs are not linked', () => {
  let s = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S01', 'C01-S02'], light: 0 });
  s = act(s, deliver(['C01-S01']));
  assert.equal(s.memories['M-C01-S01'].templateId, 'R06');
  s = act(s, depart('haven'));
  assert.deepEqual(s.passengers, ['C01-S02']);
  s = act(s, depart('asphodel'));
  s = act(s, deliver(['C01-S02']));
  assert.equal(s.memories['M-C01-S02'].templateId, 'R06');
  assert.equal(s.memories['M-C01-S01'].templateId, 'R06');       // still Faint

  let x = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S01', 'C02-S02'], light: 0, supplyIndex: 24 });
  x = act(x, deliver(['C01-S01', 'C02-S02']));
  assert.equal(x.memories['M-C01-S01'].templateId, 'R06');
  assert.equal(x.memories['M-C02-S02'].templateId, 'R06');
  assert.deepEqual(x.eventsTriggered, []);                        // no linked-pair event across cohorts
});

test('BD-12 a mismatched destination gives the printed reward but no bonus and no penalty', () => {
  const s0 = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S03'], light: 2 });   // Merchant prefers Tartarus
  const r = actEmit(s0, deliver(['C01-S03']));
  assert.equal(r.state.obols, 3);
  assert.equal(r.state.light, 2);
  assert.equal(r.state.reprimands, 0);
  const rec = r.emitted.find(e => e.type === 'SOUL_DELIVERED');
  assert.equal(rec.wishMatched, false);
  assert.equal(rec.wishBonus, 0);
  assert.equal(r.state.souls['C01-S03'], undefined);
});

test('BD-13 gains above the lantern cap are lost and accounted per soul', () => {
  const s0 = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S02'], light: 6 });
  const r = actEmit(s0, deliver(['C01-S02']));                    // flame + wish = 2, both lost at cap
  assert.equal(r.state.light, 6);
  const rec = r.emitted.find(e => e.type === 'SOUL_DELIVERED');
  assert.equal(rec.lightGained, 0);
  assert.equal(rec.lightLost, 2);
  const half = actEmit(build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S02'], light: 5 }), deliver(['C01-S02']));
  assert.equal(half.state.light, 6);
  const rec2 = half.emitted.find(e => e.type === 'SOUL_DELIVERED');
  assert.equal(rec2.lightGained, 1);
  assert.equal(rec2.lightLost, 1);
});

test('BD-14 obols have no cap', () => {
  const s = act(build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S03'], obols: 40 }), deliver(['C01-S03']));
  assert.equal(s.obols, 41);
});

test('BD-15 new memories join the bottom of the draw pile by cohort then template number', () => {
  const s0 = build({ nodeId: 'asphodel', phase: 'deliver', passengers: ['C02-S03', 'C01-S07'], light: 0, supplyIndex: 24,
    draw: [['R01', 'C01-S09']] });
  const s = act(s0, deliver(['C02-S03', 'C01-S07']));
  // draw pile was [M-C01-S09]; new cards appended C01-S07 then C02-S03; then hand fills to three in that order
  assert.deepEqual(s.hand, ['M-C01-S09', 'M-C01-S07', 'M-C02-S03']);
  assert.deepEqual(s.draw, []);
});

test('BD-16 previewDelivery matches what the confirmed action then grants', () => {
  const s = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S11', 'C01-S12', 'C01-S03'], light: 2, obols: 1 });
  const p = E.previewDelivery(s, ['C01-S11', 'C01-S12']);
  assert.equal(p.ok, true);
  assert.deepEqual(p.deliveries.map(d => d.memoryTemplateId), ['R05', 'R05']);
  const after = act(s, deliver(['C01-S11', 'C01-S12']));
  // The preview must not reveal hidden events: the Musician/Listener pair at Elysium also fires E01 (+1 light).
  assert.equal(after.light - s.light, p.totals.lightGained + 1);
  assert.deepEqual(after.eventsTriggered, ['E01']);
  assert.equal(after.obols - s.obols, p.totals.obolsGained);
  const bad = E.previewDelivery(s, ['C09-S09']);
  assert.equal(bad.ok, false);
});

test('BD-17 delivered souls leave play for good and cannot reboard', () => {
  let s = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S03'] });
  s = act(s, deliver(['C01-S03']));
  assert.ok(!s.shore.includes('C01-S03') && !s.passengers.includes('C01-S03'));
  assert.equal(s.souls['C01-S03'], undefined);
});
