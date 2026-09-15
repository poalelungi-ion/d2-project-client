import { readFileSync } from 'node:fs';

import { rel, table } from './report-table.mjs';

// Floor, not a target: the job fails if coverage drops below this. Raise it as
// tests land so the number can only ratchet upwards.
const COVERAGE_FLOOR = Number(process.env.COVERAGE_FLOOR ?? 2);

const resultsPath = process.argv[2] ?? 'vitest-results.json';
const coveragePath = process.argv[3] ?? 'coverage/coverage-summary.json';

const read = (path, label) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Could not read the ${label} (${path}): ${error.message}`);
    console.error('Did the test run crash before writing it?');
    process.exit(1);
  }
};

const results = read(resultsPath, 'test results');
const coverage = read(coveragePath, 'coverage summary');

const suites = results.testResults ?? [];
const tests = suites.flatMap((s) => s.assertionResults ?? []);
// Vitest's own counters, rather than recounting the assertion list.
const passed = results.numPassedTests ?? 0;
const failed = results.numFailedTests ?? 0;
const skipped = (results.numPendingTests ?? 0) + (results.numTodoTests ?? 0);
const testTime = tests.reduce((ms, t) => ms + (t.duration ?? 0), 0);

console.log('\nUnit test report');
table(
  [
    ['Test files', suites.length],
    ['Tests', results.numTotalTests ?? tests.length],
    ['Passed', passed],
    ['Failed', failed],
    ['Skipped', skipped],
    ['Test time', `${(testTime / 1000).toFixed(2)}s`],
  ],
  ['Metric', 'Value'],
);

if (failed > 0) {
  console.log('\nFailing tests:');
  for (const suite of suites) {
    for (const t of suite.assertionResults ?? []) {
      if (t.status !== 'failed') continue;
      console.log(`  ${rel(suite.name)}`);
      console.log(`    ${[...(t.ancestorTitles ?? []), t.title].join(' > ')}`);
      for (const m of t.failureMessages ?? []) {
        console.log(`      ${m.split('\n')[0]}`);
      }
    }
  }
}

const total = coverage.total ?? {};
const pct = (key) => Number(total[key]?.pct ?? 0);
console.log('\nCoverage');
table(
  ['lines', 'statements', 'branches', 'functions'].map((k) => [
    k,
    `${pct(k).toFixed(2)}%`,
    `${total[k]?.covered ?? 0}/${total[k]?.total ?? 0}`,
  ]),
  ['Metric', 'Percent', 'Covered/Total'],
);

// Least-covered files, so the log points at where tests are missing.
const files = Object.entries(coverage)
  .filter(([k]) => k !== 'total')
  .map(([file, m]) => [rel(file), Number(m.lines?.pct ?? 0), m.lines?.total ?? 0])
  .filter(([, , totalLines]) => totalLines > 0)
  .sort((a, b) => a[1] - b[1] || b[2] - a[2])
  .slice(0, 10);

if (files.length > 0) {
  console.log('\nLeast covered files:');
  table(
    files.map(([file, p, lines]) => [file, `${p.toFixed(2)}%`, lines]),
    ['File', 'Lines %', 'Lines'],
  );
}

// This exact line is what the GitLab `coverage:` regex scrapes.
console.log(`\nTotal coverage: ${pct('lines').toFixed(2)}%`);

const problems = [];
if (failed > 0) problems.push(`${failed} failing test(s)`);
if (pct('lines') < COVERAGE_FLOOR) {
  problems.push(`line coverage ${pct('lines').toFixed(2)}% is below the ${COVERAGE_FLOOR}% floor`);
}

if (problems.length > 0) {
  console.log(`\nFAILED: ${problems.join('; ')}.\n`);
  process.exit(1);
}

console.log(`\nPASSED: ${passed} test(s) green, coverage at or above the ${COVERAGE_FLOOR}% floor.\n`);
