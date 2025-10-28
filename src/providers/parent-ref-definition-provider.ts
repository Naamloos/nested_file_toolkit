import { Definition, DefinitionProvider, DocumentSymbol, Position, TextDocument, workspace } from 'vscode';
import { PARENT_REFERENCE_PREFIX } from '../constants/parent-reference';
import { findSymbolInDocument } from '../util/find-symbol-in-document';
import { detectParentFiles } from '../util/detect-parent-files';

export class ParentReferenceDefinitionProvider implements DefinitionProvider {
  async provideDefinition(document: TextDocument, position: Position): Promise<Definition | undefined> {
    const enabled = workspace
      .getConfiguration('nested-file-toolkit', document.uri)
      .get<boolean>('enableParentRefs', true);

    if (!enabled) {
      return undefined;
    }

    const line = document.lineAt(position.line);
    const lineText = line.text;

    // Only trigger in comments (simple heuristic for JS/TS: //, /*, or * at start)
    const isComment = /(^\s*\/\/)|(^\s*\/\*)|(^\s*\*)/.test(lineText);

    if (!isComment) {
      return undefined;
    }

    // Find all ~symbolName references in the line
    const pattern = new RegExp(`\\${PARENT_REFERENCE_PREFIX}(\\w+)`, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(lineText)) !== null) {
      const symbolName = match[1];
      const symbolStartIndex = match.index;
      const symbolEndIndex = match.index + match[0].length;

      // Check if cursor is within this ~symbolName
      if (position.character >= symbolStartIndex && position.character <= symbolEndIndex) {
        return this.buildDefinition(symbolName, document);
      }
    }

    return undefined;
  }

  private async buildDefinition(symbolName: string, document: TextDocument): Promise<Definition | undefined> {
    const parentFiles = await detectParentFiles(document.uri.fsPath);

    // If no parent files found, return undefined
    if (parentFiles.length === 0) {
      return undefined;
    }

    let qualifiedParentFile: TextDocument | undefined = undefined;
    let qualifiedSymbol: DocumentSymbol | undefined = undefined;

    for (const parentFile of parentFiles) {
      try {
        const parentDocument = await workspace.openTextDocument(parentFile);
        const symbolLocation = await findSymbolInDocument(parentDocument, symbolName);

        if (symbolLocation) {
          qualifiedSymbol = symbolLocation;
          qualifiedParentFile = parentDocument;
        }
      } catch {
        // silently fail
      }
    }

    if (qualifiedParentFile && qualifiedSymbol) {
      return {
        uri: qualifiedParentFile.uri,
        range: qualifiedSymbol.selectionRange,
      };
    }

    return undefined;
  }
}
