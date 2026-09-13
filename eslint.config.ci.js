import base from './eslint.config.js';

// CI-only layer: complexity budgets that gate the pipeline. Kept out of
// eslint.config.js so `npm run lint` stays focused on correctness.
export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // 250 lines is an outlier marker, not a style preference: p90 across the
      // codebase is ~92 lines, so only genuinely oversized units trip this.
      'max-lines-per-function': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],
    },
  },
];
