import { TextDocument, DocumentSymbol, Position, Range } from 'vscode';

type SnippetOptions = {
  maxLines?: number;
  maxChars?: number;
};

export function symbolToSnippet(document: TextDocument, symbol: DocumentSymbol, options: SnippetOptions = {}): string {
  const maxLines = options.maxLines ?? 20;
  const maxChars = options.maxChars ?? 500;

  const firstLine = 0;
  const lastLine = Math.max(0, document.lineCount - 1);

  const startLine = Math.max(firstLine, symbol.range.start.line);
  const endLine = Math.min(lastLine, symbol.range.end.line);

  const startPos = new Position(startLine, 0);
  const endPos = document.lineAt(endLine).range.end;
  const snippet = document.getText(new Range(startPos, endPos));

  const lineCount = endLine - startLine + 1;

  // Return full snippet if it's small enough
  if (snippet.length <= maxChars && lineCount <= maxLines) {
    return snippet;
  }

  // Truncate: keep the first and last line, add an ellipsis block in between.
  const openLine = document.lineAt(startLine).text;
  const closeLine = document.lineAt(endLine).text;

  // Handle single-line symbols gracefully
  if (startLine === endLine) {
    const head = openLine.slice(0, Math.max(10, Math.min(60, maxChars - 5))).trimEnd();

    return `${head} ...`;
  }

  const indent = (openLine.match(/^\s*/) ?? [''])[0];
  const ellipsis = `${indent}    ...`;

  return `${openLine}\n${ellipsis}\n${closeLine}`;
}
