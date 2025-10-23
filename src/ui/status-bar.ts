import * as vscode from 'vscode';
import { ServerStatus } from '../types';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.command = 'aiBridge.status';
  }

  show(status: ServerStatus): void {
    const icons: Record<ServerStatus, string> = {
      idle: '$(circle-outline)',
      running: '$(sync~spin)',
      waiting: '$(clock)',
      error: '$(error)'
    };

    const colors: Record<ServerStatus, string | undefined> = {
      idle: undefined,
      running: undefined,
      waiting: 'statusBarItem.warningBackground',
      error: 'statusBarItem.errorBackground'
    };

    this.statusBarItem.text = `${icons[status]} AI Bridge`;
    this.statusBarItem.tooltip = this.getTooltip(status);
    this.statusBarItem.backgroundColor = colors[status] 
      ? new vscode.ThemeColor(colors[status]!)
      : undefined;
    this.statusBarItem.show();
  }

  updateProgress(current: number, total: number): void {
    this.statusBarItem.text = `$(sync~spin) AI Bridge (${current}/${total})`;
    this.statusBarItem.tooltip = `Step ${current} of ${total}`;
  }

  hide(): void {
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }

  private getTooltip(status: ServerStatus): string {
    switch (status) {
      case 'idle':
        return 'AI Bridge: Server not running. Click to view status.';
      case 'running':
        return 'AI Bridge: Server running. Click to view status.';
      case 'waiting':
        return 'AI Bridge: Waiting for approval. Click to view status.';
      case 'error':
        return 'AI Bridge: Error occurred. Click to view details.';
    }
  }
}
