import { createAsyncAwaitBound, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'add-async-keyword-if-function-has-await',
  type: 'problem',
  ruleEntry: 'error',
  create: ruleCtx => {
    const { ruleListeners, awaitPairFunctions } = createAsyncAwaitBound();

    return {
      ...ruleListeners,
      'Program:exit': () => {
        for(const { async, parent, type, ...rest } of awaitPairFunctions) {
          const { loc, range } = type === 'FunctionExpression' && parent?.type === 'Property' ? parent : rest;
          if(async !== false || !loc || !range) {
            continue;
          }

          ruleCtx.report({
            message: "Only async function can have 'await' expression.",
            loc: {
              start: {
                line: loc.start.line,
                column: loc.start.column - 1,
              },
              end: {
                line: loc.start.line,
                column: loc.start.column + 1,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([range[0], range[0]], 'async ');
            },
          });
        }
      },
    };
  },
});
