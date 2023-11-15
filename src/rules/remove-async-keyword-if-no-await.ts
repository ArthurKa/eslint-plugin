import { createAsyncAwaitBound, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'remove-async-keyword-if-no-await',
  type: 'suggestion',
  create: ruleCtx => {
    const { ruleListeners, allFunctions, awaitPairFunctions, getParams } = createAsyncAwaitBound();

    return {
      ...ruleListeners,
      'Program:exit': () => {
        const shouldNotBeAsync = [...allFunctions].filter(e => !awaitPairFunctions.has(e));

        for(const functionNode of shouldNotBeAsync) {
          const params = getParams(functionNode);
          if(!params || !params.isAsync) {
            continue;
          }

          ruleCtx.report({
            message: "Async function has no 'await' expression.",
            loc: params.loc.start,
            fix(fixer) {
              return fixer.replaceTextRange([params.range[0], params.range[0] + 5], '');
            },
          });
        }
      },
    };
  },
});
