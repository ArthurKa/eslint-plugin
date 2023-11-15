import { createAsyncAwaitBound, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'add-async-keyword-if-function-has-await',
  type: 'problem',
  ruleEntry: 'error',
  create: ruleCtx => {
    const { ruleListeners, awaitPairFunctions, getParams } = createAsyncAwaitBound();

    return {
      ...ruleListeners,
      'Program:exit': () => {
        for(const functionNode of awaitPairFunctions) {
          const params = getParams(functionNode);
          if(!params || params.isAsync) {
            continue;
          }

          ruleCtx.report({
            message: "Only async function can have 'await' expression.",
            loc: {
              start: {
                line: params.loc.start.line,
                column: params.loc.start.column - 1,
              },
              end: {
                line: params.loc.start.line,
                column: params.loc.start.column + 1,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([params.range[0], params.range[0]], 'async ');
            },
          });
        }
      },
    };
  },
});
