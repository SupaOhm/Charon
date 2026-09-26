'use strict';
// Test helpers. Scenarios are built as literal JSON states with hand-chosen numbers; expected values in the
// tests come from the v0.3 rules text, never from re-running an engine formula.
const assert = require('node:assert/strict');
const E = require('../../engine.js');

const TEMPLATE = /^C(\d+)-(S\d\d)$/;

// o: { seed, cycle, light, obols, hull, reprimands, shore:[id|[id,anger]], passengers:[...], wraiths:[soulId],
//      nodeId, phase, visited, snapshot, hand/draw/discard:[[memTemplate, sourceSoulId]], supplyIndex,
//      eventsTriggered, reconciled, calmUsed }
function build(o) {
  o = o || {};
  const s = E.createGame({ seed: o.seed === undefined ? 1 : o.seed });
  s.souls = {}; s.shore = []; s.passengers = []; s.log = []; s.seq = 0;
  const put = (list, x) => {
    const id = Array.isArray(x) ? x[0] : x;
    const anger = Array.isArray(x) ? x[1] : 0;
    const m = TEMPLATE.exec(id);
    s.souls[id] = { id, templateId: m[2], cohort: parseInt(m[1], 10), anger };
    list.push(id);
  };
  const aboard = (o.passengers || []).map(x => Array.isArray(x) ? x[0] : x);
  (o.shore || ['C01-S01', 'C01-S02', 'C01-S03', 'C01-S04', 'C01-S05'].filter(id => !aboard.includes(id))).forEach(x => put(s.shore, x));
  (o.passengers || []).forEach(x => put(s.passengers, x));
  s.cycle = o.cycle === undefined ? 1 : o.cycle;
  s.completedCycles = s.cycle - 1;
  if (o.light !== undefined) s.light = o.light;
  if (o.obols !== undefined) s.obols = o.obols;
  if (o.hull !== undefined) s.hull = o.hull;
  if (o.reprimands !== undefined) s.reprimands = o.reprimands;
  s.supplyIndex = o.supplyIndex === undefined ? 12 : o.supplyIndex;
  s.wraiths = (o.wraiths || []).map(id => ({ id: 'W-' + id, sourceSoulId: id, templateId: TEMPLATE.exec(id)[2] }));
  s.memories = {}; s.hand = []; s.draw = []; s.discard = [];
  ['hand', 'draw', 'discard'].forEach(pile => (o[pile] || []).forEach(([tid, src]) => {
    const id = 'M-' + src;
    s.memories[id] = { id, templateId: tid, sourceSoulId: src, sourceTemplateId: TEMPLATE.exec(src)[2], deliveredTo: 'elysium', cycle: 1 };
    s[pile].push(id);
  }));
  s.nodeId = o.nodeId || 'shore';
  s.visited = o.visited || (s.nodeId === 'shore' ? [] : [s.nodeId]);
  if (s.nodeId !== 'shore') { s.waitingSnapshot = (o.snapshot || s.shore).slice(); }
  if (o.marks) s.separationMarks = o.marks;
  if (o.protection) s.protection = o.protection;
  if (o.phase === 'deliver') { s.phase = 'deliver'; s.arrival = { nodeId: s.nodeId, aboard: s.passengers.slice(), delivered: [] }; }
  s.eventsTriggered = o.eventsTriggered || [];
  s.reconciledCohorts = o.reconciled || [];
  s.calmUsed = !!o.calmUsed;
  const chk = E.deserialize(E.serialize(s));
  assert.equal(chk.ok, true, 'test fixture must itself be a valid state: ' + (chk.error && chk.error.message));
  return s;
}

function act(state, action) {
  const r = E.dispatch(state, action);
  assert.equal(r.ok, true, 'expected ' + JSON.stringify(action) + ' to succeed: ' + JSON.stringify(r.error));
  return r.state;
}
function actAll(state, actions) { return actions.reduce(act, state); }
function actEmit(state, action) {
  const r = E.dispatch(state, action);
  assert.equal(r.ok, true, 'expected ' + JSON.stringify(action) + ' to succeed: ' + JSON.stringify(r.error));
  return r;
}
function reject(state, action, code) {
  const before = JSON.stringify(state);
  const r = E.dispatch(state, action);
  assert.equal(r.ok, false, JSON.stringify(action) + ' should be rejected');
  assert.equal(r.state, state, 'rejected action must return the same state object');
  assert.equal(JSON.stringify(state), before, 'rejected action must not change state');
  assert.deepEqual(r.emitted, []);
  assert.ok(r.error && typeof r.error.message === 'string' && r.error.message.length > 0);
  if (code) assert.equal(r.error.code, code);
  return r.error;
}
const view = s => E.getView(s);
function route(s, to, variant) {
  const r = view(s).routes.find(x => x.to === to && x.variant === (variant || 'normal'));
  assert.ok(r, 'route ' + to + '/' + (variant || 'normal') + ' should be listed');
  return r;
}
const soulView = (s, id) => view(s).shore.concat(view(s).passengers).find(x => x.id === id);
const types = emitted => emitted.map(e => e.type);

// Complete one crossing loop: depart to a destination, deliver a selection, return to the shore.
function loop(s, to, deliver) {
  return actAll(s, [{ type: 'DEPART', to: to || 'elysium', variant: 'normal' },
                    { type: 'DELIVER', soulIds: deliver || [] },
                    { type: 'DEPART', to: 'shore', variant: 'normal' }]);
}

module.exports = { E, build, act, actAll, actEmit, reject, view, route, soulView, types, loop, assert };
