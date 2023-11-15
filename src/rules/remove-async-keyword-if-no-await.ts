import { createAsyncAwaitBound, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'remove-async-keyword-if-no-await',
  type: 'suggestion',
  create: ruleCtx => {
    const { ruleListeners, allFunctions, awaitPairFunctions } = createAsyncAwaitBound();

    return {
      ...ruleListeners,
      'Program:exit': () => {
        const shouldNotBeAsync = [...allFunctions].filter(e => !awaitPairFunctions.has(e));

        for(const { async, parent, type, ...rest } of shouldNotBeAsync) {
          const { loc, range } = type === 'FunctionExpression' && parent?.type === 'Property' ? parent : rest;
          if(async !== true || !loc || !range) {
            continue;
          }

          ruleCtx.report({
            message: "Async function has no 'await' expression.",
            loc: loc.start,
            fix(fixer) {
              return fixer.replaceTextRange([range[0], range[0] + 5], '');
            },
          });
        }
      },
    };
  },
});
