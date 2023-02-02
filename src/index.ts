import { ESLint, Rule } from 'eslint';
import * as configs from './configs';
import * as rules from './rules';

export = ((e: ESLint.Plugin) => e)({
  configs,
  rules: Object.fromEntries(
    Object.values(rules).map(({ ruleName, create, type }) => [
      ruleName,
      ((e: Rule.RuleModule) => e)({
        create,
        meta: {
          fixable: 'code',
          type,
        },
      }),
    ]),
  ),
});
