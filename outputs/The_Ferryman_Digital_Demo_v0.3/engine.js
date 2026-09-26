/*
 * The Ferryman v0.3 rules engine. Owner: Worker C.
 * Behavior source: outputs/The_Ferryman_v0.3_Decided_Rules.md. Interface: v0.3_handoffs/SHARED_CONTRACT.md (v1).
 * Pure and deterministic: no DOM, storage, network or clock. The only randomness is a serialized seeded PRNG
 * used to reshuffle the memory discard pile. Requires rules-data.js to load first in the browser.
 * Exposes globalThis.CharonEngine (browser) or module.exports (Node). See docs/ENGINE_API.md.
 */
(function (root, factory) {
  'use strict';
  var isNode = typeof module === 'object' && module && module.exports && typeof require === 'function';
  var rules = isNode ? require('./rules-data.js') : root.CharonRules;
  if (!rules) throw new Error('CharonEngine: rules-data.js must be loaded before engine.js');
  var api = factory(rules);
  if (isNode) module.exports = api;
  else root.CharonEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (RULES) {
  'use strict';

  var C = RULES.constants;
  var SCHEMA_VERSION = RULES.schemaVersion;
  var PHASES = ['prepare', 'deliver', 'event', 'ended'];
  var CAUSES = ['fog', 'sinking', 'dismissal'];
  var ID_RE = /^C(\d{2,})-S(0[1-9]|1[0-2])$/;

  // ---------------------------------------------------------------- utilities

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function has(arr, x) { return arr.indexOf(x) >= 0; }
  function removeFrom(arr, x) { var i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); }
  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function isInt(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }
  function err(code, message) { return { code: code, message: message }; }

  function makeSoulId(cohort, templateId) { return 'C' + pad2(cohort) + '-' + templateId; }
  function parseSoulId(id) {
    var m = typeof id === 'string' ? ID_RE.exec(id) : null;
    return m ? { cohort: parseInt(m[1], 10), templateId: 'S' + m[2] } : null;
  }
  function tmplOf(id) { return RULES.souls[parseSoulId(id).templateId]; }
  function seatsOf(id) { return tmplOf(id).seats; }
  function linkedPartnerId(id) {
    var p = parseSoulId(id), t = RULES.souls[p.templateId];
    return t.partner ? makeSoulId(p.cohort, t.partner) : null;
  }
  function conflictPartnerId(id) {
    var p = parseSoulId(id), t = RULES.souls[p.templateId];
    return t.conflict ? makeSoulId(p.cohort, t.conflict) : null;
  }
  function soulOrderKey(id) { var p = parseSoulId(id); return p.cohort * 100 + parseInt(p.templateId.slice(1), 10); }

  // Seeded PRNG (mulberry32); state is one uint32 stored in the game state.
  function nextRand(S) {
    S.rng = (S.rng + 0x6D2B79F5) >>> 0;
    var t = S.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(S, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(nextRand(S) * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Structured log. `sink` collects entries emitted by the current call.
  var sink = null;
  function emit(S, type, data) {
    var e = { seq: ++S.seq, type: type, cycle: S.cycle, nodeId: S.nodeId };
    if (data) Object.keys(data).forEach(function (k) { e[k] = data[k]; });
    S.log.push(e);
    if (sink) sink.push(e);
    return e;
  }

  // ------------------------------------------------------------------ state

  function createGame(options) {
    options = options === undefined ? {} : options;
    if (!isObj(options)) throw new TypeError('createGame: options must be an object');
    var seed = options.seed === undefined ? 1 : options.seed;
    if (!isInt(seed) || seed < 0 || seed > 4294967295) throw new RangeError('createGame: seed must be an integer 0..4294967295');
    var S = {
      schemaVersion: SCHEMA_VERSION, rulesVersion: RULES.rulesVersion, seed: seed, rng: seed >>> 0,
      phase: 'prepare', nodeId: 'shore', cycle: 1, completedCycles: 0,
      light: C.startLight, obols: C.startObols, hull: C.hullStart, reprimands: 0,
      supplyIndex: 0, souls: {}, shore: [], passengers: [], wraiths: [],
      memories: {}, hand: [], draw: [], discard: [],
      visited: [], calmUsed: false, memoryPlayed: false, playedMemory: null,
      protection: {}, waitingSnapshot: [], separationMarks: [],
      reconciledCohorts: [], eventsTriggered: [], eventQueue: [], arrival: null,
      stats: { crossings: 0, delivered: [], memoriesEarned: 0, wraithsFormed: 0, wraithsReleased: 0,
               missedQuotas: 0, quotasPaid: 0, brokenPromises: 0 },
      log: [], actionLog: [], seq: 0, ended: null
    };
    var local = [];
    var prev = sink; sink = local;
    try {
      emit(S, 'SETUP', { seed: seed, rulesVersion: RULES.rulesVersion });
      refill(S);
      drawMemories(S);
    } finally { sink = prev; }
    return S;
  }

  function nextSoul(S) {
    var i = S.supplyIndex++;
    var cohort = Math.floor(i / C.cohortSize) + 1;
    var tid = RULES.supplyOrder[i % C.cohortSize];
    var id = makeSoulId(cohort, tid);
    S.souls[id] = { id: id, templateId: tid, cohort: cohort, anger: 0 };
    return id;
  }

  function refill(S) {
    var added = [];
    while (S.shore.length < C.shoreTarget) { var id = nextSoul(S); S.shore.push(id); added.push(id); }
    if (added.length) emit(S, 'SHORE_REFILLED', { soulIds: added });
  }

  function drawMemories(S) {
    var drawn = [], reshuffled = false;
    while (S.hand.length < C.handSize) {
      if (S.draw.length === 0) {
        if (S.discard.length === 0) break;
        S.draw = shuffle(S, S.discard); S.discard = []; reshuffled = true;
      }
      var m = S.draw.shift(); S.hand.push(m); drawn.push(m);
    }
    emit(S, 'MEMORIES_DRAWN', { memoryIds: drawn, reshuffled: reshuffled, handSize: S.hand.length });
  }

  function gainLight(S, amount) {
    var before = S.light;
    S.light = Math.min(C.lightMax, S.light + amount);
    return { gained: S.light - before, lost: amount - (S.light - before) };
  }

  // ----------------------------------------------------------- fog / routes

  function favorableDestination(S) {
    return S.cycle >= C.favorableFromCycle
      ? RULES.favorableRotation[(S.cycle - C.favorableFromCycle) % RULES.favorableRotation.length] : null;
  }

  function seatsUsed(S) { return S.passengers.reduce(function (n, id) { return n + seatsOf(id); }, 0); }

  function conflictPairsAboard(S) {
    var out = [];
    S.passengers.forEach(function (id) {
      var p = parseSoulId(id);
      if (p.templateId === 'S04' && has(S.passengers, makeSoulId(p.cohort, 'S06'))) out.push(p.cohort);
    });
    return out;
  }

  function edgeBreakdown(S, to, variant) {
    var isReturn = to === 'shore';
    var rocky = variant === 'rocky';
    var raw = RULES.baseFog[to];
    var baseFog = rocky ? Math.max(0, raw - C.rockyBaseReduction) : raw;
    var favorable = favorableDestination(S);
    var cycleModifier = (!isReturn && S.cycle >= C.fogEscalationFromCycle && to !== favorable) ? C.fogEscalationAmount : 0;
    var accord = !!(S.playedMemory && RULES.memories[S.playedMemory.templateId].cancelsSoldierConflict);
    var conflictPressure = accord ? 0 : conflictPairsAboard(S).filter(function (c) { return !has(S.reconciledCohorts, c); }).length;
    var passengerProtection = 0;
    S.passengers.forEach(function (id) {
      var prot = tmplOf(id).aboardProtection;
      if (!prot) return;
      if (prot.kind === 'poet' && S.passengers.length - 1 >= prot.minOthers) passengerProtection += prot.amount;
      if (prot.kind === 'keeper' && S.passengers.length === 1) passengerProtection += prot.amount;
    });
    var memoryProtection = 0;
    if (S.playedMemory) {
      var mt = RULES.memories[S.playedMemory.templateId];
      memoryProtection = mt.protection;
      if (mt.protectionIfTwoSeatAboard && S.passengers.some(function (id) { return seatsOf(id) === 2; })) {
        memoryProtection = mt.protectionIfTwoSeatAboard;
      }
    }
    var wraithPressure = S.wraiths.length;
    var rawFog = baseFog + cycleModifier + wraithPressure + conflictPressure - passengerProtection - memoryProtection;
    return {
      baseFog: baseFog, cycleModifier: cycleModifier, wraithPressure: wraithPressure, conflictPressure: conflictPressure,
      passengerProtection: passengerProtection, memoryProtection: memoryProtection, rawFog: rawFog,
      fogDamage: Math.max(0, rawFog), hullDamage: rocky ? C.rockyHullDamage : 0,
      favorableApplied: !isReturn && S.cycle >= C.favorableFromCycle && to === favorable
    };
  }

  function routePreview(S, to, variant) {
    var b = edgeBreakdown(S, to, variant);
    var eDep = errDepart(S, to, variant);
    var fogLethal = b.fogDamage > S.light;
    var hullAfter = fogLethal ? null : S.hull - b.hullDamage;
    var lethal = fogLethal || hullAfter <= 0;
    return {
      to: to, variant: variant, isReturn: to === 'shore',
      fogDamage: b.fogDamage, hullDamage: b.hullDamage,
      lightAfter: fogLethal ? null : S.light - b.fogDamage, hullAfter: hullAfter,
      lethal: lethal, failureCause: fogLethal ? 'fog' : (lethal ? 'sinking' : null),
      legal: eDep === null, disabledReason: eDep ? eDep.message : null,
      breakdown: {
        baseFog: b.baseFog, cycleModifier: b.cycleModifier, wraithPressure: b.wraithPressure,
        conflictPressure: b.conflictPressure, passengerProtection: b.passengerProtection,
        memoryProtection: b.memoryProtection, rawFog: b.rawFog, favorableApplied: b.favorableApplied
      }
    };
  }

  // ------------------------------------------------------------ validators
  // Each returns null when legal or {code,message}. Shared by dispatch and getView so the UI cannot disagree.

  function errPhase(S, phase) {
    if (S.phase === 'ended') return err('RUN_ENDED', 'The run has ended.');
    if (S.phase !== phase) return err('WRONG_PHASE', 'This action is not available during the ' + S.phase + ' phase.');
    return null;
  }
  function errShore(S) {
    return S.nodeId === 'shore' ? null : err('WRONG_LOCATION', 'This action is only available at the starting shore.');
  }

  function errBoard(S, soulId) {
    var e = errPhase(S, 'prepare') || errShore(S);
    if (e) return e;
    if (typeof soulId !== 'string') return err('INVALID_INPUT', 'soulId must be a string.');
    if (has(S.passengers, soulId)) return err('ALREADY_ABOARD', 'That soul is already aboard.');
    if (!has(S.shore, soulId)) return err('NOT_FOUND', 'That soul is not waiting on the shore.');
    if (seatsUsed(S) + seatsOf(soulId) > C.seats) return err('CAPACITY', 'Not enough free seats.');
    return null;
  }
  function errUnboard(S, soulId) {
    var e = errPhase(S, 'prepare') || errShore(S);
    if (e) return e;
    if (typeof soulId !== 'string') return err('INVALID_INPUT', 'soulId must be a string.');
    if (!has(S.passengers, soulId)) return err('NOT_FOUND', 'That soul is not aboard.');
    return null;
  }
  function errCalm(S, soulId) {
    var e = errPhase(S, 'prepare') || errShore(S);
    if (e) return e;
    if (S.calmUsed) return err('LIMIT_REACHED', 'Calming has already been used this cycle.');
    if (S.obols < C.calmCost) return err('INSUFFICIENT_OBOLS', 'Calming costs ' + C.calmCost + ' obol.');
    if (typeof soulId !== 'string') return err('INVALID_INPUT', 'soulId must be a string.');
    if (!has(S.shore, soulId)) return err('NOT_FOUND', 'Only waiting souls on the shore can be calmed.');
    if (S.protection[soulId]) return err('ALREADY_PROTECTED', 'That soul is already protected from normal anger.');
    return null;
  }
  function errRelease(S, wraithId) {
    var e = errPhase(S, 'prepare');
    if (e) return e;
    if (typeof wraithId !== 'string') return err('INVALID_INPUT', 'wraithId must be a string.');
    if (!S.wraiths.some(function (w) { return w.id === wraithId; })) return err('NOT_FOUND', 'No such wraith.');
    if (S.light < C.releaseLightCost) return err('INSUFFICIENT_LIGHT', 'Releasing a wraith costs ' + C.releaseLightCost + ' light.');
    return null;
  }
  function errRepair(S) {
    var e = errPhase(S, 'prepare');
    if (e) return e;
    if (S.nodeId !== 'shore' && S.nodeId !== 'haven') return err('WRONG_LOCATION', 'Repairs are only available at the haven or the starting shore.');
    if (S.hull >= C.hullMax) return err('HULL_FULL', 'The hull is already at full integrity.');
    if (S.obols < C.repairCost) return err('INSUFFICIENT_OBOLS', 'Repair costs ' + C.repairCost + ' obol.');
    return null;
  }
  function errPlay(S, memoryId, targetSoulId) {
    var e = errPhase(S, 'prepare');
    if (e) return e;
    if (typeof memoryId !== 'string') return err('INVALID_INPUT', 'memoryId must be a string.');
    if (!has(S.hand, memoryId)) return err('NOT_FOUND', 'That memory is not in your hand.');
    if (S.memoryPlayed) return err('LIMIT_REACHED', 'A memory has already been played before this crossing.');
    if (targetSoulId !== null && targetSoulId !== undefined) {
      if (typeof targetSoulId !== 'string') return err('INVALID_INPUT', 'targetSoulId must be a string or null.');
      if (!RULES.memories[S.memories[memoryId].templateId].marksWaiting) return err('INVALID_TARGET', 'That memory does not take a target.');
      if (!has(S.shore, targetSoulId)) return err('INVALID_TARGET', 'The target must be a soul waiting on the shore.');
    }
    return null;
  }
  function errDepart(S, to, variant) {
    var e = errPhase(S, 'prepare');
    if (e) return e;
    if (typeof to !== 'string' || !has(RULES.nodes, to)) return err('INVALID_INPUT', 'Unknown destination.');
    if (variant === undefined) variant = 'normal';
    if (variant !== 'normal' && variant !== 'rocky') return err('INVALID_INPUT', 'variant must be "normal" or "rocky".');
    if (!has(RULES.edges[S.nodeId], to)) return err('ILLEGAL_ROUTE', 'There is no route from ' + S.nodeId + ' to ' + to + '.');
    if (to !== 'shore' && has(S.visited, to)) return err('ILLEGAL_ROUTE', 'That stop was already visited this cycle.');
    if (variant === 'rocky') {
      if (to === 'shore') return err('ILLEGAL_ROUTE', 'Return edges are never rocky.');
      if (S.cycle < C.rockyFromCycle) return err('ILLEGAL_ROUTE', 'Rocky routes unlock in cycle ' + C.rockyFromCycle + '.');
    }
    return null;
  }
  function errDeliver(S, soulIds) {
    var e = errPhase(S, 'deliver');
    if (e) return e;
    if (!Array.isArray(soulIds) || !soulIds.every(function (x) { return typeof x === 'string'; })) return err('INVALID_INPUT', 'soulIds must be an array of strings.');
    var seen = {};
    for (var i = 0; i < soulIds.length; i++) {
      if (seen[soulIds[i]]) return err('INVALID_INPUT', 'Duplicate soul in delivery selection.');
      seen[soulIds[i]] = true;
      if (!has(S.passengers, soulIds[i])) return err('NOT_FOUND', 'Soul ' + soulIds[i] + ' is not aboard.');
    }
    return null;
  }
  function pendingEventInfo(S) {
    if (S.phase !== 'event' || !S.eventQueue.length) return null;
    var q = S.eventQueue[0], ev = RULES.events[q.id], eff = ev.effect;
    var canAccept = true, reason = null;
    if (eff.kind === 'payObolReduceReprimand') {
      if (S.reprimands <= 0) { canAccept = false; reason = 'There are no reprimands to reduce.'; }
      else if (S.obols < eff.cost) { canAccept = false; reason = 'Requires ' + eff.cost + ' obol.'; }
    } else if (eff.kind === 'payObolReconcilePair') {
      if (S.obols < eff.cost) { canAccept = false; reason = 'Requires ' + eff.cost + ' obol.'; }
    }
    return { eventId: q.id, canAccept: canAccept, acceptDisabledReason: reason, canDecline: true };
  }
  function errEvent(S, eventId, accept) {
    var e = errPhase(S, 'event');
    if (e) return e;
    var p = pendingEventInfo(S);
    if (!p) return err('WRONG_PHASE', 'No event is pending.');
    if (typeof eventId !== 'string') return err('INVALID_INPUT', 'eventId must be a string.');
    if (eventId !== p.eventId) return err('NOT_FOUND', 'That event is not the pending event.');
    if (typeof accept !== 'boolean') return err('INVALID_INPUT', 'accept must be true or false.');
    if (accept && !p.canAccept) return err('EVENT_UNAFFORDABLE', p.acceptDisabledReason);
    return null;
  }

  function validateAction(S, a) {
    if (!isObj(a) || typeof a.type !== 'string') return err('INVALID_ACTION', 'Action must be an object with a string type.');
    var known = ['BOARD', 'UNBOARD', 'CALM', 'RELEASE_WRAITH', 'REPAIR', 'PLAY_MEMORY', 'DEPART', 'DELIVER', 'RESOLVE_EVENT'];
    if (!has(known, a.type)) return err('UNKNOWN_ACTION', 'Unknown action type "' + a.type + '".');
    if (S.phase === 'ended') return err('RUN_ENDED', 'The run has ended.');
    switch (a.type) {
      case 'BOARD': return errBoard(S, a.soulId);
      case 'UNBOARD': return errUnboard(S, a.soulId);
      case 'CALM': return errCalm(S, a.soulId);
      case 'RELEASE_WRAITH': return errRelease(S, a.wraithId);
      case 'REPAIR': return errRepair(S);
      case 'PLAY_MEMORY': return errPlay(S, a.memoryId, a.targetSoulId);
      case 'DEPART': return errDepart(S, a.to, a.variant);
      case 'DELIVER': return errDeliver(S, a.soulIds);
      case 'RESOLVE_EVENT': return errEvent(S, a.eventId, a.accept);
    }
    return null;
  }

  // ---------------------------------------------------------------- delivery

  // Pure computation of what delivering `ids` would grant. Applies light cap sequentially, in aboard order.
  function computeDelivery(S, ids) {
    var chosen = S.passengers.filter(function (id) { return has(ids, id); });
    var node = S.nodeId, light = S.light;
    var records = chosen.map(function (id) {
      var p = parseSoulId(id), t = RULES.souls[p.templateId];
      var wish = t.preferred === node;
      var gained = 0, lost = 0, obols = 0;
      if (t.reward.kind === 'flame') {
        var r = t.reward.amount; var g = Math.min(C.lightMax - light, r); gained += g; lost += r - g; light += g;
      } else obols += t.reward.amount;
      if (wish) {
        var w = C.wishBonusLight; var g2 = Math.min(C.lightMax - light, w); gained += g2; lost += w - g2; light += g2;
      }
      var memTid = t.memory;
      var together = false;
      if (memTid === 'faint-joined') {
        var partner = linkedPartnerId(id);
        together = has(chosen, partner);
        memTid = together ? RULES.jointMemory.together : RULES.jointMemory.alone;
      }
      return {
        soulId: id, templateId: p.templateId, cohort: p.cohort, destinationId: node,
        reward: { kind: t.reward.kind, amount: t.reward.amount },
        wishMatched: wish, wishBonus: wish ? C.wishBonusLight : 0,
        obolsGained: obols, lightGained: gained, lightLost: lost,
        memoryId: 'M-' + id, memoryTemplateId: memTid, jointDelivery: together
      };
    });
    return records;
  }

  function doDeliver(S, ids) {
    var records = computeDelivery(S, ids);
    S.arrival.delivered = records.map(function (r) { return r.soulId; });
    var newMemories = [];
    records.forEach(function (r) {
      S.obols += r.obolsGained;
      gainLight(S, r.lightGained + r.lightLost);
      removeFrom(S.passengers, r.soulId);
      delete S.souls[r.soulId]; delete S.protection[r.soulId];
      S.memories[r.memoryId] = { id: r.memoryId, templateId: r.memoryTemplateId, sourceSoulId: r.soulId,
        sourceTemplateId: r.templateId, deliveredTo: r.destinationId, cycle: S.cycle };
      newMemories.push(r.memoryId);
      S.stats.memoriesEarned++;
      S.stats.delivered.push({ soulId: r.soulId, templateId: r.templateId, destinationId: r.destinationId,
        cycle: S.cycle, wishMatched: r.wishMatched });
      emit(S, 'SOUL_DELIVERED', r);
    });
    newMemories.sort(function (a, b) { return soulOrderKey(S.memories[a].sourceSoulId) - soulOrderKey(S.memories[b].sourceSoulId); });
    newMemories.forEach(function (m) { S.draw.push(m); });
    emit(S, 'DELIVERY_CONFIRMED', { soulIds: S.arrival.delivered.slice(), count: records.length });
  }

  // ------------------------------------------------------------------ events

  function eligibleEvents(S) {
    var a = S.arrival, out = [];
    RULES.eventOrder.forEach(function (id) {
      var ev = RULES.events[id], pr = ev.predicate;
      if (has(S.eventsTriggered, id) || ev.node !== a.nodeId) return;
      var ctx = { id: id, cohort: null }, ok = false;
      if (pr.kind === 'linkedPairDeliveredTogether') {
        ok = a.delivered.some(function (sid) { var p = linkedPartnerId(sid); return p && has(a.delivered, p); });
      } else if (pr.kind === 'templateInArrivalSnapshot') {
        ok = a.aboard.some(function (sid) { return parseSoulId(sid).templateId === pr.templateId; });
      } else if (pr.kind === 'soldierPairInArrivalSnapshot') {
        var cohorts = a.aboard.filter(function (sid) {
          var p = parseSoulId(sid);
          return p.templateId === 'S04' && has(a.aboard, makeSoulId(p.cohort, 'S06'));
        }).map(function (sid) { return parseSoulId(sid).cohort; });
        if (cohorts.length) { ok = true; ctx.cohort = cohorts[0]; }
      } else if (pr.kind === 'hullBelow') {
        ok = S.hull < pr.value;
      }
      if (ok) out.push(ctx);
    });
    return out;
  }

  function finishStop(S) {
    S.arrival = null; S.eventQueue = [];
    drawMemories(S);
    S.phase = 'prepare';
  }

  // Resolve queued events in order; pause at the first choice event.
  function advanceEvents(S) {
    while (S.eventQueue.length) {
      var q = S.eventQueue[0], ev = RULES.events[q.id];
      if (!has(S.eventsTriggered, q.id)) {
        S.eventsTriggered.push(q.id);
        emit(S, 'EVENT_TRIGGERED', { eventId: q.id, choice: ev.choice, predicate: ev.predicate });
      }
      if (ev.choice) { S.phase = 'event'; return; }
      var eff = ev.effect, res = {};
      if (eff.kind === 'gainLight') res = gainLight(S, eff.amount);
      else if (eff.kind === 'gainHull') { var h = S.hull; S.hull = Math.min(C.hullMax, S.hull + eff.amount); res = { gained: S.hull - h }; }
      emit(S, 'EVENT_RESOLVED', { eventId: q.id, automatic: true, accepted: true, effect: eff.kind, result: res });
      S.eventQueue.shift();
    }
    finishStop(S);
  }

  function beginEvents(S) {
    S.eventQueue = eligibleEvents(S);
    advanceEvents(S);
  }

  function doResolveEvent(S, eventId, accept) {
    var q = S.eventQueue[0], ev = RULES.events[q.id], eff = ev.effect, res = {};
    if (accept) {
      if (eff.kind === 'payObolReduceReprimand') {
        S.obols -= eff.cost; S.reprimands = Math.max(0, S.reprimands - eff.amount);
        res = { obolsSpent: eff.cost, reprimands: S.reprimands };
      } else if (eff.kind === 'payObolReconcilePair') {
        S.obols -= eff.cost;
        if (!has(S.reconciledCohorts, q.cohort)) S.reconciledCohorts.push(q.cohort);
        res = { obolsSpent: eff.cost, reconciledCohort: q.cohort };
      }
    }
    emit(S, 'EVENT_RESOLVED', { eventId: q.id, automatic: false, accepted: accept, effect: eff.kind, result: res });
    S.eventQueue.shift();
    S.phase = 'prepare';
    advanceEvents(S);
  }

  // ------------------------------------------------------- crossing / arrival

  function endRun(S, cause, detail) {
    S.phase = 'ended'; S.arrival = null; S.eventQueue = [];
    var byDest = {};
    RULES.destinations.forEach(function (d) { byDest[d] = 0; });
    S.stats.delivered.forEach(function (r) { byDest[r.destinationId] = (byDest[r.destinationId] || 0) + 1; });
    S.ended = {
      cause: cause,
      summary: {
        cause: cause, detail: detail || {},
        completedCycles: S.completedCycles, cycleReached: S.cycle, crossings: S.stats.crossings,
        delivered: { total: S.stats.delivered.length, byDestination: byDest,
                     wishMatches: S.stats.delivered.filter(function (r) { return r.wishMatched; }).length,
                     souls: clone(S.stats.delivered) },
        memoriesEarned: S.stats.memoriesEarned,
        wraithsFormed: S.stats.wraithsFormed, wraithsReleased: S.stats.wraithsReleased,
        wraithsActive: S.wraiths.length,
        missedQuotas: S.stats.missedQuotas, quotasPaid: S.stats.quotasPaid, brokenPromises: S.stats.brokenPromises,
        final: { light: S.light, obols: S.obols, hull: S.hull, reprimands: S.reprimands }
      }
    };
    emit(S, 'RUN_ENDED', { cause: cause, detail: detail || {} });
  }

  function doDepart(S, to, variant) {
    variant = variant || 'normal';
    var from = S.nodeId;
    var b = edgeBreakdown(S, to, variant);
    if (from === 'shore') {
      S.waitingSnapshot = S.shore.slice();
      S.separationMarks = separationTargets(S);
    }
    emit(S, 'DEPART', { from: from, to: to, variant: variant, fogDamage: b.fogDamage, hullDamage: b.hullDamage,
      breakdown: { baseFog: b.baseFog, cycleModifier: b.cycleModifier, wraithPressure: b.wraithPressure,
        conflictPressure: b.conflictPressure, passengerProtection: b.passengerProtection, memoryProtection: b.memoryProtection },
      passengers: S.passengers.slice(), separationMarks: S.separationMarks.slice() });
    if (b.fogDamage > S.light) {
      emit(S, 'CROSSING_FAILED', { cause: 'fog', fogDamage: b.fogDamage, light: S.light });
      endRun(S, 'fog', { from: from, to: to, variant: variant, fogDamage: b.fogDamage, light: S.light,
        breakdown: { baseFog: b.baseFog, cycleModifier: b.cycleModifier, wraithPressure: b.wraithPressure,
          conflictPressure: b.conflictPressure, passengerProtection: b.passengerProtection, memoryProtection: b.memoryProtection } });
      return;
    }
    S.light -= b.fogDamage;
    if (b.hullDamage) {
      S.hull -= b.hullDamage;
      if (S.hull <= 0) {
        S.hull = 0;
        emit(S, 'CROSSING_FAILED', { cause: 'sinking', hullDamage: b.hullDamage });
        endRun(S, 'sinking', { from: from, to: to, variant: variant, fogDamage: b.fogDamage, hullDamage: b.hullDamage });
        return;
      }
    }
    S.stats.crossings++;
    S.memoryPlayed = false; S.playedMemory = null;
    emit(S, 'CROSSING_COMPLETED', { from: from, to: to, variant: variant, fogPaid: b.fogDamage, hullLost: b.hullDamage,
      light: S.light, hull: S.hull });
    if (to === 'shore') returnToShore(S); else arrive(S, to);
  }

  // Waiting linked partners of souls aboard, from the current shore (Section 4).
  function separationTargets(S) {
    var out = [];
    S.passengers.forEach(function (id) {
      var p = linkedPartnerId(id);
      if (p && has(S.shore, p) && !has(out, p)) out.push(p);
    });
    return out;
  }

  function arrive(S, to) {
    S.nodeId = to;
    S.visited.push(to);
    S.arrival = { nodeId: to, aboard: S.passengers.slice(), delivered: [] };
    emit(S, 'ARRIVED', { passengers: S.passengers.slice() });
    if (to === 'haven') {
      var r = gainLight(S, C.havenLight);
      emit(S, 'HAVEN_RECOVERY', { lightGained: r.gained, lightLost: r.lost });
      beginEvents(S);
    } else {
      S.phase = 'deliver';
    }
  }

  function returnToShore(S) {
    S.nodeId = 'shore'; S.arrival = null;
    S.completedCycles++;
    emit(S, 'RETURNED', { completedCycles: S.completedCycles });

    // Anger for the departure waiting snapshot, then transformations.
    var angerLog = [], formed = [];
    S.waitingSnapshot.forEach(function (id) {
      var s = S.souls[id];
      if (!s || !has(S.shore, id)) return;
      var normal = S.protection[id] ? 0 : 1;
      var sep = has(S.separationMarks, id) ? 1 : 0;
      s.anger += normal + sep;
      angerLog.push({ soulId: id, normal: normal, separation: sep, protectedBy: S.protection[id] || null, anger: s.anger });
    });
    S.waitingSnapshot.forEach(function (id) {
      var s = S.souls[id];
      if (!s || !has(S.shore, id) || s.anger < C.angerLimit) return;
      removeFrom(S.shore, id); delete S.souls[id]; delete S.protection[id];
      S.wraiths.push({ id: 'W-' + id, sourceSoulId: id, templateId: parseSoulId(id).templateId });
      S.reprimands++; S.stats.wraithsFormed++;
      formed.push(id);
    });
    emit(S, 'ANGER_RESOLVED', { souls: angerLog, wraithsFormed: formed, reprimands: S.reprimands });

    // Broken promises: undelivered passengers return to the shore keeping anger.
    var broken = S.passengers.slice();
    broken.forEach(function (id) { S.shore.push(id); S.reprimands++; S.stats.brokenPromises++; });
    S.passengers = [];
    if (broken.length) emit(S, 'PROMISES_BROKEN', { soulIds: broken, reprimands: S.reprimands });

    if (S.reprimands >= C.reprimandsMax) { endRun(S, 'dismissal', { step: 'return', reprimands: S.reprimands }); return; }

    if (S.completedCycles % C.quotaEveryCycles === 0) {
      if (S.obols >= C.quotaAmount) {
        S.obols -= C.quotaAmount; S.stats.quotasPaid++;
        emit(S, 'QUOTA_PAID', { amount: C.quotaAmount, obols: S.obols });
      } else {
        S.reprimands++; S.stats.missedQuotas++;
        emit(S, 'QUOTA_MISSED', { amount: C.quotaAmount, obols: S.obols, reprimands: S.reprimands });
      }
      if (S.reprimands >= C.reprimandsMax) { endRun(S, 'dismissal', { step: 'quota', reprimands: S.reprimands }); return; }
    }

    S.protection = {}; S.separationMarks = []; S.waitingSnapshot = []; S.calmUsed = false; S.visited = [];
    var rec = gainLight(S, C.cycleEndLight);
    S.cycle++;
    emit(S, 'CYCLE_COMPLETED', { completedCycles: S.completedCycles, lightGained: rec.gained, lightLost: rec.lost, nextCycle: S.cycle });
    refill(S);
    drawMemories(S);
    S.phase = 'prepare';
  }

  // ---------------------------------------------------------------- dispatch

  function applyAction(S, a) {
    switch (a.type) {
      case 'BOARD':
        S.passengers.push(a.soulId); removeFrom(S.shore, a.soulId);
        emit(S, 'BOARDED', { soulId: a.soulId }); break;
      case 'UNBOARD':
        removeFrom(S.passengers, a.soulId); S.shore.push(a.soulId);
        emit(S, 'UNBOARDED', { soulId: a.soulId }); break;
      case 'CALM':
        S.obols -= C.calmCost; S.calmUsed = true; S.protection[a.soulId] = 'calm';
        emit(S, 'CALMED', { soulId: a.soulId, obolsSpent: C.calmCost }); break;
      case 'RELEASE_WRAITH': {
        var w = S.wraiths.filter(function (x) { return x.id === a.wraithId; })[0];
        S.wraiths = S.wraiths.filter(function (x) { return x.id !== a.wraithId; });
        S.light -= C.releaseLightCost;
        var had = S.reprimands; S.reprimands = Math.max(0, S.reprimands - 1);
        S.stats.wraithsReleased++;
        emit(S, 'WRAITH_RELEASED', { wraithId: w.id, sourceSoulId: w.sourceSoulId, lightSpent: C.releaseLightCost,
          reprimandsReduced: had - S.reprimands, light: S.light, reprimands: S.reprimands });
        break;
      }
      case 'REPAIR':
        S.obols -= C.repairCost; S.hull = Math.min(C.hullMax, S.hull + C.repairHull);
        emit(S, 'REPAIRED', { obolsSpent: C.repairCost, hull: S.hull }); break;
      case 'PLAY_MEMORY': {
        var mem = S.memories[a.memoryId];
        removeFrom(S.hand, a.memoryId); S.discard.push(a.memoryId);
        S.memoryPlayed = true;
        var target = a.targetSoulId === undefined ? null : a.targetSoulId;
        S.playedMemory = { memoryId: a.memoryId, templateId: mem.templateId, sourceSoulId: mem.sourceSoulId, targetSoulId: target };
        var marked = false;
        if (target && !S.protection[target]) { S.protection[target] = 'memory'; marked = true; }
        emit(S, 'MEMORY_PLAYED', { memoryId: a.memoryId, templateId: mem.templateId, sourceSoulId: mem.sourceSoulId,
          targetSoulId: target, marked: marked }); break;
      }
      case 'DEPART': doDepart(S, a.to, a.variant); break;
      case 'DELIVER':
        doDeliver(S, a.soulIds); beginEvents(S); break;
      case 'RESOLVE_EVENT': doResolveEvent(S, a.eventId, a.accept); break;
    }
  }

  function canonicalAction(a) {
    var out = { type: a.type };
    ['soulId', 'wraithId', 'memoryId', 'targetSoulId', 'to', 'variant', 'eventId', 'accept'].forEach(function (k) {
      if (a[k] !== undefined) out[k] = a[k];
    });
    if (Array.isArray(a.soulIds)) out.soulIds = a.soulIds.slice();
    return out;
  }

  function dispatch(state, action) {
    var prev = sink;
    try {
      if (!isObj(state) || typeof state.phase !== 'string') return { ok: false, state: state, error: err('INVALID_STATE', 'State is not a valid game state.'), emitted: [] };
      var e = validateAction(state, action);
      if (e) return { ok: false, state: state, error: e, emitted: [] };
      var S = clone(state), emitted = [];
      sink = emitted;
      applyAction(S, action);
      S.actionLog.push(canonicalAction(action));
      return { ok: true, state: S, error: null, emitted: emitted };
    } catch (ex) {
      return { ok: false, state: state, error: err('INTERNAL', String(ex && ex.message || ex)), emitted: [] };
    } finally { sink = prev; }
  }

  // -------------------------------------------------------------------- view

  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  function soulView(S, id, aboard) {
    var p = parseSoulId(id), t = RULES.souls[p.templateId], s = S.souls[id];
    var eB = aboard ? err('ALREADY_ABOARD', 'Already aboard.') : errBoard(S, id);
    var eU = aboard ? errUnboard(S, id) : err('NOT_FOUND', 'Not aboard.');
    var eC = aboard ? err('NOT_FOUND', 'Only waiting souls can be calmed.') : errCalm(S, id);
    var reasons = aboard ? (eU ? [eU.message] : []) : [eB, eC].filter(Boolean).map(function (x) { return x.message; });
    var sepRisk = !aboard && S.nodeId === 'shore' && S.waitingSnapshot.length === 0 ? has(separationTargets(S), id) : false;
    return {
      id: id, templateId: p.templateId, cohort: p.cohort, role: t.role, seats: t.seats,
      reward: { kind: t.reward.kind, amount: t.reward.amount },
      preferredDestinationId: t.preferred, anger: s.anger,
      partnerId: linkedPartnerId(id), conflictPartnerId: conflictPartnerId(id),
      normalAngerProtected: !aboard && !!S.protection[id], protectedBy: (!aboard && S.protection[id]) || null,
      separationMarked: has(S.separationMarks, id), separationRisk: sepRisk,
      canBoard: !aboard && eB === null, canUnboard: aboard && eU === null, canCalm: !aboard && eC === null,
      disabledReasons: uniq(reasons)
    };
  }

  function forecast(S) {
    var atShoreUndeparted = S.nodeId === 'shore' && S.waitingSnapshot.length === 0;
    var waitingIds = atShoreUndeparted ? S.shore.slice() : S.waitingSnapshot.filter(function (id) { return has(S.shore, id); });
    var marks = atShoreUndeparted ? separationTargets(S) : S.separationMarks;
    var transformations = 0;
    var waiting = waitingIds.map(function (id) {
      var normal = S.protection[id] ? 0 : 1, sep = has(marks, id) ? 1 : 0;
      var cur = S.souls[id].anger, proj = cur + normal + sep, tr = proj >= C.angerLimit;
      if (tr) transformations++;
      return { soulId: id, currentAnger: cur, normalAnger: normal, separationAnger: sep, projectedAnger: proj, willTransform: tr };
    });
    var broken = S.passengers.length;
    var returnCompletes = S.completedCycles + 1;
    var quotaDue = returnCompletes % C.quotaEveryCycles === 0;
    var quotaShort = quotaDue && S.obols < C.quotaAmount;
    var afterCore = S.reprimands + transformations + broken;
    var dismissalCore = afterCore >= C.reprimandsMax;
    var after = afterCore + (!dismissalCore && quotaShort ? 1 : 0);
    var warnings = [];
    if (transformations) warnings.push({ code: 'WRAITH_FORMATION', count: transformations,
      message: transformations + ' waiting soul(s) would become wraiths at the return.' });
    if (broken) warnings.push({ code: 'BROKEN_PROMISES', count: broken,
      message: broken + ' passenger(s) still aboard would each add a reprimand if not delivered before the return.' });
    if (quotaDue) warnings.push({ code: quotaShort ? 'QUOTA_UNAFFORDABLE' : 'QUOTA_DUE', amount: C.quotaAmount,
      message: quotaShort ? 'The quota of ' + C.quotaAmount + ' obols is due at this return and cannot be paid.'
                          : 'The quota of ' + C.quotaAmount + ' obols is due at this return.' });
    if (after >= C.reprimandsMax) warnings.push({ code: 'DISMISSAL', message: 'Returning now would end the apprenticeship.' });
    return { waiting: waiting, transformations: transformations, brokenPromisesIfReturnNow: broken,
      reprimandsAfterReturn: after, dismissalIfReturnNow: after >= C.reprimandsMax, warnings: warnings,
      quotaDueAtReturn: quotaDue, quotaShortfallAtReturn: quotaShort,
      assumesNoFurtherDeliveries: true };
  }

  function routeList(S) {
    var out = [];
    if (S.phase !== 'prepare') return out;
    RULES.edges[S.nodeId].forEach(function (to) {
      out.push(routePreview(S, to, 'normal'));
      if (to !== 'shore' && S.cycle >= C.rockyFromCycle) out.push(routePreview(S, to, 'rocky'));
    });
    return out;
  }

  function memoryView(S, id) {
    var m = S.memories[id], t = RULES.memories[m.templateId];
    var e = errPlay(S, id, null);
    return { id: id, templateId: m.templateId, sourceSoulId: m.sourceSoulId, deliveredTo: m.deliveredTo,
      takesTarget: !!t.marksWaiting, canPlay: e === null, validTargetIds: e === null && t.marksWaiting ? S.shore.slice() : [],
      disabledReason: e ? e.message : null };
  }

  function getView(S) {
    var over = S.phase === 'ended';
    var wr = S.wraiths.map(function (w) {
      var e = errRelease(S, w.id);
      return { id: w.id, sourceSoulId: w.sourceSoulId, templateId: w.templateId, canRelease: e === null, disabledReason: e ? e.message : null };
    });
    var shoreViews = S.shore.map(function (id) { return soulView(S, id, false); });
    var hand = S.hand.map(function (id) { return memoryView(S, id); });
    var routes = routeList(S);
    var eRep = errRepair(S);
    var calmable = shoreViews.some(function (v) { return v.canCalm; });
    var calmReason = null;
    if (!calmable) {
      var ec = errPhase(S, 'prepare') || errShore(S) || (S.calmUsed ? errCalm(S, 'x') : null) ||
        (S.obols < C.calmCost ? errCalm(S, 'x') : null);
      calmReason = ec ? ec.message : 'No waiting soul can be calmed.';
    }
    var dueAfter = Math.ceil(S.cycle / C.quotaEveryCycles) * C.quotaEveryCycles;
    var pe = pendingEventInfo(S);
    return {
      schemaVersion: SCHEMA_VERSION, rulesVersion: RULES.rulesVersion, phase: S.phase, nodeId: S.nodeId,
      cycle: S.cycle, completedCycles: S.completedCycles,
      resources: { light: S.light, lightMax: C.lightMax, obols: S.obols, hull: S.hull, hullMax: C.hullMax,
                   reprimands: S.reprimands, reprimandsMax: C.reprimandsMax },
      capacity: { used: seatsUsed(S), max: C.seats },
      nextQuota: { dueAfterCycle: dueAfter, amount: C.quotaAmount, cyclesUntilDue: dueAfter - S.completedCycles },
      favorableDestinationId: favorableDestination(S),
      shore: shoreViews,
      passengers: S.passengers.map(function (id) { return soulView(S, id, true); }),
      wraiths: wr, hand: hand,
      memoryCounts: { draw: S.draw.length, discard: S.discard.length, hand: S.hand.length, total: S.draw.length + S.discard.length + S.hand.length },
      routes: routes,
      pendingEvent: pe,
      discoveredEventIds: S.eventsTriggered.slice(),
      returnForecast: forecast(S),
      permissions: {
        canDeliver: S.phase === 'deliver', canRepair: eRep === null, repairDisabledReason: eRep ? eRep.message : null,
        canCalm: calmable, calmDisabledReason: calmReason,
        canRelease: wr.some(function (w) { return w.canRelease; }),
        canDepart: routes.some(function (r) { return r.legal; }),
        canPlayMemory: hand.some(function (m) { return m.canPlay; }),
        canResolveEvent: S.phase === 'event'
      },
      visited: S.visited.slice(),
      calmUsed: S.calmUsed, memoryPlayedThisCrossing: S.memoryPlayed,
      playedMemory: S.playedMemory ? clone(S.playedMemory) : null,
      arrival: S.arrival ? { nodeId: S.arrival.nodeId, aboardIds: S.arrival.aboard.slice(), deliveredIds: S.arrival.delivered.slice() } : null,
      history: S.log.slice(-200),
      ended: S.ended ? clone(S.ended) : null
    };
  }

  function previewDelivery(S, soulIds) {
    var e = errDeliver(S, soulIds);
    if (e) return { ok: false, error: e, deliveries: [], totals: null };
    var recs = computeDelivery(S, soulIds);
    var totals = { obolsGained: 0, lightGained: 0, lightLost: 0, lightAfter: S.light, memories: [] };
    recs.forEach(function (r) {
      totals.obolsGained += r.obolsGained; totals.lightGained += r.lightGained; totals.lightLost += r.lightLost;
      totals.memories.push({ memoryId: r.memoryId, templateId: r.memoryTemplateId, sourceSoulId: r.soulId });
    });
    totals.lightAfter = S.light + totals.lightGained;
    return { ok: true, error: null, deliveries: recs, totals: totals };
  }

  function getLegalActions(S) {
    var out = [];
    if (S.phase === 'ended') return out;
    var push = function (a) { if (validateAction(S, a) === null) out.push(a); };
    S.shore.forEach(function (id) { push({ type: 'BOARD', soulId: id }); push({ type: 'CALM', soulId: id }); });
    S.passengers.forEach(function (id) { push({ type: 'UNBOARD', soulId: id }); });
    S.wraiths.forEach(function (w) { push({ type: 'RELEASE_WRAITH', wraithId: w.id }); });
    push({ type: 'REPAIR' });
    S.hand.forEach(function (m) {
      push({ type: 'PLAY_MEMORY', memoryId: m, targetSoulId: null });
      if (RULES.memories[S.memories[m].templateId].marksWaiting) {
        S.shore.forEach(function (id) { push({ type: 'PLAY_MEMORY', memoryId: m, targetSoulId: id }); });
      }
    });
    RULES.nodes.forEach(function (to) { ['normal', 'rocky'].forEach(function (v) { push({ type: 'DEPART', to: to, variant: v }); }); });
    push({ type: 'DELIVER', soulIds: [] });
    var pe = pendingEventInfo(S);
    if (pe) { push({ type: 'RESOLVE_EVENT', eventId: pe.eventId, accept: false }); push({ type: 'RESOLVE_EVENT', eventId: pe.eventId, accept: true }); }
    return out;
  }

  // ------------------------------------------------------- serialize / load

  function serialize(state) {
    return JSON.stringify({ schemaVersion: SCHEMA_VERSION, rulesVersion: RULES.rulesVersion, state: state });
  }

  function validateState(S) {
    function bad(m) { throw new Error(m); }
    function ints(x, name, min, max) { if (!isInt(x) || x < min || (max !== undefined && x > max)) bad(name + ' is invalid'); }
    function idArr(x, name) { if (!Array.isArray(x) || !x.every(function (i) { return typeof i === 'string'; })) bad(name + ' must be an array of strings'); }
    if (!isObj(S)) bad('state is not an object');
    if (S.schemaVersion !== SCHEMA_VERSION) bad('unsupported state schemaVersion');
    if (S.rulesVersion !== RULES.rulesVersion) bad('unsupported rulesVersion');
    if (!has(PHASES, S.phase)) bad('unknown phase');
    if (!has(RULES.nodes, S.nodeId)) bad('unknown node');
    ints(S.seed, 'seed', 0, 4294967295); ints(S.rng, 'rng', 0, 4294967295);
    ints(S.cycle, 'cycle', 1); ints(S.completedCycles, 'completedCycles', 0);
    ints(S.light, 'light', 0, C.lightMax); ints(S.obols, 'obols', 0); ints(S.hull, 'hull', 0, C.hullMax);
    ints(S.reprimands, 'reprimands', 0); ints(S.supplyIndex, 'supplyIndex', 0); ints(S.seq, 'seq', 0);
    var ended = S.phase === 'ended';
    if (ended) {
      if (!isObj(S.ended) || !has(CAUSES, S.ended.cause) || !isObj(S.ended.summary)) bad('ended record is invalid');
      if (S.completedCycles !== S.cycle - 1 && S.completedCycles !== S.cycle) bad('cycle counters disagree');
    } else {
      if (S.ended !== null) bad('ended must be null while running');
      if (S.completedCycles !== S.cycle - 1) bad('cycle counters disagree');
      if (S.hull < 1) bad('hull cannot be zero in a live run');
      if (S.reprimands >= C.reprimandsMax) bad('reprimands at limit in a live run');
    }
    ['shore', 'passengers', 'hand', 'draw', 'discard', 'visited', 'waitingSnapshot', 'separationMarks'].forEach(function (k) { idArr(S[k], k); });
    if (!isObj(S.souls) || !isObj(S.memories) || !isObj(S.protection) || !isObj(S.stats)) bad('missing object field');
    // Souls
    var inPlay = S.shore.concat(S.passengers);
    if (uniq(inPlay).length !== inPlay.length) bad('a soul appears in two places');
    var soulKeys = Object.keys(S.souls);
    if (soulKeys.length !== inPlay.length) bad('souls map disagrees with shore/passengers');
    inPlay.forEach(function (id) {
      var s = S.souls[id], p = parseSoulId(id);
      if (!p) bad('bad soul id ' + id);
      if (!isObj(s) || s.id !== id || s.templateId !== p.templateId || s.cohort !== p.cohort) bad('soul record mismatch for ' + id);
      ints(s.anger, 'anger', 0, C.angerLimit - 1);
    });
    if (seatsUsed(S) > C.seats) bad('passengers exceed capacity');
    if (!Array.isArray(S.wraiths)) bad('wraiths must be an array');
    var wids = {};
    S.wraiths.forEach(function (w) {
      if (!isObj(w) || !parseSoulId(w.sourceSoulId) || w.id !== 'W-' + w.sourceSoulId || w.templateId !== parseSoulId(w.sourceSoulId).templateId) bad('wraith record invalid');
      if (wids[w.id] || S.souls[w.sourceSoulId]) bad('duplicate wraith or soul/wraith clash');
      wids[w.id] = true;
    });
    if (S.supplyIndex < inPlay.length + S.wraiths.length) bad('supplyIndex too small');
    // Memories
    var placed = S.hand.concat(S.draw, S.discard);
    if (uniq(placed).length !== placed.length) bad('a memory appears in two piles');
    if (Object.keys(S.memories).length !== placed.length) bad('memories map disagrees with piles');
    if (S.hand.length > C.handSize) bad('hand too large');
    placed.forEach(function (id) {
      var m = S.memories[id];
      if (!isObj(m) || m.id !== id || !RULES.memories[m.templateId] || !parseSoulId(m.sourceSoulId) || id !== 'M-' + m.sourceSoulId) bad('memory record invalid: ' + id);
    });
    if (typeof S.memoryPlayed !== 'boolean' || typeof S.calmUsed !== 'boolean') bad('flag must be boolean');
    if (S.playedMemory !== null) {
      if (!isObj(S.playedMemory) || !RULES.memories[S.playedMemory.templateId]) bad('playedMemory invalid');
    }
    if ((S.playedMemory !== null) !== S.memoryPlayed) bad('memoryPlayed disagrees with playedMemory');
    // Marks
    Object.keys(S.protection).forEach(function (id) {
      if (!has(inPlay, id) || (S.protection[id] !== 'calm' && S.protection[id] !== 'memory')) bad('protection entry invalid');
    });
    S.separationMarks.forEach(function (id) { if (!has(S.waitingSnapshot, id)) bad('separation mark outside snapshot'); });
    S.waitingSnapshot.forEach(function (id) { if (!parseSoulId(id)) bad('snapshot id invalid'); });
    if (!ended && S.nodeId === 'shore' && (S.waitingSnapshot.length || S.separationMarks.length)) bad('snapshot present at shore');
    // Map position
    S.visited.forEach(function (n) { if (!has(RULES.destinations, n) && n !== 'haven') bad('visited contains invalid node'); });
    if (uniq(S.visited).length !== S.visited.length) bad('duplicate visited node');
    if (!ended) {
      if (S.nodeId === 'shore' && S.visited.length) bad('visited must be empty at shore');
      if (S.nodeId !== 'shore' && !has(S.visited, S.nodeId)) bad('current node not marked visited');
    }
    // Events
    if (!Array.isArray(S.eventsTriggered) || !S.eventsTriggered.every(function (e) { return !!RULES.events[e]; }) || uniq(S.eventsTriggered).length !== S.eventsTriggered.length) bad('eventsTriggered invalid');
    if (!Array.isArray(S.eventQueue) || !S.eventQueue.every(function (q) { return isObj(q) && !!RULES.events[q.id]; })) bad('eventQueue invalid');
    if (!Array.isArray(S.reconciledCohorts) || !S.reconciledCohorts.every(function (c) { return isInt(c) && c >= 1; })) bad('reconciledCohorts invalid');
    if (S.phase === 'prepare') {
      if (S.eventQueue.length || S.arrival !== null) bad('prepare phase must have no arrival or events');
    } else if (S.phase === 'deliver') {
      if (!isObj(S.arrival) || S.arrival.nodeId !== S.nodeId || !has(RULES.destinations, S.nodeId) || S.eventQueue.length) bad('deliver phase state invalid');
      if (S.arrival.delivered.length) bad('deliver phase must precede delivery');
    } else if (S.phase === 'event') {
      if (!isObj(S.arrival) || S.eventQueue.length < 1 || !RULES.events[S.eventQueue[0].id].choice) bad('event phase state invalid');
    }
    if (S.arrival !== null) { idArr(S.arrival.aboard, 'arrival.aboard'); idArr(S.arrival.delivered, 'arrival.delivered'); }
    // Stats and logs
    ['crossings', 'memoriesEarned', 'wraithsFormed', 'wraithsReleased', 'missedQuotas', 'quotasPaid', 'brokenPromises'].forEach(function (k) { ints(S.stats[k], 'stats.' + k, 0); });
    if (!Array.isArray(S.stats.delivered) || !Array.isArray(S.log) || !Array.isArray(S.actionLog)) bad('log arrays missing');
  }

  function deserialize(text) {
    try {
      if (typeof text !== 'string') return { ok: false, state: null, error: err('INVALID_SAVE', 'Save data must be a string.') };
      var doc;
      try { doc = JSON.parse(text); } catch (e) { return { ok: false, state: null, error: err('INVALID_SAVE', 'Save data is not valid JSON.') }; }
      if (!isObj(doc)) return { ok: false, state: null, error: err('INVALID_SAVE', 'Save data must be a JSON object.') };
      if (doc.schemaVersion !== SCHEMA_VERSION) return { ok: false, state: null, error: err('UNSUPPORTED_SCHEMA', 'Unsupported save schemaVersion: ' + String(doc.schemaVersion) + '.') };
      if (doc.rulesVersion !== RULES.rulesVersion) return { ok: false, state: null, error: err('UNSUPPORTED_RULES', 'Unsupported rulesVersion: ' + String(doc.rulesVersion) + '.') };
      if (!isObj(doc.state)) return { ok: false, state: null, error: err('INVALID_SAVE', 'Save data has no state object.') };
      try { validateState(doc.state); } catch (e) { return { ok: false, state: null, error: err('INVALID_SAVE', 'Save failed validation: ' + e.message + '.') }; }
      return { ok: true, state: clone(doc.state), error: null };
    } catch (ex) {
      return { ok: false, state: null, error: err('INVALID_SAVE', 'Save could not be read: ' + String(ex && ex.message || ex)) };
    }
  }

  // Deterministic replay of an accepted-action list from a seed (evidence and debugging).
  function replay(options, actions) {
    var state = createGame(options), emitted = [];
    for (var i = 0; i < actions.length; i++) {
      var r = dispatch(state, actions[i]);
      if (!r.ok) return { ok: false, state: state, error: r.error, failedIndex: i, emitted: emitted };
      state = r.state; emitted = emitted.concat(r.emitted);
    }
    return { ok: true, state: state, error: null, failedIndex: null, emitted: emitted };
  }

  return {
    version: { engine: '0.3.0', contract: RULES.contractVersion, rules: RULES.rulesVersion, schema: SCHEMA_VERSION },
    createGame: createGame, getView: getView, dispatch: dispatch,
    serialize: serialize, deserialize: deserialize,
    // additive helpers, documented in docs/ENGINE_API.md
    previewDelivery: previewDelivery, getLegalActions: getLegalActions, replay: replay,
    rules: RULES
  };
});
