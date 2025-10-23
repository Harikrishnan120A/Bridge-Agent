# Build and Run Guide

Step-by-step instructions to build, test, and run the AI Bridge Agent extension.

## Prerequisites

Before you begin, ensure you have:

- ✅ **VS Code** installed (version 1.85.0+)
- ✅ **Node.js** installed (version 16.x or higher)
- ✅ **npm** or **yarn** package manager
- ✅ **Git** (optional, for version control)

Check versions:
```powershell
node --version    # Should show v16.x or higher
npm --version     # Should show 8.x or higher
code --version    # Should show VS Code version
```

## Step 1: Install Dependencies

Open PowerShell and navigate to the project:

```powershell
cd "c:\Users\Hari\OneDrive\Desktop\My workspace\plug"
```

Install all dependencies:

```powershell
npm install
```

This will install:
- VS Code extension dependencies
- TypeScript compiler
- Express.js and WebSocket server
- Playwright for browser automation
- All type definitions

Expected output:
```
added 150+ packages in 30s
```

## Step 2: Compile TypeScript

Compile the TypeScript source code to JavaScript:

```powershell
npm run compile
```

This creates the `dist/` folder with compiled JavaScript files.

Expected output:
```
> ai-bridge-agent@1.0.0 compile
> tsc -p ./

[No errors means success]
```

## Step 3: Open in VS Code

Open the project in VS Code:

```powershell
code .
```

## Step 4: Launch Extension Development Host

There are two ways to run the extension:

### Method A: Using F5 (Recommended)

1. Make sure you're in VS Code with the project open
2. Press `F5` key
3. A new "Extension Development Host" window opens
4. The extension is now active in that window

### Method B: Using Run Menu

1. Click **Run** menu → **Start Debugging**
2. Or click the green play button in the sidebar
3. Extension Development Host opens

## Step 5: Verify Extension is Active

In the Extension Development Host window:

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type "AI Bridge"
3. You should see these commands:
   - AI Bridge: Start Server
   - AI Bridge: Stop Server
   - AI Bridge: Show Status
   - AI Bridge: Configure Settings
   - AI Bridge: Cancel Session

## Step 6: Start the Bridge Server

1. Press `Ctrl+Shift+P`
2. Run: **AI Bridge: Start Server**
3. Look for notification: "AI Bridge server running at http://localhost:3737"
4. Check status bar (bottom): Should show `⟳ AI Bridge`

Verify server is running:

```powershell
# In a new PowerShell window
curl http://localhost:3737/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

## Step 7: Test with AI

### Option A: Test with cURL

Create a test session:

```powershell
# Start session
$session = Invoke-RestMethod -Method Post -Uri "http://localhost:3737/api/session/start" -ContentType "application/json" -Body '{"goal":"Test session"}'

echo $session.sessionId

