import { basename, dirname, join } from 'path';
import { Uri, workspace } from 'vscode';
import { childPatternToRegex } from './child-pattern-to-regex';

export const detectParentFiles = async (fileFsPath: string): Promise<string[]> => {
  const fileName = basename(fileFsPath);
  const parentDir = dirname(fileFsPath);

  const patterns =
    workspace.getConfiguration('explorer', Uri.file(fileFsPath)).get<Record<string, string>>('fileNesting.patterns') ||
    {};

  const parents = new Set<string>();

  for (const [parentPattern, childrenStr] of Object.entries(patterns)) {
    const childPatterns = childrenStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const childPat of childPatterns) {
      const childRegex = childPatternToRegex(childPat);
      const m = fileName.match(childRegex);

      if (m) {
        // Find the first non-empty capture group
        const capture = m.slice(1).find((c) => c);

        if (capture) {
          const parentName = parentPattern.replace(/\*/g, capture);
          const candidate = join(parentDir, parentName);

          try {
            await workspace.fs.stat(Uri.file(candidate));
            parents.add(candidate);
          } catch {
            /* not exist */
          }
        }
      }
    }
  }

  return Array.from(parents);
};
