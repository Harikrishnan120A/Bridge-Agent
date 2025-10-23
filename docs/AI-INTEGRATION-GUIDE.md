# External AI Integration Guide

Complete guide for integrating ChatGPT, Claude, Gemini, or other AI assistants with AI Bridge Agent.

## 📡 Connection Setup

### Step 1: Start AI Bridge in VS Code

1. Open VS Code with your project
2. Run command: **AI Bridge: Start Server**
3. Note the connection URL (e.g., `http://localhost:3737`)
4. Keep VS Code open during the session

### Step 2: Establish Connection in AI Chat

**Initial Message Template:**
```
I'm using AI Bridge Agent at http://localhost:3737 to automate development in VS Code.

You can execute commands, edit files, run tests, and preview the application through the bridge API.

Project Goal: [Describe what you want to build]
```

## 🎯 Workflow Patterns

### Pattern 1: Iterative Development

```
Using AI Bridge at http://localhost:3737:

1. Create a new React component called UserProfile
2. Add props for name, email, and avatar
3. Style it with Tailwind CSS  
4. Create a test file
5. Run the tests
6. If tests fail, fix the issues and re-run
7. Preview the component in browser at http://localhost:3000
8. Iterate until it looks good
```

### Pattern 2: Bug Fixing

```
Using AI Bridge at http://localhost:3737:

My application is showing errors. Please:
1. Check diagnostics for errors and warnings
2. Review the error messages
3. Suggest fixes
4. Apply the fixes
5. Verify the errors are resolved
6. Run tests to ensure nothing broke
```

### Pattern 3: Feature Addition

```
Using AI Bridge at http://localhost:3737:

Add a new feature to my Express API:
1. Create a new route /api/products
2. Add CRUD operations
3. Write tests for each endpoint
4. Update documentation
5. Run all tests to ensure compatibility
```

## 📤 Making API Requests

### Starting a Session

**Request:**
```http
POST http://localhost:3737/api/session/start
Content-Type: application/json

{
  "goal": "Build a todo list application",
  "metadata": {
    "framework": "React",
    "language": "TypeScript"
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Running a Command

**Request:**
```http
POST http://localhost:3737/api/action
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-001",
  "action": "run",
  "payload": {
    "command": "npm install express",
    "cwd": "./",
    "timeout": 300
  },
  "metadata": {
    "description": "Install Express framework",
    "reasoning": "Needed for building the API server"
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-001",
  "success": true,
  "action": "run",
  "result": {
    "stdout": "added 50 packages in 5s",
    "stderr": "",
    "exitCode": 0,
    "duration": 5200
  },
  "timestamp": "2025-10-23T12:00:00Z"
}
```

### Editing a File

**Request:**
```http
POST http://localhost:3737/api/action
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-002",
  "action": "edit",
  "payload": {
    "file": "src/server.ts",
    "operation": "replace",
    "content": "import express from 'express';\n\nconst app = express();\nconst PORT = 3000;\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});"
  },
  "metadata": {
    "description": "Create Express server with health endpoint",
    "reasoning": "Set up basic server structure"
  }
}
```

### Running Tests

**Request:**
```http
POST http://localhost:3737/api/action
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-003",
  "action": "test",
  "payload": {
    "command": "npm test",
    "cwd": "./",
    "timeout": 300
  },
  "metadata": {
    "description": "Run all tests",
    "reasoning": "Verify functionality"
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-003",
  "success": true,
  "action": "test",
  "result": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "skipped": 0,
    "failures": [],
    "duration": 2500
  },
  "timestamp": "2025-10-23T12:05:00Z"
}
```

### Getting Diagnostics

**Request:**
```http
POST http://localhost:3737/api/action
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-004",
  "action": "diagnostics",
  "payload": {
    "files": ["src/server.ts"]
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-004",
  "success": true,
  "action": "diagnostics",
  "result": {
    "errors": [
      {
        "file": "src/server.ts",
        "line": 5,
        "column": 10,
        "severity": "error",
        "message": "Cannot find name 'req'",
        "source": "typescript"
      }
    ],
    "warnings": []
  },
  "timestamp": "2025-10-23T12:06:00Z"
}
```

### Browser Preview

**Request:**
```http
POST http://localhost:3737/api/action
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-005",
  "action": "preview",
  "payload": {
    "url": "http://localhost:3000",
    "captureScreenshot": true,
    "actions": [
      {
        "type": "wait",
        "timeout": 2000
      },
      {
        "type": "click",
        "selector": "#submit-button"
      },
      {
        "type": "screenshot"
      }
    ]
  },
  "metadata": {
    "description": "Preview application and test UI",
    "reasoning": "Verify the UI renders correctly"
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-005",
  "success": true,
  "action": "preview",
  "result": {
    "screenshot": "base64-encoded-image-data...",
    "httpStatus": 200,
    "consoleErrors": [],
    "duration": 3500
  },
  "timestamp": "2025-10-23T12:07:00Z"
}
```

## 🤖 AI Assistant Prompts

### ChatGPT Prompt Template

```markdown
# System Context

