import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BridgeConfig } from '../types';

export class ConfigManager {
  private context: vscode.ExtensionContext;
  private config: BridgeConfig | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadConfig();
  }

  private loadConfig(): void {
    const workspaceRoot = this.getWorkspaceRoot();
    const configPath = path.join(workspaceRoot, '.aiBridge', 'config.json');

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      this.config = JSON.parse(configContent);
    } else {
      this.config = this.getDefaultConfig();
      this.saveConfig();
    }
  }

  private saveConfig(): void {
    if (!this.config) return;

    const workspaceRoot = this.getWorkspaceRoot();
    const configDir = path.join(workspaceRoot, '.aiBridge');
    const configPath = path.join(configDir, 'config.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }

  private getDefaultConfig(): BridgeConfig {
    const workspaceRoot = this.getWorkspaceRoot();

    return {
      version: '1.0.0',
      server: {
        port: this.get<number>('serverPort', 3737),
        host: 'localhost',
        enableWebSocket: true,
        cors: {
          enabled: true,
          origins: [
            'http://localhost:*',
            'https://chat.openai.com',
            'https://claude.ai',
            'https://gemini.google.com'
          ]
        }
      },
      security: {
        requireApproval: {
          fileOperations: true,
          commandExecution: !this.get<boolean>('autoApprove', false),
          networkAccess: true,
          dangerousCommands: true
        },
        allowedCommands: this.get<string[]>('allowedCommands', [
          'npm', 'yarn', 'pnpm', 'node', 'python', 'pytest', 'go', 'cargo', 'deno', 'bun', 'npx'
        ]),
        blockedCommands: [
          'rm -rf /',
          'sudo',
          'su',
          'chmod 777',
          'mkfs',
          'dd if='
        ],
        allowedPaths: [workspaceRoot],
        maxStepsPerSession: this.get<number>('maxStepsPerSession', 50),
        commandTimeout: this.get<number>('commandTimeout', 600)
      },
      execution: {
        workingDirectory: workspaceRoot,
        shell: process.platform === 'win32' ? 'powershell.exe' : 'bash',
        environment: {
          NODE_ENV: 'development'
        }
      },
      browser: {
        enabled: this.get<boolean>('enableBrowser', true),
        headless: true,
        viewport: {
          width: 1280,
          height: 720
        },
        defaultTimeout: 30000
      },
      logging: {
        level: this.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info'),
        maskCredentials: this.get<boolean>('maskCredentials', true),
        saveToFile: true,
        logPath: path.join(workspaceRoot, '.aiBridge', 'logs')
      },
      backup: {
        enabled: this.get<boolean>('createBackups', true),
        path: path.join(workspaceRoot, '.aiBridge', 'backups'),
        maxBackups: 10
      }
    };
  }

  get<T>(key: string, defaultValue: T): T {
    const vsConfig = vscode.workspace.getConfiguration('aiBridge');
    return vsConfig.get<T>(key, defaultValue);
  }

  getConfig(): BridgeConfig {
    if (!this.config) {
      this.config = this.getDefaultConfig();
    }
    return this.config;
  }

  updateConfig(updates: Partial<BridgeConfig>): void {
    this.config = { ...this.getConfig(), ...updates };
    this.saveConfig();
  }

  private getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      throw new Error('No workspace folder open');
    }
    return folders[0].uri.fsPath;
  }

  getWorkspaceRoot2(): string {
    return this.getWorkspaceRoot();
  }
}
