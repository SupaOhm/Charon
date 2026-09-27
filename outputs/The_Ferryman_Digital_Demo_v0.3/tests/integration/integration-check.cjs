#!/usr/bin/env node
/* Worker D static and contract integration checks. Node built-ins only.
 *   node tests/integration/integration-check.cjs
 * Checks the delivered folder: script order, local-only paths, safe text
 * rendering, public engine API use, canonical actions, storage separation,
 * no development fixtures, engine contract basics, and content/art packs.
 * Writes tests/integration/results.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const results = [];
function check(name, fn) {
  try { const d = fn(); results.push({ name, status: 'PASS', detail: d || '' }); }
  catch (e) { results.push({ name, status: 'FAIL', detail: e.message }); }
}
function assert(c, m) { if (!c) throw new Error(m); }
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
function loadGlobals(files) {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  files.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
  return ctx;
}

check('index.html loads scripts in contract order', () => {
  const srcs = [...read('index.html').matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
  const want = ['rules-data.js', 'engine.js', 'assets/assets.js', 'content.js', 'app.js'];
  assert(JSON.stringify(srcs) === JSON.stringify(want), JSON.stringify(srcs));
  want.forEach((f) => assert(exists(f), 'missing ' + f));
  return srcs.join(', ');
});

check('no remote URLs, CDN, fetch or remote fonts in UI files', () => {
  for (const f of ['index.html', 'app.js', 'styles.css']) {
    const hit = read(f).match(/(?:src|href)\s*=\s*["']?(?:https?:)?\/\/|url\(\s*["']?(?:https?:)?\/\/|@import|fetch\(|XMLHttpRequest/);
    assert(!hit, f + ': ' + (hit && hit[0]));
  }
});

check('local references in index.html exist', () => {
  const refs = [...read('index.html').matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
  refs.forEach((r) => assert(exists(r), 'missing ' + r));
  return refs.length + ' references';
});

check('app.js renders text only (no innerHTML, insertAdjacentHTML, document.write, eval)', () => {
  assert(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/.test(read('app.js')), 'raw HTML/code sink');
});

check('app.js calls only the public engine API', () => {
  const used = new Set([...read('app.js').matchAll(/Engine\.(\w+)/g)].map((m) => m[1]));
  const allowed = new Set(['createGame', 'getView', 'dispatch', 'serialize', 'deserialize', 'previewDelivery', 'version']);
  const extra = [...used].filter((u) => !allowed.has(u));
  assert(!extra.length, 'non-public: ' + extra.join(', '));
  return [...used].sort().join(', ');
});

check('app.js dispatches only canonical actions', () => {
  const types = new Set([...read('app.js').matchAll(/type:\s*'([A-Z_]+)'/g)].map((m) => m[1]));
  const canon = ['BOARD', 'UNBOARD', 'CALM', 'RELEASE_WRAITH', 'REPAIR', 'PLAY_MEMORY', 'DEPART', 'DELIVER', 'RESOLVE_EVENT'];
  const extra = [...types].filter((x) => !canon.includes(x));
  assert(!extra.length, extra.join(', '));
  return [...types].sort().join(', ');
});

check('run save and discovery knowledge use separate keys; New Run leaves knowledge alone', () => {
  const t = read('app.js');
  const run = /RUN_KEY = '([^']+)'/.exec(t)[1], kn = /KNOWLEDGE_KEY = '([^']+)'/.exec(t)[1];
  assert(run !== kn, 'same key');
  const body = t.slice(t.indexOf('function newRun'), t.indexOf('function randomSeed'));
  assert(!/KNOWLEDGE|knowledge/.test(body), 'newRun touches knowledge');
  return run + ' / ' + kn;
});

check('release build has no development fixtures or cheat paths', () => {
  assert(!exists('ui/fixtures.js'), 'ui/fixtures.js present');
  const t = read('app.js');
  assert(!/fixture|cheat|debug\s*=|\?dev/i.test(t), 'fixture/cheat reference in app.js');
});

let E = null;
check('engine loads as classic scripts (browser path) and exposes the contract API', () => {
  const ctx = loadGlobals(['rules-data.js', 'engine.js']);
  E = ctx.CharonEngine;
  assert(E, 'CharonEngine global missing');
  ['createGame', 'getView', 'dispatch', 'serialize', 'deserialize'].forEach((f) => assert(typeof E[f] === 'function', 'missing ' + f));
  return 'engine ' + JSON.stringify(E.version);
});

if (E) {
  check('initial view: spec start values', () => {
    const v = E.getView(E.createGame({ seed: 1 }));
    const r = v.resources;
    assert(v.phase === 'prepare' && v.nodeId === 'shore' && v.cycle === 1 && v.completedCycles === 0, 'start position');
    assert(r.light === 2 && r.lightMax === 6 && r.obols === 2 && r.hull === 3 && r.hullMax === 3 && r.reprimands === 0 && r.reprimandsMax === 3, JSON.stringify(r));
    assert(v.shore.length === 5 && v.capacity.max === 4 && v.hand.length === 0, 'shore/capacity/hand');
    assert(v.nextQuota.dueAfterCycle === 3 && v.nextQuota.amount === 2, 'quota');
  });
  check('invalid action: ok:false, same state, error code and message', () => {
    const s = E.createGame({ seed: 1 });
    const res = E.dispatch(s, { type: 'NOPE' });
    assert(!res.ok && res.state === s && res.error.code && res.error.message, JSON.stringify(res.error));
  });
  check('deserialize rejects malformed saves', () => {
    ['', '{', '{"schemaVersion":99}', '{"schemaVersion":1,"rulesVersion":"0.3","state":{}}'].forEach((t) => assert(!E.deserialize(t).ok, 'accepted ' + t));
  });
}

check('content pack: all stable IDs present, strings only', () => {
  const c = loadGlobals(['content.js']).CHARON_CONTENT;
  assert(c && c.version === '0.3', 'CHARON_CONTENT');
  ['shore', 'elysium', 'asphodel', 'tartarus', 'haven'].forEach((k) => assert(c.nodes[k] && c.nodes[k].name, 'node ' + k));
  for (let i = 1; i <= 12; i++) assert(c.souls['S' + String(i).padStart(2, '0')], 'soul ' + i);
  for (let i = 1; i <= 6; i++) assert(c.memories['R0' + i], 'memory ' + i);
  for (let i = 1; i <= 4; i++) assert(c.events['E0' + i], 'event ' + i);
  ['fog', 'sinking', 'dismissal'].forEach((k) => assert(c.endings[k] && c.endings[k].title, 'ending ' + k));
  const walk = (o) => Object.values(o).forEach((v) => { assert(typeof v !== 'function', 'function in content'); if (v && typeof v === 'object') walk(v); });
  walk(c);
  return Object.keys(c.help).length + ' help entries, ' + c.tutorial.length + ' tutorial steps';
});

check('art pack: essential keys and every referenced file exist locally', () => {
  const a = loadGlobals(['assets/assets.js']).CHARON_ASSETS;
  const need = ['apprentice', 'boat', 'wraith', 'shore', 'elysium', 'asphodel', 'tartarus', 'haven'];
  need.forEach((k) => assert(a.images[k], 'missing ' + k));
  let n = 0;
  ['images', 'icons', 'components'].forEach((g) => Object.entries(a[g] || {}).forEach(([k, e]) => {
    assert(typeof e.src === 'string' && !/^(data:|https?:|\/\/)/.test(e.src), g + '.' + k + ' bad src');
    assert(exists(e.src), g + '.' + k + ' missing ' + e.src);
    n++;
  }));
  return n + ' manifest entries resolve';
});

check('icons referenced by app.js exist in the manifest', () => {
  const a = loadGlobals(['assets/assets.js']).CHARON_ASSETS;
  const used = new Set([...read('app.js').matchAll(/icon\('([A-Za-z0-9_]+)'\)/g)].map((m) => m[1]));
  const miss = [...used].filter((k) => !a.icons[k]);
  assert(!miss.length, 'missing icons ' + miss.join(', '));
  return used.size + ' icons';
});

const counts = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
for (const r of results) console.log(r.status.padEnd(5) + ' ' + r.name + (r.detail ? '  [' + r.detail + ']' : ''));
console.log('\n' + JSON.stringify(counts));
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify({ ranAt: new Date().toISOString(), node: process.version, counts, results }, null, 2) + '\n');
process.exitCode = counts.FAIL ? 1 : 0;
