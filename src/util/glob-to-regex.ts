export const globToRegex = (pattern: string): RegExp => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const withCapture = escaped.replace(/\*/g, '(.+?)');

  return new RegExp('^' + withCapture + '$');
};
