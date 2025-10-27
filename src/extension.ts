import { createNestedFiles } from './commands/create-nested-file';
import { splitWithRelated } from './commands/split-nested-file';
import { ParentReferenceHoverProvider } from './providers/parent-ref-hover-provider';
import { ParentReferenceDefinitionProvider } from './providers/parent-ref-definition-provider';
import { ExtensionContext, commands, languages } from 'vscode';
import { ParentReferenceDecorator } from './providers/parent-ref-decorator';

export function activate(context: ExtensionContext) {
	console.log('[Nested File Toolkit] Extension activating...');
	
	const createCommand = commands.registerCommand('nested-file-toolkit.create', createNestedFiles);
	const splitCommand = commands.registerCommand('nested-file-toolkit.splitWithRelated', splitWithRelated);
  
  // Register definition and hover providers for ~symbol references
  // Apply to all file types to support various programming languages
  console.log('[Nested File Toolkit] Registering ~symbol providers...');
  
  const definitionProvider = languages.registerDefinitionProvider(
    { scheme: 'file' },
    new ParentReferenceDefinitionProvider()
  );
  
  const hoverProvider = languages.registerHoverProvider(
    { scheme: 'file' },
    new ParentReferenceHoverProvider()
  );

  const parentRefDecorator = new ParentReferenceDecorator();

  context.subscriptions.push(createCommand, splitCommand, definitionProvider, hoverProvider, parentRefDecorator);
  console.log('[Nested File Toolkit] Extension activated successfully! (raHH!)');
}

// This method is called when your extension is deactivated
export function deactivate() {}
