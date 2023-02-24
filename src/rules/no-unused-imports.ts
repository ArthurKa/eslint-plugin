import type { Identifier } from 'estree';
import { createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-unused-imports',
  type: 'suggestion',
  create: ruleCtx => {
    const amounts = new Map<string, number>();
    const identifiers = new Map<string, Identifier>();

    return {
      ImportSpecifier({ imported }) {
        identifiers.set(imported.name, imported);
      },
      Identifier({ name }) {
        amounts.set(name, (amounts.get(name) ?? 0) + 1);
      },
      'Program:exit': function() {
        for(const [name, amount] of amounts.entries()) {
          const identifier = identifiers.get(name);
          if(amount > 2 || !identifier) {
            continue;
          }

          const { loc, range } = identifier;
          if(!loc || !range) {
            return;
          }

          ruleCtx.report({
            message: `'${name}' is defined but never used.`,
            loc: {
              start: {
                line: loc.start.line,
                column: loc.start.column,
              },
              end: {
                line: loc.end.line,
                column: loc.end.column,
              },
            },
            fix(fixer) {
              return fixer.replaceTextRange([range[0], range[1] + 1], '');
            },
          });
        }
      },
    };
  },
});
