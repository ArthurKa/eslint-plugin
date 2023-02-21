import { createPluginRule, makeCommentsCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-space-in-jsdoc-type-curlies',
  type: 'layout',
  create: makeCommentsCheckRule({
    reportMessage: 'There should be no space in JSDoc type curlies.',
    regExp: /((?<=^[^{]+{) )|( (?=}[^}]*$))/g,
    replaceWith: '',
    skipIteration: ({ value }) => !value.trim().match(/\* @type(def)?\b/),
  }),
});
