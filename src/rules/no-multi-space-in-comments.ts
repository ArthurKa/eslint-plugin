import { makeCommentsCheckRule } from '../utils';

export const noMultiSpaceInComments = makeCommentsCheckRule({
  reportMessage: 'There should be no multiple spaces.',
  regExp: /\s{2,}/g,
  replaceWith: ' ',
});
