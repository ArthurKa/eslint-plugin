import { addSpaceForKeyword, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'space-after-keywords',
  type: 'layout',
  create: addSpaceForKeyword('after', ['satisfies', 'as', 'type']),
});
