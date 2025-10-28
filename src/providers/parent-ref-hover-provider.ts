import { DocumentSymbol, Hover, HoverProvider, MarkdownString, Position, Range, TextDocument, workspace } from 'vscode';
import { PARENT_REFERENCE_PREFIX } from '../constants/parent-reference';
import { detectParentFiles } from '../util/detect-parent-files';
import { findSymbolInDocument } from '../util/find-symbol-in-document';
import { symbolToSnippet } from '../util/symbol-location-to-codeblock';

export class ParentReferenceHoverProvider implements HoverProvider {
  async provideHover(document: TextDocument, position: Position): Promise<Hover | undefined> {
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
        return new Hover(
          await this.buildMarkdownMessage(symbolName, document),
          new Range(position.line, symbolStartIndex, position.line, symbolEndIndex),
        );
      }
    }

    return undefined;
  }

  private async buildMarkdownMessage(symbolName: string, document: TextDocument): Promise<MarkdownString> {
    const parentFiles = await detectParentFiles(document.uri.fsPath);

    // If no parent files found, return undefined
    if (parentFiles.length === 0) {
      return new MarkdownString(`**~${symbolName}** reference\n\n_No parent file found._`);
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

    // Use the language server to find the actual symbol definition in the parent file
    if (!qualifiedSymbol || !qualifiedParentFile) {
      return new MarkdownString(`**~${symbolName}** reference\n\n_Symbol definition not found in parent file._`);
    }

    const markdown = new MarkdownString();

    markdown.appendMarkdown(`**${symbolName}** reference from parent file:\n\`${qualifiedParentFile.fileName}\`\n\n`);
    markdown.appendCodeblock(symbolToSnippet(qualifiedParentFile, qualifiedSymbol), qualifiedParentFile.languageId);
    markdown.appendMarkdown('\n\n_CTRL+Click to navigate to definition._');

    return markdown;
  }
}
