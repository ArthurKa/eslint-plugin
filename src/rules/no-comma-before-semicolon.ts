import { AST } from 'eslint';
import { castTo, createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-comma-before-semicolon',
  type: 'problem',
  ruleEntry: 'error',
  create: ruleCtx => ({
    Program(program) {
      castTo<AST.Program>(program);

      program.tokens.forEach((e, i, arr) => {
        const prev = arr[i - 1];
        if(e.value !== ';' || prev?.value !== ',') {
          return;
        }

        ruleCtx.report({
          message: 'There should be no comma before semicolon.',
          loc: {
            start: {
              line: prev.loc.start.line,
              column: prev.loc.start.column,
            },
            end: {
              line: prev.loc.end.line,
              column: prev.loc.end.column,
            },
          },
          fix(fixer) {
            return fixer.replaceTextRange(prev.range, '');
          },
        });
      });
    },
  }),
});
