import { basename, dirname, join, relative } from 'path';
import { commands, Uri, ViewColumn, window, workspace } from 'vscode';
import { detectParentFiles } from '../util/detect-parent-files';
import { detectChildFiles } from '../util/detect-child-files';

/**
 * Open a file beside the current editor.
 */
const openBeside = async (absPath: string, left: boolean = false): Promise<void> => {
  // Store current editor's URI
  const currentEditor = window.activeTextEditor;
  if(!currentEditor) {
    return;
  }
  
  const currentUri = currentEditor.document.uri;

  // Close the current editor
  await commands.executeCommand('workbench.action.closeActiveEditor');
  
  if(!left) {
    const newDoc = await workspace.openTextDocument(Uri.file(absPath));
    await window.showTextDocument(newDoc, { viewColumn: ViewColumn.One, preview: false });
    const currentDoc = await workspace.openTextDocument(currentUri);
    await window.showTextDocument(currentDoc, { viewColumn: ViewColumn.Beside, preview: false });
  } else {
    const currentDoc = await workspace.openTextDocument(currentUri);
    await window.showTextDocument(currentDoc, { viewColumn: ViewColumn.One, preview: false });
    const newDoc = await workspace.openTextDocument(Uri.file(absPath));
    await window.showTextDocument(newDoc, { viewColumn: ViewColumn.Beside, preview: false });
  }
};

/**
 * Main command: split the editor with a related nested file or parent.
 * - If you're on a parent, it looks for existing children.
 * - If you're on a child, it looks for an existing parent.
 * Offers a picker if multiple candidates are found.
 * Always positions child on left, parent on right.
 */
const splitWithRelated = async (uri?: Uri): Promise<void> => {
  const fileUri = uri || window.activeTextEditor?.document.uri;
  if(!fileUri) {
    window.showErrorMessage('No active file.');
    return;
  }
  const fsPath = fileUri.fsPath;

  const children = await detectChildFiles(fsPath);
  const parents = await detectParentFiles(fsPath);

  const candidates = [...children, ...parents];
  if(!candidates.length) {
    window.showInformationMessage('No related nested file or parent found for this file.');
    return;
  }

  let targetPath = candidates[0];
  if(candidates.length > 1) {
    const picked = await window.showQuickPick(
      candidates.map(p => ({ label: basename(p), description: relative(dirname(fsPath), p), full: p })),
      { placeHolder: 'Select file to open beside' }
    );
    if(!picked) {
      return;
    }
    targetPath = picked.full;
  }

  // Determine if current file is parent or child
  const isCurrentParent = children.length > 0;

  await openBeside(targetPath, !isCurrentParent);
};

export { splitWithRelated };
