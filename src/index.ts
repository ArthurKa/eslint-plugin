import { ESLint } from 'eslint';
import * as configs from './configs';
import * as rules from './rules';

export = ((e: ESLint.Plugin) => e)({
  configs,
  rules: {
    'no-space-between-empty-curlies': {
      create: rules.noSpaceBetweenEmptyCurlies,
      meta: {
        fixable: 'code',
      },
    },
  },
});
