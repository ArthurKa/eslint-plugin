import { createPluginRule, makeCommentsCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'space-after-coma-in-eslint-disable-directives',
  create: makeCommentsCheckRule({
    reportMessage: 'There should be space after coma.',
    regExp: /,(?=[^ ])/g,
    replaceWith: ', ',
    skipIteration: ({ value }) => !value.trim().startsWith('eslint-disable'),
  }),
});
