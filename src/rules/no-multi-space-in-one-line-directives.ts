import { createPluginRule, makeCommentsCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-multi-space-in-one-line-directives',
  type: 'layout',
  create: makeCommentsCheckRule({
    reportMessage: 'There should be no multiple spaces.',
    regExp: /\s{2,}/g,
    replaceWith: ' ',
    skipIteration: ({ value }) => !value.trim().match(/^(\*\s+)?(eslint[-\b]|@type(def)?\b|@example\b)/),
  }),
});
