import { createPluginRule, makeCommentsCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-space-in-jsdoc-type-import-parents',
  type: 'layout',
  create: makeCommentsCheckRule({
    reportMessage: 'There should be no space in JSDoc import parents.',
    regExp: /((?<=import\() )|((?<=import\([^)]+) (?=\)))/g,
    replaceWith: '',
    skipIteration: ({ value }) => !value.trim().match(/\* @type(def)?\b/),
  }),
});
