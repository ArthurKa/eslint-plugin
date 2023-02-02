import type { AST, Linter, Rule } from 'eslint';
import type { Comment, Identifier } from 'estree';

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
