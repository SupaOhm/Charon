'use strict';
// Runs every engine test and cross-checks the rule matrix. Writes engine-test-results.json next to this file.
// Usage (from outputs/The_Ferryman_Digital_Demo_v0.3/):  node verification/engine/run-verification.cjs
// Exit code 0 only if every test passes and every matrix ID maps to a passing test.
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const testDir = path.join(root, 'tests', 'engine');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js')).sort().map(f => path.join(testDir, f));
const results = [];

const stream = run({ files, concurrency: false });
stream.on('test:pass', e => { if (e.nesting === 0 && !/\.test\.js$/.test(e.name)) results.push({ name: e.name, status: 'PASS', ms: +(e.details.duration_ms).toFixed(2) }); });
stream.on('test:fail', e => { if (e.nesting === 0 && !/\.test\.js$/.test(e.name)) results.push({ name: e.name, status: 'FAIL', ms: +(e.details.duration_ms).toFixed(2), error: String(e.details.error && e.details.error.message || e.details.error) }); });
stream.on('test:stdout', () => {});
stream.on('test:stderr', () => {});
stream.on('end', () => {});
stream.resume();

stream.on('close', () => {
  // Cross-check matrix IDs against actual test names.
  const matrixPath = path.join(__dirname, 'RULE_MATRIX.md');
  const matrix = fs.existsSync(matrixPath) ? fs.readFileSync(matrixPath, 'utf8') : '';
  const idRe = /\b(?:API|RT|BD|CE|MEM|EV|RL|RP|PH|RPL)-\d{2}\b/g;
  const testIds = {};
  results.forEach(r => { const m = /^([A-Z]+-\d{2}) /.exec(r.name); if (m) testIds[m[1]] = r.status; });
  const matrixIds = Array.from(new Set(matrix.match(idRe) || []));
  const missingInTests = matrixIds.filter(id => !(id in testIds));
  const unlisted = Object.keys(testIds).filter(id => !matrixIds.includes(id));
  const failed = results.filter(r => r.status === 'FAIL');
  const summary = {
    generatedBy: 'verification/engine/run-verification.cjs',
    node: process.version, platform: process.platform + ' ' + process.arch,
    command: 'node verification/engine/run-verification.cjs',
    equivalentTestCommand: 'node --test "tests/engine/*.test.js"',
    rulesSnapshot: 'outputs/The_Ferryman_v0.3_Decided_Rules.md',
    counts: { tests: results.length, pass: results.length - failed.length, fail: failed.length },
    matrix: { ids: matrixIds.length, missingInTests, unlistedTests: unlisted },
    overall: failed.length === 0 && missingInTests.length === 0 && unlisted.length === 0 ? 'PASS' : 'FAIL',
    results
  };
  fs.writeFileSync(path.join(__dirname, 'engine-test-results.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(`node ${process.version}: ${summary.counts.pass}/${summary.counts.tests} tests passed; matrix IDs ${matrixIds.length}; ` +
    `missing ${missingInTests.length}; unlisted ${unlisted.length}; overall ${summary.overall}`);
  failed.forEach(f => console.log('FAIL', f.name, '-', f.error));
  if (missingInTests.length) console.log('Matrix IDs with no test:', missingInTests.join(', '));
  if (unlisted.length) console.log('Tests missing from the matrix:', unlisted.join(', '));
  process.exit(summary.overall === 'PASS' ? 0 : 1);
});
