/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import path = require('path');
import { createPluginRule } from '../utils';

let astUtils;
try {
  astUtils = require('eslint/lib/rules/utils/ast-utils');
} catch(e) {
  try {
    astUtils = require(require.resolve('eslint/lib/rules/utils/ast-utils'));
  } catch(e) {
    try {
      astUtils = require(path.resolve('node_modules/eslint/lib/rules/utils/ast-utils'));
    } catch(e) {
      astUtils = require(path.resolve('../../node_modules/eslint/lib/rules/utils/ast-utils'));
    }
  }
}

const PATTERN_TYPE = /^(?:.+?Pattern|RestElement|SpreadProperty|ExperimentalRestProperty|Property)$/u;
const DECLARATION_HOST_TYPE = /^(?:Program|BlockStatement|SwitchCase)$/u;
const DESTRUCTURING_HOST_TYPE = /^(?:VariableDeclarator|AssignmentExpression)$/u;

function isInitOfForStatement(node) {
  return node.parent.type === 'ForStatement' && node.parent.init === node;
}

function canBecomeVariableDeclaration(identifier) {
  let node = identifier.parent;

  while(PATTERN_TYPE.test(node.type)) {
    node = node.parent;
  }

  return (
    node.type === 'VariableDeclarator' ||
    (
      node.type === 'AssignmentExpression' &&
      node.parent.type === 'ExpressionStatement' &&
      DECLARATION_HOST_TYPE.test(node.parent.parent.type)
    )
  );
}

function isOuterVariableInDestructing(name, initScope) {
  if(initScope.through.find(ref => ref.resolved && ref.resolved.name === name)) {
    return true;
  }

  const variable = astUtils.getVariableByName(initScope, name);

  if(variable !== null) {
    return variable.defs.some(def => def.type === 'Parameter');
  }

  return false;
}

function getDestructuringHost(reference) {
  if(!reference.isWrite()) {
    return null;
  }
  let node = reference.identifier.parent;

  while(PATTERN_TYPE.test(node.type)) {
    node = node.parent;
  }

  if(!DESTRUCTURING_HOST_TYPE.test(node.type)) {
    return null;
  }
  return node;
}

function hasMemberExpressionAssignment(node) {
  switch(node.type) {
    case 'ObjectPattern':
      return node.properties.some(prop => {
        if(prop) {
          return hasMemberExpressionAssignment(prop.argument || prop.value);
        }

        return false;
      });

    case 'ArrayPattern':
      return node.elements.some(element => {
        if(element) {
          return hasMemberExpressionAssignment(element);
        }

        return false;
      });

    case 'AssignmentPattern':
      return hasMemberExpressionAssignment(node.left);

    case 'MemberExpression':
      return true;
  }

  return false;
}

function getIdentifierIfShouldBeConst(variable, ignoreReadBeforeAssign) {
  if(variable.eslintUsed && variable.scope.type === 'global') {
    return null;
  }

  let writer = null;
  let isReadBeforeInit = false;
  const references = variable.references;

  for(let i = 0; i < references.length; ++i) {
    const reference = references[i];

    if(reference.isWrite()) {
      const isReassigned = (
        writer !== null &&
        writer.identifier !== reference.identifier
      );

      if(isReassigned) {
        return null;
      }

      const destructuringHost = getDestructuringHost(reference);

      if(destructuringHost !== null && destructuringHost.left !== void 0) {
        const leftNode = destructuringHost.left;
        let hasOuterVariables = false;
        let hasNonIdentifiers = false;

        if(leftNode.type === 'ObjectPattern') {
          const properties = leftNode.properties;

          hasOuterVariables = properties
            .filter(prop => prop.value)
            .map(prop => prop.value.name)
            .some(name => isOuterVariableInDestructing(name, variable.scope));

          hasNonIdentifiers = hasMemberExpressionAssignment(leftNode);
        } else if(leftNode.type === 'ArrayPattern') {
          const elements = leftNode.elements;

          hasOuterVariables = elements
            .map(element => element && element.name)
            .some(name => isOuterVariableInDestructing(name, variable.scope));

          hasNonIdentifiers = hasMemberExpressionAssignment(leftNode);
        }

        if(hasOuterVariables || hasNonIdentifiers) {
          return null;
        }
      }

      writer = reference;
    } else if(reference.isRead() && writer === null) {
      if(ignoreReadBeforeAssign) {
        return null;
      }
      isReadBeforeInit = true;
    }
  }

  const shouldBeConst = (
    writer !== null &&
    writer.from === variable.scope &&
    canBecomeVariableDeclaration(writer.identifier)
  );

  if(!shouldBeConst) {
    return null;
  }

  if(isReadBeforeInit) {
    return variable.defs[0].name;
  }

  return writer.identifier;
}

