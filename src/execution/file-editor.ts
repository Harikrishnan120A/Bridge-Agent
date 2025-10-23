import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EditOperation, EditResult } from '../types';
import { ConfigManager } from '../config/config-manager';
import { OutputManager } from '../ui/output-manager';

export class FileEditor {
  private configManager: ConfigManager;
  private outputManager: OutputManager;

  constructor(configManager: ConfigManager, outputManager: OutputManager) {
    this.configManager = configManager;
    this.outputManager = outputManager;
  }

  async edit(operation: EditOperation): Promise<EditResult> {
    const startTime = Date.now();

    try {
      // Validate file path
      this.validateFilePath(operation.file);

      // Create backup if enabled
      let backupPath: string | undefined;
      if (this.configManager.getConfig().backup.enabled && fs.existsSync(operation.file)) {
        backupPath = await this.createBackup(operation.file);
      }

      // Perform the edit operation
      let linesChanged = 0;

      switch (operation.type) {
        case 'replace':
          linesChanged = await this.replaceFile(operation);
          break;

        case 'insert':
          linesChanged = await this.insertLines(operation);
          break;

        case 'delete':
          linesChanged = await this.deleteLines(operation);
          break;

        case 'patch':
          linesChanged = await this.applyPatch(operation);
          break;

        default:
          throw new Error(`Unknown edit operation: ${operation.type}`);
      }

      // Format the file if formatter is available
      await this.formatFile(operation.file);

      const duration = Date.now() - startTime;
      this.outputManager.log(`File edited: ${operation.file} (${linesChanged} lines, ${duration}ms)`);

      return {
        success: true,
        filesModified: [operation.file],
        linesChanged,
        backupPath
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputManager.logError(`File edit failed: ${errorMessage}`);

      return {
        success: false,
        filesModified: [],
        linesChanged: 0
      };
    }
  }

  private validateFilePath(filePath: string): void {
    const config = this.configManager.getConfig();
    const workspaceRoot = this.configManager.getWorkspaceRoot2();
    const resolvedPath = path.resolve(workspaceRoot, filePath);

    // Check if path is within allowed directories
    const isAllowed = config.security.allowedPaths.some(allowed =>
      resolvedPath.startsWith(allowed)
    );

    if (!isAllowed) {
      throw new Error(`File path not allowed: ${filePath}`);
    }
  }

  private async createBackup(filePath: string): Promise<string> {
    const config = this.configManager.getConfig();
    const backupDir = config.backup.path;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);

    // Copy file to backup
    fs.copyFileSync(filePath, backupPath);

    this.outputManager.log(`Backup created: ${backupPath}`);

    // Clean up old backups
    this.cleanupOldBackups(backupDir, fileName, config.backup.maxBackups);

    return backupPath;
  }

  private cleanupOldBackups(backupDir: string, fileName: string, maxBackups: number): void {
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith(fileName))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Remove old backups
    if (backups.length > maxBackups) {
      for (let i = maxBackups; i < backups.length; i++) {
        fs.unlinkSync(backups[i].path);
        this.outputManager.log(`Removed old backup: ${backups[i].name}`);
      }
    }
  }

  private async replaceFile(operation: EditOperation): Promise<number> {
    const content = operation.content || '';
    
    // Write new content
    fs.writeFileSync(operation.file, content, 'utf-8');

    return content.split('\n').length;
  }

  private async insertLines(operation: EditOperation): Promise<number> {
    const content = fs.readFileSync(operation.file, 'utf-8');
    const lines = content.split('\n');
    const insertContent = operation.content || '';
    const insertLines = insertContent.split('\n');

    const lineStart = operation.lineStart || 0;

    // Insert lines
    lines.splice(lineStart, 0, ...insertLines);

    // Write back
    fs.writeFileSync(operation.file, lines.join('\n'), 'utf-8');

    return insertLines.length;
  }

  private async deleteLines(operation: EditOperation): Promise<number> {
    const content = fs.readFileSync(operation.file, 'utf-8');
    const lines = content.split('\n');

    const lineStart = operation.lineStart || 0;
    const lineEnd = operation.lineEnd || lineStart + 1;
    const deleteCount = lineEnd - lineStart;

    // Delete lines
    lines.splice(lineStart, deleteCount);

    // Write back
    fs.writeFileSync(operation.file, lines.join('\n'), 'utf-8');

    return deleteCount;
  }

  private async applyPatch(operation: EditOperation): Promise<number> {
    // Simple patch implementation - replace lines in range
    const content = fs.readFileSync(operation.file, 'utf-8');
    const lines = content.split('\n');
    const patchContent = operation.content || '';
    const patchLines = patchContent.split('\n');

    const lineStart = operation.lineStart || 0;
    const lineEnd = operation.lineEnd || lineStart + patchLines.length;
    const deleteCount = lineEnd - lineStart;

    // Replace lines
    lines.splice(lineStart, deleteCount, ...patchLines);

    // Write back
    fs.writeFileSync(operation.file, lines.join('\n'), 'utf-8');

    return patchLines.length;
  }

  private async formatFile(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        'vscode.executeFormatDocumentProvider',
        document.uri,
        { insertSpaces: true, tabSize: 2 }
      );

      if (edits && edits.length > 0) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        await vscode.workspace.applyEdit(workspaceEdit);
        await document.save();
      }
    } catch (error) {
      // Formatting failed, but don't fail the whole operation
      this.outputManager.logWarning(`Could not format file: ${filePath}`);
    }
  }

  async restoreBackup(backupPath: string, targetPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    fs.copyFileSync(backupPath, targetPath);
    this.outputManager.log(`Restored from backup: ${backupPath} -> ${targetPath}`);
  }
}
