'use strict';
// Scripted-policy experiments against the public engine API. AUTOMATED EXPERIMENTS ONLY: these are not human
// playtests and not balance evidence (the v0.3 numbers are untested defaults). Output: policy-experiment-results.json
// Usage (from outputs/The_Ferryman_Digital_Demo_v0.3/):  node verification/engine/policy-experiments.cjs
const fs = require('node:fs');
const path = require('node:path');
const E = require(path.resolve(__dirname, '..', '..', 'engine.js'));

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const STEP_CAP = 4000;
const CYCLE_CAP = 60;

function pickBoarding(v) {
  const order = v.shore.slice().sort((a, b) => b.anger - a.anger);
  const chosen = []; let seats = v.capacity.used;
  const has = id => chosen.some(x => x.id === id) || v.passengers.some(x => x.id === id);
  order.forEach(s => {
    if (has(s.id) || seats + s.seats > v.capacity.max) return;
    if (s.conflictPartnerId && has(s.conflictPartnerId)) return;
    chosen.push(s); seats += s.seats;
    if (s.partnerId) {
      const p = order.find(x => x.id === s.partnerId);
      if (p && !has(p.id) && seats + p.seats <= v.capacity.max) { chosen.push(p); seats += p.seats; }
    }
  });
  return chosen.map(s => s.id);
}

// maxStops: destinations visited per cycle. calm: spend spare obols calming. rockyOK: allow rocky routes.
function courier(opts) {
  return function next(state) {
    const v = E.getView(state);
    if (v.phase === 'event') return { type: 'RESOLVE_EVENT', eventId: v.pendingEvent.eventId, accept: v.pendingEvent.canAccept };
    if (v.phase === 'deliver') {
      const here = v.nodeId;
      const stopsDone = v.visited.filter(n => n !== 'haven').length;
      const last = stopsDone >= opts.maxStops;
      const ids = v.passengers.filter(p => last || p.preferredDestinationId === here).map(p => p.id);
      return { type: 'DELIVER', soulIds: ids };
    }
    const atShore = v.nodeId === 'shore';
    if (v.wraiths.some(w => w.canRelease) && v.resources.light >= 4) return { type: 'RELEASE_WRAITH', wraithId: v.wraiths.find(w => w.canRelease).id };
    if (v.permissions.canRepair && v.resources.obols >= 2) return { type: 'REPAIR' };
    const playable = v.hand.find(m => m.canPlay);
    if (playable) {
      const target = playable.takesTarget ? (v.shore.slice().sort((a, b) => b.anger - a.anger)[0] || {}).id || null : null;
      return { type: 'PLAY_MEMORY', memoryId: playable.id, targetSoulId: target };
    }
    if (atShore && opts.calm && v.permissions.canCalm && v.resources.obols >= 3) {
      const t = v.shore.filter(s => s.canCalm).sort((a, b) => b.anger - a.anger)[0];
      if (t) return { type: 'CALM', soulId: t.id };
    }
    if (atShore) {
      const pick = pickBoarding(v)[0];
      if (pick) return { type: 'BOARD', soulId: pick };
    }
    // choose a route: the cheapest legal, non-lethal option toward the most-wanted destination, else return
    const legal = v.routes.filter(r => r.legal && !r.lethal && (opts.rockyOK || r.variant === 'normal'));
    const stopsDone = v.visited.filter(n => n !== 'haven').length;
    if (!atShore && (stopsDone >= opts.maxStops || v.passengers.length === 0)) {
      const home = legal.find(r => r.to === 'shore');
      const haven = legal.find(r => r.to === 'haven' && v.resources.light <= 1 && stopsDone > 0);
      if (haven) return { type: 'DEPART', to: 'haven', variant: 'normal' };
      if (home) return { type: 'DEPART', to: 'shore', variant: 'normal' };
    }
    const wants = {};
    v.passengers.forEach(p => { wants[p.preferredDestinationId] = (wants[p.preferredDestinationId] || 0) + 1; });
    const dests = legal.filter(r => ['elysium', 'asphodel', 'tartarus'].includes(r.to))
      .sort((a, b) => (wants[b.to] || 0) - (wants[a.to] || 0) || a.fogDamage - b.fogDamage);
    if (dests.length) return { type: 'DEPART', to: dests[0].to, variant: dests[0].variant };
    const home = legal.find(r => r.to === 'shore');
    if (home) return { type: 'DEPART', to: 'shore', variant: 'normal' };
    const any = v.routes.find(r => r.legal);
    return any ? { type: 'DEPART', to: any.to, variant: any.variant } : null;
  };
}

