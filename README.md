# AI Bridge Agent

**Bridge between external AI chat interfaces (ChatGPT, Claude, Gemini) and VS Code for automated development workflows.**

[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

AI Bridge Agent acts as an intelligent intermediary between external AI assistants and your local VS Code environment. It enables external AI to:

- ✅ Execute terminal commands safely
- ✅ Read and edit files with approval system
- ✅ Run tests and capture results
- ✅ Check diagnostics (errors/warnings)
- ✅ Preview applications in browser
- ✅ Automate entire development workflows

## 🚀 Features

### 🔐 **Safe Command Execution**
- Allowlist/blocklist for commands
- Path validation and sanitization
- User approval for dangerous operations
- Real-time output capture

### 📝 **Intelligent File Editing**
- Multiple edit operations (replace, insert, delete, patch)
- Automatic backups before modifications
- File formatting after edits
- Workspace-scoped path validation

### 🧪 **Test Automation**
- Support for Jest, Mocha, pytest, Go test, Rust cargo test
- Parse test results and failures
- Capture detailed error messages

### 🌐 **Browser Verification**
- Playwright-based browser automation
- Screenshot capture
- Console error detection
- UI interaction testing

### 🛡️ **Security & Safety**
- Rate limiting on operations
- Credential masking in logs
- Command injection prevention
- Approval system for sensitive actions

### 📊 **Session Management**
- Track all actions in a session
- Generate session reports
- Rollback capabilities
- Step-by-step progress tracking

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "AI Bridge Agent"
4. Click Install

### From Source
```bash
# Clone repository
git clone https://github.com/yourusername/ai-bridge-agent.git
cd ai-bridge-agent

# Install dependencies
npm install

# Build extension
npm run compile

# Package extension
npm run package
```

## 🎮 Quick Start

### 1. Start the Bridge Server

**Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):
```
AI Bridge: Start Server
```

The server will start on `http://localhost:3737` (configurable).

### 2. Connect from External AI

In ChatGPT, Claude, or Gemini, begin with:

```
I'm using AI Bridge Agent at http://localhost:3737

Please help me build a React component for a todo list.
```

### 3. Monitor Progress

- **Status Bar**: Shows server status and session progress
- **Output Channel**: View logs and command outputs
- **Approval Dialogs**: Review and approve sensitive operations

## 📘 Usage Examples

### Example 1: Create and Test a Node.js Project

**External AI Request:**
```
Using AI Bridge Agent at http://localhost:3737, create a simple Express server with these features:
1. GET /api/health endpoint
2. POST /api/users endpoint  
3. Write tests for both endpoints
4. Run the tests
```

**AI Bridge will:**
1. Initialize `package.json` and install Express
2. Create `server.js` with endpoints
3. Create `server.test.js` with Jest tests
4. Install Jest
5. Run tests and report results

### Example 2: Debug a React Application

**External AI Request:**
```
My React app at http://localhost:3000 has errors. 
Using AI Bridge, please:
1. Check for TypeScript/ESLint errors
2. Open the app in browser and capture screenshot
3. Check console for errors
4. Fix any issues found
```

**AI Bridge will:**
1. Read VS Code diagnostics
2. Launch browser and navigate to app
3. Capture screenshot and console errors
4. Suggest and apply fixes
5. Verify fixes work

## ⚙️ Configuration

### Extension Settings

Access via **File > Preferences > Settings** or `Ctrl+,`:

```json
{
  "aiBridge.serverPort": 3737,
  "aiBridge.autoApprove": false,
  "aiBridge.maxStepsPerSession": 50,
  "aiBridge.allowedCommands": [
    "npm", "yarn", "pnpm", "node", "python", "pytest", "go", "cargo"
  ],
  "aiBridge.commandTimeout": 600,
  "aiBridge.enableBrowser": true,
  "aiBridge.maskCredentials": true,
  "aiBridge.createBackups": true,
  "aiBridge.logLevel": "info"
}
```

### Configuration File

Create `.aiBridge/config.json` in your workspace:

