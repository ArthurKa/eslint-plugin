import { createPluginRule, makeImportCheckRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-end-with-index-in-imports',
  type: 'suggestion',
  create: makeImportCheckRule({
    reportMessage: 'There should be no `/index`.',
    endsWith: '/index',
    replaceWith: '',
  }),
});
