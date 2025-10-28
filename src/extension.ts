import { createNestedFiles } from './commands/create-nested-file';
import { splitWithRelated } from './commands/split-nested-file';
import { ParentReferenceHoverProvider } from './providers/parent-ref-hover-provider';
import { ParentReferenceDefinitionProvider } from './providers/parent-ref-definition-provider';
import { ExtensionContext, commands, languages, window, workspace } from 'vscode';
import { ParentReferenceDecorator } from './providers/parent-ref-decorator';
import { syncNestedFileRenames } from './events/sync-nested-file-rename';
import { FileChildCountProvider } from './providers/file-children-count-provider';

export function activate(context: ExtensionContext): void {
  console.log('[Nested File Toolkit] Extension activating...');

  const createCommand = commands.registerCommand('nested-file-toolkit.create', createNestedFiles);
  const splitCommand = commands.registerCommand('nested-file-toolkit.splitWithRelated', splitWithRelated);

  const definitionProvider = languages.registerDefinitionProvider(
    { scheme: 'file' },
    new ParentReferenceDefinitionProvider(),
  );

  const hoverProvider = languages.registerHoverProvider({ scheme: 'file' }, new ParentReferenceHoverProvider());

  const parentRefDecorator = new ParentReferenceDecorator();

  const fileRenameSyncListener = workspace.onDidRenameFiles(syncNestedFileRenames);

  const fileCountDecorationProvider = window.registerFileDecorationProvider(new FileChildCountProvider());

  context.subscriptions.push(
    createCommand,
    splitCommand,
    definitionProvider,
    hoverProvider,
    parentRefDecorator,
    fileRenameSyncListener,
    fileCountDecorationProvider,
  );
  console.log('[Nested File Toolkit] Extension activated successfully! (raHH!)');
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
