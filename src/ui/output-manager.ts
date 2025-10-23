import * as vscode from 'vscode';
import { Step } from '../types';

export class OutputManager {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('AI Bridge Agent');
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  logAction(step: Step): void {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('═'.repeat(80));
    this.outputChannel.appendLine(`Step ${step.id} - ${step.action.toUpperCase()}`);
    this.outputChannel.appendLine('═'.repeat(80));
    this.outputChannel.appendLine(`Started: ${step.startTime.toISOString()}`);
    
    if (step.payload) {
      this.outputChannel.appendLine('\nPayload:');
      this.outputChannel.appendLine(JSON.stringify(step.payload, null, 2));
    }
  }

  streamOutput(data: string): void {
    this.outputChannel.append(data);
  }

  logResult(step: Step): void {
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine('-'.repeat(80));
    
    if (step.error) {
      this.outputChannel.appendLine(`❌ FAILED: ${step.error.message}`);
      if (step.error.stack) {
        this.outputChannel.appendLine('\nStack trace:');
        this.outputChannel.appendLine(step.error.stack);
      }
    } else {
      this.outputChannel.appendLine(`✅ COMPLETED in ${step.duration}ms`);
      if (step.result) {
        this.outputChannel.appendLine('\nResult:');
        this.outputChannel.appendLine(JSON.stringify(step.result, null, 2));
      }
    }
    
    this.outputChannel.appendLine('═'.repeat(80));
    this.outputChannel.appendLine('');
  }

  logError(message: string, error?: Error): void {
    this.outputChannel.appendLine(`❌ ERROR: ${message}`);
    if (error) {
      this.outputChannel.appendLine(`Details: ${error.message}`);
      if (error.stack) {
        this.outputChannel.appendLine(error.stack);
      }
    }
  }

  logWarning(message: string): void {
    this.outputChannel.appendLine(`⚠️  WARNING: ${message}`);
  }

  logSuccess(message: string): void {
    this.outputChannel.appendLine(`✅ ${message}`);
  }

  show(): void {
    this.outputChannel.show();
  }

  clear(): void {
    this.outputChannel.clear();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}
