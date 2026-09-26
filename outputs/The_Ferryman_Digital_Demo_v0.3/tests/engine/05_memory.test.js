'use strict';
const test = require('node:test');
const { E, build, act, actAll, actEmit, reject, view, route, soulView, loop, assert } = require('./helpers.js');

const depart = (to, variant) => ({ type: 'DEPART', to, variant: variant || 'normal' });
const deliverNone = { type: 'DELIVER', soulIds: [] };
const play = (id, target) => ({ type: 'PLAY_MEMORY', memoryId: 'M-' + id, targetSoulId: target === undefined ? null : target });
const four = [['R01', 'C01-S09'], ['R02', 'C01-S03'], ['R03', 'C01-S05'], ['R06', 'C01-S02']];

test('MEM-01 the hand is refilled to three exactly once per stop, after arrival', () => {
  let s = build({ nodeId: 'elysium', phase: 'deliver', draw: four });
  s = act(s, deliverNone);
  assert.deepEqual(s.hand, ['M-C01-S09', 'M-C01-S03', 'M-C01-S05']);
  assert.deepEqual(s.draw, ['M-C01-S02']);
  s = act(s, play('C01-S09'));
  assert.deepEqual(view(s).memoryCounts, { draw: 1, discard: 1, hand: 2, total: 4 });   // no redraw at this stop
  s = act(s, depart('haven'));
  assert.equal(s.hand.length, 3);                                                        // drawn at the next stop
  assert.deepEqual(s.draw, []);
});

test('MEM-02 playing is free, limited to one per crossing, and cannot be repeated', () => {
  let s = build({ light: 4, obols: 3, hand: four.slice(0, 3) });
  s = act(s, play('C01-S09'));
  assert.equal(s.light, 4);
  assert.equal(s.obols, 3);
  reject(s, play('C01-S03'), 'LIMIT_REACHED');
  reject(s, play('C01-S09'), 'NOT_FOUND');                        // the played card is gone from the hand
  assert.equal(soulView(s, 'C01-S01') !== undefined, true);
  assert.ok(view(s).hand.every(m => m.canPlay === false && m.disabledReason));
  reject(s, depart('haven'), 'ILLEGAL_ROUTE');                    // a rejected departure does not reset the allowance
  assert.equal(s.memoryPlayed, true);
  s = actAll(s, [depart('elysium'), deliverNone]);
  assert.equal(s.memoryPlayed, false);                            // reset after a successful crossing
  // hand held 2 cards and the draw pile was empty, so the discard (the played card) was recycled into the hand
  assert.equal(s.hand.length, 3);
  s = act(s, play('C01-S03'));
  assert.equal(s.discard.length, 1);
});

test('MEM-03 discard recycling only happens when the draw pile runs dry, and is not a permanent removal', () => {
  const none = build({ nodeId: 'elysium', phase: 'deliver', hand: [['R01', 'C01-S09'], ['R02', 'C01-S03']],
    draw: [['R03', 'C01-S05']], discard: [['R06', 'C01-S02'], ['R01', 'C01-S08'], ['R01', 'C01-S10'], ['R01', 'C01-S11'], ['R01', 'C01-S12']] });
  const a = act(none, deliverNone);
  assert.equal(a.hand.length, 3);
  assert.equal(a.draw.length, 0);
  assert.equal(a.discard.length, 5);
  assert.equal(a.rng, none.rng, 'no shuffle may occur while the draw pile can supply the hand');

  const dry = build({ nodeId: 'elysium', phase: 'deliver', discard: [['R01', 'C01-S09'], ['R02', 'C01-S03'], ['R03', 'C01-S05'], ['R06', 'C01-S02']] });
  const b = act(dry, deliverNone);
  assert.equal(b.hand.length, 3);
  assert.equal(b.draw.length, 1);
  assert.equal(b.discard.length, 0);
  assert.deepEqual(b.hand.concat(b.draw).sort(), ['M-C01-S02', 'M-C01-S03', 'M-C01-S05', 'M-C01-S09']);   // nothing lost
  assert.notEqual(b.rng, dry.rng);
});

test('MEM-04 the reshuffle is seeded: identical seeds agree, different seeds can differ', () => {
  const orderFor = seed => {
    const s = build({ seed, nodeId: 'elysium', phase: 'deliver',
      discard: [['R01', 'C01-S09'], ['R02', 'C01-S03'], ['R03', 'C01-S05'], ['R06', 'C01-S02'], ['R01', 'C01-S08'], ['R01', 'C01-S10']] });
    const t = act(s, deliverNone);
    return t.hand.concat(t.draw).join(',');
  };
  assert.equal(orderFor(5), orderFor(5));
  const distinct = new Set(Array.from({ length: 30 }, (_, i) => orderFor(i + 1)));
  assert.ok(distinct.size > 1, 'the shuffle must actually depend on the seed');
});

test('MEM-05 a played card goes to the discard pile and cannot be drawn again at that stop', () => {
  let s = build({ nodeId: 'elysium', hand: [['R01', 'C01-S09']] });
  s = act(s, play('C01-S09'));
  assert.deepEqual(s.discard, ['M-C01-S09']);
  assert.deepEqual(s.hand, []);
  assert.deepEqual(s.draw, []);
});

test('MEM-06 Recollection marks one waiting soul: its normal anger is prevented, the others rise', () => {
  let s = build({ hand: [['R03', 'C01-S09']] });
  s = act(s, play('C01-S09', 'C01-S03'));
  assert.equal(soulView(s, 'C01-S03').normalAngerProtected, true);
  assert.equal(soulView(s, 'C01-S03').protectedBy, 'memory');
  s = loop(s);
  assert.equal(s.souls['C01-S03'].anger, 0);
  assert.equal(s.souls['C01-S01'].anger, 1);
});

