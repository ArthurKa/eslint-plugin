import { ESLint } from 'eslint';
import * as rules from './rules';

export = ((e: ESLint.Plugin) => e)({
  rules: {
    'no-space-between-empty-curlies': {
      create: rules.noSpaceBetweenEmptyCurlies,
      meta: {
        fixable: 'code',
      },
    },
  },
});
