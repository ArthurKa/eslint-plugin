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
    'no-space-between-empty-parens': {
      create: rules.noSpaceBetweenEmptyParens,
      meta: {
        fixable: 'code',
      },
    },
    'no-multi-space-in-comments': {
      create: rules.noMultiSpaceInComments,
      meta: {
        fixable: 'code',
      },
    },
    'space-after-coma-in-eslint-disable-directives': {
      create: rules.spaceAfterComaInEslintDisableDirectives,
      meta: {
        fixable: 'code',
      },
    },
  },
});
