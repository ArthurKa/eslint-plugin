import { Rule } from 'eslint';
import { makeBracketsIdentifier } from '../utils';

export const noSpaceBetweenEmptyParens: Rule.RuleModule['create'] = ruleCtx => ({
  Identifier: makeBracketsIdentifier({
    ruleCtx,
    reportMessage: 'There should be no space between parens.',
    brackets: ['(', ')'],
  }),
});
