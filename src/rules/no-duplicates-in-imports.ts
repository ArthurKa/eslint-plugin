import { Rule } from 'eslint';
import type{ ImportSpecifier } from 'estree';
import { createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-duplicates-in-imports',
  type: 'problem',
  ruleEntry: 'error',
  create: ruleCtx => {
    let prev: ImportSpecifier & Rule.NodeParentExtension | null = null;

    return {
      ImportSpecifier(node) {
        try {
          const { range } = node;
          if(!prev || !range) {
            return;
          }

          // @ts-expect-error
          if(prev.imported.name !== node.imported.name || node.parent.source.value !== prev.parent.source.value) {
            return;
          }

          ruleCtx.report({
            message: 'There should be no duplicate in import.',
            node,
            fix(fixer) {
              if(!prev?.range) {
                throw new Error('This should never happen. 5ie0fk');
              }
              return fixer.replaceTextRange([prev.range[1], range[1]], '');
            },
          });
        } finally {
          prev = node;
        }
      },
    };
  },
});
