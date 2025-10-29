import { basename, dirname, join } from 'path';
import { Uri, window, workspace, commands } from 'vscode';
import TemplateRepository from '../constants/templates';
import { globToRegex } from '../util/glob-to-regex';
import { getCapture } from '../util/get-capture';
import { expandChildren } from '../util/expand-children';

const createNestedFiles = async (uri: Uri): Promise<void> => {
  const fileUri = uri || window.activeTextEditor?.document.uri;

  if (!fileUri) {
    window.showErrorMessage('No file selected or active.');

    return;
  }

  // The name of the file we try to create a nested file for
  const fileName = basename(fileUri.fsPath);
  // The directory containing the file
  const parentDirName = dirname(fileUri.fsPath);

  // Get the file nesting patterns from the user's settings
  const patterns = workspace.getConfiguration('explorer', fileUri).get<Record<string, string>>('fileNesting.patterns');
  // Get the nested file templates from the user's settings
  const nestedFileTemplates = {
    ...TemplateRepository,
    ...workspace.getConfiguration('nested-file-toolkit', fileUri).get<Record<string, string>>('templates'),
  };

  if (!patterns) {
    window.showErrorMessage('No file nesting patterns found in settings.');

    return;
  }

  let capturedValue: string | undefined;
  let matchedPattern: string | undefined;
  let matchedChildrenStr: string | undefined;

  for (const [pattern, childrenStr] of Object.entries(patterns)) {
    const regex = globToRegex(pattern);

    if (regex.test(fileName)) {
      capturedValue = getCapture(fileName, pattern);
      matchedPattern = pattern;
      matchedChildrenStr = childrenStr;
      break;
    }
  }

  if (!capturedValue || !matchedPattern || !matchedChildrenStr) {
    window.showErrorMessage(`No matching pattern found for file: ${fileName}`);

    return;
  }

  const expandedTemplates = expandChildren(matchedChildrenStr, capturedValue);

  const picked = await window.showQuickPick(expandedTemplates, {
    canPickMany: true,
    placeHolder: 'Select nested files to create',
    title: `Create nested files for ${fileName}`,
  });

  const created: string[] = [];
  const existing: string[] = [];
  const pickedItems = picked ?? [];

  for (const pickedItem of pickedItems) {
    const templatePlaceholders: FileTemplatePlaceholders = {
      name: fileName.replace(/\.[^.]+$/, ''),
      fileName: fileName,
      capture: capturedValue,
      nestedFileName: pickedItem,
      nestedName: pickedItem.replace(/\.[^.]+$/, ''),
      date: new Date(Date.now()),
    };
    const template = findFittingTemplate(pickedItem, nestedFileTemplates || {}, templatePlaceholders);
    const isNew = await createFile(pickedItem, parentDirName, template);

    if (isNew) {
      created.push(pickedItem);
    } else {
      existing.push(pickedItem);
    }
  }

  if (created.length > 0) {
    window.showInformationMessage(`Created nested files: ${created.join(', ')}`);
  }

  if (existing.length > 0) {
    window.showInformationMessage(`Opened existing files: ${existing.join(', ')}`);
  }
};

const createFile = async (filename: string, parentDir: string, template: string): Promise<boolean> => {
  const filePath = join(parentDir, filename);
  const fileUri = Uri.file(filePath);
  let isNewFile = false;

  // Get metadata, if it fails, create file with template content
  try {
    await workspace.fs.stat(fileUri);
  } catch {
    const encoder = new TextEncoder();

    await workspace.fs.writeFile(fileUri, encoder.encode(template.trim()));
    isNewFile = true;
  }

  const document = await workspace.openTextDocument(filePath);

  await window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
  });

  if(isNewFile) {
    await commands.executeCommand('editor.action.formatDocument', fileUri);
  }

  return isNewFile;
};

const findFittingTemplate = (
  filename: string,
  patterns: Record<string, string>,
  placeholders: FileTemplatePlaceholders,
): string => {
  let longestMatch: { pattern: string; template: string; length: number } | undefined;

  for (const [pattern, template] of Object.entries(patterns)) {
    const regex = globToRegex(pattern);

    if (regex.test(filename)) {
      const length = pattern.length;

      if (!longestMatch || length > longestMatch.length) {
        longestMatch = { pattern, template, length };
      }
    }
  }

  if (!longestMatch) {
    return '';
  }

  // Replace all template placeholders
  let expandedTemplate = longestMatch.template;

  for (const [key, value] of Object.entries(placeholders)) {
    const placeholderRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

    expandedTemplate = expandedTemplate.replace(placeholderRegex, value.toString());
  }

  return expandedTemplate;
};

export { createNestedFiles };
