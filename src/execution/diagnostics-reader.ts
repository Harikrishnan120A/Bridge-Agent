import * as vscode from 'vscode';
import { Diagnostic } from '../types';
import { OutputManager } from '../ui/output-manager';

export class DiagnosticsReader {
  private outputManager: OutputManager;

  constructor(outputManager: OutputManager) {
    this.outputManager = outputManager;
  }

  async getDiagnostics(files?: string[]): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = [];

    try {
      // Get all diagnostics from VS Code
      const allDiagnostics = vscode.languages.getDiagnostics();

      for (const [uri, uriDiagnostics] of allDiagnostics) {
        const filePath = uri.fsPath;

        // Filter by specific files if provided
        if (files && files.length > 0) {
          const isIncluded = files.some(f => filePath.includes(f));
          if (!isIncluded) continue;
        }

        // Convert VS Code diagnostics to our format
        for (const diag of uriDiagnostics) {
          diagnostics.push({
            file: filePath,
            line: diag.range.start.line + 1, // VS Code is 0-indexed
            column: diag.range.start.character + 1,
            severity: this.mapSeverity(diag.severity),
            message: diag.message,
            source: diag.source || 'unknown'
          });
        }
      }

      this.outputManager.log(`Found ${diagnostics.length} diagnostics`);

      return diagnostics;

    } catch (error) {
      this.outputManager.logError('Failed to get diagnostics', error as Error);
      return [];
    }
  }

  async getErrorsAndWarnings(): Promise<{
    errors: Diagnostic[];
    warnings: Diagnostic[];
  }> {
    const allDiagnostics = await this.getDiagnostics();

    const errors = allDiagnostics.filter(d => d.severity === 'error');
    const warnings = allDiagnostics.filter(d => d.severity === 'warning');

    this.outputManager.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

    return { errors, warnings };
  }

  async getDiagnosticsByFile(filePath: string): Promise<Diagnostic[]> {
    return this.getDiagnostics([filePath]);
  }

  async hasCriticalErrors(): Promise<boolean> {
    const { errors } = await this.getErrorsAndWarnings();
    return errors.length > 0;
  }

  groupByFile(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
    const grouped = new Map<string, Diagnostic[]>();

    for (const diag of diagnostics) {
      const existing = grouped.get(diag.file) || [];
      existing.push(diag);
      grouped.set(diag.file, existing);
    }

    return grouped;
  }

  groupBySource(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
    const grouped = new Map<string, Diagnostic[]>();

    for (const diag of diagnostics) {
      const existing = grouped.get(diag.source) || [];
      existing.push(diag);
      grouped.set(diag.source, existing);
    }

    return grouped;
  }

  private mapSeverity(severity: vscode.DiagnosticSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'error';
      case vscode.DiagnosticSeverity.Warning:
        return 'warning';
      case vscode.DiagnosticSeverity.Information:
      case vscode.DiagnosticSeverity.Hint:
        return 'info';
      default:
        return 'info';
    }
  }

  formatDiagnostics(diagnostics: Diagnostic[]): string {
    if (diagnostics.length === 0) {
      return 'No diagnostics found';
    }

    const grouped = this.groupByFile(diagnostics);
    let output = '';

    for (const [file, fileDiags] of grouped.entries()) {
      output += `\n${file}:\n`;
      
      for (const diag of fileDiags) {
        const icon = diag.severity === 'error' ? '❌' : diag.severity === 'warning' ? '⚠️' : 'ℹ️';
        output += `  ${icon} Line ${diag.line}:${diag.column} - ${diag.message} [${diag.source}]\n`;
      }
    }

    return output;
  }
}
