import { addSpaceBeforeKeyword, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'space-before-keywords',
  type: 'layout',
  create: addSpaceBeforeKeyword(['satisfies', 'as']),
});