function groupByDestructuring(variables, ignoreReadBeforeAssign) {
  const identifierMap = new Map();

  for(let i = 0; i < variables.length; ++i) {
    const variable = variables[i];
    const references = variable.references;
    const identifier = getIdentifierIfShouldBeConst(variable, ignoreReadBeforeAssign);
    let prevId = null;

    for(let j = 0; j < references.length; ++j) {
      const reference = references[j];
      const id = reference.identifier;

      if(id === prevId) {
        continue;
      }
      prevId = id;

      const group = getDestructuringHost(reference);

      if(group) {
        if(identifierMap.has(group)) {
          identifierMap.get(group).push(identifier);
        } else {
          identifierMap.set(group, [identifier]);
        }
      }
    }
  }

  return identifierMap;
}

function findUp(node, type, shouldStop) {
  if(!node || shouldStop(node)) {
    return null;
  }
  if(node.type === type) {
    return node;
  }
  return findUp(node.parent, type, shouldStop);
}

export default createPluginRule({
  ruleName: 'use-let-if-reassigned',
  type: 'problem',
  ruleEntry: 'error',
  create(context) {
    const options = context.options[0] || {};
    const shouldMatchAnyDestructuredVariable = options.destructuring !== 'all';
    const ignoreReadBeforeAssign = options.ignoreReadBeforeAssign === true;
    const variables = [];
    let reportCount = 0;
    let checkedId = null;
    let checkedName = '';

    function checkGroup(map) {
      const entries = [...map.entries()];

      for(const [{ id }, nodes] of entries) {
        if(!id) {
          continue;
        }

        const nodesToReport = nodes.reduce((acc, cur) => {
          if(!cur) {
            acc.push(id);
          }

          return acc;
        }, []);

        if(nodes.length && (shouldMatchAnyDestructuredVariable || nodesToReport.length === nodes.length)) {
          const varDeclParent = findUp(nodes[0], 'VariableDeclaration', parentNode => parentNode.type.endsWith('Statement'));
          const isVarDecParentNull = varDeclParent === null;

          if(!isVarDecParentNull && varDeclParent.declarations.length > 0) {
            const firstDeclaration = varDeclParent.declarations[0];

            if(firstDeclaration.init) {
              const firstDecParent = firstDeclaration.init.parent;

              if(firstDecParent.type === 'VariableDeclarator') {
                if(firstDecParent.id.name !== checkedName) {
                  checkedName = firstDecParent.id.name;
                  reportCount = 0;
                }

                if(firstDecParent.id.type === 'ObjectPattern') {
                  if(firstDecParent.init.name !== checkedName) {
                    checkedName = firstDecParent.init.name;
                    reportCount = 0;
                  }
                }

                if(firstDecParent.id !== checkedId) {
                  checkedId = firstDecParent.id;
                  reportCount = 0;
                }
              }
            }
          }

          let shouldFix = varDeclParent &&

            (varDeclParent.parent.type === 'ForInStatement' || varDeclParent.parent.type === 'ForOfStatement' ||
              varDeclParent.declarations.every(declaration => declaration.init)) &&

            nodesToReport.length === nodes.length;

          if(!isVarDecParentNull && varDeclParent.declarations && varDeclParent.declarations.length !== 1) {
            if(varDeclParent && varDeclParent.declarations && varDeclParent.declarations.length >= 1) {
              reportCount += nodesToReport.length;

              shouldFix = shouldFix && (reportCount === varDeclParent.declarations.length);
            }
          }

          nodesToReport.forEach(node => {
            context.report({
              node,
              message: "This variable is reassigned. Use 'let' instead.",
              data: node,
              fix(fixer) {
                const { range } = node.parent.parent;

                return fixer.replaceTextRange([range[0], range[0] + 5], 'let');
              },
            });
          });
        }
      }
    }

    return {
      'Program:exit': function() {
        checkGroup(groupByDestructuring(variables, ignoreReadBeforeAssign));
      },
      VariableDeclaration(node) {
        if(node.kind === 'const' && !isInitOfForStatement(node)) {
          variables.push(...context.getDeclaredVariables(node));
        }
      },
    };
  },
});
