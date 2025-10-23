export class CredentialMasker {
  private patterns: Array<{ regex: RegExp; replacement: string }>;

  constructor() {
    this.patterns = [
      // API keys
      {
        regex: /api[_-]?key[_-]?=?\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
        replacement: 'api_key=***MASKED***'
      },
      // Tokens
      {
        regex: /token[_-]?=?\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
        replacement: 'token=***MASKED***'
      },
      // Passwords
      {
        regex: /password[_-]?=?\s*['"]?([^\s'"]+)['"]?/gi,
        replacement: 'password=***MASKED***'
      },
      // Secrets
      {
        regex: /secret[_-]?=?\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
        replacement: 'secret=***MASKED***'
      },
      // Bearer tokens
      {
        regex: /bearer\s+([a-zA-Z0-9_-]{20,})/gi,
        replacement: 'bearer ***MASKED***'
      },
      // AWS keys
      {
        regex: /(AKIA[A-Z0-9]{16})/g,
        replacement: '***MASKED_AWS_KEY***'
      },
      // Private keys (PEM format)
      {
        regex: /-----BEGIN [A-Z ]+-----[\s\S]+?-----END [A-Z ]+-----/g,
        replacement: '***MASKED_PRIVATE_KEY***'
      },
      // JWT tokens
      {
        regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
        replacement: '***MASKED_JWT***'
      },
      // Connection strings
      {
        regex: /(mongodb|mysql|postgresql|redis):\/\/[^:]+:([^@]+)@/gi,
        replacement: '$1://***MASKED***:***MASKED***@'
      },
      // GitHub tokens
      {
        regex: /(gh[ps]_[a-zA-Z0-9]{36,})/g,
        replacement: '***MASKED_GITHUB_TOKEN***'
      }
    ];
  }

  mask(text: string): string {
    let masked = text;

    for (const { regex, replacement } of this.patterns) {
      masked = masked.replace(regex, replacement);
    }

    // Mask environment variables
    masked = this.maskEnvVars(masked);

    return masked;
  }

  private maskEnvVars(text: string): string {
    // Match KEY=value patterns common in .env files
    const envPattern = /^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$/gm;
    
    const sensitiveKeys = [
      'API_KEY',
      'SECRET',
      'PASSWORD',
      'TOKEN',
      'PRIVATE_KEY',
      'DATABASE_URL',
      'CONNECTION_STRING',
      'AWS_ACCESS_KEY',
      'AWS_SECRET_KEY',
      'GITHUB_TOKEN'
    ];

    return text.replace(envPattern, (match, key, value) => {
      const isSensitive = sensitiveKeys.some(sensitive => 
        key.includes(sensitive)
      );

      if (isSensitive) {
        return `${key}=***MASKED***`;
      }

      return match;
    });
  }

  maskObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.mask(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.maskObject(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const masked: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Mask sensitive keys
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || 
            lowerKey.includes('secret') || 
            lowerKey.includes('token') ||
            lowerKey.includes('key')) {
          masked[key] = '***MASKED***';
        } else {
          masked[key] = this.maskObject(value);
        }
      }
      return masked;
    }

    return obj;
  }
}
