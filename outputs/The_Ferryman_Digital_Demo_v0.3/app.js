/* The Ferryman v0.3: browser interface (Worker D).
 * Game state, legality, rewards, predictions and endings come only from
 * CharonEngine (createGame, getView, dispatch, serialize, deserialize, plus the
 * documented additive previewDelivery). UI state holds only selections and
 * dialog choices. Text comes from CHARON_CONTENT and art from CHARON_ASSETS;
 * fallbacks keep the game usable if either pack is missing.
 */
(function () {
  'use strict';

  var APP_VERSION = '0.3.0';
  var RUN_KEY = 'charon.v03.run';
  var REJECTED_KEY = 'charon.v03.run.rejected';
  var KNOWLEDGE_KEY = 'charon.v03.discoveries';
  var NODE_IDS = ['shore', 'elysium', 'asphodel', 'tartarus', 'haven'];
  var EVENT_IDS = ['E01', 'E02', 'E03', 'E04'];

  /* ---------- Fallback copy (used only where content.js lacks a key) ---------- */

  var FALLBACK = {
    title: 'The Ferryman: Apprentice Charon',
    intro: 'Carry souls from the starting shore to the stops beyond. Each move between stops is one crossing; returning to the shore completes a cycle. The run continues until the lantern fails, the boat sinks or Charon ends your apprenticeship.',
    nodes: {
      shore: { name: 'Starting Shore' }, elysium: { name: 'Elysium' }, asphodel: { name: 'Asphodel' },
      tartarus: { name: 'Tartarus' }, haven: { name: 'Haven' }
    },
    souls: {
      S01: { name: 'Mother' }, S02: { name: 'Child' }, S03: { name: 'Merchant' }, S04: { name: 'Red Soldier' },
      S05: { name: 'Poet' }, S06: { name: 'Blue Soldier' }, S07: { name: 'Cook' }, S08: { name: 'Mason' },
      S09: { name: 'Messenger' }, S10: { name: 'Keeper' }, S11: { name: 'Musician' }, S12: { name: 'Listener' }
    },
    memories: {
      R01: { name: 'Steadiness', description: '2 protection.' },
      R02: { name: 'Vigil', description: '1 protection; 3 if any aboard soul uses two seats.' },
      R03: { name: 'Recollection', description: '1 protection; optionally mark one waiting soul against normal anger this cycle.' },
      R04: { name: 'Accord', description: '1 protection; cancels same-cohort soldier conflict.' },
      R05: { name: 'Joined Memory', description: '2 protection; optionally mark one waiting soul against normal anger this cycle.' },
      R06: { name: 'Faint Memory', description: '1 protection.' }
    },
    events: {
      E01: { title: 'Shared Farewell' }, E02: { title: 'Unfinished Message', acceptLabel: 'Pay 1 obol', declineLabel: 'Decline' },
      E03: { title: 'Old Feud', acceptLabel: 'Pay 1 obol', declineLabel: 'Decline' }, E04: { title: 'The Broken Landing' }
    },
    ui: {
      board: 'Board', unboard: 'Unboard', depart: 'Depart', deliver: 'Deliver selected',
      deliverNone: 'Continue without delivery', calm: 'Calm', release: 'Release wraith', repair: 'Repair',
      playMemory: 'Play memory', newRun: 'New run', resume: 'Resume', exportRun: 'Export run',
      clearDiscoveries: 'Clear discoveries'
    },
    help: {
      crossing: 'One crossing is one move between two stops.',
      cycle: 'A cycle is the whole trip from the starting shore back to it.',
      anger: 'Waiting souls gain anger only when a cycle ends.',
      light: 'Fog greater than your light ends the run. Exactly zero survives.',
      calming: 'Pay 1 obol at the shore to protect one waiting soul from its next normal anger.',
      wishes: 'Matching a soul’s wish gives a bonus; missing it has no penalty.',
      quota: 'Hades takes obols after every third completed cycle.',
      memory: 'Memories are free; play at most one per crossing.',
      discovery: 'Stop events stay hidden until they happen.'
    },
    endings: {
      fog: { title: 'The lantern failed', body: 'Fog damage exceeded the available light.' },
      sinking: { title: 'The boat sank', body: 'The hull reached zero.' },
      dismissal: { title: 'Apprenticeship ended', body: 'Reprimands reached the limit.' }
    }
  };

  // Soul templates an event concerns, for discovered notes on soul details (display only).
  var EVENT_SOUL_TEMPLATES = { E01: ['S01', 'S02', 'S11', 'S12'], E02: ['S09'], E03: ['S04', 'S06'], E04: [] };
  var BREAKDOWN_LABELS = {
    baseFog: 'Base fog', cycleModifier: 'Cycle modifier', wraithPressure: 'Wraith pressure',
    conflictPressure: 'Soldier conflict', passengerProtection: 'Passenger protection', memoryProtection: 'Memory protection',
    rawFog: 'Total before floor at 0'
  };
  var HELP_ORDER = ['crossing', 'cycle', 'routes', 'light', 'hull', 'boarding', 'promises', 'delivery', 'wishes', 'pairs',
    'passengerEffects', 'memory', 'memoryTargets', 'anger', 'calming', 'wraiths', 'quota', 'recovery', 'returnOrder',
    'supply', 'escalation', 'discovery', 'failure', 'saving'];

  /* ---------- Content, art and icon lookup ---------- */

  function content() { return globalThis.CHARON_CONTENT || null; }
  function pack() { return globalThis.CHARON_ASSETS || null; }
  function str(v) { return typeof v === 'string' && v.trim() !== '' ? v : ''; }

  function pick(section, key, field) {
    var c = content();
    var v = c && c[section] && c[section][key] && str(c[section][key][field]);
    if (v) return v;
    var f = FALLBACK[section] && FALLBACK[section][key];
    return f && str(f[field]) || '';
  }
  function label(key) { var c = content(); return (c && c.ui && str(c.ui[key])) || FALLBACK.ui[key] || key; }
  function helpText(key) { var c = content(); return (c && c.help && str(c.help[key])) || FALLBACK.help[key] || ''; }
  function topText(key) { var c = content(); return (c && str(c[key])) || FALLBACK[key]; }
  function nodeName(id) { return pick('nodes', id, 'name') || id; }
  function templateOf(soulId) { var m = /S\d{2}$/.exec(String(soulId || '')); return m ? m[0] : null; }
  function soulName(tid) { return pick('souls', tid, 'name') || tid; }
  function soulLabel(id) { return soulName(templateOf(id)) + ' ' + id; }
  function memoryName(tid) { return pick('memories', tid, 'name') || tid; }
  function eventTitle(id) { return pick('events', id, 'title') || id; }

  /* ---------- DOM helpers (text only, never raw HTML) ---------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'onclick') el.addEventListener('click', v);
        else if (k === 'onchange') el.addEventListener('change', v);
        else if (k === 'key') el.setAttribute('data-key', v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, child) {
    if (child === null || child === undefined || child === false || child === '') return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
  function $(id) { return document.getElementById(id); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function humanize(key) {
    return String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); });
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  function placeholder(key, cls) {
    return h('div', { class: 'art-placeholder ' + (cls || ''), role: 'img', 'aria-label': 'Missing art: ' + key },
      h('span', { text: key }), h('small', { text: 'art placeholder' }));
  }
  // Painted art with a labelled placeholder fallback. Missing art never affects mechanics.
  function art(key, cls, decorative) {
    var p = pack();
    var entry = p && p.images && p.images[key];
    if (!entry || typeof entry.src !== 'string') return placeholder(key, cls);
    var img = h('img', {
      class: 'art ' + (cls || ''), src: entry.src, alt: decorative ? '' : (entry.alt || ''),
      width: entry.width, height: entry.height, loading: 'lazy', decoding: 'async'
    });
    img.style.objectFit = entry.fit || 'cover';
    img.style.objectPosition = entry.position || 'center';
    img.addEventListener('error', function () {
      if (img.parentNode) img.parentNode.replaceChild(placeholder(key, cls), img);
      console.warn('[charon-ui] art file failed to load:', key, entry.src);
    });
    return img;
  }
  // Small decorative icon next to a text label; omitted silently if absent.
  function icon(key) {
    var p = pack();
    var entry = p && p.icons && p.icons[key];
    if (!entry || typeof entry.src !== 'string') return null;
    var img = h('img', { class: 'icon', src: entry.src, alt: '', width: 20, height: 20, 'aria-hidden': 'true' });
    img.addEventListener('error', function () { img.remove(); });
    return img;
  }

  /* ---------- Storage ---------- */

  function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function storageRemove(key) { try { localStorage.removeItem(key); } catch (e) { /* unavailable */ } }

  function loadKnowledge() {
    var raw = storageGet(KNOWLEDGE_KEY);
    if (!raw) return [];
    try {
      var data = JSON.parse(raw);
      var ids = data && Array.isArray(data.eventIds) ? data.eventIds : [];
      return ids.filter(function (id) { return EVENT_IDS.indexOf(id) >= 0; });
    } catch (e) { return []; }
  }
  function saveKnowledge() {
    storageSet(KNOWLEDGE_KEY, JSON.stringify({ version: 1, eventIds: knowledge, updatedAt: new Date().toISOString() }));
  }

  /* ---------- App state ---------- */

  var Engine = null;
  var game = null;          // engine State, opaque
  var view = null;          // engine View
  var knowledge = loadKnowledge();
  var sessionLog = [];
  var busy = false;
  var ui = freshUi();

  function freshUi() {
    return { stepKey: '', route: null, deliver: {}, memoryTargets: {}, detailSoulId: null, lastEmitted: [], message: null };
  }
  function stepKeyOf(v) { return [v.cycle, v.nodeId, v.phase, v.pendingEvent ? v.pendingEvent.eventId : ''].join('|'); }

  /* ---------- Engine interaction ---------- */

  function setGame(state, fromAction) {
    var before = view ? (view.discoveredEventIds || []) : [];
    game = state;
    view = Engine.getView(game);
    var key = stepKeyOf(view);
    if (key !== ui.stepKey) { ui.route = null; ui.deliver = {}; ui.memoryTargets = {}; ui.stepKey = key; }
    if (ui.route && !(view.routes || []).some(function (r) { return r.to === ui.route.to && r.variant === ui.route.variant; })) ui.route = null;
    // Only events newly discovered by an action enter the knowledge reference,
    // so a cleared reference is not silently refilled when a save is loaded.
    if (fromAction) {
      var added = (view.discoveredEventIds || []).filter(function (id) { return before.indexOf(id) < 0 && knowledge.indexOf(id) < 0; });
      if (added.length) { knowledge = knowledge.concat(added); saveKnowledge(); }
    }
  }

  function send(action) {
    if (busy || !game) return;
    busy = true;
    try {
      var res = Engine.dispatch(game, action);
      if (!res || !res.ok) {
        var err = (res && res.error) || { code: 'UNKNOWN', message: 'The engine rejected the action.' };
        flash(err.message, 'error');
        return;
      }
      ui.lastEmitted = Array.isArray(res.emitted) ? res.emitted : [];
      sessionLog.push({ action: action, emitted: ui.lastEmitted });
      ui.message = null;
      setGame(res.state, true);
      persistRun();
    } catch (e) {
      console.error('[charon-ui] dispatch threw', e);
      flash('The engine reported an internal error: ' + e.message, 'error');
    } finally {
      busy = false;
    }
    render();
  }

  function persistRun() {
    if (!game) return;
    var text;
    try { text = Engine.serialize(game); } catch (e) { flash('Could not save the run: ' + e.message, 'warn'); return; }
    if (!storageSet(RUN_KEY, text)) flash('Browser storage is unavailable, so this run will not survive a reload. Use Export run to keep it.', 'warn');
  }

  function newRun() {
    sessionLog = [];
    ui = freshUi();
    view = null;
    setGame(Engine.createGame({ seed: randomSeed() }), false);
    persistRun();
    showScreen('game');
    render();
    focusHeading();
  }
  function randomSeed() {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; }
    catch (e) { return Math.floor(Math.random() * 4294967295); }
  }

  // Validates through the engine first; a rejected save never replaces the current run.
  function tryLoadSave(text, source) {
    var res;
    try { res = Engine.deserialize(text); } catch (e) { res = { ok: false, error: { message: e.message } }; }
    if (!res || !res.ok) {
      var msg = (res && res.error && (res.error.message || res.error.code)) || 'unknown error';
      return { ok: false, message: 'The ' + source + ' could not be loaded: ' + msg + (game ? ' Your current run is unchanged.' : '') };
    }
    sessionLog = [];
    ui = freshUi();
    view = null;
    setGame(res.state, false);
    persistRun();
    return { ok: true };
  }

  /* ---------- Messages ---------- */

  function flash(text, kind) { ui.message = { text: text, kind: kind || 'info' }; renderMessage(); }
  function renderMessage() {
    var box = clear($('message'));
    if (!ui.message) { box.hidden = true; return; }
    box.hidden = false;
    box.className = 'message ' + ui.message.kind;
    box.setAttribute('role', ui.message.kind === 'error' ? 'alert' : 'status');
    append(box, h('span', { text: ui.message.text }));
    append(box, h('button', { class: 'icon-button', type: 'button', 'aria-label': 'Dismiss message', text: '×', onclick: function () { ui.message = null; renderMessage(); } }));
  }

  /* ---------- Log entry wording (engine entries carry data, not prose) ---------- */

  function logText(e) {
    if (!e || typeof e !== 'object') return String(e);
    var n = function (id) { return nodeName(id); };
    switch (e.type) {
      case 'SETUP': return 'Run started.';
      case 'SHORE_REFILLED': return e.soulIds && e.soulIds.length ? 'New souls arrive at the shore: ' + e.soulIds.map(soulLabel).join(', ') + '.' : 'No new souls arrived.';
      case 'MEMORIES_DRAWN':
        return (e.memoryIds && e.memoryIds.length ? 'Drew ' + plural(e.memoryIds.length, 'memory', 'memories') : 'No memories to draw') +
          (e.reshuffled ? ' after shuffling the discard pile' : '') + '. Hand: ' + e.handSize + '.';
      case 'BOARDED': return soulLabel(e.soulId) + ' boarded.';
      case 'UNBOARDED': return soulLabel(e.soulId) + ' stepped back onto the shore.';
      case 'CALMED': return 'Calmed ' + soulLabel(e.soulId) + ' for ' + plural(e.obolsSpent, 'obol') + '.';
      case 'WRAITH_RELEASED': return 'Released the wraith of ' + soulLabel(e.sourceSoulId) + ' for ' + e.lightSpent + ' light.';
      case 'REPAIRED': return 'Repaired the hull for ' + plural(e.obolsSpent, 'obol') + '. Hull ' + e.hull + '.';
      case 'MEMORY_PLAYED':
        return 'Played ' + memoryName(e.templateId) + ' (from ' + soulLabel(e.sourceSoulId) + ')' +
          (e.marked && e.targetSoulId ? ', protecting ' + soulLabel(e.targetSoulId) + ' at this cycle’s return' : '') + '.';
      case 'DEPART':
        return 'Departed ' + n(e.from) + ' for ' + n(e.to) + (e.variant === 'rocky' ? ' by the rocky route' : '') +
          ': fog ' + e.fogDamage + (e.hullDamage ? ', hull damage ' + e.hullDamage : '') + '.';
      case 'CROSSING_COMPLETED': return 'Crossed to ' + n(e.to) + '. Light ' + e.light + ', hull ' + e.hull + '.';
      case 'CROSSING_FAILED':
        return e.cause === 'fog' ? 'The crossing failed: fog ' + e.fogDamage + ' exceeded light ' + e.light + '.' : 'The crossing failed: the hull broke (' + e.hullDamage + ' damage).';
      case 'ARRIVED': return 'Arrived at ' + n(e.nodeId) + '.';
      case 'HAVEN_RECOVERY': return e.lightGained ? 'The haven restored ' + e.lightGained + ' light.' : 'The haven’s light was lost: the lantern is already full.';
      case 'SOUL_DELIVERED': {
        var gains = [];
        if (e.obolsGained) gains.push('+' + plural(e.obolsGained, 'obol'));
        if (e.lightGained) gains.push('+' + e.lightGained + ' light' + (e.wishMatched ? ' (wish matched)' : ''));
        if (e.lightLost) gains.push(e.lightLost + ' light lost at the cap');
        return soulLabel(e.soulId) + ' delivered to ' + n(e.destinationId) + (gains.length ? ': ' + gains.join(', ') : '') +
          '. Memory earned: ' + memoryName(e.memoryTemplateId) + (e.jointDelivery ? ' (delivered together)' : '') + '.';
      }
      case 'DELIVERY_CONFIRMED': return e.count ? plural(e.count, 'soul') + ' disembarked.' : 'Nobody disembarked here.';
      case 'EVENT_TRIGGERED': return 'Event revealed: ' + eventTitle(e.eventId) + '.';
      case 'EVENT_RESOLVED': {
        var r = e.result || {};
        var bits = [];
        if (r.gained) bits.push('+' + r.gained);
        if (r.lost) bits.push(r.lost + ' lost at the cap');
        return eventTitle(e.eventId) + (e.automatic ? ' took effect' : (e.accepted ? ': accepted' : ': declined')) + (bits.length ? ' (' + bits.join(', ') + ')' : '') + '.';
      }
      case 'RETURNED': return 'Returned to the starting shore. Cycles completed: ' + e.completedCycles + '.';
      case 'ANGER_RESOLVED': {
        var angry = (e.souls || []).filter(function (s) { return s.normal || s.separation; });
        var txt = angry.length ? 'Anger rose for ' + angry.map(function (s) { return soulLabel(s.soulId) + ' (now ' + s.anger + ')'; }).join(', ') + '.' : 'No waiting soul gained anger.';
        if (e.wraithsFormed && e.wraithsFormed.length) txt += ' ' + plural(e.wraithsFormed.length, 'wraith') + ' formed. Reprimands: ' + e.reprimands + '.';
        return txt;
      }
      case 'PROMISES_BROKEN': return 'Broken promises: ' + e.soulIds.map(soulLabel).join(', ') + ' returned undelivered. Reprimands: ' + e.reprimands + '.';
      case 'QUOTA_PAID': return 'Hades’ quota paid: ' + plural(e.amount, 'obol') + '. Obols left: ' + e.obols + '.';
      case 'QUOTA_MISSED': return 'Quota missed: fewer than ' + plural(e.amount, 'obol') + '. Reprimands: ' + e.reprimands + '.';
      case 'CYCLE_COMPLETED': return 'Cycle ' + e.nextCycle + ' begins.' + (e.lightGained ? ' Recovered ' + e.lightGained + ' light.' : (e.lightLost ? ' Recovery lost: the lantern is full.' : ''));
      case 'RUN_ENDED': return 'The run ended: ' + e.cause + '.';
      default: return humanize(e.type || 'entry');
    }
  }

  /* ---------- Rendering ---------- */

  function render() {
    if (!view) return;
    var active = document.activeElement;
    var focusKey = active && active.getAttribute && active.getAttribute('data-key');
    document.body.setAttribute('data-phase', view.phase);
    renderStatus();
    renderMap();
    renderPhase();
    renderAside();
    renderHistory();
    renderMessage();
    if (focusKey) {
      var el = document.querySelector('[data-key="' + cssEscape(focusKey) + '"]');
      if (el && !el.disabled) el.focus({ preventScroll: true });
      else focusHeading();
    }
  }
  function focusHeading() { var hd = $('phase-heading'); if (hd) hd.focus({ preventScroll: false }); }
  function cssEscape(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  function stat(iconKey, labelText, value, hint, cls) {
    return h('div', { class: 'stat ' + (cls || '') },
      h('span', { class: 'stat-label' }, icon(iconKey), labelText),
      h('span', { class: 'stat-value', text: value }),
      hint ? h('span', { class: 'stat-hint', text: hint }) : null);
  }

  function renderStatus() {
    var r = view.resources, q = view.nextQuota;
    append(clear($('status-bar')), [
      stat('light', 'Lantern light', r.light + ' / ' + r.lightMax, 'Fog above this ends the run', 'light' + (r.light === 0 ? ' danger' : '')),
      stat('obol', 'Obols', String(r.obols), 'Quota, calming, repairs', 'obols'),
      stat('hull', 'Hull', r.hull + ' / ' + r.hullMax, 'The boat sinks at 0', 'hull' + (r.hull <= 1 ? ' danger' : '')),
      stat('reprimand', 'Reprimands', r.reprimands + ' / ' + r.reprimandsMax, 'Dismissed at ' + r.reprimandsMax, 'reprimands' + (r.reprimands >= r.reprimandsMax - 1 ? ' danger' : '')),
      stat('cycle', 'Cycle', String(view.cycle), plural(view.completedCycles, 'cycle') + ' completed', 'cycle'),
      stat('quota', 'Next quota', q ? plural(q.amount, 'obol') : 'none', q ? 'Due when cycle ' + q.dueAfterCycle + ' completes' + (q.cyclesUntilDue !== undefined ? ' (' + (q.cyclesUntilDue === 0 ? 'this cycle' : 'in ' + plural(q.cyclesUntilDue, 'more cycle')) + ')' : '') : '', 'quota')
    ]);
    var notes = [];
    if (view.cycle >= 3) notes.push('Rocky routes are available: lower fog, but 1 hull damage.');
    if (view.cycle >= 5) notes.push('Every non-return crossing has +1 fog.');
    if (view.favorableDestinationId) notes.push(nodeName(view.favorableDestinationId) + ' is favored this cycle: crossings into it skip the +1.');
    $('cycle-note').textContent = view.phase === 'ended' ? '' : notes.join(' ');
  }

  function routesTo(id) { return (view.routes || []).filter(function (r) { return r.to === id; }); }

  function renderMap() {
    var box = clear($('map'));
    var visited = view.visited || [];
    var picking = view.phase === 'prepare';
    function tile(id) {
      var here = view.nodeId === id;
      var rs = picking ? routesTo(id) : [];
      var legal = rs.filter(function (r) { return r.legal; });
      var isVisited = visited.indexOf(id) >= 0;
      var badges = [];
      if (here) badges.push(h('span', { class: 'badge here', text: 'You are here' }));
      if (isVisited && !here) badges.push(h('span', { class: 'badge visited', text: 'Visited this cycle' }));
      if (view.favorableDestinationId === id) badges.push(h('span', { class: 'badge fav', text: 'Favored' }));
      var fogs = legal.map(function (r) {
        return h('span', { class: 'map-fog' + (r.lethal ? ' lethal' : '') }, icon(r.variant === 'rocky' ? 'rock' : 'fog'),
          (r.variant === 'rocky' ? 'Rocky: fog ' : 'Fog ') + r.fogDamage + (r.hullDamage ? ', −' + r.hullDamage + ' hull' : ''));
      });
      var inner = [art(id, 'map-art', true), h('span', { class: 'map-text' }, h('span', { class: 'map-name', text: nodeName(id) }),
        badges.length ? h('span', { class: 'map-badges' }, badges) : null, fogs.length ? h('span', { class: 'map-fogs' }, fogs) : null)];
      var cls = 'map-node node-' + id + (here ? ' here' : '') + (isVisited ? ' visited' : '') + (legal.length ? ' reachable' : '');
      if (!legal.length) return h('div', { class: cls }, inner);
      var normal = legal.filter(function (r) { return r.variant === 'normal'; })[0] || legal[0];
      var selected = ui.route && ui.route.to === id;
      return h('button', {
        type: 'button', class: cls + (selected ? ' selected' : ''), key: 'map-' + id, 'aria-pressed': selected ? 'true' : 'false',
        'aria-label': (id === 'shore' ? 'Return to ' : 'Sail to ') + nodeName(id) + ', fog ' + normal.fogDamage,
        onclick: function () { ui.route = { to: normal.to, variant: normal.variant }; render(); }
      }, inner);
    }
    append(box, [
      h('div', { class: 'map-col map-origin' }, tile('shore')),
      h('div', { class: 'map-col map-dests' }, tile('elysium'), tile('asphodel'), tile('tartarus')),
      h('div', { class: 'map-col map-haven' }, tile('haven'))
    ]);
    var trail = ['shore'].concat(visited).map(nodeName).join(' → ');
    $('map-legend').textContent = 'This cycle so far: ' + trail + (view.nodeId !== 'shore' || visited.length ? '' : ' (not yet departed)') +
      '. Each move between two stops is one crossing; the cycle ends only when you return to the starting shore.';
  }

  function phaseTitle() {
    if (view.phase === 'deliver') return 'Arrived at ' + nodeName(view.nodeId) + ': who disembarks?';
    if (view.phase === 'event') return 'Something happens at ' + nodeName(view.nodeId);
    if (view.phase === 'ended') return 'The run has ended';
    return 'Preparing at ' + nodeName(view.nodeId);
  }

  function renderPhase() {
    var box = clear($('phase'));
    append(box, h('div', { class: 'phase-head' }, art(view.nodeId, 'phase-art', true),
      h('div', { class: 'phase-title' }, h('p', { class: 'eyebrow', text: 'Cycle ' + view.cycle + ' · ' + humanize(view.phase) }),
        h('h2', { id: 'phase-heading', tabindex: '-1', text: phaseTitle() }),
        view.phase !== 'ended' && pick('nodes', view.nodeId, 'description') ? h('p', { class: 'node-desc', text: pick('nodes', view.nodeId, 'description') }) : null)));
    if (ui.lastEmitted.length) {
      append(box, h('div', { class: 'emitted', role: 'status' }, h('strong', { text: 'What just happened' }),
        h('ul', null, ui.lastEmitted.filter(function (e) { return e.type !== 'SETUP'; }).map(function (e) { return h('li', { text: logText(e) }); }))));
    }
    var revealed = ui.lastEmitted.filter(function (e) { return e.type === 'EVENT_RESOLVED' && e.automatic; });
    revealed.forEach(function (e) { append(box, eventCard(e.eventId, null)); });
    if (view.phase === 'deliver') renderDeliver(box);
    else if (view.phase === 'event') renderEvent(box);
    else if (view.phase === 'ended') renderEnded(box);
    else renderPrepare(box);
  }

  function helpTip(key, title) {
    var t = helpText(key);
    if (!t) return null;
    return h('details', { class: 'help-tip' }, h('summary', { text: title || humanize(key) }), h('p', { text: t }));
  }

  /* Souls */

  function soulCard(s, controls, opts) {
    opts = opts || {};
    var tid = s.templateId || templateOf(s.id);
    var pips = [];
    for (var i = 0; i < 3; i++) pips.push(h('span', { class: 'pip' + (i < s.anger ? ' filled' : '') }));
    var reward = s.reward ? (s.reward.kind === 'coin' ? '+' + plural(s.reward.amount, 'obol') : '+' + s.reward.amount + ' light') : '';
    var tags = [];
    if (s.partnerId) tags.push(h('span', { class: 'tag link' }, icon('link'), 'Linked with ' + soulLabel(s.partnerId)));
    if (s.conflictPartnerId) tags.push(h('span', { class: 'tag conflict' }, icon('conflict'), 'Feud with ' + soulLabel(s.conflictPartnerId)));
    if (s.normalAngerProtected) tags.push(h('span', { class: 'tag protected' }, icon('protection'), 'Protected from normal anger' + (s.protectedBy ? ' (' + s.protectedBy + ')' : '')));
    if (s.separationRisk) tags.push(h('span', { class: 'tag separated', text: 'Partner aboard: +1 separation anger if you leave now' }));
    if (s.separationMarked) tags.push(h('span', { class: 'tag separated', text: 'Separated: +1 anger at return' }));
    if (opts.wishMatch) tags.push(h('span', { class: 'tag wish' }, icon('preferred'), 'Wishes for this stop'));
    var open = ui.detailSoulId === s.id;
    return h('article', { class: 'soul-card' + (opts.selected ? ' selected' : '') + (s.anger >= 2 ? ' angry' : ''), 'aria-label': soulLabel(s.id) },
      h('div', { class: 'soul-top' }, art(tid, 'portrait', true),
        h('div', null, h('span', { class: 'soul-id', text: s.id + ' · cohort ' + s.cohort }), h('h3', { class: 'soul-name', text: soulName(tid) }))),
      h('dl', { class: 'soul-stats' },
        h('div', null, h('dt', null, icon('seats'), 'Seats'), h('dd', { text: String(s.seats) })),
        h('div', null, h('dt', null, icon(s.reward && s.reward.kind === 'coin' ? 'obol' : 'flame'), 'Reward'), h('dd', { text: reward })),
        h('div', null, h('dt', null, icon('preferred'), 'Wish'), h('dd', { text: s.preferredDestinationId ? nodeName(s.preferredDestinationId) : 'none' })),
        h('div', null, h('dt', null, icon('anger'), 'Anger'), h('dd', { class: 'anger', 'aria-label': s.anger + ' of 3 anger' }, pips, h('span', { class: 'anger-num', text: ' ' + s.anger + '/3' })))),
      tags.length ? h('div', { class: 'tags' }, tags) : null,
      controls && controls.length ? h('div', { class: 'soul-controls' }, controls) : null,
      s.disabledReasons && s.disabledReasons.length && opts.showReasons !== false ? h('ul', { class: 'reasons' }, s.disabledReasons.map(function (r) { return h('li', { text: r }); })) : null,
      h('button', {
        type: 'button', class: 'link-button', key: 'detail-' + s.id, 'aria-expanded': open ? 'true' : 'false',
        text: open ? 'Hide details' : 'Details', onclick: function () { ui.detailSoulId = open ? null : s.id; render(); }
      }),
      open ? soulDetail(s, tid) : null);
  }

  function soulDetail(s, tid) {
    var known = discoveredSet();
    var notes = EVENT_IDS.filter(function (id) { return known[id] && EVENT_SOUL_TEMPLATES[id].indexOf(tid) >= 0; });
    return h('div', { class: 'soul-detail' },
      pick('souls', tid, 'flavor') ? h('p', { text: pick('souls', tid, 'flavor') }) : null,
      h('p', { class: 'subtle', text: 'Delivering earns a memory: ' + memoryHint(tid) + '.' }),
      notes.length ? h('div', { class: 'event-notes' }, h('strong', { text: 'Discovered events' }), h('ul', null, notes.map(function (id) {
        return h('li', null, h('b', { text: eventTitle(id) + '. ' }), pick('events', id, 'condition') + ' ' + pick('events', id, 'effect'));
      }))) : null);
  }
  function memoryHint(tid) {
    // Read-only lookup in the engine's frozen rules data; the UI never decides it.
    var rules = globalThis.CharonRules;
    var t = rules && rules.souls && rules.souls[tid];
    if (!t || !t.memory) return 'see the rules reference';
    if (t.memory === 'faint-joined') return memoryName('R06') + ', or ' + memoryName('R05') + ' if delivered together with their partner';
    return memoryName(t.memory);
  }
  function discoveredSet() {
    var set = {};
    knowledge.forEach(function (id) { set[id] = true; });
    ((view && view.discoveredEventIds) || []).forEach(function (id) { set[id] = true; });
    return set;
  }

  /* Deliver */

  function renderDeliver(box) {
    var ps = view.passengers || [];
    var chosen = ps.filter(function (p) { return ui.deliver[p.id]; }).map(function (p) { return p.id; });
    append(box, h('p', { class: 'section-intro', text: 'Choose everyone who disembarks here, then confirm once. Anyone not chosen stays aboard for a later stop. A missed wish has no penalty.' }));
    append(box, h('div', { class: 'tips' }, helpTip('promises', 'Promises'), helpTip('wishes', 'Wishes'), helpTip('pairs', 'Linked pairs')));
    if (!ps.length) append(box, h('p', { class: 'empty', text: 'The boat is empty. Continue to resolve this stop.' }));
    append(box, h('div', { class: 'soul-grid' }, ps.map(function (p) {
      var on = !!ui.deliver[p.id];
      return soulCard(p, [h('button', {
        type: 'button', class: on ? 'primary small' : 'secondary small', key: 'deliver-' + p.id, 'aria-pressed': on ? 'true' : 'false',
        text: on ? 'Disembarking' : 'Choose to disembark', onclick: function () { ui.deliver[p.id] = !on; render(); }
      })], { selected: on, wishMatch: p.preferredDestinationId === view.nodeId, showReasons: false });
    })));
    if (chosen.length && typeof Engine.previewDelivery === 'function') {
      var pv = Engine.previewDelivery(game, chosen);
      if (pv && pv.ok) {
        var t = pv.totals;
        append(box, h('div', { class: 'delivery-preview', 'aria-live': 'polite' },
          h('strong', { text: 'If you confirm: ' }),
          '+' + plural(t.obolsGained, 'obol') + ', +' + t.lightGained + ' light' + (t.lightLost ? ' (' + t.lightLost + ' lost at the cap)' : '') + ', light becomes ' + t.lightAfter + '. ',
          'Memories: ' + t.memories.map(function (m) { return memoryName(m.templateId); }).join(', ') + '.',
          h('span', { class: 'subtle', text: ' Hidden stop events are not included.' })));
      } else if (pv && pv.error) {
        append(box, h('p', { class: 'reason', text: pv.error.message }));
      }
    }
    var ok = view.permissions.canDeliver;
    append(box, h('div', { class: 'action-row' },
      h('button', { type: 'button', class: 'primary', key: 'deliver-confirm', disabled: !chosen.length || !ok, text: label('deliver') + ' (' + chosen.length + ')',
        onclick: function () { send({ type: 'DELIVER', soulIds: chosen }); } }),
      h('button', { type: 'button', class: 'secondary', key: 'deliver-none', disabled: !ok, text: label('deliverNone'),
        onclick: function () { send({ type: 'DELIVER', soulIds: [] }); } })));
  }

  /* Events */

  function eventCard(id, pending) {
    var body = pick('events', id, 'body');
    var choice = null;
    if (pending) {
      choice = [h('div', { class: 'action-row' },
        h('button', { type: 'button', class: 'primary', key: 'event-accept', disabled: !pending.canAccept, text: pick('events', id, 'acceptLabel') || 'Accept',
          onclick: function () { send({ type: 'RESOLVE_EVENT', eventId: id, accept: true }); } }),
        h('button', { type: 'button', class: 'secondary', key: 'event-decline', disabled: !pending.canDecline, text: pick('events', id, 'declineLabel') || 'Decline',
          onclick: function () { send({ type: 'RESOLVE_EVENT', eventId: id, accept: false }); } })),
        !pending.canAccept && pending.acceptDisabledReason ? h('p', { class: 'reason', text: pending.acceptDisabledReason }) : null];
    }
    return h('article', { class: 'event-card' },
      h('p', { class: 'eyebrow' }, icon('discovery'), 'Event revealed' + (pending ? '' : ' · automatic')),
      h('h3', { text: eventTitle(id) }),
      body ? h('p', { class: 'event-body', text: body }) : null,
      pick('events', id, 'condition') ? h('p', null, h('strong', { text: 'Why it happened: ' }), pick('events', id, 'condition')) : null,
      pick('events', id, 'effect') ? h('p', null, h('strong', { text: 'Effect: ' }), pick('events', id, 'effect')) : null,
      choice);
  }

  function renderEvent(box) {
    var ev = view.pendingEvent;
    if (!ev) { append(box, h('p', { text: 'Waiting for the event to resolve.' })); return; }
    append(box, eventCard(ev.eventId, ev));
  }

  /* Ended */

  function renderEnded(box) {
    var end = view.ended || {};
    var cause = end.cause || 'unknown';
    var s = end.summary || {};
    var d = s.delivered || {};
    var rows = [
      ['Cause', humanize(cause) + detailText(s.detail)],
      ['Completed cycles', s.completedCycles], ['Cycle reached', s.cycleReached], ['Crossings', s.crossings],
      ['Souls delivered', d.total], ['Wishes matched', d.wishMatches], ['Memories earned', s.memoriesEarned],
      ['Wraiths formed', s.wraithsFormed], ['Wraiths released', s.wraithsReleased], ['Wraiths still active', s.wraithsActive],
      ['Quotas paid', s.quotasPaid], ['Quotas missed', s.missedQuotas], ['Broken promises', s.brokenPromises],
      ['Final resources', s.final ? 'Light ' + s.final.light + ', obols ' + s.final.obols + ', hull ' + s.final.hull + ', reprimands ' + s.final.reprimands : null]
    ];
    var byDest = d.byDestination ? Object.keys(d.byDestination).map(function (k) { return nodeName(k) + ': ' + d.byDestination[k]; }).join(', ') : '';
    append(box, h('section', { class: 'terminal cause-' + cause },
      h('div', { class: 'terminal-art' }, art(cause === 'dismissal' ? 'apprentice' : (cause === 'sinking' ? 'boat' : 'wraith'), 'terminal-img', true)),
      h('div', null,
        h('p', { class: 'eyebrow', text: 'Run ended · ' + cause }),
        h('h3', { text: pick('endings', cause, 'title') || 'The run has ended' }),
        h('p', { text: pick('endings', cause, 'body') }),
        h('dl', { class: 'summary' }, rows.filter(function (r) { return r[1] !== undefined && r[1] !== null; }).map(function (r) {
          return h('div', { class: 'summary-row' }, h('dt', { text: r[0] }), h('dd', { text: String(r[1]) }));
        })),
        byDest ? h('p', { class: 'subtle', text: 'Delivered by destination: ' + byDest + '.' }) : null,
        d.souls && d.souls.length ? h('details', { class: 'delivered-list' }, h('summary', { text: 'Every delivered soul (' + d.souls.length + ')' }),
          h('ul', null, d.souls.map(function (x) { return h('li', { text: typeof x === 'object' ? soulLabel(x.soulId || x.id) + ' → ' + nodeName(x.destinationId || x.to) : String(x) }); }))) : null,
        h('p', { class: 'subtle', text: 'The run is endless: there is no victory screen. Each completed cycle is a checkpoint.' }),
        h('div', { class: 'action-row' },
          h('button', { type: 'button', class: 'primary', key: 'ended-new', text: label('newRun'), onclick: confirmNewRun }),
          h('button', { type: 'button', class: 'secondary', key: 'ended-export', text: label('exportRun'), onclick: exportRun })))));
  }
  function detailText(dt) {
    if (!dt) return '';
    if (dt.step) return ' (at ' + dt.step + ')';
    if (dt.to) return ' (crossing to ' + nodeName(dt.to) + ')';
    return '';
  }

  /* Prepare */

  function renderPrepare(box) {
    var atShore = view.nodeId === 'shore';
    var perm = view.permissions || {};

    if (atShore) {
      var shore = view.shore || [];
      append(box, section('Waiting shore', plural(shore.length, 'soul') + ' waiting',
        'Board passengers for this cycle; boarding is reversible until you depart. Waiting souls gain anger only when you return.' +
          (view.calmUsed ? ' Calming already used this cycle.' : ' You may calm one waiting soul this cycle for 1 obol.'),
        [h('div', { class: 'tips' }, helpTip('boarding', 'Boarding'), helpTip('promises', 'Promises'), helpTip('anger', 'Anger'), helpTip('calming', 'Calming')),
          shore.length ? h('div', { class: 'soul-grid' }, shore.map(function (s) {
            return soulCard(s, [
              h('button', { type: 'button', class: 'secondary small', key: 'board-' + s.id, disabled: !s.canBoard, onclick: function () { send({ type: 'BOARD', soulId: s.id }); } }, icon('board'), label('board')),
              h('button', { type: 'button', class: 'secondary small', key: 'calm-' + s.id, disabled: !s.canCalm, onclick: function () { send({ type: 'CALM', soulId: s.id }); } }, icon('calm'), label('calm') + ' (1 obol)')
            ]);
          })) : h('p', { class: 'empty', text: 'No souls are waiting.' })]));
    }

    var ps = view.passengers || [];
    append(box, section('Boat', view.capacity.used + ' of ' + view.capacity.max + ' seats',
      atShore ? 'Each passenger is a promise: deliver them before you return, or it counts as broken.' : 'Passengers still aboard. They can disembark only at a destination.',
      [capacityBar(), ps.length ? h('div', { class: 'soul-grid' }, ps.map(function (p) {
        var ctl = atShore ? [h('button', { type: 'button', class: 'secondary small', key: 'unboard-' + p.id, disabled: !p.canUnboard, onclick: function () { send({ type: 'UNBOARD', soulId: p.id }); } }, icon('unboard'), label('unboard'))] : [];
        return soulCard(p, ctl, { showReasons: atShore });
      })) : h('p', { class: 'empty', text: 'The boat is empty. Empty crossings are allowed.' })]));

    var ws = view.wraiths || [];
    if (ws.length) {
      append(box, section('Wraiths', ws.length + ' active',
        'Each active wraith adds 1 fog to every crossing. Releasing one costs 2 light and removes 1 reprimand; spending down to exactly 0 light is allowed.',
        h('div', { class: 'wraith-grid' }, ws.map(function (w) {
          return h('article', { class: 'wraith-card' }, art('wraith', 'wraith-art', true),
            h('div', null,
              h('strong', { text: 'Wraith of ' + soulName(w.templateId || templateOf(w.sourceSoulId)) }),
              h('span', { class: 'soul-id', text: w.sourceSoulId }),
              h('button', { type: 'button', class: 'secondary small', key: 'release-' + w.id, disabled: !w.canRelease, onclick: function () { send({ type: 'RELEASE_WRAITH', wraithId: w.id }); } }, icon('release'), label('release') + ' (2 light)'),
              !w.canRelease && w.disabledReason ? h('p', { class: 'reason', text: w.disabledReason }) : null));
        }))));
    }

    if (atShore || view.nodeId === 'haven') {
      append(box, section('Repairs', 'Hull ' + view.resources.hull + ' / ' + view.resources.hullMax,
        'Spend 1 obol to restore 1 hull. Repeatable until the hull is full.',
        h('div', { class: 'action-row' },
          h('button', { type: 'button', class: 'secondary', key: 'repair', disabled: !perm.canRepair, onclick: function () { send({ type: 'REPAIR' }); } }, icon('repair'), label('repair') + ' (1 obol)'),
          !perm.canRepair && perm.repairDisabledReason ? h('span', { class: 'reason', text: perm.repairDisabledReason }) : null)));
    }

    renderMemories(box);
    renderRoutes(box);
  }

  function section(title, pill, intro, body) {
    return h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h3', { text: title }), pill ? h('span', { class: 'pill', text: pill }) : null),
      intro ? h('p', { class: 'section-intro', text: intro }) : null, body);
  }

  function capacityBar() {
    var used = view.capacity.used, max = view.capacity.max, cells = [];
    for (var i = 0; i < Math.max(max, used); i++) cells.push(h('span', { class: 'seat-cell' + (i < used ? ' used' : '') + (i >= max ? ' over' : '') }));
    return h('div', { class: 'capacity' }, art('boat', 'boat-art', true),
      h('div', { class: 'seat-row', role: 'img', 'aria-label': used + ' of ' + max + ' seats used' }, cells),
      h('span', { class: 'subtle', text: used + ' / ' + max + ' seats' }));
  }

  function renderMemories(box) {
    var hand = view.hand || [];
    var mc = view.memoryCounts || {};
    var status = view.memoryPlayedThisCrossing ? 'A memory has been played for this crossing.' : 'Free to play; at most one per crossing.';
    append(box, section('Memories', 'Hand ' + hand.length + ' · draw pile ' + (mc.draw || 0) + ' · discard ' + (mc.discard || 0),
      status + ' Protection lasts only for the next crossing unless the card marks a waiting soul.',
      [helpTip('memoryTargets', 'Marking a waiting soul'),
        hand.length ? h('div', { class: 'memory-grid' }, hand.map(memoryCard)) : h('p', { class: 'empty', text: 'No memories in hand. Each delivered soul adds one to your draw pile.' })]));
  }

  function memoryCard(m) {
    var tid = m.templateId;
    var targets = m.validTargetIds || [];
    var chosen = ui.memoryTargets[m.id] || '';
    var select = null;
    if (m.takesTarget || targets.length) {
      var selId = 'target-' + m.id;
      var shoreById = {};
      (view.shore || []).forEach(function (s) { shoreById[s.id] = s; });
      select = h('label', { class: 'target', for: selId }, 'Mark a waiting soul (optional)',
        h('select', { id: selId, key: selId, disabled: !m.canPlay, onchange: function (e) { ui.memoryTargets[m.id] = e.target.value; } },
          h('option', { value: '', text: 'No mark (protection only)' }),
          targets.map(function (t) {
            var s = shoreById[t];
            var o = h('option', { value: t, text: soulLabel(t) + (s ? ', anger ' + s.anger : '') });
            if (chosen === t) o.selected = true;
            return o;
          })));
    }
    var srcT = templateOf(m.sourceSoulId);
    return h('article', { class: 'memory-card' + (m.canPlay ? '' : ' unplayable') },
      h('div', { class: 'memory-head' }, icon(tid), h('span', { class: 'memory-id', text: tid })),
      h('h4', { text: memoryName(tid) }),
      h('p', { class: 'memory-effect', text: pick('memories', tid, 'description') }),
      h('p', { class: 'memory-source', text: 'From ' + soulLabel(m.sourceSoulId) + (m.deliveredTo ? ', delivered to ' + nodeName(m.deliveredTo) : '') }),
      pick('souls', srcT, 'memoryFlavor') ? h('p', { class: 'memory-flavor', text: pick('souls', srcT, 'memoryFlavor') }) : null,
      select,
      h('button', { type: 'button', class: 'primary small', key: 'play-' + m.id, disabled: !m.canPlay,
        onclick: function () { send({ type: 'PLAY_MEMORY', memoryId: m.id, targetSoulId: ui.memoryTargets[m.id] || null }); } }, icon('playMemory'), label('playMemory')),
      !m.canPlay && m.disabledReason ? h('p', { class: 'reason', text: m.disabledReason }) : null);
  }

  function routeKey(r) { return r.to + ':' + (r.variant || 'normal'); }

  function renderRoutes(box) {
    var rs = (view.routes || []).slice().sort(function (a, b) {
      return (a.legal === b.legal ? 0 : a.legal ? -1 : 1) || NODE_IDS.indexOf(a.to) - NODE_IDS.indexOf(b.to) || (a.variant === 'rocky') - (b.variant === 'rocky');
    });
    append(box, section('Next crossing', rs.filter(function (r) { return r.legal; }).length + ' routes open',
      'The large number is the fog this crossing will deal. Rocky routes also damage the hull. Unknown stop events are never included.',
      [h('div', { class: 'tips' }, helpTip('routes', 'Routes'), helpTip('light', 'Light'), helpTip('hull', 'Hull'), helpTip('escalation', 'Later cycles')),
        rs.length ? h('div', { class: 'route-grid' }, rs.map(routeCard)) : h('p', { class: 'empty', text: 'No routes.' })]));
  }

  function routeCard(r) {
    var sel = ui.route && routeKey(ui.route) === routeKey(r);
    var rocky = r.variant === 'rocky';
    var br = r.breakdown || {};
    return h('article', { class: 'route-card' + (sel ? ' selected' : '') + (r.lethal ? ' lethal' : '') + (r.legal ? '' : ' illegal') },
      h('div', { class: 'route-head' },
        h('span', { class: 'route-to', text: (r.to === 'shore' ? 'Return to ' : 'To ') + nodeName(r.to) }),
        rocky ? h('span', { class: 'badge rocky' }, icon('rock'), 'Rocky') : null,
        r.to === 'shore' ? h('span', { class: 'badge cycle', text: 'Ends the cycle' }) : null),
      h('div', { class: 'route-numbers' },
        h('div', { class: 'fog-number' }, h('span', { class: 'fog-value', text: String(r.fogDamage) }), h('small', { text: 'fog' })),
        h('div', { class: 'hull-number' + (r.hullDamage ? ' hit' : '') }, r.hullDamage ? [icon('hull'), '⚠ −' + r.hullDamage + ' hull'] : 'No hull damage')),
      r.legal ? h('p', { class: 'route-after', text: r.lethal ? '' : 'After crossing: light ' + fmt(r.lightAfter) + ', hull ' + fmt(r.hullAfter) + ' (before arrival rewards)' }) : null,
      r.lethal ? h('p', { class: 'lethal-note', text: r.failureCause === 'sinking' ? 'Ends the run: the hull would break.' : 'Ends the run: fog exceeds your light.' }) : null,
      r.legal ? h('details', { class: 'breakdown' }, h('summary', { text: 'Why this number?' }),
        h('dl', null, Object.keys(BREAKDOWN_LABELS).filter(function (k) { return br[k] !== undefined; }).map(function (k) {
          return h('div', null, h('dt', { text: BREAKDOWN_LABELS[k] }), h('dd', { text: (/Protection$/.test(k) && br[k] ? '−' : '') + fmt(br[k]) }));
        }), br.favorableApplied ? h('p', { class: 'subtle', text: 'Favored destination: cycle modifier skipped.' }) : null)) : null,
      r.legal ? h('button', { type: 'button', class: sel ? 'primary small' : 'secondary small', key: 'route-' + routeKey(r),
        'aria-pressed': sel ? 'true' : 'false', 'aria-label': (sel ? 'Selected: ' : 'Select ') + (rocky ? 'rocky ' : '') + 'route to ' + nodeName(r.to) + ', fog ' + r.fogDamage + (r.hullDamage ? ', hull damage ' + r.hullDamage : ''),
        text: sel ? 'Selected' : 'Select route', onclick: function () { ui.route = { to: r.to, variant: r.variant }; render(); } }) : null,
      !r.legal && r.disabledReason ? h('p', { class: 'reason', text: r.disabledReason }) : null);
  }
  function fmt(v) { return v === null || v === undefined ? 'n/a' : String(v); }

  function selectedRoute() {
    if (!ui.route) return null;
    return (view.routes || []).filter(function (r) { return routeKey(r) === routeKey(ui.route); })[0] || null;
  }

  /* Aside: departure and return forecast */

  function renderAside() {
    var box = clear($('aside-body'));
    if (view.phase !== 'prepare') {
      append(box, h('p', { class: 'subtle', text: view.phase === 'ended' ? 'No further crossings.' : 'Resolve this stop before preparing the next crossing.' }));
      if (view.phase !== 'ended') append(box, forecastBlock(null));
      return;
    }
    var r = selectedRoute();
    if (!r) append(box, h('p', { class: 'subtle', text: 'Select a route on the map or under Next crossing.' }));
    else {
      append(box, h('div', { class: 'aside-route' },
        h('p', { class: 'eyebrow', text: r.variant === 'rocky' ? 'Rocky crossing' : 'Crossing' }),
        h('h3', { text: nodeName(view.nodeId) + ' → ' + nodeName(r.to) }),
        h('div', { class: 'aside-fog' }, h('span', { class: 'big', text: String(r.fogDamage) }), h('span', { text: 'fog against your ' + view.resources.light + ' light' })),
        r.hullDamage ? h('p', { class: 'hull-warn', text: '⚠ Rocky: ' + r.hullDamage + ' hull damage after the fog (hull ' + view.resources.hull + ' → ' + fmt(r.hullAfter) + ').' }) : null,
        r.lethal ? h('p', { class: 'warning', text: 'Known losing move: ' + (r.failureCause === 'sinking' ? 'the boat would sink.' : 'the lantern would fail.') }) : null));
    }
    append(box, forecastBlock(r));
    var dismissal = r && r.to === 'shore' && view.returnForecast && view.returnForecast.dismissalIfReturnNow;
    append(box, h('button', {
      type: 'button', class: 'primary depart' + (r && (r.lethal || dismissal) ? ' danger' : ''), key: 'depart', disabled: !r || !r.legal || !view.permissions.canDepart,
      onclick: function () { if (r) depart(r); }
    }, icon('depart'), r ? label('depart') + (r.to === 'shore' ? ': return to ' : ' to ') + nodeName(r.to) : label('depart')));
  }

  function forecastBlock(r) {
    var f = view.returnForecast;
    if (!f) return null;
    var returning = r && r.to === 'shore';
    var waiting = (f.waiting || []).filter(function (w) { return w.projectedAnger !== w.currentAnger || w.willTransform; });
    return h('div', { class: 'forecast' + (returning ? ' active' : '') },
      h('p', { class: 'eyebrow', text: returning ? 'When you return now' : 'Cycle-end forecast' }),
      h('p', { class: 'subtle', text: 'Waiting anger is exact for your current choices. Broken promises count passengers still aboard; delivering them first removes them.' }),
      h('ul', { class: 'forecast-list' },
        h('li', null, h('span', { text: 'Waiting souls gaining anger' }), h('strong', { text: String(waiting.length) })),
        h('li', null, h('span', { text: 'Would become wraiths' }), h('strong', { text: String(f.transformations) })),
        h('li', null, h('span', { text: 'Broken promises if you return now' }), h('strong', { text: String(f.brokenPromisesIfReturnNow) })),
        h('li', null, h('span', { text: 'Reprimands after return' }), h('strong', { text: f.reprimandsAfterReturn + ' / ' + view.resources.reprimandsMax })),
        f.quotaDueAtReturn ? h('li', null, h('span', { text: 'Quota due at this return' }), h('strong', { text: f.quotaShortfallAtReturn ? 'short' : 'payable' })) : null),
      waiting.length ? h('details', { class: 'forecast-waiting' }, h('summary', { text: 'Anger at return' }),
        h('ul', null, waiting.map(function (w) {
          return h('li', { text: soulLabel(w.soulId) + ': ' + w.currentAnger + ' → ' + w.projectedAnger + (w.separationAnger ? ' (includes separation)' : '') + (w.willTransform ? ', becomes a wraith' : '') });
        }))) : null,
      f.dismissalIfReturnNow ? h('p', { class: 'warning', text: 'Returning now would end the apprenticeship.' }) : null,
      (f.warnings || []).filter(function (w) { return w.code !== 'DISMISSAL'; }).map(function (w) { return h('p', { class: 'caution', text: w.message || String(w.code || w) }); }));
  }

  function depart(r) {
    var dismissal = r.to === 'shore' && view.returnForecast && view.returnForecast.dismissalIfReturnNow;
    var action = { type: 'DEPART', to: r.to, variant: r.variant };
    if (!r.lethal && !dismissal) { send(action); return; }
    var lines = [];
    if (r.lethal) lines.push(r.failureCause === 'sinking' ? 'This rocky crossing would break the hull and end the run before arrival.' : 'Fog ' + r.fogDamage + ' exceeds your ' + view.resources.light + ' light. The run would end before arrival.');
    if (dismissal) lines.push('Returning now is predicted to reach ' + view.resources.reprimandsMax + ' reprimands and end the apprenticeship.');
    lines.push('Nothing after this can undo it.');
    confirmDialog('Make a losing move?', lines, 'Depart anyway', function () { send(action); }, true);
  }

  /* History */

  function renderHistory() {
    var box = clear($('history'));
    var hist = (view.history || []).filter(function (e) { return e.type !== 'SETUP'; });
    if (!hist.length) { append(box, h('p', { class: 'subtle', text: 'Nothing recorded yet.' })); return; }
    append(box, h('ol', { class: 'history-list', reversed: true }, hist.slice().reverse().map(function (e) {
      return h('li', null, h('span', { class: 'history-meta', text: 'C' + e.cycle + ' ' + nodeName(e.nodeId) }), logText(e));
    })));
  }

  /* ---------- Dialogs ---------- */

  function confirmDialog(title, lines, okText, onOk, danger) {
    var d = $('confirm-dialog');
    clear(d);
    append(d, [
      h('h2', { id: 'confirm-title', text: title }),
      lines.map(function (l) { return h('p', { text: l }); }),
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', class: 'secondary', text: 'Cancel', onclick: function () { d.close(); } }),
        h('button', { type: 'button', class: 'primary' + (danger ? ' danger' : ''), text: okText, onclick: function () { d.close(); onOk(); } }))
    ]);
    d.showModal();
    d.querySelector('button').focus();
  }

  function confirmNewRun() {
    if (!game || view.phase === 'ended') { newRun(); return; }
    confirmDialog('Start a new run?', [
      'The current run (cycle ' + view.cycle + ') will be replaced. No resources, souls or memories carry over.',
      'Your event reference is kept. Clear it separately if you want to.'
    ], label('newRun'), newRun, true);
  }

  function dialogHead(title) {
    return h('div', { class: 'dialog-head' }, h('h2', { text: title }),
      h('button', { type: 'button', class: 'icon-button', 'aria-label': 'Close', text: '×', onclick: function (e) { e.target.closest('dialog').close(); } }));
  }

  function openHelp() {
    var d = $('help-dialog');
    clear(d);
    var c = content();
    var tut = c && Array.isArray(c.tutorial) ? c.tutorial.filter(function (t) { return t && str(t.title); }) : [];
    var keys = HELP_ORDER.filter(function (k) { return helpText(k); });
    append(d, [
      dialogHead('How to play'),
      h('p', { text: topText('intro') }),
      tut.length ? h('ol', { class: 'tutorial' }, tut.map(function (t) { return h('li', null, h('strong', { text: t.title }), h('p', { text: t.body || '' })); })) : null,
      h('h3', { text: 'Rules reference' }),
      h('dl', { class: 'help-list' }, keys.map(function (k) { return h('div', null, h('dt', { text: humanize(k) }), h('dd', { text: helpText(k) })); }))
    ]);
    d.showModal();
  }

  function openReference(showSpoilers) {
    var d = $('reference-dialog');
    clear(d);
    var known = discoveredSet();
    append(d, [
      dialogHead('Event reference'),
      h('p', { text: 'A knowledge reference, not progression. Events you discover are remembered in this browser across runs. Undiscovered events stay hidden unless you choose to see spoilers.' }),
      h('div', { class: 'reference-list' }, EVENT_IDS.map(function (id) {
        var isKnown = !!known[id], reveal = isKnown || showSpoilers;
        return h('article', { class: 'reference-item' + (isKnown ? ' known' : '') },
          h('p', { class: 'eyebrow', text: id + (isKnown ? ' · discovered' : ' · undiscovered') }),
          h('h3', { text: reveal ? eventTitle(id) : 'Hidden event' }),
          reveal ? h('p', null, h('strong', { text: 'Condition: ' }), pick('events', id, 'condition')) : h('p', { class: 'subtle', text: 'Not yet encountered.' }),
          reveal ? h('p', null, h('strong', { text: 'Effect: ' }), pick('events', id, 'effect')) : null);
      })),
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', class: 'secondary', key: 'spoilers', text: showSpoilers ? 'Hide spoilers' : 'Show all events (spoilers)', onclick: function () { openReference(!showSpoilers); } }),
        h('button', { type: 'button', class: 'secondary', key: 'clear-discoveries', text: label('clearDiscoveries'), disabled: !knowledge.length,
          onclick: function () {
            d.close();
            confirmDialog('Clear the event reference?', ['This forgets discovered event notes in this browser. It does not change the current run or its events.'], label('clearDiscoveries'), function () {
              knowledge = []; storageRemove(KNOWLEDGE_KEY); flash('Event reference cleared.', 'info'); if (view) render();
            }, true);
          } }))
    ]);
    if (!d.open) d.showModal();
  }

  /* ---------- Export / import ---------- */

  function exportRun() {
    if (!game) { flash('There is no run to export yet.', 'warn'); return; }
    var payload = {
      kind: 'charon-v0.3-run-export', exportedAt: new Date().toISOString(), appVersion: APP_VERSION,
      engineVersion: Engine.version || null, contentVersion: content() ? content().version : null,
      assetsRevision: pack() ? (pack().revision || pack().version) : null,
      save: Engine.serialize(game), view: view, sessionLog: sessionLog
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = h('a', { href: URL.createObjectURL(blob), download: 'ferryman-v0.3-cycle' + view.cycle + '.json' });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    flash('Run exported as a JSON file. Load save accepts this file.', 'info');
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var text = String(reader.result || '');
      try {
        var parsed = JSON.parse(text);
        if (parsed && parsed.kind === 'charon-v0.3-run-export' && typeof parsed.save === 'string') text = parsed.save;
      } catch (e) { /* the engine reports the error */ }
      var res = tryLoadSave(text, 'file');
      if (res.ok) { showScreen('game'); render(); flash('Loaded the run from the file.', 'info'); focusHeading(); }
      else flash(res.message, 'error');
    };
    reader.onerror = function () { flash('Could not read the file.', 'error'); };
    reader.readAsText(file);
  }

  /* ---------- Screens and boot ---------- */

  function showScreen(name) {
    $('start-screen').hidden = name !== 'start';
    $('game-screen').hidden = name !== 'game';
    $('blocked-screen').hidden = name !== 'blocked';
    $('export-btn').disabled = name !== 'game';
  }

  function wireChrome() {
    $('help-btn').addEventListener('click', openHelp);
    $('reference-btn').addEventListener('click', function () { openReference(false); });
    $('export-btn').addEventListener('click', exportRun);
    $('newrun-btn').addEventListener('click', function () { if (Engine) confirmNewRun(); });
    $('import-input').addEventListener('change', function (e) { if (e.target.files[0] && Engine) importFile(e.target.files[0]); e.target.value = ''; });
    document.title = topText('title');
    $('title').textContent = topText('title');
    $('start-title').textContent = topText('title');
    $('start-intro').textContent = topText('intro');
    $('hero-art').appendChild(art('apprentice', 'hero-img'));
    $('export-btn').textContent = label('exportRun');
    $('newrun-btn').textContent = label('newRun');
    var missing = [];
    if (!content()) missing.push('content.js (fallback copy in use)');
    if (!pack()) missing.push('assets/assets.js (art placeholders in use)');
    if (missing.length) { var n = $('pack-note'); n.hidden = false; n.textContent = 'Missing: ' + missing.join('; ') + '.'; }
  }

  function bootEngine() {
    var saved = storageGet(RUN_KEY);
    var start = clear($('start-actions'));
    if (saved) {
      var probe;
      try { probe = Engine.deserialize(saved); } catch (e) { probe = { ok: false, error: { message: e.message } }; }
      if (probe && probe.ok) {
        var pv = Engine.getView(probe.state);
        append(start, h('button', { type: 'button', class: 'primary', key: 'resume',
          text: label('resume') + ' (cycle ' + pv.cycle + (pv.phase === 'ended' ? ', ended' : '') + ')',
          onclick: function () { setGame(probe.state, false); showScreen('game'); render(); focusHeading(); } }));
      } else {
        // Keep the unreadable save aside instead of deleting it.
        storageSet(REJECTED_KEY, saved);
        storageRemove(RUN_KEY);
        append(start, h('p', { class: 'warning', text: 'A saved run could not be loaded (' + ((probe && probe.error && probe.error.message) || 'invalid save') + '). It was set aside, not deleted.' }));
      }
    }
    append(start, h('button', { type: 'button', class: saved ? 'secondary' : 'primary', key: 'start-new', text: label('newRun'), onclick: newRun }));
    append(start, h('button', { type: 'button', class: 'secondary', text: 'How to play', onclick: openHelp }));
    showScreen('start');
  }

  function boot() {
    wireChrome();
    var E = globalThis.CharonEngine;
    var api = ['createGame', 'getView', 'dispatch', 'serialize', 'deserialize'];
    if (!E || api.some(function (f) { return typeof E[f] !== 'function'; })) {
      $('blocked-text').textContent = 'The game engine (rules-data.js and engine.js) did not load. Serve this folder over local HTTP and reload.';
      showScreen('blocked');
      return;
    }
    Engine = E;
    bootEngine();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
