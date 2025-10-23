# Installation & Setup Guide

Complete guide to install, configure, and use AI Bridge Agent.

## 📋 Prerequisites

Before installing AI Bridge Agent, ensure you have:

- **VS Code**: Version 1.85.0 or higher
- **Node.js**: Version 16.x or higher (for development)
- **Operating System**: Windows, macOS, or Linux

## 📦 Installation Methods

### Method 1: From VS Code Marketplace (Recommended)

1. Open VS Code
2. Click Extensions icon (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "AI Bridge Agent"
4. Click **Install**
5. Reload VS Code if prompted

### Method 2: From VSIX File

1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions
4. Click `...` (More Actions) → Install from VSIX
5. Select the downloaded `.vsix` file
6. Reload VS Code

### Method 3: From Source (Development)

```bash
# Clone repository
git clone https://github.com/yourusername/ai-bridge-agent.git
cd ai-bridge-agent

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Open in VS Code
code .

# Press F5 to launch Extension Development Host
```

## ⚙️ Configuration

### Basic Configuration

1. Open Settings: **File** → **Preferences** → **Settings**
2. Search for "AI Bridge"
3. Configure options:

```json
{
  "aiBridge.serverPort": 3737,
  "aiBridge.autoApprove": false,
  "aiBridge.maxStepsPerSession": 50,
  "aiBridge.allowedCommands": [
    "npm", "yarn", "pnpm", "node", "python", "go", "cargo"
  ],
  "aiBridge.commandTimeout": 600,
  "aiBridge.enableBrowser": true,
  "aiBridge.maskCredentials": true,
  "aiBridge.createBackups": true,
  "aiBridge.logLevel": "info"
}
```

### Advanced Configuration

Create `.aiBridge/config.json` in your workspace:

```json
{
  "version": "1.0.0",
  "server": {
    "port": 3737,
    "host": "localhost",
    "enableWebSocket": true,
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:*"]
    }
  },
  "security": {
    "requireApproval": {
      "fileOperations": true,
      "commandExecution": true
    },
    "allowedCommands": ["npm", "node", "python"],
    "maxStepsPerSession": 50
  }
}
```

## 🚀 First Use

### Step 1: Start the Server

**Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):
```
AI Bridge: Start Server
```

You should see:
- ✅ Notification: "AI Bridge server running at http://localhost:3737"
- 📊 Status bar shows: `⟳ AI Bridge`
- 📝 Output channel logs startup

### Step 2: Verify Connection

Test the health endpoint:

```bash
# Using curl
curl http://localhost:3737/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

### Step 3: Connect External AI

Open ChatGPT, Claude, or Gemini and send:

```
I'm using AI Bridge Agent at http://localhost:3737

Can you help me create a simple "Hello World" Express server?
```

### Step 4: Monitor Progress

Watch in VS Code:
1. **Status Bar**: Shows session progress
2. **Output Channel**: View → Output → "AI Bridge Agent"
3. **Notifications**: Approval requests

## 🎯 Usage Patterns

### Pattern 1: Quick Task

```
Using AI Bridge at http://localhost:3737:

Create a function that sorts an array of numbers and write a test for it.
```

### Pattern 2: Full Project

```
Using AI Bridge at http://localhost:3737:

Build a REST API for a blog with:
- Posts CRUD endpoints
- User authentication
- TypeScript
- Jest tests
- Proper error handling

Work step-by-step and verify everything works.
```

### Pattern 3: Debugging

```
Using AI Bridge at http://localhost:3737:

My app has TypeScript errors. Please:
1. Check diagnostics
2. Identify issues
3. Fix them
4. Verify fixes work
```

## 🛠️ Commands Reference

| Command | Description | Shortcut |
|---------|-------------|----------|
| `AI Bridge: Start Server` | Start the bridge server | - |
| `AI Bridge: Stop Server` | Stop the bridge server | - |
| `AI Bridge: Show Status` | Display current status | - |
| `AI Bridge: Configure Settings` | Open settings | - |
| `AI Bridge: Cancel Session` | Cancel active session | - |
| `AI Bridge: Open Dashboard` | Open dashboard (coming soon) | - |

## 🔧 Troubleshooting

### Issue: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3737
```

