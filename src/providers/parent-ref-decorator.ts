import { Disposable, Range, TextEditor, TextEditorDecorationType, window, workspace } from 'vscode';
import { PARENT_REFERENCE_PREFIX } from '../constants/parent-reference';

export class ParentReferenceDecorator implements Disposable {
  private decorationType: TextEditorDecorationType;
  private disposables: Disposable[] = [];

  constructor() {
    this.decorationType = window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0, 26, 255, 0.14)',
      fontStyle: 'italic',
      textDecoration: 'underline',
    });

    // Register event listeners
    this.disposables.push(
      window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.updateDecorations(editor);
        }
      }),
      workspace.onDidChangeTextDocument((event) => {
        const editor = window.activeTextEditor;

        if (editor && event.document === editor.document) {
          this.updateDecorations(editor);
        }
      }),
      workspace.onDidChangeConfiguration((e) => {
        const editor = window.activeTextEditor;

        if (!editor) {
          return;
        }

        // Re-evaluate decorations when the setting changes
        if (
          e.affectsConfiguration('nested-file-toolkit.enableParentRefs', editor.document.uri) ||
          e.affectsConfiguration('nested-file-toolkit', editor.document.uri)
        ) {
          this.updateDecorations(editor);
        }
      }),
    );

    // Update decorations for the currently active editor
    if (window.activeTextEditor) {
      this.updateDecorations(window.activeTextEditor);
    }
  }

  /**
   * Find and decorate all parent references in the document
   */
  private updateDecorations(editor: TextEditor): void {
    const document = editor.document;

    const enabled = workspace
      .getConfiguration('nested-file-toolkit', document.uri)
      .get<boolean>('enableParentRefs', true);

    if (!enabled) {
      // Clear decorations when disabled
      editor.setDecorations(this.decorationType, []);

      return;
    }

    const text = document.getText();
    const decorations: Range[] = [];

    // Find all parent references in the document
    const pattern = new RegExp(`\\${PARENT_REFERENCE_PREFIX}(\\w+)`, 'g');
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);

      decorations.push(new Range(startPos, endPos));
    }

    // Apply decorations
    editor.setDecorations(this.decorationType, decorations);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.decorationType.dispose();
    this.disposables.forEach((d) => {
      d.dispose();
    });
  }
}