# Run a command
$body = @{
  sessionId = $session.sessionId
  stepId = "step-001"
  action = "run"
  payload = @{
    command = "node --version"
  }
  metadata = @{
    description = "Check Node version"
    reasoning = "Testing command execution"
  }
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3737/api/action" -ContentType "application/json" -Body $body
```

### Option B: Test with ChatGPT

1. Open ChatGPT
2. Send this message:

```
I'm using AI Bridge Agent at http://localhost:3737

Please execute this command: node --version

And tell me what version is installed.
```

3. ChatGPT will make the API call and show you the result

## Step 8: Monitor Activity

While the extension is running, monitor:

### Status Bar
- Bottom-left corner shows: `⟳ AI Bridge`
- Click it to see status details

### Output Channel
1. Menu: **View** → **Output**
2. Select "AI Bridge Agent" from dropdown
3. See real-time logs of all activities

### Notifications
- Approval requests appear as notifications
- Click "Approve" to allow actions
- Click "Deny" to reject

## Step 9: Test Each Feature

### Test Command Execution
```json
POST http://localhost:3737/api/action
{
  "sessionId": "[your-session-id]",
  "stepId": "step-001",
  "action": "run",
  "payload": {
    "command": "echo Hello World"
  }
}
```

### Test File Creation
```json
POST http://localhost:3737/api/action
{
  "sessionId": "[your-session-id]",
  "stepId": "step-002",
  "action": "edit",
  "payload": {
    "file": "test.txt",
    "operation": "replace",
    "content": "Hello from AI Bridge!"
  }
}
```

### Test Diagnostics
```json
POST http://localhost:3737/api/action
{
  "sessionId": "[your-session-id]",
  "stepId": "step-003",
  "action": "diagnostics",
  "payload": {}
}
```

## Troubleshooting

### Error: Cannot find module 'vscode'

**Solution:** This is expected during npm install. It will work when running in VS Code.

### Error: Port 3737 already in use

**Solution:** Change the port in settings:
```json
{
  "aiBridge.serverPort": 3738
}
```

Or kill the process using the port:
```powershell
# Find process
netstat -ano | findstr :3737

# Kill it (replace [PID] with actual PID)
taskkill /PID [PID] /F
```

### Error: TypeScript compilation failed

**Solution:** Check for syntax errors:
```powershell
npm run lint
```

Fix any errors shown, then recompile:
```powershell
npm run compile
```

### Extension not appearing in Command Palette

**Solution:**
1. Close Extension Development Host
2. In main VS Code window, press `F5` again
3. Wait for extension to activate (check status bar)

### Browser not launching

**Solution:** Install Playwright browsers:
```powershell
npx playwright install chromium
```

Or disable browser in settings:
```json
{
  "aiBridge.enableBrowser": false
}
```

## Development Workflow

### Making Changes

1. Edit TypeScript files in `src/`
2. Save files
3. Compile: `npm run compile`
4. Reload extension: 
   - In Extension Development Host, press `Ctrl+R`
   - Or press `F5` again in main window

### Watch Mode

For automatic recompilation on file changes:

```powershell
npm run watch
```

Leave this running in a terminal. Now whenever you save a file, it auto-compiles.

### Debugging

Set breakpoints in VS Code:
1. Open a TypeScript file in `src/`
2. Click left of line number to add breakpoint (red dot)
3. Press `F5` to start debugging
4. Extension will pause at breakpoints

## Testing the Extension

### Manual Testing

Follow the steps in "Step 9: Test Each Feature" above.

### Automated Testing

(Unit tests would be added here in future versions)

```powershell
npm test
```

## Building for Distribution

### Create VSIX Package

```powershell
# Install vsce globally (once)
npm install -g vsce

# Package the extension
npm run package
```

This creates: `ai-bridge-agent-1.0.0.vsix`

### Install VSIX Locally

1. In VS Code: Extensions → `...` → Install from VSIX
2. Select `ai-bridge-agent-1.0.0.vsix`
3. Reload VS Code

### Share with Others

Send the `.vsix` file to others. They can install it the same way.

## Publishing to Marketplace

(For when ready to publish publicly)

```powershell
# Login (first time only)
vsce login [your-publisher-name]

# Publish
vsce publish
```

## Cleanup

### Stop the Server

1. Press `Ctrl+Shift+P`
2. Run: **AI Bridge: Stop Server**

### Close Extension Development Host

Close the Extension Development Host window.

### Clean Build Files

```powershell
# Remove compiled files
Remove-Item -Recurse -Force dist

# Remove node_modules (if needed)
Remove-Item -Recurse -Force node_modules

# Reinstall
npm install
npm run compile
```

## Performance Tips

### Reduce Logging

```json
{
  "aiBridge.logLevel": "warn"
}
```

### Disable Browser if Not Needed

```json
{
  "aiBridge.enableBrowser": false
}
```

### Increase Timeouts for Slow Commands

```json
{
  "aiBridge.commandTimeout": 1200
}
```

## Next Steps

1. ✅ Extension is running - Congratulations!
2. 📖 Read the [Quick Start Guide](examples/quick-start.md)
3. 🤖 Try [ChatGPT Integration](examples/chatgpt-template.md)
4. 📚 Study [API Reference](docs/API-REFERENCE.md)
5. 🚀 Build something amazing!

## Support

If you encounter issues:

1. Check the **Output Channel** for error messages
2. Review this guide for solutions
3. Check [INSTALLATION.md](docs/INSTALLATION.md)
4. Report issues on GitHub (when available)

---

**Happy Building! 🎉**

You now have a fully functional AI Bridge Agent extension running in VS Code!
