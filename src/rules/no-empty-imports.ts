import { AST } from 'eslint';
import { castTo, createPluginRule } from '../utils';

const reportMessage = 'There should be no empty import.';

export default createPluginRule({
  ruleName: 'no-empty-imports',
  type: 'suggestion',
  create: ruleCtx => ({
    Program(program) {
      castTo<AST.Program>(program);

      program.tokens.forEach((e, i, arr) => {
        if(
          true
            && e.value === 'import'
            && arr[i + 1]?.value === '{'
            && arr[i + 2]?.value === '}'
            && arr[i + 3]?.value === 'from'
            && arr[i + 4]?.type === 'String'
        ) {
          const end = arr[i + 4];
          if(!end) {
            return;
          }

          ruleCtx.report({
            message: reportMessage,
            loc: {
              start: {
                line: e.loc.start.line,
                column: e.loc.start.column,
              },
              end: {
                line: end.loc.end.line,
                column: end.loc.end.column,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([e.range[0] - 1, end.range[1]], '');
            },
          });
          return;
        }

        if(
          true
            && e.value === 'import'
            && arr[i + 1]?.type === 'Identifier'
            && arr[i + 2]?.value === ','
            && arr[i + 3]?.value === '{'
            && arr[i + 4]?.value === '}'
            && arr[i + 5]?.value === 'from'
            && arr[i + 6]?.type === 'String'
        ) {
          const start = arr[i + 2];
          const curly = arr[i + 3];
          const end = arr[i + 4];
          if(!start || !end || !curly) {
            return;
          }

          ruleCtx.report({
            message: reportMessage,
            loc: {
              start: {
                line: curly.loc.start.line,
                column: curly.loc.start.column,
              },
              end: {
                line: end.loc.end.line,
                column: end.loc.end.column,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([start.range[0], end.range[1]], '');
            },
          });
        }

        if(
          true
            && e.value === 'import'
            && arr[i + 1]?.value === 'type'
            && arr[i + 2]?.type === 'Identifier'
            && arr[i + 3]?.value === ','
            && arr[i + 4]?.value === '{'
            && arr[i + 5]?.value === '}'
            && arr[i + 6]?.value === 'from'
            && arr[i + 7]?.type === 'String'
        ) {
          const start = arr[i + 3];
          const curly = arr[i + 4];
          const end = arr[i + 5];
          if(!start || !end || !curly) {
            return;
          }

          ruleCtx.report({
            message: reportMessage,
            loc: {
              start: {
                line: curly.loc.start.line,
                column: curly.loc.start.column,
              },
              end: {
                line: end.loc.end.line,
                column: end.loc.end.column,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([start.range[0], end.range[1]], '');
            },
          });
        }
      });
    },
  }),
});
