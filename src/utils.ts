import type { AST, Rule } from 'eslint';
import type { Identifier } from 'estree';

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
  message,
  brackets,
}: {
  ruleCtx: Rule.RuleContext;
  message: string;
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
            message,
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