```json
{
  "version": "1.0.0",
  "server": {
    "port": 3737,
    "host": "localhost",
    "enableWebSocket": true
  },
  "security": {
    "requireApproval": {
      "fileOperations": true,
      "commandExecution": true,
      "dangerousCommands": true
    },
    "allowedCommands": ["npm", "node", "python"],
    "blockedCommands": ["rm -rf /", "sudo", "su"],
    "maxStepsPerSession": 50,
    "commandTimeout": 600
  },
  "backup": {
    "enabled": true,
    "path": ".aiBridge/backups",
    "maxBackups": 10
  }
}
```

## 🔌 API Reference

### REST API Endpoints

#### `POST /api/action`
Execute an action.

**Request Body:**
```json
{
  "sessionId": "uuid",
  "stepId": "uuid",
  "action": "run",
  "payload": {
    "command": "npm test",
    "cwd": "./",
    "timeout": 300
  },
  "metadata": {
    "description": "Run tests",
    "reasoning": "Verify all tests pass"
  }
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "stepId": "uuid",
  "success": true,
  "action": "run",
  "result": {
    "stdout": "All tests passed",
    "stderr": "",
    "exitCode": 0,
    "duration": 2500
  },
  "timestamp": "2025-10-23T12:00:00Z"
}
```

#### Actions Supported

| Action | Description | Payload |
|--------|-------------|---------|
| `run` | Execute terminal command | `command`, `cwd`, `timeout` |
| `test` | Run tests | `command`, `cwd`, `timeout` |
| `edit` | Edit files | `file`, `operation`, `content`, `lineStart`, `lineEnd` |
| `diagnostics` | Get errors/warnings | `files` (optional) |
| `preview` | Browser automation | `url`, `actions`, `captureScreenshot` |
| `status` | Get current status | (none) |

### WebSocket Events

Connect to `ws://localhost:3737`:

**Client → Server:**
- `action.submit` - Submit action
- `session.start` - Start session
- `session.end` - End session

**Server → Client:**
- `connected` - Connection established
- `action.received` - Action received
- `action.executing` - Action executing
- `action.completed` - Action completed
- `action.failed` - Action failed
- `log.output` - Real-time command output

## 🔐 Security

### Command Safety

**Allowed by default:**
- Package managers: npm, yarn, pnpm
- Runtimes: node, python, go, cargo, deno, bun
- Version control: git (read operations)

**Blocked by default:**
- `rm -rf /` (destructive deletions)
- `sudo`, `su` (privilege escalation)
- Network tools: `curl`, `wget` (outside localhost)
- System modifications

### File Safety

- All file operations scoped to workspace
- Path traversal prevention
- Automatic backups before edits
- Rollback capabilities

### Credential Protection

Automatically masks in logs:
- API keys
- Tokens
- Passwords
- Private keys
- Connection strings

## 🐛 Troubleshooting

### Server Won't Start

**Error:** `Port 3737 already in use`

**Solution:**
```json
// settings.json
{
  "aiBridge.serverPort": 3738
}
```

### Commands Timing Out

**Solution:**
```json
{
  "aiBridge.commandTimeout": 1200
}
```

### Browser Not Launching

**Solution:**
```bash
# Install Playwright browsers
npx playwright install chromium
```

### Approval Dialogs Annoying

**Solution:**
```json
{
  "aiBridge.autoApprove": true
}
```
⚠️ **Warning:** Only enable in trusted environments!

## 📝 Examples

See the `examples/` directory for:
- ChatGPT integration templates
- Claude integration templates  
- Gemini integration templates
- Sample workflows
- Use case scenarios

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ai-bridge-agent/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/ai-bridge-agent/discussions)
- **Documentation:** [Wiki](https://github.com/yourusername/ai-bridge-agent/wiki)

## 🙏 Acknowledgments

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Express.js](https://expressjs.com/)
- [Playwright](https://playwright.dev/)
- [WebSocket](https://github.com/websockets/ws)

---

**Made with ❤️ for AI-assisted development**
