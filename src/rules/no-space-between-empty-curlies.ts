import { Rule } from 'eslint';
import { makeBracketsIdentifier } from '../utils';

export const noSpaceBetweenEmptyCurlies: Rule.RuleModule['create'] = ruleCtx => ({
  Identifier: makeBracketsIdentifier({
    ruleCtx,
    message: 'There should be no space between curlies.',
    brackets: ['{', '}'],
  }),
});