// The "empty" baseline never boards anyone: it shows how fast pure neglect ends a run.
function idle(state) {
  const v = E.getView(state);
  if (v.phase === 'deliver') return { type: 'DELIVER', soulIds: [] };
  if (v.phase === 'event') return { type: 'RESOLVE_EVENT', eventId: v.pendingEvent.eventId, accept: false };
  const home = v.routes.find(r => r.to === 'shore' && r.legal && !r.lethal);
  if (home) return { type: 'DEPART', to: 'shore', variant: 'normal' };
  const d = v.routes.find(r => r.legal && !r.lethal && r.variant === 'normal');
  return d ? { type: 'DEPART', to: d.to, variant: 'normal' } : null;
}

const policies = {
  idle_never_boards: idle,
  courier_one_stop: courier({ maxStops: 1, calm: false, rockyOK: false }),
  courier_one_stop_calming: courier({ maxStops: 1, calm: true, rockyOK: false }),
  courier_two_stops_calming: courier({ maxStops: 2, calm: true, rockyOK: false }),
  courier_two_stops_rocky_ok: courier({ maxStops: 2, calm: true, rockyOK: true })
};

function play(policy, seed) {
  let s = E.createGame({ seed });
  let steps = 0;
  while (s.phase !== 'ended' && steps < STEP_CAP && s.completedCycles < CYCLE_CAP) {
    const a = policy(s);
    if (!a) return { stalled: true, state: s };
    const r = E.dispatch(s, a);
    if (!r.ok) return { rejected: { action: a, error: r.error }, state: s };
    s = r.state; steps++;
  }
  return { state: s, capped: s.phase !== 'ended' };
}

const out = { generatedBy: 'verification/engine/policy-experiments.cjs', node: process.version,
  caveat: 'Scripted policies are automated experiments, not human playtests and not balance evidence. v0.3 numbers are untested defaults.',
  seeds: SEEDS.length, cycleCap: CYCLE_CAP, stepCap: STEP_CAP, policies: {} };

Object.keys(policies).forEach(name => {
  const cycles = [], causes = { fog: 0, sinking: 0, dismissal: 0, capped: 0 };
  let delivered = 0, wraithsFormed = 0, wraithsReleased = 0, missedQuotas = 0, rejected = 0, stalled = 0;
  const failures = [];
  SEEDS.forEach(seed => {
    const r = play(policies[name], seed);
    if (r.rejected) { rejected++; failures.push({ seed, rejected: r.rejected }); }
    if (r.stalled) stalled++;
    const st = r.state;
    cycles.push(st.completedCycles);
    if (st.ended) causes[st.ended.cause]++; else causes.capped++;
    delivered += st.stats.delivered.length; wraithsFormed += st.stats.wraithsFormed;
    wraithsReleased += st.stats.wraithsReleased; missedQuotas += st.stats.missedQuotas;
  });
  cycles.sort((a, b) => a - b);
  out.policies[name] = { runs: SEEDS.length, completedCycles: { min: cycles[0], median: cycles[Math.floor(cycles.length / 2)], max: cycles[cycles.length - 1] },
    endings: causes, totalDelivered: delivered, wraithsFormed: wraithsFormed, wraithsReleased: wraithsReleased,
    missedQuotas: missedQuotas, rejectedActions: rejected, stalled: stalled, failures: failures.slice(0, 3) };
});

fs.writeFileSync(path.join(__dirname, 'policy-experiment-results.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.policies, null, 1));