**Solution 1:** Change port
```json
{
  "aiBridge.serverPort": 3738
}
```

**Solution 2:** Kill process using port
```bash
# Windows
netstat -ano | findstr :3737
taskkill /PID [PID] /F

# macOS/Linux
lsof -i :3737
kill -9 [PID]
```

### Issue: Commands Timing Out

**Error:**
```
Command timed out after 600 seconds
```

**Solution:**
```json
{
  "aiBridge.commandTimeout": 1200
}
```

### Issue: Browser Not Starting

**Error:**
```
Failed to launch browser
```

**Solution:**
```bash
# Install Playwright browsers
npx playwright install chromium
```

Or disable browser:
```json
{
  "aiBridge.enableBrowser": false
}
```

### Issue: Approval Dialogs Not Appearing

**Check:**
1. Look for notification in bottom-right corner
2. Check if window is focused
3. Check notification settings

**Solution:**
Enable auto-approve (trusted projects only):
```json
{
  "aiBridge.autoApprove": true
}
```

### Issue: Files Not Being Created

**Check:**
1. View → Output → "AI Bridge Agent"
2. Look for error messages
3. Check file permissions

**Solution:**
Ensure workspace folder has write permissions.

### Issue: WebSocket Connection Failed

**Check:**
1. Server is running
2. Firewall settings
3. Port not blocked

**Solution:**
```json
{
  "server": {
    "enableWebSocket": true,
    "port": 3737
  }
}
```

## 🔐 Security Best Practices

### 1. Use Approval System

```json
{
  "aiBridge.autoApprove": false,
  "security": {
    "requireApproval": {
      "fileOperations": true,
      "commandExecution": true,
      "dangerousCommands": true
    }
  }
}
```

### 2. Limit Allowed Commands

```json
{
  "aiBridge.allowedCommands": [
    "npm",
    "node",
    "python"
  ]
}
```

### 3. Enable Credential Masking

```json
{
  "aiBridge.maskCredentials": true
}
```

### 4. Create Backups

```json
{
  "aiBridge.createBackups": true,
  "backup": {
    "enabled": true,
    "maxBackups": 10
  }
}
```

### 5. Review Logs Regularly

Check Output Channel for suspicious activity.

## 📊 Performance Tips

### 1. Increase Timeout for Slow Commands

```json
{
  "aiBridge.commandTimeout": 1200
}
```

### 2. Disable Browser if Not Needed

```json
{
  "aiBridge.enableBrowser": false
}
```

### 3. Reduce Log Level

```json
{
  "aiBridge.logLevel": "warn"
}
```

### 4. Limit Session Steps

```json
{
  "aiBridge.maxStepsPerSession": 30
}
```

## 📚 Next Steps

After installation:

1. ✅ Read [Quick Start Guide](../examples/quick-start.md)
2. ✅ Review [API Integration Guide](AI-INTEGRATION-GUIDE.md)
3. ✅ Try [ChatGPT Template](../examples/chatgpt-template.md)
4. ✅ Explore [Example Workflows](../examples/)
5. ✅ Join [Community Discussions](https://github.com/yourusername/ai-bridge-agent/discussions)

## 🆘 Getting Help

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/ai-bridge-agent/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-bridge-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-bridge-agent/discussions)
- **Email**: support@example.com

## 🔄 Updates

The extension auto-updates through VS Code. To check for updates manually:

1. Go to Extensions
2. Search "AI Bridge Agent"
3. Click **Update** if available

Or enable auto-update:
```json
{
  "extensions.autoUpdate": true
}
```

---

**Happy Automating! 🚀**
