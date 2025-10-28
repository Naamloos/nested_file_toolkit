export const childPatternToRegex = (childPattern: string): RegExp => {
  // First, split by the capture token
  const parts = childPattern.split(/\$\(capture\)|\$\{capture\}/);

  if (parts.length < 2) {
    // No capture token found, just return a simple regex
    const escaped = childPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

    return new RegExp('^' + escaped + '$');
  }

  // Escape each part individually BEFORE joining with capture group
  const escapedParts = parts.map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));

  // Join with a capture group (.+?) between each part
  const pattern = '^' + escapedParts.join('(.+?)') + '$';

  return new RegExp(pattern);
};
