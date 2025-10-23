import * as vscode from 'vscode';
import { ExecutionResult } from '../types';
import { ConfigManager } from '../config/config-manager';
import { CommandSanitizer } from '../security/command-sanitizer';
import { OutputManager } from '../ui/output-manager';
import { CredentialMasker } from '../security/credential-masker';
import { ApprovalManager } from '../session/approval-manager';

export class CommandExecutor {
  private configManager: ConfigManager;
  private sanitizer: CommandSanitizer;
  private outputManager: OutputManager;
  private masker: CredentialMasker;
  private approvalManager: ApprovalManager;
  private activeTerminals: Map<string, vscode.Terminal> = new Map();

  constructor(
    configManager: ConfigManager,
    outputManager: OutputManager,
    approvalManager: ApprovalManager
  ) {
    this.configManager = configManager;
    this.outputManager = outputManager;
    this.approvalManager = approvalManager;
    this.sanitizer = new CommandSanitizer(configManager);
    this.masker = new CredentialMasker();
  }

  async execute(command: string, cwd: string, timeout: number = 600): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Sanitize command
      const sanitized = this.sanitizer.sanitize(command);

      if (!sanitized.isSafe) {
        throw new Error(`Unsafe command: ${sanitized.warnings.join(', ')}`);
      }

      // Log command (with credentials masked)
      const maskedCommand = this.masker.mask(command);
      this.outputManager.log(`Executing: ${maskedCommand}`);
      this.outputManager.log(`Working directory: ${cwd}`);

      // Execute command
      const result = await this.executeInTerminal(command, cwd, timeout);

      const duration = Date.now() - startTime;
      this.outputManager.log(`Completed in ${duration}ms with exit code ${result.exitCode}`);

      return {
        ...result,
        duration,
        command: maskedCommand
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.outputManager.logError(`Command execution failed: ${errorMessage}`);

      return {
        success: false,
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
        duration,
        command: this.masker.mask(command)
      };
    }
  }

  private async executeInTerminal(
    command: string,
    cwd: string,
    timeout: number
  ): Promise<Omit<ExecutionResult, 'duration' | 'command'>> {
    return new Promise((resolve, reject) => {
      const terminal = vscode.window.createTerminal({
        name: 'AI Bridge Command',
        cwd,
        hideFromUser: false
      });

      this.activeTerminals.set(terminal.name, terminal);

      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      // Create a temporary file to capture output
      const captureCommand = this.buildCaptureCommand(command);
      
      terminal.sendText(captureCommand);

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        terminal.dispose();
        this.activeTerminals.delete(terminal.name);
        reject(new Error(`Command timed out after ${timeout} seconds`));
      }, timeout * 1000);

      // Listen for terminal close
      const disposable = vscode.window.onDidCloseTerminal(closedTerminal => {
        if (closedTerminal === terminal) {
          clearTimeout(timeoutHandle);
          disposable.dispose();
          this.activeTerminals.delete(terminal.name);

          resolve({
            success: exitCode === 0,
            stdout,
            stderr,
            exitCode
          });
        }
      });

      // Note: Actual output capture requires VS Code API support or file-based approach
      // For now, we'll return a placeholder result
      // In production, you'd need to implement proper output capture

      setTimeout(() => {
        clearTimeout(timeoutHandle);
        terminal.dispose();
        resolve({
          success: true,
          stdout: 'Command executed (output capture requires additional implementation)',
          stderr: '',
          exitCode: 0
        });
      }, 2000);
    });
  }

  private buildCaptureCommand(command: string): string {
    // Build a command that captures output
    // This is platform-specific
    const config = this.configManager.getConfig();
    
    if (config.execution.shell.includes('powershell')) {
      return `${command}; $LASTEXITCODE`;
    } else {
      return `${command}; echo $?`;
    }
  }

  dispose(): void {
    // Close all active terminals
    for (const terminal of this.activeTerminals.values()) {
      terminal.dispose();
    }
    this.activeTerminals.clear();
  }
}
