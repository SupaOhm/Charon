'use strict';
const test = require('node:test');
const { E, build, act, reject, view, assert } = require('./helpers.js');

test('API-01 createGame gives the specified opening state (Sections 3, 4, 9 Setup)', () => {
  const s = E.createGame({ seed: 1 });
  const v = view(s);
  assert.equal(v.schemaVersion, 1);
  assert.equal(v.phase, 'prepare');
  assert.equal(v.nodeId, 'shore');
  assert.equal(v.cycle, 1);
  assert.equal(v.completedCycles, 0);
  assert.deepEqual(v.resources, { light: 2, lightMax: 6, obols: 2, hull: 3, hullMax: 3, reprimands: 0, reprimandsMax: 3 });
  assert.deepEqual(v.capacity, { used: 0, max: 4 });
  assert.deepEqual(v.nextQuota, { dueAfterCycle: 3, amount: 2, cyclesUntilDue: 3 });
  assert.equal(v.favorableDestinationId, null);
  assert.deepEqual(v.shore.map(x => x.id), ['C01-S01', 'C01-S02', 'C01-S03', 'C01-S04', 'C01-S05']);
  assert.deepEqual(v.hand, []);
  assert.deepEqual(v.memoryCounts, { draw: 0, discard: 0, hand: 0, total: 0 });
  assert.deepEqual(v.wraiths, []);
  assert.equal(v.pendingEvent, null);
  assert.deepEqual(v.discoveredEventIds, []);
  assert.equal(v.ended, null);
  assert.ok(v.shore.every(x => x.anger === 0));
});

test('API-02 opening routes are three destinations with fog 0, 1, 2 and no rocky variants', () => {
  const v = view(E.createGame({ seed: 7 }));
  assert.deepEqual(v.routes.map(r => [r.to, r.variant, r.fogDamage]),
    [['elysium', 'normal', 0], ['asphodel', 'normal', 1], ['tartarus', 'normal', 2]]);
  assert.ok(v.routes.every(r => r.legal && !r.lethal && r.hullDamage === 0));
});

test('API-03 createGame rejects invalid seeds and options', () => {
  assert.throws(() => E.createGame({ seed: 1.5 }), RangeError);
  assert.throws(() => E.createGame({ seed: -1 }), RangeError);
  assert.throws(() => E.createGame({ seed: 'x' }), RangeError);
  assert.throws(() => E.createGame(5), TypeError);
  assert.equal(E.createGame().seed, 1);
});

test('API-04 invalid actions return ok:false, the same state object, an error and no emissions', () => {
  const s = E.createGame({ seed: 1 });
  reject(s, null, 'INVALID_ACTION');
  reject(s, 'BOARD', 'INVALID_ACTION');
  reject(s, {}, 'INVALID_ACTION');
  reject(s, { type: 'FLY' }, 'UNKNOWN_ACTION');
  reject(s, { type: 'BOARD' }, 'INVALID_INPUT');
  reject(s, { type: 'BOARD', soulId: 42 }, 'INVALID_INPUT');
  reject(s, { type: 'BOARD', soulId: 'C09-S09' }, 'NOT_FOUND');
  reject(s, { type: 'DEPART', to: 'olympus' }, 'INVALID_INPUT');
  reject(s, { type: 'DEPART', to: 'elysium', variant: 'sideways' }, 'INVALID_INPUT');
  reject(s, { type: 'DELIVER', soulIds: [] }, 'WRONG_PHASE');
  reject(s, { type: 'RESOLVE_EVENT', eventId: 'E01', accept: true }, 'WRONG_PHASE');
  reject(s, { type: 'PLAY_MEMORY', memoryId: 'M-C01-S01', targetSoulId: null }, 'NOT_FOUND');
});

test('API-05 successful dispatch never mutates the caller state and returns structured emissions', () => {
  const s = E.createGame({ seed: 3 });
  const before = JSON.stringify(s);
  const r = E.dispatch(s, { type: 'BOARD', soulId: 'C01-S03' });
  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.equal(JSON.stringify(s), before);
  assert.notEqual(r.state, s);
  assert.equal(r.emitted.length, 1);
  assert.equal(r.emitted[0].type, 'BOARDED');
  assert.equal(r.emitted[0].soulId, 'C01-S03');
  assert.deepEqual(view(r.state).passengers.map(p => p.id), ['C01-S03']);
});

test('API-06 the view is a pure projection: repeated calls agree and never change state', () => {
  const s = build({ cycle: 4, passengers: ['C01-S03'] });
  const before = JSON.stringify(s);
  assert.deepEqual(view(s), view(s));
  assert.equal(JSON.stringify(s), before);
});

test('API-07 serialize/deserialize round-trips a mid-run state exactly', () => {
  let s = E.createGame({ seed: 11 });
  s = act(s, { type: 'BOARD', soulId: 'C01-S02' });
  s = act(s, { type: 'DEPART', to: 'asphodel', variant: 'normal' });
  const text = E.serialize(s);
  assert.equal(JSON.parse(text).schemaVersion, 1);
  const d = E.deserialize(text);
  assert.equal(d.ok, true);
  assert.equal(d.error, null);
  assert.deepEqual(d.state, s);
  assert.equal(E.serialize(d.state), text);
});

