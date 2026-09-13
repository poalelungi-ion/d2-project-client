import base from './eslint.config.js';

// CI-only layer: complexity budgets reported as warnings so the pipeline can
// surface them without failing `npm run lint` locally.
export default [
  ...base,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['warn', 3],
      'max-params': ['warn', 4],
    },
  },
];
