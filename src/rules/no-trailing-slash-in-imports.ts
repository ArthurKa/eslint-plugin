import { createPluginRule, makeImportCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-trailing-slash-in-imports',
  type: 'suggestion',
  create: makeImportCheckRule({
    reportMessage: 'There should be no trailing slash.',
    endsWith: '/',
    replaceWith: '',
  }),
});
