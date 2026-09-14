import { readFileSync } from 'node:fs';

import { countBy, rel, table } from './report-table.mjs';

const COMPLEXITY_RULES = new Set([
  'complexity',
  'max-depth',
  'max-lines-per-function',
  'max-nested-callbacks',
  'max-params',
]);

const reportPath = process.argv[2] ?? 'gl-code-quality-report.json';

let findings;
try {
  findings = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (error) {
  console.error(`Could not read ${reportPath}: ${error.message}`);
  process.exit(1);
}

const line = (f) => f.location?.lines?.begin ?? f.location?.positions?.begin?.line ?? 0;
const ruleOf = (f) => (f.check_name ?? '').replace(/^eslint\./, '');

const complexity = findings.filter((f) => COMPLEXITY_RULES.has(ruleOf(f)));
const other = findings.filter((f) => !COMPLEXITY_RULES.has(ruleOf(f)));

console.log('\nComplexity report');

if (complexity.length === 0) {
  console.log('No complexity budgets exceeded.');
} else {
  table(
    countBy(complexity, ruleOf).map(([rule, count]) => [rule, count]),
    ['Rule', 'Violations'],
  );

  console.log('\nHotspots (files with the most violations):');
  table(
    countBy(complexity, (f) => rel(f.location.path))
      .slice(0, 10)
      .map(([file, count]) => [file, count]),
    ['File', 'Violations'],
  );

  console.log('\nDetails:');
  for (const f of complexity.sort((a, b) =>
    `${a.location.path}${line(a)}`.localeCompare(`${b.location.path}${line(b)}`),
  )) {
    console.log(`  ${rel(f.location.path)}:${line(f)}  ${f.description}  [${ruleOf(f)}]`);
  }
}

console.log(
  `\nTotal: ${complexity.length} complexity finding(s), ${other.length} other lint finding(s) across ${
    new Set(findings.map((f) => f.location.path)).size
  } file(s).`,
);

if (other.length > 0) {
  console.log(
    `Note: the ${other.length} other lint finding(s) are reported in the code quality report but do not fail this job.`,
  );
}

// Only the complexity budgets gate the pipeline.
if (complexity.length > 0) {
  console.log(
    `\nFAILED: ${complexity.length} complexity budget violation(s). Split the offending unit(s) or raise the budget in eslint.config.ci.js.\n`,
  );
  process.exit(1);
}

console.log('\nPASSED: all complexity budgets met.\n');
