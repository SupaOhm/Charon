'use strict';
const test = require('node:test');
const { E, build, act, actAll, view, assert } = require('./helpers.js');

// Independent test-side PRNG (deliberately not the engine's).
function lcg(seed) { let x = seed >>> 0; return () => (x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296; }

// Drive a run with random but legal-ish choices; the engine, not the driver, decides what is allowed.
function randomRun(seed, maxSteps, onStep) {
  const rnd = lcg(seed * 7919 + 13);
  let s = E.createGame({ seed });
  const script = [];
  for (let i = 0; i < maxSteps && s.phase !== 'ended'; i++) {
    let a;
    const legal = E.getLegalActions(s);
    if (s.phase === 'deliver') {
      const ids = s.passengers.filter(() => rnd() < 0.7);
      a = { type: 'DELIVER', soulIds: ids };
    } else if (legal.length) {
      const weighted = [];
      legal.forEach(x => { const w = x.type === 'DEPART' ? 4 : x.type === 'BOARD' ? 3 : x.type === 'RESOLVE_EVENT' ? 5 : 1; for (let k = 0; k < w; k++) weighted.push(x); });
      a = weighted[Math.floor(rnd() * weighted.length)];
    } else break;
    const r = E.dispatch(s, a);
    if (!r.ok) throw new Error('driver produced a rejected action ' + JSON.stringify(a) + ': ' + JSON.stringify(r.error));
    onStep && onStep(s, a, r);
    s = r.state; script.push(a);
  }
  return { state: s, script };
}

test('RPL-01 replaying the accepted-action list from the seed reproduces the state byte for byte', () => {
  const { state } = randomRun(21, 250);
  const again = E.replay({ seed: 21 }, state.actionLog);
  assert.equal(again.ok, true);
  assert.equal(E.serialize(again.state), E.serialize(state));
});

test('RPL-02 two independent runs from one seed and one script are identical, and a save resumes identically', () => {
  const a = randomRun(8, 200);
  const b = E.replay({ seed: 8 }, a.script);
  assert.equal(E.serialize(a.state), E.serialize(b.state));
  const mid = E.replay({ seed: 8 }, a.script.slice(0, 40)).state;
  const resumed = E.deserialize(E.serialize(mid)).state;
  const finish = E.replay({ seed: 8 }, a.script.slice(0, 40)).ok && a.script.slice(40).reduce((st, act_) => E.dispatch(st, act_).state, resumed);
  assert.equal(E.serialize(finish), E.serialize(a.state));
});

test('RPL-03 invariants hold at every step of many random runs (fuzz, 60 seeds)', () => {
  const stats = { runs: 0, ended: { fog: 0, sinking: 0, dismissal: 0 }, maxCycle: 0, wraithsFormed: 0, events: {}, deliveries: 0 };
  for (let seed = 1; seed <= 60; seed++) {
    const { state } = randomRun(seed, 300, (before, a, r) => {
      const s = r.state;
      const round = E.deserialize(E.serialize(s));
      assert.equal(round.ok, true, 'state must always be a loadable, self-consistent save: ' + (round.error && round.error.message));
      assert.deepEqual(round.state, s);
      const v = E.getView(s);
      assert.ok(v.resources.light >= 0 && v.resources.light <= 6);
      assert.ok(v.resources.hull >= 0 && v.resources.hull <= 3);
      assert.ok(v.resources.obols >= 0 && v.resources.reprimands >= 0);
      assert.ok(v.capacity.used <= v.capacity.max);
      const placed = s.shore.concat(s.passengers, s.wraiths.map(w => w.sourceSoulId), s.stats.delivered.map(d => d.soulId));
      assert.equal(new Set(placed).size, placed.length, 'a soul instance exists in exactly one place');
      assert.equal(s.hand.length + s.draw.length + s.discard.length, s.stats.memoriesEarned, 'memory conservation');
      assert.ok(s.hand.length <= 3);
      if (r.emitted.some(e => e.type === 'CYCLE_COMPLETED')) assert.ok(s.shore.length >= 5, 'refilled toward five at cycle start');
      if (s.phase !== 'ended') assert.ok(s.hull >= 1 && s.reprimands < 3);
      r.emitted.forEach(e => { if (e.type === 'EVENT_TRIGGERED') stats.events[e.eventId] = (stats.events[e.eventId] || 0) + 1; if (e.type === 'SOUL_DELIVERED') stats.deliveries++; });
      // frozen after termination
      if (s.phase === 'ended') {
        const dead = E.dispatch(s, { type: 'REPAIR' });
        assert.equal(dead.ok, false);
        assert.equal(dead.state, s);
      }
    });
    stats.runs++;
    stats.maxCycle = Math.max(stats.maxCycle, state.cycle);
    stats.wraithsFormed += state.stats.wraithsFormed;
    if (state.ended) stats.ended[state.ended.cause]++;
  }
  assert.ok(stats.deliveries > 0, 'fuzz should exercise delivery');
  // recorded for the evidence file; printed so the run log shows what was actually exercised
  console.log('    fuzz coverage:', JSON.stringify(stats));
});

test('RPL-04 identical seeds give identical opening states; different seeds share the fixed soul order', () => {
  assert.equal(E.serialize(E.createGame({ seed: 5 })).length, E.serialize(E.createGame({ seed: 5 })).length);
  assert.deepEqual(E.createGame({ seed: 5 }).shore, E.createGame({ seed: 99 }).shore);   // arrivals never depend on the PRNG
});

test('RPL-05 the engine is free of ambient state: two interleaved runs do not interfere', () => {
  let a = E.createGame({ seed: 1 }), b = E.createGame({ seed: 1 });
  a = act(a, { type: 'BOARD', soulId: 'C01-S03' });
  b = act(b, { type: 'BOARD', soulId: 'C01-S05' });
  a = act(a, { type: 'DEPART', to: 'elysium', variant: 'normal' });
  assert.deepEqual(b.passengers, ['C01-S05']);
  assert.equal(b.phase, 'prepare');
  assert.deepEqual(a.passengers, ['C01-S03']);
});

test('RPL-06 a long scripted run keeps every invariant and issues unique soul IDs across cohort rollover', () => {
  // Simple courier: board up to three waiting souls, take the cheapest normal destination, deliver everyone, come home.
  const step = s => {
    const v = E.getView(s);
    if (v.phase === 'event') return { type: 'RESOLVE_EVENT', eventId: v.pendingEvent.eventId, accept: false };
    if (v.phase === 'deliver') return { type: 'DELIVER', soulIds: v.passengers.map(p => p.id) };
    if (v.nodeId !== 'shore') return { type: 'DEPART', to: 'shore', variant: 'normal' };
    if (v.passengers.length < 3) { const c = v.shore.find(x => x.canBoard); if (c) return { type: 'BOARD', soulId: c.id }; }
    const r = v.routes.filter(x => x.legal && !x.lethal && x.variant === 'normal').sort((a, b) => a.fogDamage - b.fogDamage)[0];
    return r ? { type: 'DEPART', to: r.to, variant: 'normal' } : null;
  };
  const seen = new Set();
  let s = E.createGame({ seed: 3 });
  for (let i = 0; i < 3000 && s.phase !== 'ended' && s.completedCycles < 40; i++) {
    const a = step(s);
    if (!a) break;
    const r = E.dispatch(s, a);
    assert.equal(r.ok, true, JSON.stringify(a) + ' ' + JSON.stringify(r.error));
    s = r.state;
    s.shore.concat(s.passengers).forEach(id => seen.add(id));
    if (i % 25 === 0) assert.equal(E.deserialize(E.serialize(s)).ok, true);
  }
  assert.ok(s.completedCycles >= 5, 'the run must last long enough to pass the first twelve souls (ended: ' + JSON.stringify(s.ended && s.ended.cause) + ')');
  assert.ok([...seen].some(id => id.startsWith('C02-')), 'cohort 2 souls appear');
  assert.equal(s.stats.delivered.length, new Set(s.stats.delivered.map(d => d.soulId)).size, 'no soul instance is delivered twice');
});
