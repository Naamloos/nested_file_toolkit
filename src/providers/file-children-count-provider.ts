import { FileDecorationProvider, EventEmitter, Uri, ThemeColor, workspace } from 'vscode';
import { FileDecoration } from 'vscode';
import { detectChildFiles } from '../util/detect-child-files';
import { detectParentFiles } from '../util/detect-parent-files';

export class FileChildCountProvider implements FileDecorationProvider {
  private readonly _onDidChangeFileDecorations = new EventEmitter<Uri | Uri[]>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor() {
    // Watch for file system changes (create, delete, change)
    const watcher = workspace.createFileSystemWatcher('**/*');

    watcher.onDidCreate((uri) => this.refreshParent(uri));
    watcher.onDidDelete((uri) => this.refreshParent(uri));
    watcher.onDidChange((uri) => this.refreshParent(uri));

    // Watch for configuration changes
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('nested-file-toolkit.showChildrenBadge')) {
        // TODO: figure out a way to refresh all
      }
    });
  }

  private refreshParent(uri: Uri): void {
    // Fire for the parent directory, which is the one that would show the badge
    detectParentFiles(uri.fsPath)
      .then((parents) => {
        parents.forEach((parent) => {
          this._onDidChangeFileDecorations.fire(Uri.file(parent));
        });
      })
      .catch(() => {});
  }

  /**
   * Provide a decoration for each file with a count
   */
  async provideFileDecoration(uri: Uri): Promise<FileDecoration | undefined> {
    const showBadge = workspace.getConfiguration('nested-file-toolkit').get<boolean>('showChildrenBadge', true);

    if (!showBadge) {
      return undefined;
    }

    // Show badge for any file that has nested children
    const count = (await detectChildFiles(uri.fsPath)).length;

    if (count === undefined || count < 1) {
      return undefined;
    }

    return {
      badge: String(count) + '\u2193', // down arrow
      tooltip: `${count} nested file${count !== 1 ? 's' : ''}`,
    };
  }
}