test('API-08 deserialize rejects malformed and unsupported saves without partial loading', () => {
  const good = JSON.parse(E.serialize(E.createGame({ seed: 1 })));
  const withState = f => { const g = JSON.parse(JSON.stringify(good)); f(g.state); return JSON.stringify(g); };
  const bad = {
    'not a string': 42,
    'not JSON': '{oops',
    'JSON null': 'null',
    'array': '[]',
    'wrong schemaVersion': JSON.stringify({ ...good, schemaVersion: 2 }),
    'missing schemaVersion': JSON.stringify({ rulesVersion: '0.3', state: good.state }),
    'wrong rulesVersion': JSON.stringify({ ...good, rulesVersion: '0.2' }),
    'missing state': JSON.stringify({ schemaVersion: 1, rulesVersion: '0.3' }),
    'light above cap': withState(s => { s.light = 99; }),
    'negative obols': withState(s => { s.obols = -1; }),
    'fractional hull': withState(s => { s.hull = 1.5; }),
    'unknown phase': withState(s => { s.phase = 'dreaming'; }),
    'unknown node': withState(s => { s.nodeId = 'olympus'; }),
    'soul in shore and boat': withState(s => { s.passengers.push(s.shore[0]); }),
    'shore soul without record': withState(s => { delete s.souls['C01-S01']; }),
    'record without placement': withState(s => { s.souls['C09-S01'] = { id: 'C09-S01', templateId: 'S01', cohort: 9, anger: 0 }; }),
    'anger at wraith threshold left in shore': withState(s => { s.souls['C01-S01'].anger = 3; }),
    'over capacity': withState(s => {
      ['C01-S01', 'C01-S04', 'C01-S08'].forEach(id => {
        s.passengers.push(id); s.shore = s.shore.filter(x => x !== id);
        if (!s.souls[id]) s.souls[id] = { id, templateId: id.slice(4), cohort: 1, anger: 0 };
      });
    }),
    'memory in two piles': withState(s => {
      s.memories['M-C01-S01'] = { id: 'M-C01-S01', templateId: 'R01', sourceSoulId: 'C01-S01' };
      s.hand = ['M-C01-S01']; s.draw = ['M-C01-S01'];
    }),
    'oversized hand': withState(s => {
      ['C01-S01', 'C01-S02', 'C01-S03', 'C01-S04'].forEach(id => {
        s.memories['M-' + id] = { id: 'M-' + id, templateId: 'R01', sourceSoulId: id }; s.hand.push('M-' + id);
      });
    }),
    'deliver phase without arrival': withState(s => { s.phase = 'deliver'; }),
    'event phase without queue': withState(s => { s.phase = 'event'; }),
    'ended without record': withState(s => { s.phase = 'ended'; }),
    'live run with zero hull': withState(s => { s.hull = 0; }),
    'live run at reprimand limit': withState(s => { s.reprimands = 3; }),
    'cycle counters disagree': withState(s => { s.completedCycles = 5; }),
    'non-integer rng': withState(s => { s.rng = 0.5; }),
    'visited at shore': withState(s => { s.visited = ['elysium']; }),
    'unknown triggered event': withState(s => { s.eventsTriggered = ['E99']; }),
    'protection on absent soul': withState(s => { s.protection = { 'C01-S99': 'calm' }; })
  };
  Object.keys(bad).forEach(name => {
    const r = E.deserialize(bad[name]);
    assert.equal(r.ok, false, name + ' must be rejected');
    assert.equal(r.state, null, name);
    assert.ok(r.error && r.error.code && r.error.message, name + ' needs a useful error');
  });
});

test('API-09 no dispatch action can alter approved constants or rules data', () => {
  assert.throws(() => { 'use strict'; E.rules.constants.seats = 9; }, TypeError);
  assert.equal(E.rules.constants.seats, 4);
  const s = E.createGame({ seed: 1 });
  const r = act(s, { type: 'BOARD', soulId: 'C01-S01', seats: 99, light: 99 }); // extra keys are ignored, not applied
  assert.equal(r.light, 2);
  assert.equal(view(r).capacity.max, 4);
  assert.equal(view(r).capacity.used, 2);
});

test('API-10 hidden event conditions are absent from the normal view until triggered', () => {
  const s = build({ nodeId: 'elysium', phase: 'deliver', passengers: ['C01-S01', 'C01-S02'], light: 1 });
  const text = JSON.stringify(view(s));
  assert.ok(!/linkedPair|templateInArrivalSnapshot|soldierPair|hullBelow|predicate/.test(text), 'predicates must not be exposed');
  assert.deepEqual(view(s).discoveredEventIds, []);
  const s2 = act(s, { type: 'DELIVER', soulIds: ['C01-S01', 'C01-S02'] });
  assert.deepEqual(view(s2).discoveredEventIds, ['E01']);
});

test('API-11 the ended view exposes cause and summary and offers no legal actions', () => {
  const s = build({ light: 1 });
  const r = act(s, { type: 'DEPART', to: 'tartarus', variant: 'normal' });
  const v = view(r);
  assert.equal(v.phase, 'ended');
  assert.equal(v.ended.cause, 'fog');
  assert.equal(v.ended.summary.completedCycles, 0);
  assert.deepEqual(v.routes, []);
  assert.deepEqual(E.getLegalActions(r), []);
  assert.ok(Object.keys(v.permissions).filter(k => typeof v.permissions[k] === 'boolean').every(k => v.permissions[k] === false));
});
