import { basename, dirname, join } from "path";
import { workspace, Uri } from "vscode";
import { globToRegex } from "./glob-to-regex";
import { getCapture } from "./get-capture";
import { expandChildren } from "./expand-children";

export const detectChildFiles = async (fileFsPath: string): Promise<string[]> => {
  const fileName = basename(fileFsPath);
  const parentDir = dirname(fileFsPath);

  const patterns = workspace.getConfiguration('explorer', Uri.file(fileFsPath)).get<Record<string, string>>('fileNesting.patterns') || {};

  const results = new Set<string>();
  for(const [parentPattern, childrenStr] of Object.entries(patterns)) {
    const regex = globToRegex(parentPattern);
    if(regex.test(fileName)) {
      const capture = getCapture(fileName, parentPattern);
      const expanded = expandChildren(childrenStr, capture);
      for(const child of expanded) {
        const candidate = join(parentDir, child);
        try {
          await workspace.fs.stat(Uri.file(candidate));
          results.add(candidate);
        } catch { /* not exist */ }
      }
    }
  }
  return Array.from(results);
};