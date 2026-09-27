#!/usr/bin/env node
/* Worker D browser verification: real engine, real clicks.
 *   node tests/integration/browser-flows.cjs [--chrome /path/to/chrome]
 * Serves this folder on 127.0.0.1 (Node http), drives a locally installed
 * headless Chrome over the DevTools protocol (Node's global WebSocket), and
 * plays legal moves by clicking the interface. Each check compares what the
 * page shows with CharonEngine.getView() of the run the page saved.
 * Agent-driven automation: not a human playtest, not balance evidence.
 * Evidence: verification/browser/runs/{results.json,*.png,export.json}
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'verification', 'browser', 'runs');
const ai = process.argv.indexOf('--chrome');
const CHROME = ai > 0 ? process.argv[ai + 1]
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function launchChrome() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'charon-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--window-size=1280,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('Chrome did not start')), 20000);
    proc.on('error', (e) => { clearTimeout(t); reject(e); });
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(buf);
      if (m) { clearTimeout(t); resolve({ proc, profile, port: new URL(m[1]).port }); }
    });
  });
}

class Page {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.exceptions = []; this.errors = []; this.warnings = []; this.handlers = {};
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
        return;
      }
      if (m.method === 'Runtime.exceptionThrown') this.exceptions.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
        (m.params.type === 'error' ? this.errors : this.warnings).push(m.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' '));
      }
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') this.errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
      const hs = this.handlers[m.method];
      if (hs) hs.splice(0).forEach((f) => f(m.params));
    });
  }
  send(method, params) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params: params || {} }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method) { return new Promise((r) => { (this.handlers[method] = this.handlers[method] || []).push(r); }); }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('page eval: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
    return r.result.value;
  }
  async goto(url) { const l = this.once('Page.loadEventFired'); await this.send('Page.navigate', { url }); await l; await sleep(150); await this.inject(); }
  async reload() { const l = this.once('Page.loadEventFired'); await this.send('Page.reload', { ignoreCache: true }); await l; await sleep(150); await this.inject(); }
  async key(key, code, keyCode) {
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, text: key === 'Enter' ? '\r' : (key === ' ' ? ' ' : undefined) });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
    await sleep(40);
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64'));
    return 'runs/' + name + '.png';
  }
  // Test helpers that live in the page. They read the page's own saved run
  // through the engine; they never write game state.
  inject() {
    return this.eval(`window.T = {
      view() { const t = localStorage.getItem('charon.v03.run'); if (!t) return null; const r = CharonEngine.deserialize(t); return r.ok ? CharonEngine.getView(r.state) : null; },
      el(k) { return document.querySelector('[data-key="' + k + '"]'); },
      click(k) { const e = this.el(k); if (!e) throw new Error('no element ' + k); if (e.disabled) throw new Error('disabled ' + k); e.click(); return true; },
      has(k) { return !!this.el(k); },
      enabled(k) { const e = this.el(k); return !!e && !e.disabled; },
      stats() { return Array.from(document.querySelectorAll('.stat-value')).map(e => e.textContent); },
      text(sel) { return Array.from(document.querySelectorAll(sel)).map(e => e.textContent.trim()); },
      msg() { const m = document.getElementById('message'); return m.hidden ? '' : m.textContent; },
      dialogOpen(id) { return document.getElementById(id).open; },
      dialogClick(id, label) { const b = Array.from(document.querySelectorAll('#' + id + ' button')).find(x => x.textContent.trim() === label); if (!b) throw new Error('no dialog button ' + label); b.click(); return true; },
      overflow() { return document.documentElement.scrollWidth - document.documentElement.clientWidth; }
    }; true`);
  }
}

const results = [];
let current = 'setup';
function assert(c, m) { if (!c) throw new Error(m); }
async function check(name, fn) {
  current = name;
  try { const d = await fn(); results.push({ name, status: 'PASS', detail: d === undefined ? '' : d }); }
  catch (e) { results.push({ name, status: 'FAIL', detail: e.message }); }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const chrome = await launchChrome();
  let P;
  try {
    const list = await (await fetch('http://127.0.0.1:' + chrome.port + '/json/list')).json();
    const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    P = new Page(ws);
    await P.send('Page.enable'); await P.send('Runtime.enable'); await P.send('Log.enable'); await P.send('DOM.enable');
    await P.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await P.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT, eventsEnabled: true }).catch(() => {});

    const V = () => P.eval('T.view()');
    const click = (k) => P.eval('T.click(' + JSON.stringify(k) + ')');
    const has = (k) => P.eval('T.has(' + JSON.stringify(k) + ')');
    const enabled = (k) => P.eval('T.enabled(' + JSON.stringify(k) + ')');
    const stats = () => P.eval('T.stats()');
    const msg = () => P.eval('T.msg()');
    async function statsMatch(v) {
      const s = await stats(), r = v.resources;
      const want = [r.light + ' / ' + r.lightMax, String(r.obols), r.hull + ' / ' + r.hullMax, r.reprimands + ' / ' + r.reprimandsMax, String(v.cycle)];
      assert(JSON.stringify(s.slice(0, 5)) === JSON.stringify(want), 'status bar ' + JSON.stringify(s.slice(0, 5)) + ' vs engine ' + JSON.stringify(want));
    }
    async function depart(to, variant, confirm) {
      await click('route-' + to + ':' + (variant || 'normal'));
      await click('depart');
      if (await P.eval(`T.dialogOpen('confirm-dialog')`)) {
        if (!confirm) throw new Error('unexpected confirmation dialog for ' + to);
        await P.eval(`T.dialogClick('confirm-dialog', 'Depart anyway')`);
      }
      return V();
    }
    // Courier cycle via clicks: board by highest anger, sail to the preferred stop, deliver all, return.
    async function courierCycle() {
      for (;;) {
        const v = await V();
        const s = v.shore.filter((x) => x.canBoard).sort((a, b) => b.anger - a.anger)[0];
        if (!s) break;
        await click('board-' + s.id);
      }
      let v = await V();
      const counts = {};
      v.passengers.forEach((p) => { counts[p.preferredDestinationId] = (counts[p.preferredDestinationId] || 0) + 1; });
      const dest = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'elysium';
      v = await depart(dest, 'normal', false);
      if (v.phase === 'ended') return v;
      for (const p of v.passengers) await click('deliver-' + p.id);
      await click(v.passengers.length ? 'deliver-confirm' : 'deliver-none');
      v = await V();
      if (v.phase === 'event') { await click('event-decline'); v = await V(); }
      return depart('shore', 'normal', true);
    }

    /* ---------- Run A: first cycle in detail ---------- */

    await P.goto(base);
    await P.eval('localStorage.clear(); true');
    await P.reload();

    await check('start screen offers New run; no save yet', async () => {
      const r = await P.eval(`({ start: !document.getElementById('start-screen').hidden, resume: T.has('resume'), newRun: T.has('start-new'), note: document.getElementById('pack-note').hidden })`);
      assert(r.start && !r.resume && r.newRun && r.note, JSON.stringify(r));
    });

    await check('initial resources match the engine and the spec', async () => {
      await click('start-new');
      const v = await V();
      await statsMatch(v);
      const s = await stats();
      assert(s[0] === '2 / 6' && s[1] === '2' && s[2] === '3 / 3' && s[3] === '0 / 3' && s[4] === '1', JSON.stringify(s));
      const shore = await P.eval(`document.querySelectorAll('[data-key^="board-"]').length`);
      assert(shore === 5 && v.shore.length === 5, 'shore ' + shore);
      const quota = await P.eval(`document.querySelectorAll('.stat')[5].textContent`);
      assert(/2 obols/.test(quota) && /cycle 3/.test(quota), quota);
      await P.shot('A01-start');
      return s.join(' | ') + '; ' + quota;
    });

    await check('keyboard: Enter on a focused Board button boards and focus stays usable', async () => {
      await P.eval(`T.el('board-C01-S01').focus(); true`);
      await P.key('Enter', 'Enter', 13);
      const v = await V();
      assert(v.passengers.some((p) => p.id === 'C01-S01'), 'not boarded');
      const f = await P.eval(`document.activeElement && (document.activeElement.getAttribute('data-key') || document.activeElement.id)`);
      assert(f, 'focus lost to body');
      await P.eval(`T.el('board-C01-S02').focus(); true`);
      await P.key(' ', 'Space', 32);
      const v2 = await V();
      assert(v2.passengers.length === 2 && v2.capacity.used === 3, 'space did not board: ' + v2.capacity.used);
      return 'focus after re-render: ' + f;
    });

    await check('unboard is reversible and boarding refused past capacity with the engine reason', async () => {
      await click('board-C01-S03');
      let v = await V();
      assert(v.capacity.used === 4, 'used ' + v.capacity.used);
      const s04 = v.shore.find((s) => s.id === 'C01-S04');
      assert(!(await enabled('board-C01-S04')) && !s04.canBoard, 'S04 boardable at full capacity');
      const reasons = await P.eval(`Array.from(T.el('board-C01-S04').closest('.soul-card').querySelectorAll('.reasons li')).map(l=>l.textContent)`);
      assert(reasons.length && reasons[0] === s04.disabledReasons[0], JSON.stringify(reasons));
      await click('unboard-C01-S03');
      v = await V();
      assert(v.capacity.used === 3 && v.shore.some((s) => s.id === 'C01-S03'), 'unboard failed');
      return reasons[0];
    });

    await check('calming: 1 obol, once per cycle, other calm buttons then disabled', async () => {
      await click('calm-C01-S03');
      const v = await V();
      await statsMatch(v);
      assert(v.resources.obols === 1, 'obols ' + v.resources.obols);
      assert(v.shore.find((s) => s.id === 'C01-S03').normalAngerProtected, 'not protected');
      const anyCalm = await P.eval(`Array.from(document.querySelectorAll('[data-key^="calm-"]')).some(b => !b.disabled)`);
      assert(!anyCalm, 'another calm still enabled');
      const tag = await P.eval(`T.el('calm-C01-S03').closest('.soul-card').textContent`);
      assert(/Protected from normal anger/.test(tag), 'no protection tag');
    });

    await check('return route disabled before any destination; routes show one fog number each', async () => {
      const r = await P.eval(`Array.from(document.querySelectorAll('.route-card')).map(c => ({ t: c.querySelector('.route-to').textContent, fog: c.querySelector('.fog-value').textContent, btn: !!c.querySelector('button[data-key^="route-"]') }))`);
      const v = await V();
      v.routes.filter((x) => x.legal).forEach((x) => assert(r.some((c) => c.fog === String(x.fogDamage) && c.t.includes(x.to === 'shore' ? 'Return' : '')), 'missing route ' + x.to));
      assert(!v.routes.some((x) => x.to === 'shore' && x.legal), 'shore legal from shore');
      return r.map((c) => c.t + '=' + c.fog).join(', ');
    });

    await check('delivery phase blocks preparation; nobody gains anger mid-cycle', async () => {
      const before = (await V()).shore.map((s) => s.id + ':' + s.anger).join(',');
      const v = await depart('elysium', 'normal', false);
      assert(v.phase === 'deliver' && v.nodeId === 'elysium', v.phase + '@' + v.nodeId);
      const r = await P.eval(`({ routes: document.querySelectorAll('.route-card').length, depart: T.has('depart') && T.enabled('depart'), play: document.querySelectorAll('[data-key^="play-"]').length, none: T.el('deliver-none').textContent, sel: T.enabled('deliver-confirm') })`);
      assert(r.routes === 0 && !r.depart && r.play === 0, JSON.stringify(r));
      assert(r.none === 'Continue without delivery' && !r.sel, JSON.stringify(r));
      const after = v.shore.map((s) => s.id + ':' + s.anger).join(',');
      assert(before === after, 'anger changed mid-cycle: ' + before + ' -> ' + after);
      await P.shot('A02-deliver');
      return after;
    });

    await check('delivery preview and wish reward match the engine; linked pair reveals E01 automatically', async () => {
      await click('deliver-C01-S01');
      await click('deliver-C01-S02');
      const preview = await P.eval(`(document.querySelector('.delivery-preview')||{}).textContent || ''`);
      const light0 = (await V()).resources.light;
      await click('deliver-confirm');
      const v = await V();
      await statsMatch(v);
      const emitted = await P.eval(`T.text('.emitted li')`);
      assert(emitted.some((t) => /Mother C01-S01 delivered to Elysium/.test(t) && /wish matched/.test(t)), JSON.stringify(emitted));
      assert(v.discoveredEventIds.includes('E01'), 'E01 not discovered');
      const card = await P.eval(`(document.querySelector('.event-card')||{}).textContent || ''`);
      assert(/Shared Farewell/.test(card) && /automatic/.test(card), card);
      assert(!(await P.eval(`T.has('event-accept')`)), 'automatic event shows accept button');
      const kn = await P.eval(`localStorage.getItem('charon.v03.discoveries')`);
      assert(/E01/.test(kn), 'knowledge not stored');
      await P.shot('A03-after-delivery-E01');
      return 'preview "' + preview.slice(0, 90) + '"; light ' + light0 + ' -> ' + v.resources.light;
    });

    await check('delivery cannot be repeated (idempotent)', async () => {
      const v = await V();
      assert(v.phase === 'prepare', v.phase);
      assert(!(await has('deliver-confirm')) && !(await has('deliver-none')), 'delivery controls still present');
      const res = await P.eval(`(() => { const t = localStorage.getItem('charon.v03.run'); const s = CharonEngine.deserialize(t).state; const r = CharonEngine.dispatch(s, { type: 'DELIVER', soulIds: [] }); return { ok: r.ok, code: r.error && r.error.code }; })()`);
      assert(!res.ok && res.code === 'WRONG_PHASE', JSON.stringify(res));
      return 'second DELIVER rejected ' + res.code + ' (engine check against the saved state, not a UI click)';
    });

    await check('free memory: one per crossing, optional mark, second card disabled with reason', async () => {
      let v = await V();
      assert(v.hand.length === 2, 'hand ' + v.hand.length);
      const m = v.hand[0];
      await P.eval(`(() => { const s = document.getElementById('target-${m.id}'); s.value = 'C01-S04'; s.dispatchEvent(new Event('change')); return true; })()`);
      const light = v.resources.light;
      await click('play-' + m.id);
      v = await V();
      assert(v.resources.light === light, 'memory cost light');
      assert(v.shore.find((s) => s.id === 'C01-S04').normalAngerProtected, 'mark not applied');
      const other = v.hand[0];
      assert(!(await enabled('play-' + other.id)), 'second memory playable');
      const reason = await P.eval(`T.el('play-${other.id}').parentNode.querySelector('.reason').textContent`);
      assert(reason === other.disabledReason, reason);
      const mp = (v.routes.find((r) => r.to === 'haven') || {}).breakdown;
      assert(mp && mp.memoryProtection === 2, 'memory protection ' + JSON.stringify(mp));
      return reason;
    });

    await check('haven: light recovery, repairs follow engine permission with reason', async () => {
      const v0 = await V();
      const v = await depart('haven', 'normal', false);
      assert(v.phase === 'prepare' && v.nodeId === 'haven', v.phase + '@' + v.nodeId);
      await statsMatch(v);
      const rep = await P.eval(`({ en: T.enabled('repair'), reason: (T.el('repair').parentNode.querySelector('.reason')||{}).textContent })`);
      assert(!rep.en && rep.reason === v.permissions.repairDisabledReason, JSON.stringify(rep));
      const noBoard = await P.eval(`document.querySelectorAll('[data-key^="board-"], [data-key^="calm-"], [data-key^="unboard-"]').length`);
      assert(noBoard === 0, 'shore-only controls at haven');
      return 'light ' + v0.resources.light + ' -> ' + v.resources.light + '; ' + rep.reason;
    });

    await check('return: anger only at cycle end; calm and memory mark protect; cycle advances', async () => {
      const pre = await V();
      const fc = pre.returnForecast.waiting.map((w) => w.soulId + ':' + w.projectedAnger).join(',');
      const v = await depart('shore', 'normal', false);
      await statsMatch(v);
      assert(v.cycle === 2 && v.completedCycles === 1, 'cycle ' + v.cycle);
      const a = Object.fromEntries(v.shore.map((s) => [s.id, s.anger]));
      assert(a['C01-S03'] === 0 && a['C01-S04'] === 0 && a['C01-S05'] === 1, JSON.stringify(a));
      const got = pre.returnForecast.waiting.map((w) => w.soulId + ':' + a[w.soulId]).join(',');
      assert(fc === got, 'forecast ' + fc + ' vs actual ' + got);
      const fresh = v.shore.filter((s) => s.cohort === 1 && ['S06', 'S07'].includes(s.templateId));
      assert(fresh.every((s) => s.anger === 0), 'new refill soul has anger');
      await P.shot('A04-cycle2');
      return 'forecast matched: ' + fc;
    });

    await check('save/reload: page reload resumes the same run', async () => {
      const before = await stats();
      await P.reload();
      const btn = await P.eval(`(T.el('resume')||{}).textContent`);
      assert(/cycle 2/.test(btn), btn);
      await click('resume');
      const after = await stats();
      assert(JSON.stringify(before) === JSON.stringify(after), JSON.stringify(before) + ' vs ' + JSON.stringify(after));
      return btn;
    });

    await check('JSON export downloads a loadable file', async () => {
      const before = fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && f.startsWith('ferryman-'));
      before.forEach((f) => fs.unlinkSync(path.join(OUT, f)));
      await P.eval(`document.getElementById('export-btn').click(); true`);
      let file = null;
      for (let i = 0; i < 40 && !file; i++) { await sleep(100); file = fs.readdirSync(OUT).find((f) => /^ferryman-v0\.3-cycle2\.json$/.test(f)); }
      assert(file, 'no download');
      const data = JSON.parse(fs.readFileSync(path.join(OUT, file), 'utf8'));
      assert(data.kind === 'charon-v0.3-run-export' && typeof data.save === 'string' && data.view.cycle === 2, 'bad export');
      fs.renameSync(path.join(OUT, file), path.join(OUT, 'export-cycle2.json'));
      return 'verification/browser/runs/export-cycle2.json, ' + data.sessionLog.length + ' session actions';
    });

    await check('invalid save file is rejected and the current run is unchanged', async () => {
      const bad = path.join(OUT, 'invalid-save.json');
      fs.writeFileSync(bad, '{"kind":"charon-v0.3-run-export","save":"{not json"}');
      const before = await stats();
      const doc = await P.send('DOM.getDocument', {});
      const node = await P.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#import-input' });
      await P.send('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [bad] });
      await sleep(300);
      const m = await msg();
      const after = await stats();
      assert(/could not be loaded/.test(m) && /unchanged/.test(m), m);
      assert(JSON.stringify(before) === JSON.stringify(after), 'run changed');
      return m.slice(0, 120);
    });

    await check('exported file loads back through Load save', async () => {
      await courierCycle();
      const moved = await V();
      const doc = await P.send('DOM.getDocument', {});
      const node = await P.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#import-input' });
      await P.send('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [path.join(OUT, 'export-cycle2.json')] });
      await sleep(300);
      const v = await V();
      assert(moved.cycle === 3 && v.cycle === 2, 'cycle ' + moved.cycle + ' -> ' + v.cycle);
      await statsMatch(v);
      return 'cycle ' + moved.cycle + ' run replaced by exported cycle 2';
    });

    await check('invalid stored save is set aside, not deleted, and the game still starts', async () => {
      const good = await P.eval(`localStorage.getItem('charon.v03.run')`);
      await P.eval(`localStorage.setItem('charon.v03.run', '{"schemaVersion":1,"rulesVersion":"0.3","state":{"broken":true}}'); true`);
      await P.reload();
      const r = await P.eval(`({ warn: (document.querySelector('#start-actions .warning')||{}).textContent, rejected: localStorage.getItem('charon.v03.run.rejected'), resume: T.has('resume'), newRun: T.has('start-new') })`);
      assert(r.warn && /set aside/.test(r.warn) && /broken/.test(r.rejected) && !r.resume && r.newRun, JSON.stringify(r));
      await P.eval(`localStorage.setItem('charon.v03.run', ${JSON.stringify(good)}); localStorage.removeItem('charon.v03.run.rejected'); true`);
      await P.reload();
      await click('resume');
      return r.warn.slice(0, 100);
    });

    await check('courier play to cycle 4: quota settled at cycle 3, rocky routes with separate hull marker', async () => {
      let v = await V();
      const logs = [];
      while (v.phase !== 'ended' && v.cycle < 4) { v = await courierCycle(); }
      assert(v.phase !== 'ended', 'run ended early: ' + JSON.stringify(v.ended && v.ended.cause));
      const hist = await P.eval(`T.text('.history-list li')`);
      const quota = hist.find((t) => /quota/i.test(t));
      assert(quota, 'no quota entry in log');
      await statsMatch(v);
      const rocky = await P.eval(`Array.from(document.querySelectorAll('.route-card')).filter(c => c.querySelector('.badge.rocky')).map(c => ({ fog: c.querySelector('.fog-value').textContent, hull: c.querySelector('.hull-number').textContent }))`);
      assert(rocky.length === 3 && rocky.every((r) => /1 hull/.test(r.hull)), JSON.stringify(rocky));
      const note = await P.eval(`document.getElementById('cycle-note').textContent`);
      assert(/Rocky/.test(note), note);
      await P.shot('A05-cycle4-rocky');
      return quota + ' | rocky ' + JSON.stringify(rocky);
    });

    await check('rocky crossing damages hull; haven E04 restores it; repair at shore costs 1 obol per hull', async () => {
      let v = await depart('elysium', 'rocky', false);
      assert(v.resources.hull === 2, 'hull after rocky ' + v.resources.hull);
      await click('deliver-none');
      v = await depart('haven', 'normal', false);
      const e04 = v.discoveredEventIds.includes('E04');
      const card = await P.eval(`(document.querySelector('.event-card')||{}).textContent || ''`);
      assert(e04 && v.resources.hull === 3 && /Broken Landing/.test(card), 'E04 expected at haven with hull 2: ' + JSON.stringify({ e04, hull: v.resources.hull }));
      assert(!(await enabled('repair')), 'repair enabled at full hull');
      v = await depart('asphodel', 'rocky', false);
      await click('deliver-none');
      v = await depart('shore', 'normal', true);
      assert(v.nodeId === 'shore' && v.resources.hull === 2, 'hull at shore ' + v.resources.hull);
      const ob = v.resources.obols;
      assert(ob >= 1 && v.permissions.canRepair && (await enabled('repair')), 'repair not available with ' + ob + ' obols');
      await click('repair');
      const v2 = await V();
      await statsMatch(v2);
      assert(v2.resources.hull === 3 && v2.resources.obols === ob - 1, 'repair result');
      assert(!(await enabled('repair')), 'repair still enabled at full hull');
      return 'rocky 3 -> 2; E04 at haven 2 -> 3; rocky again -> 2; shore repair -> 3, obols ' + ob + ' -> ' + v2.resources.obols;
    });

    await check('narrow 390x844 viewport: no horizontal scroll (prepare screen)', async () => {
      await P.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
      await sleep(200);
      const o1 = await P.eval('T.overflow()');
      await P.shot('A06-narrow-prepare');
      await P.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
      assert(o1 <= 0, 'overflow ' + o1);
      return 'overflow ' + o1 + 'px (emulated, not a real phone)';
    });

    /* ---------- New run and knowledge reference ---------- */

    await check('New run asks for confirmation, resets the run, keeps the event reference', async () => {
      await P.eval(`document.getElementById('newrun-btn').click(); true`);
      assert(await P.eval(`T.dialogOpen('confirm-dialog')`), 'no confirmation');
      await P.eval(`T.dialogClick('confirm-dialog', 'New run')`);
      const v = await V();
      assert(v.cycle === 1 && v.discoveredEventIds.length === 0, 'not reset');
      await statsMatch(v);
      await P.eval(`document.getElementById('reference-btn').click(); true`);
      const ref = await P.eval(`({ known: T.text('#reference-dialog .reference-item.known h3'), hidden: T.text('#reference-dialog h3').filter(t => t === 'Hidden event').length, cond: /Unfinished Message|Messenger/.test(document.getElementById('reference-dialog').textContent) })`);
      assert(ref.known.some((k) => /Shared Farewell/.test(k)) && ref.hidden === 4 - ref.known.length && !ref.cond, JSON.stringify(ref));
      await P.eval(`T.dialogClick('reference-dialog', 'Show all events (spoilers)')`);
      const sp = await P.eval(`({ hidden: T.text('#reference-dialog h3').filter(t => t === 'Hidden event').length, cond: /Messenger/.test(document.getElementById('reference-dialog').textContent) })`);
      assert(sp.hidden === 0 && sp.cond, JSON.stringify(sp));
      await P.shot('B01-reference-spoilers');
      await P.eval(`T.dialogClick('reference-dialog', 'Clear discoveries')`);
      await P.eval(`T.dialogClick('confirm-dialog', 'Clear discoveries')`);
      const kn = await P.eval(`localStorage.getItem('charon.v03.discoveries')`);
      const v2 = await V();
      assert(kn === null && v2.cycle === 1, 'clear failed or changed the run');
      return 'kept ' + ref.known.join(', ') + '; spoilers hidden until opened; cleared without touching the run';
    });

    /* ---------- Run C: exact zero light, then a fog failure ---------- */

    await check('exact zero light survives (Tartarus fog 2 with 2 light)', async () => {
      const v = await depart('tartarus', 'normal', false);
      assert(v.phase === 'deliver' && v.resources.light === 0 && !v.ended, JSON.stringify(v.resources));
      await statsMatch(v);
      await click('deliver-none');
      return 'light 0, run continues';
    });

    await check('fog failure: lethal route warned, needs confirmation, ends with fog screen', async () => {
      let v = await V();
      const r = v.routes.find((x) => x.to === 'asphodel');
      assert(r.lethal && r.failureCause === 'fog', JSON.stringify(r));
      const cardLethal = await P.eval(`T.el('route-asphodel:normal').closest('.route-card').classList.contains('lethal')`);
      assert(cardLethal, 'lethal route not marked');
      await click('route-asphodel:normal');
      await click('depart');
      assert(await P.eval(`T.dialogOpen('confirm-dialog')`), 'no confirmation');
      await P.shot('C01-lethal-confirm');
      await P.eval(`T.dialogClick('confirm-dialog', 'Cancel')`);
      v = await V();
      assert(v.phase === 'prepare' && v.nodeId === 'tartarus', 'cancel still departed');
      v = await depart('asphodel', 'normal', true);
      assert(v.phase === 'ended' && v.ended.cause === 'fog', JSON.stringify(v.ended && v.ended.cause));
      const t = await P.eval(`document.querySelector('.terminal').textContent`);
      assert(/lantern/i.test(t) && /Completed cycles/.test(t) && !/you win|you won/i.test(t), t.slice(0, 200));
      const late = await P.eval(`document.querySelectorAll('[data-key^="route-"], [data-key="depart"], [data-key^="board-"]').length`);
      assert(late === 0, 'actions offered after the end');
      await P.shot('C02-ended-fog');
      return t.slice(0, 120);
    });

    /* ---------- Run D: idle play to dismissal ---------- */

    await check('dismissal: wraiths form only at return; predicted dismissal needs confirmation; dismissal screen', async () => {
      await click('ended-new');
      let v = await V();
      let sawWarning = false;
      for (let guard = 0; guard < 12 && v.phase !== 'ended'; guard++) {
        v = await depart('elysium', 'normal', true);
        if (v.phase === 'ended') break;
        await click('deliver-none');
        v = await V();
        assert(v.wraiths.length === 0, 'wraith formed mid-cycle');
        if (v.returnForecast.dismissalIfReturnNow) {
          sawWarning = await P.eval(`/end the apprenticeship/.test(document.querySelector('.aside').textContent)`);
          await click('route-shore:normal');
          await click('depart');
          assert(await P.eval(`T.dialogOpen('confirm-dialog')`), 'no dismissal confirmation');
          await P.shot('D01-dismissal-confirm');
          await P.eval(`T.dialogClick('confirm-dialog', 'Depart anyway')`);
          v = await V();
          break;
        }
        v = await depart('shore', 'normal', false);
      }
      assert(v.phase === 'ended' && v.ended.cause === 'dismissal', 'ended ' + JSON.stringify(v.ended && v.ended.cause));
      assert(sawWarning, 'dismissal warning not shown in the departure panel');
      const t = await P.eval(`document.querySelector('.terminal').textContent`);
      assert(/Dismissal/i.test(t) && /Wraiths formed/.test(t), t.slice(0, 200));
      await P.shot('D02-ended-dismissal');
      return 'completed cycles ' + v.ended.summary.completedCycles + '; wraiths formed at the final return: ' + v.ended.summary.wraithsFormed;
    });

    /* ---------- Run E: wraiths form at return; release affordable and unaffordable ---------- */

    await check('wraiths form at return and add fog next crossing; release costs 2 light, removes a reprimand; unaffordable is disabled', async () => {
      await click('ended-new');
      let v = await V();
      for (let c = 0; c < 2; c++) {          // two idle cycles: original five reach anger 2
        v = await depart('elysium', 'normal', false);
        await click('deliver-none');
        v = await depart('shore', 'normal', false);
      }
      for (const id of ['C01-S01', 'C01-S02', 'C01-S03']) await click('board-' + id);   // S04, S05 stay waiting
      v = await V();
      // The forecast assumes no further deliveries: 3 aboard + 2 wraiths would dismiss if returning straight away.
      assert(v.returnForecast.transformations === 2 && v.returnForecast.brokenPromisesIfReturnNow === 3, 'forecast ' + JSON.stringify(v.returnForecast));
      v = await depart('elysium', 'normal', false);
      assert(v.wraiths.length === 0, 'wraith before return');
      for (const p of v.passengers) await click('deliver-' + p.id);
      await click('deliver-confirm');
      v = await depart('shore', 'normal', false);
      assert(v.wraiths.length === 2 && v.resources.reprimands === 2, 'after return ' + JSON.stringify({ w: v.wraiths.length, r: v.resources.reprimands }));
      const wp = v.routes.find((r) => r.to === 'elysium' && r.variant === 'normal').breakdown.wraithPressure;
      assert(wp === 2, 'wraith pressure ' + wp);
      await P.shot('E01-wraiths');
      const light = v.resources.light, w = v.wraiths[0];
      assert(w.canRelease && light >= 2, 'release not affordable at light ' + light);
      await click('release-' + w.id);
      let v2 = await V();
      await statsMatch(v2);
      assert(v2.resources.light === light - 2 && v2.wraiths.length === 1 && v2.resources.reprimands === 1, 'release result');
      const wp2 = v2.routes.find((r) => r.to === 'elysium' && r.variant === 'normal').breakdown.wraithPressure;
      assert(wp2 === 1, 'preview not recomputed: ' + wp2);
      const out = 'light ' + light + ' -> ' + v2.resources.light + ', reprimands 2 -> 1, pressure 2 -> 1';
      // Spend light until release is unaffordable.
      v2 = await depart('tartarus', 'normal', true);
      if (v2.phase === 'deliver') { await click('deliver-none'); v2 = await V(); }
      const w2 = v2.wraiths[0];
      if (v2.resources.light >= 2) return out + '; unaffordable case not reached (light ' + v2.resources.light + ')';
      assert(!w2.canRelease && !(await enabled('release-' + w2.id)), 'release enabled below 2 light');
      const reason = await P.eval(`T.el('release-${w2.id}').parentNode.querySelector('.reason').textContent`);
      assert(reason === w2.disabledReason, reason);
      return out + '; at light ' + v2.resources.light + ': "' + reason + '"';
    });

    /* ---------- Run F: sinking ---------- */

    await check('sinking by rocky crossings ends before arrival rewards', async () => {
      if (await has('ended-new')) await click('ended-new');
      else { await P.eval(`document.getElementById('newrun-btn').click(); true`); await P.eval(`T.dialogClick('confirm-dialog', 'New run')`); }
      let v = await V();
      // Leave one soul waiting across cycles by boarding the others; courier the rest.
      let released = null, unaffordable = null;
      for (let guard = 0; guard < 30 && v.phase !== 'ended' && v.cycle < 3; guard++) v = await courierCycle();
      assert(v.phase !== 'ended', 'ended before cycle 3');
      // Cycle >= 3: three rocky crossings sink a 3-hull boat unless repaired.
      v = await depart('elysium', 'rocky', true);
      if (v.phase === 'deliver') { await click('deliver-none'); v = await V(); }
      if (v.wraiths.length) {
        const w = v.wraiths[0];
        if (w.canRelease) {
          const light = v.resources.light, rep = v.resources.reprimands;
          await click('release-' + w.id);
          const v2 = await V();
          assert(v2.resources.light === light - 2 && v2.wraiths.length === v.wraiths.length - 1 && v2.resources.reprimands === Math.max(0, rep - 1), 'release result');
          released = 'light ' + light + ' -> ' + v2.resources.light + ', reprimands ' + rep + ' -> ' + v2.resources.reprimands;
          v = v2;
        } else unaffordable = w.disabledReason;
      }
      v = await depart('asphodel', 'rocky', true);
      if (v.phase === 'deliver') { await click('deliver-none'); v = await V(); }
      if (v.phase === 'event') { await click('event-decline'); v = await V(); }
      if (v.phase !== 'ended') {
        const r = v.routes.find((x) => x.to === 'tartarus' && x.variant === 'rocky');
        assert(r && r.lethal && r.failureCause === 'sinking', 'third rocky not predicted to sink: ' + JSON.stringify(r));
        const hullTxt = await P.eval(`T.el('route-tartarus:rocky').closest('.route-card').querySelector('.lethal-note').textContent`);
        assert(/hull/.test(hullTxt), hullTxt);
        v = await depart('tartarus', 'rocky', true);
      }
      assert(v.phase === 'ended', 'not ended');
      const t = await P.eval(`document.querySelector('.terminal').textContent`);
      await P.shot('F01-ended-' + v.ended.cause);
      assert(v.ended.cause === 'sinking' && /sank|sink|hull/i.test(t), 'cause ' + v.ended.cause);
      return 'ended by sinking on the third rocky crossing' + (released ? '; also released a wraith: ' + released : '');
    });

    /* ---------- Run H: choice events E02 and E03 through the UI ---------- */

    await check('choice events: E03 accept pays 1 obol; E02 accept disabled with reason at 0 reprimands, decline works', async () => {
      await P.eval(`document.getElementById('newrun-btn').click(); true`);
      if (await P.eval(`T.dialogOpen('confirm-dialog')`)) await P.eval(`T.dialogClick('confirm-dialog', 'New run')`);
      let v = await V();
      const out = [];
      for (let guard = 0; guard < 12 && out.length < 2 && v.phase !== 'ended'; guard++) {
        const ids = v.shore.map((s) => s.id);
        const wantE03 = !v.discoveredEventIds.includes('E03') && ids.includes('C01-S04') && ids.includes('C01-S06');
        const wantE02 = !v.discoveredEventIds.includes('E02') && ids.includes('C01-S09');
        if (!wantE03 && !wantE02) { v = await courierCycle(); continue; }
        const board = wantE03 ? ['C01-S04', 'C01-S06'] : ['C01-S09'];
        for (const id of board) await click('board-' + id);
        v = await depart(wantE03 ? 'tartarus' : 'asphodel', 'normal', false);
        for (const p of v.passengers) await click('deliver-' + p.id);
        await click('deliver-confirm');
        v = await V();
        assert(v.phase === 'event' && v.pendingEvent, 'no pending event, phase ' + v.phase);
        const ev = v.pendingEvent;
        const r = await P.eval(`({ card: document.querySelector('.event-card').textContent, acc: T.enabled('event-accept'), dec: T.enabled('event-decline'), routes: document.querySelectorAll('.route-card').length, reason: (document.querySelector('.event-card .reason')||{}).textContent || '' })`);
        assert(r.routes === 0 && r.dec === ev.canDecline && r.acc === ev.canAccept, JSON.stringify(r));
        if (ev.eventId === 'E03') {
          assert(/Old Feud/.test(r.card) && r.acc, 'E03 card/accept ' + JSON.stringify(r));
          const ob = v.resources.obols;
          await P.shot('H01-event-E03');
          await click('event-accept');
          const v2 = await V();
          await statsMatch(v2);
          assert(v2.resources.obols === ob - 1 && v2.phase === 'prepare', 'E03 accept result');
          out.push('E03 accepted, obols ' + ob + ' -> ' + v2.resources.obols);
        } else {
          assert(/Unfinished Message/.test(r.card), 'E02 card');
          if (!ev.canAccept) assert(r.reason === ev.acceptDisabledReason, 'reason ' + r.reason);
          await P.shot('H02-event-E02');
          await click('event-decline');
          const v2 = await V();
          assert(v2.phase === 'prepare', 'decline did not continue');
          out.push('E02 ' + (ev.canAccept ? 'accept available' : 'accept disabled: "' + r.reason + '"') + ', declined');
        }
        v = await depart('shore', 'normal', true);
      }
      assert(out.length === 2, 'only reached: ' + out.join('; '));
      return out.join('; ');
    });

    /* ---------- Missing art ---------- */

    await check('missing art file falls back to a labelled placeholder without breaking play', async () => {
      await P.send('Fetch.enable', { patterns: [{ urlPattern: '*assets/art/S01.png*' }, { urlPattern: '*assets/art/boat.png*' }] });
      const failer = async () => { for (;;) { const e = await P.once('Fetch.requestPaused'); await P.send('Fetch.failRequest', { requestId: e.requestId, errorReason: 'Failed' }).catch(() => {}); } };
      failer();
      await P.eval(`localStorage.removeItem('charon.v03.run'); true`);
      await P.reload();
      await click('start-new');
      await sleep(800);
      const r = await P.eval(`({ ph: T.text('.art-placeholder span'), board: T.enabled('board-C01-S01') })`);
      await P.send('Fetch.disable');
      assert(r.ph.includes('S01') && r.ph.includes('boat') && r.board, JSON.stringify(r));
      await P.shot('G01-missing-art');
      return 'placeholders: ' + r.ph.join(', ');
    });

    await check('direct file:// opening: engine loads and a new run starts (headless Chrome)', async () => {
      await P.goto('file://' + path.join(ROOT, 'index.html'));
      await P.eval(`localStorage.clear(); true`);
      await P.reload();
      await click('start-new');
      const s = await stats();
      assert(s[0] === '2 / 6' && s[4] === '1', JSON.stringify(s));
      await click('board-C01-S01');
      await P.reload();
      const r = await P.eval(`(T.el('resume')||{}).textContent || ''`);
      assert(/Resume/.test(r), 'no resume after reload on file://');
      return 'start, board, reload-resume work from ' + 'file://.../index.html';
    });

    await check('no uncaught page exceptions or unexpected console errors', async () => {
      const errs = P.errors.filter((e) => !/art file failed to load|net::ERR_FAILED|Failed to load resource/.test(e));
      assert(!P.exceptions.length, P.exceptions.join(' | '));
      assert(!errs.length, errs.join(' | '));
      return P.errors.length + ' expected errors from the deliberately failed art requests';
    });
  } catch (e) {
    results.push({ name: 'harness (during: ' + current + ')', status: 'FAIL', detail: e.stack || e.message });
  } finally {
    const counts = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
    const report = {
      kind: 'Agent-driven browser automation against the real engine. Not a human playtest; not balance evidence.',
      ranAt: new Date().toISOString(), node: process.version, chrome: CHROME, platform: process.platform + ' ' + process.arch,
      counts, results, exceptions: P ? P.exceptions : [], consoleErrors: P ? P.errors : [], consoleWarnings: P ? P.warnings : []
    };
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    for (const r of results) console.log(r.status.padEnd(5) + ' ' + r.name + (r.detail ? '\n        ' + String(r.detail).slice(0, 300) : ''));
    console.log('\n' + JSON.stringify(counts));
    chrome.proc.kill();
    srv.close();
    await sleep(300);
    try { fs.rmSync(chrome.profile, { recursive: true, force: true }); } catch (e) { /* temp */ }
    try { fs.unlinkSync(path.join(OUT, 'invalid-save.json')); } catch (e) { /* none */ }
    process.exitCode = counts.FAIL ? 1 : 0;
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
