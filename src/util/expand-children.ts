export const expandChildren = (childrenStr: string, capture: string): string[] => {
  return childrenStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/\$\(capture\)/g, capture).replace(/\$\{capture\}/g, capture));
};