You are working with AI Bridge Agent, a VS Code extension that allows you to automate development workflows. You can:

- Execute terminal commands via the bridge API
- Create and edit files
- Run tests and analyze results
- Check for errors and warnings
- Preview applications in browser

# Connection Details

Bridge URL: http://localhost:3737
Current Session: [session-id]

# Available Actions

1. **run**: Execute terminal commands
2. **edit**: Create/modify files
3. **test**: Run test suites
4. **diagnostics**: Get errors/warnings
5. **preview**: Browser automation
6. **status**: Get current state

# Guidelines

- Always explain what you're about to do before making API calls
- Check diagnostics after making changes
- Run tests frequently to catch issues early
- Use descriptive step IDs (step-001, step-002, etc.)
- Include metadata with description and reasoning
- Handle errors gracefully and suggest fixes

# User Request

[User describes their development goal]

# Your Response

[Break down the task into steps and execute via AI Bridge]
```

### Claude Prompt Template

```markdown
I'm using AI Bridge Agent at http://localhost:3737 to assist with development.

You can help by:
1. Analyzing the current project state
2. Executing commands safely
3. Creating and editing files
4. Running tests
5. Debugging issues

Current task: [describe task]

Please proceed step-by-step, explaining each action before taking it. After each step, wait for the result before proceeding.
```

### Gemini Prompt Template

```markdown
**Development Environment:**
- Tool: AI Bridge Agent
- URL: http://localhost:3737
- Mode: Interactive development automation

**Capabilities:**
- Command execution with safety checks
- File system operations
- Test automation
- Error diagnostics
- Browser testing

**Task:** [describe what you want to build]

**Instructions:**
Work incrementally, verify each step, and handle errors proactively.
```

## 🔄 Complete Workflow Example

### Building a REST API from Scratch

**Initial Prompt:**
```
Using AI Bridge Agent at http://localhost:3737, create a REST API for a book store with:

1. Express.js backend
2. TypeScript
3. Endpoints: GET /books, POST /books, GET /books/:id
4. Jest tests for all endpoints
5. Proper error handling

Work step-by-step and verify everything works.
```

**AI Bridge Will Execute:**

**Step 1: Initialize Project**
```json
{
  "action": "run",
  "payload": {
    "command": "npm init -y && npm install express typescript @types/express @types/node ts-node"
  }
}
```

**Step 2: Create TypeScript Config**
```json
{
  "action": "edit",
  "payload": {
    "file": "tsconfig.json",
    "operation": "replace",
    "content": "{ \"compilerOptions\": { \"target\": \"ES2020\", \"module\": \"commonjs\", \"outDir\": \"./dist\", \"strict\": true, \"esModuleInterop\": true } }"
  }
}
```

**Step 3: Create Server File**
```json
{
  "action": "edit",
  "payload": {
    "file": "src/server.ts",
    "operation": "replace",
    "content": "import express from 'express';\n// [full server code]"
  }
}
```

**Step 4: Check for Errors**
```json
{
  "action": "diagnostics",
  "payload": {
    "files": ["src/server.ts"]
  }
}
```

**Step 5: Create Tests**
```json
{
  "action": "edit",
  "payload": {
    "file": "src/server.test.ts",
    "operation": "replace",
    "content": "// [test code]"
  }
}
```

**Step 6: Run Tests**
```json
{
  "action": "test",
  "payload": {
    "command": "npm test"
  }
}
```

**Step 7: Start Server & Preview**
```json
{
  "action": "run",
  "payload": {
    "command": "npm start"
  }
}
```

```json
{
  "action": "preview",
  "payload": {
    "url": "http://localhost:3000/books"
  }
}
```

## ⚠️ Best Practices

### DO ✅

- Start each conversation with the bridge URL
- Use descriptive metadata
- Check diagnostics frequently
- Run tests after changes
- Handle approval dialogs promptly
- Keep sessions under 50 steps
- End sessions when done

### DON'T ❌

- Run commands without explaining
- Modify files outside workspace
- Ignore error messages
- Skip testing
- Use hardcoded credentials
- Leave sessions running indefinitely

## 🐛 Troubleshooting

### Connection Refused

**Problem:** AI cannot connect to bridge

**Solution:**
1. Verify VS Code is running
2. Check bridge server is started
3. Confirm port number (default 3737)
4. Check firewall settings

### Approval Timeout

**Problem:** Operations stuck waiting for approval

**Solution:**
1. Look for VS Code notification
2. Click Approve/Deny
3. Or enable auto-approve for trusted sessions

### Session Limit Reached

**Problem:** "Maximum steps exceeded"

**Solution:**
```http
POST http://localhost:3737/api/session/end

{
  "sessionId": "current-session-id",
  "status": "completed"
}
```

Then start a new session.

## 📞 Support

- Report issues: [GitHub Issues](https://github.com/yourusername/ai-bridge-agent/issues)
- Ask questions: [GitHub Discussions](https://github.com/yourusername/ai-bridge-agent/discussions)
- Read docs: [Wiki](https://github.com/yourusername/ai-bridge-agent/wiki)

---

**Happy Building! 🚀**