test('MEM-07 a card with an optional target still protects the crossing when no target is chosen', () => {
  const s0 = build({ light: 6, hand: [['R03', 'C01-S09']] });
  assert.equal(route(s0, 'tartarus').fogDamage, 2);
  const s = act(s0, play('C01-S09', null));
  assert.equal(route(s, 'tartarus').fogDamage, 1);
  assert.deepEqual(s.protection, {});
});

test('MEM-08 invalid memory targets are rejected at dispatch', () => {
  let s = build({ hand: [['R03', 'C01-S09'], ['R01', 'C01-S08']] });
  reject(s, play('C01-S09', 'C09-S01'), 'INVALID_TARGET');
  reject(s, play('C01-S08', 'C01-S03'), 'INVALID_TARGET');        // Steadiness takes no target
  reject(s, play('C01-S09', 7), 'INVALID_INPUT');
  s = act(s, { type: 'BOARD', soulId: 'C01-S03' });
  reject(s, play('C01-S09', 'C01-S03'), 'INVALID_TARGET');        // aboard, not waiting
  assert.deepEqual(view(s).hand[0].validTargetIds, ['C01-S01', 'C01-S02', 'C01-S04', 'C01-S05']);
  assert.deepEqual(view(s).hand[1].validTargetIds, []);
  assert.equal(view(s).hand[0].takesTarget, true);
});

test('MEM-09 protection does not stack: calming plus a memory mark prevents one anger increase, not two', () => {
  let s = act(build({ hand: [['R03', 'C01-S09']] }), { type: 'CALM', soulId: 'C01-S03' });
  s = act(s, play('C01-S09', 'C01-S03'));
  assert.equal(s.protection['C01-S03'], 'calm');
  s = loop(s);
  assert.equal(s.souls['C01-S03'].anger, 0);
  const m = act(build({ hand: [['R05', 'C01-S09']] }), play('C01-S09', 'C01-S04'));
  assert.equal(soulView(m, 'C01-S04').canCalm, false);            // already protected
  assert.ok(soulView(m, 'C01-S04').disabledReasons.some(r => /already protected/.test(r)));
});

test('MEM-10 memory marks expire when the cycle completes', () => {
  let s = act(build({ hand: [['R03', 'C01-S09']] }), play('C01-S09', 'C01-S03'));
  s = loop(s);
  assert.deepEqual(s.protection, {});
  s = loop(s);
  assert.equal(s.souls['C01-S03'].anger, 1);                      // second cycle: unprotected
});

test('MEM-11 remembrance reaches the waiting shore from any stop', () => {
  let s = build({ nodeId: 'elysium', hand: [['R05', 'C01-S09']] });
  s = act(s, play('C01-S09', 'C01-S04'));
  s = act(s, depart('shore'));
  assert.equal(s.souls['C01-S04'].anger, 0);
  assert.equal(s.souls['C01-S01'].anger, 1);
});

test('MEM-12 memories are source-linked instances with their own stable ids', () => {
  let s = build({ nodeId: 'tartarus', phase: 'deliver', passengers: ['C01-S03', 'C01-S08'], light: 4 });
  s = act(s, { type: 'DELIVER', soulIds: ['C01-S03', 'C01-S08'] });
  const a = s.memories['M-C01-S03'], b = s.memories['M-C01-S08'];
  assert.deepEqual([a.templateId, b.templateId], ['R02', 'R02']);   // both Vigil, yet distinct instances
  assert.notEqual(a.id, b.id);
  assert.equal(a.sourceSoulId, 'C01-S03');
  assert.equal(a.deliveredTo, 'tartarus');
  assert.equal(view(s).hand.find(m => m.id === 'M-C01-S08').sourceSoulId, 'C01-S08');
});

test('MEM-13 memories cannot be played outside the preparation phase', () => {
  const inDeliver = build({ nodeId: 'elysium', phase: 'deliver', hand: [['R01', 'C01-S09']] });
  reject(inDeliver, play('C01-S09'), 'WRONG_PHASE');
  assert.equal(view(inDeliver).hand[0].canPlay, false);
});

test('MEM-14 Vigil protects 3 only while a two-seat soul is aboard at departure', () => {
  let s = build({ light: 6, hand: [['R02', 'C01-S09']], passengers: ['C01-S08'] });
  s = act(s, play('C01-S09'));
  assert.equal(route(s, 'tartarus').breakdown.memoryProtection, 3);
  s = act(s, { type: 'UNBOARD', soulId: 'C01-S08' });
  assert.equal(route(s, 'tartarus').breakdown.memoryProtection, 1);
});

test('MEM-15 setup draws from empty piles without inventing memories', () => {
  const s = E.createGame({ seed: 4 });
  assert.deepEqual(view(s).memoryCounts, { draw: 0, discard: 0, hand: 0, total: 0 });
  assert.equal(s.log.filter(e => e.type === 'MEMORIES_DRAWN').length, 1);
});

test('MEM-16 a marked soul who then boards and is delivered leaves no stale mark (regression found by fuzzing)', () => {
  let s = build({ hand: [['R03', 'C01-S09']] });
  s = act(s, play('C01-S09', 'C01-S03'));
  s = act(s, { type: 'BOARD', soulId: 'C01-S03' });
  assert.equal(E.deserialize(E.serialize(s)).ok, true);                 // mark on an aboard soul is a valid state
  s = actAll(s, [depart('tartarus'), { type: 'DELIVER', soulIds: ['C01-S03'] }]);
  assert.deepEqual(s.protection, {});
  assert.equal(E.deserialize(E.serialize(s)).ok, true);
});
