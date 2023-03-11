import type { Identifier } from 'estree';
import { createPluginRule } from '../utils';

export default createPluginRule({
  ruleName: 'no-unused-imports',
  type: 'suggestion',
  create: ruleCtx => {
    const amounts = new Map<string, number>();
    const identifiers = new Map<string, Identifier>();

    return {
      ImportSpecifier({ imported, local }) {
        if(imported.range?.[0] === void 0 || local.range?.[1] === void 0) {
          return;
        }

        identifiers.set(local.name, {
          ...local,
          range: [imported.range[0], local.range[1]],
        });
      },
      Identifier({ name, parent }) {
        if(parent.type === 'ImportSpecifier') {
          return;
        }

        amounts.set(name, (amounts.get(name) ?? 0) + 1);
      },
      'Program:exit': function() {
        for(const [name, identifier] of identifiers.entries()) {
          const amount = amounts.get(name) ?? 0;
          if(amount) {
            continue;
          }

          const isType = (identifier as any)?.parent?.importKind === 'type';
          const _loc = (identifier as any)?.parent?.parent?.loc;
          const isMultiline = _loc.start.line !== _loc.end.line;

          const { loc, range } = identifier;
          if(!loc || !range) {
            return;
          }
          const isLastLine = loc.end.line + 1 === _loc.end.line;

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
              const start = range[0] + (isType ? -5 : 0);

              if(isLastLine) {
                return fixer.replaceTextRange([start, range[1] + 3], '}');
              }

              return fixer.replaceTextRange([start, range[1] + (isMultiline ? 2 : 1)], '');
            },
          });
        }
      },
    };
  },
});
