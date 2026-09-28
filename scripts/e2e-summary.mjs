import { readFileSync } from 'node:fs';

import { countBy, rel, table } from './report-table.mjs';

// Mirrors scripts/test-summary.mjs: the Playwright run itself is allowed to
// fail in CI so that this script always gets to print, and this script decides
// the job's exit code.

const resultsPath = process.argv[2] ?? 'playwright-results.json';

const read = (path, label) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Could not read the ${label} (${path}): ${error.message}`);
    console.error('Did the Playwright run crash before writing it?');
    process.exit(1);
  }
};

const report = read(resultsPath, 'e2e results');

// Playwright's JSON reporter keeps the terminal colour codes in its error
// messages; they render as noise in a CI log.
const plain = (text) => String(text).replace(/\u001b\[[0-9;]*m/g, '');

/** The JSON reporter nests suites by file and then by describe block. */
const collectSpecs = (suite) => [
  ...(suite.specs ?? []),
  ...(suite.suites ?? []).flatMap(collectSpecs),
];

const specs = (report.suites ?? []).flatMap(collectSpecs);
const stats = report.stats ?? {};

const failing = specs.filter((s) => !s.ok);
// A spec that passed only on retry still ran red once; surfacing it keeps
// flake visible instead of letting `retries` quietly absorb it.
const flaky = specs.filter(
  (s) => s.ok && s.tests?.some((t) => (t.results ?? []).length > 1),
);

console.log('\nEnd-to-end test report');
table(
  [
    ['Specs', specs.length],
    ['Passed', stats.expected ?? specs.length - failing.length],
    ['Failed', stats.unexpected ?? failing.length],
    ['Flaky', stats.flaky ?? flaky.length],
    ['Skipped', stats.skipped ?? 0],
    ['Duration', `${((stats.duration ?? 0) / 1000).toFixed(2)}s`],
  ],
  ['Metric', 'Value'],
);

if (failing.length > 0) {
  console.log('\nFailing specs:');
  for (const spec of failing) {
    console.log(`  ${rel(spec.file ?? 'unknown')}`);
    console.log(`    ${spec.title}`);
    for (const t of spec.tests ?? []) {
      // Only the final attempt: with retries on, earlier ones repeat the same
      // error and bury the result.
      const last = (t.results ?? []).at(-1);
      const message = last?.error?.message ?? last?.errors?.[0]?.message;
      if (message) console.log(`      ${plain(message).split('\n')[0]}`);
    }
  }

  const perFile = countBy(failing, (s) => rel(s.file ?? 'unknown'));
  if (perFile.length > 1) {
    console.log('\nFailures per file:');
    table(perFile, ['File', 'Failures']);
  }
}

if (flaky.length > 0) {
  console.log('\nPassed only on retry -- open an issue or mark test.fixme:');
  for (const spec of flaky) console.log(`  ${rel(spec.file ?? 'unknown')} > ${spec.title}`);
}

const problems = [];
if (failing.length > 0) problems.push(`${failing.length} failing spec(s)`);
if (specs.length === 0) problems.push('no specs ran at all');

if (problems.length > 0) {
  console.log(`\nFAILED: ${problems.join('; ')}.\n`);
  process.exit(1);
}

console.log(`\nPASSED: ${specs.length} spec(s) green.\n`);
