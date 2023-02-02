import { createPluginRule, makeCommentsCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'space-after-comma-in-eslint-disable-directives',
  type: 'layout',
  create: makeCommentsCheckRule({
    reportMessage: 'There should be space after comma.',
    regExp: /,(?=[^ ])/g,
    replaceWith: ', ',
    skipIteration: ({ value }) => !value.trim().startsWith('eslint-disable'),
  }),
});
