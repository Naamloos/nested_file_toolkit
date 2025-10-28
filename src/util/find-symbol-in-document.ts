import { TextDocument, commands, DocumentSymbol } from 'vscode';

export const findSymbolInDocument = async (
  document: TextDocument,
  symbolName: string,
): Promise<DocumentSymbol | undefined> => {
  // Use VS Code's built-in document symbol provider
  const symbols = await commands.executeCommand<DocumentSymbol[]>('vscode.executeDocumentSymbolProvider', document.uri);

  if (!symbols) {
    return undefined;
  }

  // Recursively search through symbols
  const searchSymbols = (syms: DocumentSymbol[]): DocumentSymbol | undefined => {
    for (const symbol of syms) {
      if (symbol.name === symbolName) {
        return symbol;
      }

      // Search children
      if (symbol.children.length > 0) {
        const found = searchSymbols(symbol.children);

        if (found) {
          return found;
        }
      }
    }

    return undefined;
  };

  return searchSymbols(symbols);
};
