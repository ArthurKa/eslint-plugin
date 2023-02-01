import { Rule } from 'eslint';

export const noMultiSpaceInComments: Rule.RuleModule['create'] = ruleCtx => ({
  Program(program) {
    program.comments?.forEach(({ loc, range, value }) => {
      if(!loc || !range || loc.start.line !== loc.end.line) {
        return;
      }

      const { line, column } = loc.start;
      const rangeShift = range[0] - column;
      const re = /\s{2,}/gm;
      let match: ReturnType<RegExp['exec']>;

      // eslint-disable-next-line no-cond-assign
      while(match = re.exec(value)) {
        const { 0: value, index } = match;

        const startColumn = column + index + 2;
        const endColumn = startColumn + value.length;

        ruleCtx.report({
          message: 'There should be no multiple spaces.',
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
            return fixer.replaceTextRange([rangeShift + startColumn, rangeShift + endColumn], ' ');
          },
        });
      }
    });
  },
});
