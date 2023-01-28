import { AST, Rule } from 'eslint';

function findProgram(node: Rule.NodeParentExtension): AST.Program | null {
  do {
    if(node.parent.type === 'Program') {
      return node.parent as any;
    }

    // eslint-disable-next-line no-param-reassign, no-cond-assign
  } while(node = node.parent);

  return null;
}

const alreadyReportedProgramRanges = new Set<`${number} ${number}`>();

export const noSpaceBetweenEmptyCurlies: Rule.RuleModule['create'] = ruleCtx => ({
  Identifier: node => {
    const program = findProgram(node);

    if(!program) {
      return;
    }

    program.tokens.forEach((openCurly, i, arr) => {
      if(openCurly.value === '{') {
        const closeCurly = arr[i + 1];
        if(closeCurly?.value !== '}') {
          return;
        }

        if(
          true
            && openCurly.loc.start.line === closeCurly.loc.start.line
            && closeCurly.loc.start.column - openCurly.loc.start.column === 2
        ) {
          const rangeStart = openCurly.range[0];
          const rangeEnd = closeCurly.range[1];
          const reportRange = `${rangeStart} ${rangeEnd}` as const;

          if(alreadyReportedProgramRanges.has(reportRange)) {
            return;
          }

          alreadyReportedProgramRanges.add(reportRange);

          ruleCtx.report({
            message: 'There should be no space between curlies.',
            loc: {
              start: openCurly.loc.start,
              end: closeCurly.loc.end,
            },
            fix(fixer) {
              setTimeout(() => {
                alreadyReportedProgramRanges.delete(reportRange);
              }, 0);

              return fixer.replaceTextRange([rangeStart, rangeEnd], '{}');
            },
          });
        }
      }
    });
  },
});
