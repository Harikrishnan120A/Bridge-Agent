import { SanitizedCommand } from '../types';
import { ConfigManager } from '../config/config-manager';
import * as path from 'path';

export class CommandSanitizer {
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  sanitize(command: string): SanitizedCommand {
    const warnings: string[] = [];
    let sanitized = command;

    // Check for dangerous metacharacters
    const dangerousChars = this.findDangerousMetacharacters(command);
    if (dangerousChars.length > 0) {
      warnings.push(`Contains potentially dangerous metacharacters: ${dangerousChars.join(', ')}`);
    }

    // Validate file paths
    const pathWarnings = this.validatePaths(command);
    warnings.push(...pathWarnings);

    // Check for command injection patterns
    const injectionWarnings = this.checkInjectionPatterns(command);
    warnings.push(...injectionWarnings);

    // Check against allowed/blocked commands
    const commandCheck = this.checkCommandAllowance(command);
    if (!commandCheck.allowed) {
      warnings.push(commandCheck.reason || 'Command not in allowed list');
    }

    const isSafe = warnings.length === 0 && commandCheck.allowed;

    return {
      original: command,
      sanitized,
      isSafe,
      warnings
    };
  }

  private findDangerousMetacharacters(cmd: string): string[] {
    const dangerous: string[] = [];
    
    // Check for shell metacharacters outside quoted strings
    const patterns = [
      { char: ';', reason: 'command separator' },
      { char: '|', reason: 'pipe' },
      { char: '&&', reason: 'AND operator' },
      { char: '||', reason: 'OR operator' },
      { char: '>', reason: 'redirect' },
      { char: '<', reason: 'input redirect' },
      { char: '`', reason: 'command substitution' },
      { char: '$(', reason: 'command substitution' }
    ];

    for (const pattern of patterns) {
      if (this.containsOutsideQuotes(cmd, pattern.char)) {
        dangerous.push(pattern.char);
      }
    }

    return dangerous;
  }

  private containsOutsideQuotes(str: string, search: string): boolean {
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }

      if (!inQuotes && str.substring(i, i + search.length) === search) {
        return true;
      }
    }

    return false;
  }

  private validatePaths(cmd: string): string[] {
    const warnings: string[] = [];
    const config = this.configManager.getConfig();
    const workspaceRoot = this.configManager.getWorkspaceRoot2();

    // Extract potential file paths (simple heuristic)
    const pathPattern = /(?:^|\s)(\.{0,2}\/[^\s]+|[a-zA-Z]:[^\s]+|\/[^\s]+)/g;
    const matches = cmd.match(pathPattern);

    if (matches) {
      for (const match of matches) {
        const cleanPath = match.trim();
        
        // Resolve relative paths
        const resolved = path.resolve(workspaceRoot, cleanPath);

        // Check if path is within allowed directories
        const isAllowed = config.security.allowedPaths.some(allowed => 
          resolved.startsWith(allowed)
        );

        if (!isAllowed) {
          warnings.push(`Path outside workspace: ${cleanPath}`);
        }

        // Check for path traversal
        if (cleanPath.includes('..')) {
          warnings.push(`Path traversal detected: ${cleanPath}`);
        }
      }
    }

    return warnings;
  }

  private checkInjectionPatterns(cmd: string): string[] {
    const warnings: string[] = [];

    const injectionPatterns = [
      { pattern: /\$\([^)]*\)/, message: 'Command substitution detected' },
      { pattern: /`[^`]*`/, message: 'Backtick command substitution detected' },
      { pattern: /;\s*rm\s+-rf/, message: 'Dangerous rm -rf command' },
      { pattern: />\s*\/dev\/null/, message: 'Output redirection to /dev/null' },
      { pattern: /wget|curl.*\|.*sh/, message: 'Download and execute pattern' }
    ];

    for (const { pattern, message } of injectionPatterns) {
      if (pattern.test(cmd)) {
        warnings.push(message);
      }
    }

    return warnings;
  }

  private checkCommandAllowance(cmd: string): { allowed: boolean; reason?: string } {
    const config = this.configManager.getConfig();
    const trimmed = cmd.trim();

    // Check blocked commands first
    for (const blocked of config.security.blockedCommands) {
      if (trimmed.includes(blocked)) {
        return { allowed: false, reason: `Blocked command: ${blocked}` };
      }
    }

    // Check allowed commands
    const commandName = trimmed.split(/\s+/)[0];
    const isAllowed = config.security.allowedCommands.some(allowed => 
      commandName === allowed || commandName.startsWith(allowed + '.')
    );

    if (!isAllowed) {
      return { allowed: false, reason: `Command '${commandName}' not in allowed list` };
    }

    return { allowed: true };
  }
}
