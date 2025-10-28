import { FileRenameEvent, Uri, workspace } from 'vscode';
import { globToRegex } from '../util/glob-to-regex';
import * as path from 'path';
import { detectChildFiles } from '../util/detect-child-files';
import { detectParentFiles } from '../util/detect-parent-files';
import { childPatternToRegex } from '../util/child-pattern-to-regex';

const syncNestedFileRenames = async (event: FileRenameEvent): Promise<void> => {
  const syncRenames = workspace.getConfiguration('nested-file-toolkit').get<boolean>('syncRenames');

  if (!syncRenames) {
    return;
  }

  await Promise.all(event.files.map((f) => renameRelationsIfNeeded(f.oldUri, f.newUri)));
};

const renameRelationsIfNeeded = async (oldFile: Uri, newFile: Uri): Promise<void> => {
  const patterns = workspace.getConfiguration('explorer', oldFile).get<Record<string, string>>('fileNesting.patterns');

  if (!patterns) {
    return;
  }

  const oldBase = path.basename(oldFile.fsPath);
  const newBase = path.basename(newFile.fsPath);
  const [children, parents] = await Promise.all([detectChildFiles(oldFile.fsPath), detectParentFiles(oldFile.fsPath)]);

  for (const [parentPattern, childPattern] of Object.entries(patterns)) {
    const parentRegex = globToRegex(parentPattern);
    const childPatterns = childPattern
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const childRegexes = childPatterns.map((p) => childPatternToRegex(p));

    // Handle parent renames
    for (const parent of parents) {
      if (!parentRegex.test(path.basename(parent))) {
        continue;
      }

      const capture = getFirstCapture(childRegexes, oldBase, newBase);

      if (capture) {
        const [oldCap, newCap] = capture;
        const newParentName = parent.replace(oldCap, newCap);

        if (!(await fileExists(newParentName))) {
          await workspace.fs.rename(Uri.file(parent), Uri.file(newParentName), { overwrite: false });
        }
      }
    }

    // Handle child renames
    const oldPart = oldBase.match(parentRegex);
    const newPart = newBase.match(parentRegex);

    if (oldPart && newPart && oldPart.length > 1 && newPart.length > 1) {
      for (const child of children) {
        if (childRegexes.some((rx) => rx.test(path.basename(child)))) {
          const newChild = child.replace(oldPart[1], newPart[1]);

          if (!(await fileExists(newChild))) {
            await workspace.fs.rename(Uri.file(child), Uri.file(newChild), { overwrite: false });
          }
        }
      }
    }
  }
};

function getFirstCapture(regexes: RegExp[], oldBase: string, newBase: string): [string, string] | undefined {
  for (const rx of regexes) {
    const oldCap = oldBase.match(rx);
    const newCap = newBase.match(rx);

    if (oldCap && newCap && oldCap.length > 1 && newCap.length > 1) {
      return [oldCap[1], newCap[1]];
    }
  }

  return undefined;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await workspace.fs.stat(Uri.file(filePath));

    return true;
  } catch {
    return false;
  }
}

export { syncNestedFileRenames };
