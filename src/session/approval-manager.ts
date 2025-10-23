import * as vscode from 'vscode';
import { IncomingAction } from '../types';
import { ConfigManager } from '../config/config-manager';
import { OutputManager } from '../ui/output-manager';

export class ApprovalManager {
  private configManager: ConfigManager;
  private outputManager: OutputManager;
  private pendingApprovals: Map<string, (approved: boolean) => void> = new Map();

  constructor(configManager: ConfigManager, outputManager: OutputManager) {
    this.configManager = configManager;
    this.outputManager = outputManager;
  }

  async requestApproval(action: IncomingAction): Promise<boolean> {
    // Check if approval is needed
    if (!this.requiresApproval(action)) {
      this.outputManager.log(`✓ Action auto-approved: ${action.action}`);
      return true;
    }

    this.outputManager.log(`⏸ Approval required for: ${action.action}`);

    // Build approval message
    const message = this.buildApprovalMessage(action);
    const commandPreview = this.getCommandPreview(action);

    // Show modal dialog
    const result = await vscode.window.showWarningMessage(
      `${message}\n\n${commandPreview}\n\n${action.metadata?.reasoning || ''}`,
      { modal: true },
      'Approve',
      'Deny',
      'View Details'
    );

    if (result === 'View Details') {
      // Show full details in output
      this.outputManager.show();
      this.outputManager.log('\n' + '═'.repeat(80));
      this.outputManager.log('APPROVAL REQUEST DETAILS');
      this.outputManager.log('═'.repeat(80));
      this.outputManager.log(`Action: ${action.action}`);
      this.outputManager.log(`Session ID: ${action.sessionId}`);
      this.outputManager.log(`Step ID: ${action.stepId}`);
      this.outputManager.log('\nPayload:');
      this.outputManager.log(JSON.stringify(action.payload, null, 2));
      if (action.metadata) {
        this.outputManager.log('\nMetadata:');
        this.outputManager.log(JSON.stringify(action.metadata, null, 2));
      }
      this.outputManager.log('═'.repeat(80) + '\n');

      // Re-prompt
      return this.requestApproval(action);
    }

    const approved = result === 'Approve';
    
    if (approved) {
      this.outputManager.logSuccess(`Approval granted for ${action.action}`);
    } else {
      this.outputManager.logWarning(`Approval denied for ${action.action}`);
    }

    return approved;
  }

  requiresApproval(action: IncomingAction): boolean {
    const config = this.configManager.getConfig();
    const autoApprove = this.configManager.get<boolean>('autoApprove', false);

    // If auto-approve is enabled, check if action is safe
    if (autoApprove && this.isSafeAction(action)) {
      return false;
    }

    // Check specific approval requirements
    switch (action.action) {
      case 'run':
      case 'test':
        return config.security.requireApproval.commandExecution || 
               this.isDangerousCommand(action.payload.command || '');

      case 'edit':
        return config.security.requireApproval.fileOperations ||
               this.isDangerousFileOperation(action);

      case 'preview':
        return config.security.requireApproval.networkAccess;

      case 'status':
      case 'diagnostics':
        return false; // Read-only operations don't need approval

      default:
        return true; // Unknown actions require approval
    }
  }

  private isSafeAction(action: IncomingAction): boolean {
    switch (action.action) {
      case 'status':
      case 'diagnostics':
        return true;

      case 'run':
      case 'test':
        const command = action.payload.command || '';
        return this.isReadOnlyCommand(command) && !this.isDangerousCommand(command);

      case 'edit':
        return false; // File edits always need approval unless auto-approve is on

      case 'preview':
        return true; // Browser preview is generally safe

      default:
        return false;
    }
  }

  private isReadOnlyCommand(command: string): boolean {
    const readOnlyPrefixes = [
      'npm list',
      'npm ls',
      'git status',
      'git log',
      'git diff',
      'cat ',
      'ls ',
      'dir ',
      'echo ',
      'node --version',
      'python --version',
      'which ',
      'where '
    ];

    return readOnlyPrefixes.some(prefix => command.trim().startsWith(prefix));
  }

  private isDangerousCommand(command: string): boolean {
    const config = this.configManager.getConfig();
    const dangerous = config.security.blockedCommands;

    return dangerous.some(blocked => command.includes(blocked));
  }

  private isDangerousFileOperation(action: IncomingAction): boolean {
    if (action.payload.operation === 'delete') {
      return true;
    }

    // Check if file is outside workspace
    const config = this.configManager.getConfig();
    const file = action.payload.file || '';
    const allowedPaths = config.security.allowedPaths;

    return !allowedPaths.some(allowed => file.startsWith(allowed));
  }

  private buildApprovalMessage(action: IncomingAction): string {
    const description = action.metadata?.description || `Execute ${action.action} action`;
    return `AI Bridge wants to: ${description}`;
  }

  private getCommandPreview(action: IncomingAction): string {
    switch (action.action) {
      case 'run':
      case 'test':
        return `Command: ${action.payload.command}`;

      case 'edit':
        return `File: ${action.payload.file}\nOperation: ${action.payload.operation}`;

      case 'preview':
        return `URL: ${action.payload.url}`;

      default:
        return `Action: ${action.action}`;
    }
  }
}
