/**
 * Regression Guard — tests/regression.js
 *
 * Run:  node tests/regression.js
 *
 * First run (no fixture JSON): runs the pipeline on fixture images
 * and saves the output to tests/fixtures/expected_pipeline.json, then exits 0.
 *
 * Subsequent runs: runs the pipeline and deep-compares the output to the
 * saved fixture. Exits 0 on match, 1 on any mismatch.
 *
 * Fields excluded from comparison (non-deterministic / version bumps):
 *   system.version, system.pipeline, _confidence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from '../src/pipeline/runPipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIXTURES_DIR   = path.join(__dirname, 'fixtures');
const FRONT_IMG      = path.join(FIXTURES_DIR, 'front.png');
const BACK_IMG       = path.join(FIXTURES_DIR, 'back.png');
const THIRD_IMG      = path.join(FIXTURES_DIR, 'third.jpg');
const EXPECTED_JSON  = path.join(FIXTURES_DIR, 'expected_pipeline.json');

// Fields to strip before comparison (non-deterministic or version-bumped values)
const STRIP_KEYS = new Set(['version', 'pipeline', '_confidence']);

function stripNonDeterministic(obj) {
  if (Array.isArray(obj)) return obj.map(stripNonDeterministic);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (!STRIP_KEYS.has(k)) out[k] = stripNonDeterministic(v);
    }
    return out;
  }
  return obj;
}

function deepEqual(a, b, path = '') {
  if (typeof a !== typeof b) return [`type mismatch at ${path}: ${typeof a} vs ${typeof b}`];
  if (a === null && b === null) return [];
  if (a === null || b === null) return [`null mismatch at ${path}`];
  if (typeof a !== 'object') {
    return a === b ? [] : [`value mismatch at "${path}": "${a}" vs "${b}"`];
  }
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  const errors = [];

  const allKeys = new Set([...keysA, ...keysB]);
  for (const k of allKeys) {
    if (!(k in a)) { errors.push(`missing key "${path}.${k}" in actual output`); continue; }
    if (!(k in b)) { errors.push(`extra key "${path}.${k}" in actual output (not in fixture)`); continue; }
    errors.push(...deepEqual(a[k], b[k], `${path}.${k}`));
  }
  return errors;
}

async function main() {
  // Quick sanity-check inputs
  for (const [label, p] of [['front', FRONT_IMG], ['back', BACK_IMG], ['third', THIRD_IMG]]) {
    if (!fs.existsSync(p)) {
      console.error(`❌ Fixture image not found: ${p}`);
      console.error(`   Copy a real ${label} image to tests/fixtures/${path.basename(p)}`);
      process.exit(1);
    }
  }

  console.log('🔄 Running pipeline on fixture images…');
  console.log('   (This can take ~1-2 minutes for Tesseract and sharp operations)');
  const result = await runPipeline(FRONT_IMG, BACK_IMG, THIRD_IMG);
  console.log('✅ Pipeline finished.');
  const stripped = stripNonDeterministic(result);

  if (!fs.existsSync(EXPECTED_JSON)) {
    // First run — save baseline
    fs.writeFileSync(EXPECTED_JSON, JSON.stringify(stripped, null, 2));
    console.log(`✅ Baseline saved to tests/fixtures/expected_pipeline.json`);
    console.log('   Re-run this script after refactoring to verify no behavior change.');
    process.exit(0);
  }

  // Compare against baseline
  const expected = JSON.parse(fs.readFileSync(EXPECTED_JSON, 'utf-8'));
  const errors = deepEqual(stripped, expected, 'root');

  if (errors.length === 0) {
    console.log('✅ Regression test PASSED — pipeline output is identical to baseline.');
    process.exit(0);
  } else {
    console.error(`❌ Regression test FAILED — ${errors.length} difference(s) found:\n`);
    errors.slice(0, 20).forEach(e => console.error('  •', e));
    if (errors.length > 20) console.error(`  … and ${errors.length - 20} more.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Regression script error:', err);
  process.exit(1);
});
