import base from './eslint.config.js';

// CI-only layer: complexity budgets that gate the pipeline. Kept out of
// eslint.config.js so `npm run lint` stays focused on correctness.
export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/features/settings/ProfDinoGame.tsx'],
    rules: {
      // Backstop values, not style preferences. Today's worst function is 314
      'max-lines-per-function': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      complexity: ['error', { max: 20 }],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],
    },
  },
];
