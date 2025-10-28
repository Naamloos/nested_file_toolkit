import { Uri, workspace } from 'vscode';

export const findMatchedPattern = (
  parentUri: Uri,
  childUri: Uri,
): { parentPattern: string; childPattern: string } | null => {
  const patterns = workspace
    .getConfiguration('explorer', parentUri)
    .get<Record<string, string>>('fileNesting.patterns');

  if (!patterns) {
    return null;
  }

  for (const [parentPattern, childrenStr] of Object.entries(patterns)) {
    const childPatterns = childrenStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const childPat of childPatterns) {
      const childRegex = new RegExp('^' + childPat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(.+?)') + '$');
      const childFileName = childUri.path.split('/').pop() || '';
      const m = childFileName.match(childRegex);

      if (m) {
        const capture = m.slice(1).find((c) => c);

        if (capture) {
          return { parentPattern, childPattern: capture };
        }
      }
    }
  }

  return null;
};
