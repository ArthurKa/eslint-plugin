import type { AST, Linter, Rule } from 'eslint';
import type { ArrowFunctionExpression, Comment, FunctionDeclaration, FunctionExpression, Identifier } from 'estree';

export const createPluginRule = ({
  ruleName,
  type,
  ruleEntry = 'warn',
  create,
}: {
  ruleName: string;
  ruleEntry?: Linter.RuleEntry;
  type: NonNullable<Rule.RuleMetaData['type']>;
  create: Rule.RuleModule['create'];
}) => ({
  ruleName,
  type,
  ruleEntry,
  create,
});

export const findProgram = (node: Rule.NodeParentExtension): AST.Program | null => {
  do {
    if(node.parent.type === 'Program') {
      return node.parent as any;
    }

    // eslint-disable-next-line no-param-reassign, no-cond-assign
  } while(node = node.parent);

  return null;
};

export const makeBracketsIdentifier = ({
  ruleCtx,
  reportMessage,
  brackets,
}: {
  ruleCtx: Rule.RuleContext;
  reportMessage: string;
  brackets: [string, string];
}) => {
  const alreadyReportedProgramRanges = new Set<`${number} ${number}`>();

  return (node: Identifier & Rule.NodeParentExtension) => {
    const program = findProgram(node);

    if(!program) {
      return;
    }

    program.tokens.forEach((openBracket, i, arr) => {
      if(openBracket.value === brackets[0]) {
        const closeBracket = arr[i + 1];
        if(closeBracket?.value !== brackets[1]) {
          return;
        }

        if(
          true
          && openBracket.loc.start.line === closeBracket.loc.start.line
          && closeBracket.loc.start.column - openBracket.loc.start.column === 2
        ) {
          const rangeStart = openBracket.range[0];
          const rangeEnd = closeBracket.range[1];
          const reportRange = `${rangeStart} ${rangeEnd}` as const;

          if(alreadyReportedProgramRanges.has(reportRange)) {
            return;
          }

          alreadyReportedProgramRanges.add(reportRange);

          ruleCtx.report({
            message: reportMessage,
            loc: {
              start: openBracket.loc.end,
              end: closeBracket.loc.start,
            },
            fix(fixer) {
              setTimeout(() => {
                alreadyReportedProgramRanges.delete(reportRange);
              }, 0);

              return fixer.replaceTextRange([rangeStart + 1, rangeEnd - 1], '');
            },
          });
        }
      }
    });
  };
};

export const makeCommentsCheckRule = ({
  reportMessage,
  regExp,
  replaceWith,
  skipIteration,
}: {
  reportMessage: string;
  regExp: RegExp;
  replaceWith: string;
  skipIteration?: (comment: Comment) => boolean;
}): Rule.RuleModule['create'] => (
  ruleCtx => ({
    Program(program) {
      program.comments?.forEach(comment => {
        const { loc, range, value } = comment;
        if(
          false
            || !loc
            || !range
            || loc.start.line !== loc.end.line
            || skipIteration?.(comment)
        ) {
          return;
        }

        const { line, column } = loc.start;
        const rangeShift = range[0] - column;
        const re = new RegExp(regExp);
        let match: ReturnType<RegExp['exec']>;

        // eslint-disable-next-line no-cond-assign
        while(match = re.exec(value)) {
          const { 0: value, index } = match;

          const startColumn = column + index + 2;
          const endColumn = startColumn + value.length;

          ruleCtx.report({
            message: reportMessage,
            loc: {
              start: {
                line,
                column: startColumn,
              },
              end: {
                line,
                column: endColumn,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([rangeShift + startColumn, rangeShift + endColumn], replaceWith);
            },
          });
        }
      });
    },
  })
);

export function castTo<T>(e: unknown): asserts e is T {}

export const addSpaceForKeyword = (
  position: 'before' | 'after',
  keywords: string[],
): Rule.RuleModule['create'] => (
  ruleCtx => ({
    Program(program) {
      castTo<AST.Program>(program);

      for(const keyword of keywords) {
        program.tokens.forEach((e, i, arr) => {
          let prev = arr[i + (position === 'before' ? -1 : 1)];
          if(e.value !== keyword || !prev) {
            return;
          }

          if(position === 'after') {
            // eslint-disable-next-line no-param-reassign
            [e, prev] = [prev, e];
          }

          if(prev.range[1] !== e.range[0]) {
            return;
          }

          ruleCtx.report({
            message: `There should be space ${position} '${keyword}' keyword.`,
            loc: {
              start: {
                line: e.loc.start.line,
                column: e.loc.start.column - 1,
              },
              end: {
                line: e.loc.start.line,
                column: e.loc.start.column + 1,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([e.range[0], e.range[0]], ' ');
            },
          });
        });
      }
    },
  })
);

export const makeImportCheckRule = ({
  reportMessage,
  endsWith,
  replaceWith,
}: {
  reportMessage: string;
  endsWith: string;
  replaceWith: string;
}): Rule.RuleModule['create'] => (
  ruleCtx => ({
    ImportDeclaration(node) {
      const { value, loc, range } = node.source;
      if(!range || !loc || typeof value !== 'string' || !value.endsWith(endsWith)) {
        return;
      }

      ruleCtx.report({
        message: reportMessage,
        loc: {
          start: {
            line: loc.start.line,
            column: loc.end.column - endsWith.length - 1,
          },
          end: {
            line: loc.end.line,
            column: loc.end.column - 1,
          },
        },
        fix(fixer) {
          return fixer.replaceTextRange([range[1] - endsWith.length - 1, range[1] - 1], replaceWith);
        },
      });
    },
  })
);

export const createAsyncAwaitBound = () => {
  type FunctionNode = (
    & Rule.NodeParentExtension
    & (
      | ArrowFunctionExpression
      | FunctionExpression
      | FunctionDeclaration
    )
  );

  const awaitPairFunctions = new Set<FunctionNode>();
  const allFunctions = new Set<FunctionNode>();

  return {
    awaitPairFunctions,
    allFunctions,
    ruleListeners: {
      ArrowFunctionExpression: node => allFunctions.add(node),
      FunctionExpression: node => allFunctions.add(node),
      FunctionDeclaration: node => allFunctions.add(node),
      AwaitExpression(node) {
        let funcNode = node.parent as typeof node.parent | null;

        while(funcNode && funcNode.type !== 'ArrowFunctionExpression' && funcNode.type !== 'FunctionDeclaration' && funcNode.type !== 'FunctionExpression') {
          funcNode = funcNode.parent;
        }

        if(!funcNode) {
          return;
        }

        awaitPairFunctions.add(funcNode);
      },
    } satisfies ReturnType<Parameters<typeof createPluginRule>[0]['create']>,
  };
};
