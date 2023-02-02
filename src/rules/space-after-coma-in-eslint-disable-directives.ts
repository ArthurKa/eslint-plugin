import { makeCommentsCheckRule } from '../utils';

export const spaceAfterComaInEslintDisableDirectives = makeCommentsCheckRule({
  reportMessage: 'There should be space after coma.',
  regExp: /,(?=[^ ])/g,
  replaceWith: ', ',
  skipIteration: ({ value }) => !value.trim().startsWith('eslint-disable'),
});
