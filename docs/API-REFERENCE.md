# API Reference

Complete API documentation for AI Bridge Agent HTTP and WebSocket interfaces.

## Base URL

```
http://localhost:3737
```

(Port configurable via settings)

## Authentication

Currently no authentication required. Runs on localhost only for security.

## Content Type

All requests must use:
```
Content-Type: application/json
```

---

## REST API Endpoints

### Health Check

Check if server is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

---

### Get Status

Get current bridge and session status.

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "serverRunning": true,
  "port": 3737,
  "sessionActive": true,
  "currentSessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepCount": 5,
  "maxSteps": 50
}
```

**Fields:**
- `serverRunning` - Whether server is active
- `port` - Server port number
- `sessionActive` - Whether a session is active
- `currentSessionId` - ID of current session (if any)
- `stepCount` - Number of steps in current session
- `maxSteps` - Maximum steps allowed

**Status Codes:**
- `200 OK` - Success

---

### Execute Action

Execute an action (command, edit, test, etc.).

**Endpoint:** `POST /api/action`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "stepId": "step-001",
  "action": "run|edit|test|diagnostics|preview|status",
  "payload": {
    // Action-specific payload
  },
  "requiresApproval": false,
  "metadata": {
    "description": "Description of what you're doing",
    "reasoning": "Why you're doing it"
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
    // Action-specific result
  },
  "error": null,
  "timestamp": "2025-10-23T12:00:00.000Z",
  "needsApproval": false,
  "approvalGranted": true
}
```

**Status Codes:**
- `200 OK` - Action completed
- `500 Internal Server Error` - Action failed

---

## Action Types

### 1. Run Command

Execute a terminal command.

**Action:** `"run"`

**Payload:**
```json
{
  "command": "npm install express",
  "cwd": "./",
  "timeout": 300
}
```

**Fields:**
- `command` (required) - Command to execute
- `cwd` (optional) - Working directory (default: workspace root)
- `timeout` (optional) - Timeout in seconds (default: 600)

**Result:**
```json
{
  "stdout": "added 50 packages in 5s",
  "stderr": "",
  "exitCode": 0,
  "duration": 5200
}
```

**Example:**
```bash
curl -X POST http://localhost:3737/api/action \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "stepId": "step-001",
    "action": "run",
    "payload": {
      "command": "npm --version"
    }
  }'
```

---

### 2. Edit File

Create or modify a file.

**Action:** `"edit"`

**Payload:**
```json
{
  "file": "src/server.ts",
  "operation": "replace|insert|delete|patch",
  "content": "file content here",
  "lineStart": 0,
  "lineEnd": 10
}
```

**Fields:**
- `file` (required) - File path relative to workspace
- `operation` (required) - Edit operation type
- `content` (optional) - Content to write/insert
- `lineStart` (optional) - Starting line for insert/delete/patch
- `lineEnd` (optional) - Ending line for delete/patch

**Operations:**
- `replace` - Replace entire file content
- `insert` - Insert at specific line
- `delete` - Delete line range
- `patch` - Replace line range

**Result:**
```json
{
  "filesModified": ["src/server.ts"],
  "linesChanged": 45,
  "backupPath": ".aiBridge/backups/server.ts.2025-10-23T12-00-00.bak"
}
```

**Example:**
```bash
curl -X POST http://localhost:3737/api/action \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "stepId": "step-002",
    "action": "edit",
    "payload": {
      "file": "README.md",
      "operation": "replace",
      "content": "# My Project\n\nDescription here"
    }
  }'
```

---

### 3. Run Tests

Execute test suite.

**Action:** `"test"`

**Payload:**
```json
{
  "command": "npm test",
  "cwd": "./",
  "timeout": 300
}
```

**Result:**
```json
{
  "success": true,
  "total": 10,
  "passed": 10,
  "failed": 0,
  "skipped": 0,
  "failures": [],
  "duration": 2500
}
```

**Failure Details:**
```json
{
  "failures": [
    {
      "name": "should return 200 OK",
      "file": "src/server.test.ts",
      "message": "Expected 200 but got 404",
      "stack": "Error: ..."
    }
  ]
}
```

---

### 4. Get Diagnostics

Get errors and warnings from VS Code.

**Action:** `"diagnostics"`

**Payload:**
```json
{
  "files": ["src/server.ts"]
}
```

**Fields:**
- `files` (optional) - Specific files to check (default: all)

**Result:**
```json
{
  "errors": [
    {
      "file": "src/server.ts",
      "line": 10,
      "column": 5,
      "severity": "error",
      "message": "Cannot find name 'req'",
      "source": "typescript"
    }
  ],
  "warnings": [
    {
      "file": "src/server.ts",
      "line": 15,
      "column": 10,
      "severity": "warning",
      "message": "Unused variable 'data'",
      "source": "eslint"
    }
  ]
}
```

---

### 5. Browser Preview

Automate browser and capture screenshots.

**Action:** `"preview"`

**Payload:**
```json
{
  "url": "http://localhost:3000",
  "captureScreenshot": true,
  "actions": [
    {
      "type": "goto|click|type|wait|screenshot",
      "selector": "#submit-button",
      "value": "text to type",
      "timeout": 5000
    }
  ]
}
```

**Browser Actions:**
- `goto` - Navigate to URL (value = URL)
- `click` - Click element (selector required)
- `type` - Type text (selector + value required)
- `wait` - Wait milliseconds (timeout required)
- `screenshot` - Capture screenshot

**Result:**
```json
{
  "success": true,
  "screenshot": "base64-encoded-image...",
  "httpStatus": 200,
  "consoleErrors": ["TypeError: ..."],
  "duration": 3500
}
```

---

## Session Management

### Start Session

Create a new session.

**Endpoint:** `POST /api/session/start`

**Request:**
```json
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

---

### End Session

End the current session.

**Endpoint:** `POST /api/session/end`

**Request:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed|failed|cancelled"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Get Session

Get session details.

**Endpoint:** `GET /api/session/:id`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2025-10-23T12:00:00.000Z",
  "endTime": "2025-10-23T12:05:00.000Z",
  "status": "completed",
  "steps": [],
  "currentStep": 10,
  "maxSteps": 50,
  "workspaceRoot": "/path/to/workspace",
  "backupPath": "/path/to/backups",
  "metadata": {
    "projectGoal": "Build todo app"
  }
}
```

---

### Cancel Session

Cancel and delete a session.

**Endpoint:** `DELETE /api/session/:id`

**Response:**
```json
{
  "success": true
}
```

---

## WebSocket API

Connect to WebSocket for real-time updates.

**URL:** `ws://localhost:3737`

### Events from Server

#### Connected
```json
{
  "type": "connected",
  "message": "Connected to AI Bridge Agent",
  "timestamp": "2025-10-23T12:00:00.000Z"
}
```

#### Action Received
```json
{
  "type": "action.received",
  "data": {
    "sessionId": "...",
    "stepId": "..."
  },
  "timestamp": "..."
}
```

#### Action Executing
```json
{
  "type": "action.executing",
  "data": {
    "sessionId": "...",
    "stepId": "..."
  },
  "timestamp": "..."
}
```

#### Action Completed
```json
{
  "type": "action.completed",
  "data": {
    "sessionId": "...",
    "stepId": "...",
    "success": true
  },
  "timestamp": "..."
}
```

#### Action Failed
```json
{
  "type": "action.failed",
  "data": {
    "sessionId": "...",
    "stepId": "...",
    "error": "Error message"
  },
  "timestamp": "..."
}
```

#### Log Output
```json
{
  "type": "log.output",
  "data": {
    "message": "Command output..."
  },
  "timestamp": "..."
}
```

### Events to Server

#### Submit Action
```json
{
  "type": "action.submit",
  "action": {
    "sessionId": "...",
    "stepId": "...",
    "action": "run",
    "payload": {}
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "sessionId": "...",
  "stepId": "...",
  "success": false,
  "action": "run",
  "result": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "stack": "Stack trace..."
  },
  "timestamp": "..."
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `COMMAND_FAILED` | Command execution failed |
| `FILE_NOT_FOUND` | File doesn't exist |
| `PERMISSION_DENIED` | Insufficient permissions |
| `TIMEOUT` | Operation timed out |
| `SYNTAX_ERROR` | Code syntax error |
| `NETWORK_ERROR` | Network request failed |
| `BROWSER_ERROR` | Browser automation failed |
| `APPROVAL_DENIED` | User denied approval |
| `MAX_STEPS_EXCEEDED` | Session step limit reached |

---

## Rate Limits

| Type | Limit |
|------|-------|
| Actions per minute | 10 |
| Actions per session | 50 |
| Commands per minute | 5 |
| File edits per minute | 20 |
| Previews per minute | 3 |

When exceeded, returns:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded for actionsPerMinute. Wait 30 seconds."
  }
}
```

---

## Examples

### Complete Workflow Example

```javascript
// 1. Start session
const sessionResponse = await fetch('http://localhost:3737/api/session/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    goal: 'Create Express server',
    metadata: { framework: 'Express', language: 'TypeScript' }
  })
});
const { sessionId } = await sessionResponse.json();

// 2. Run command
const runResponse = await fetch('http://localhost:3737/api/action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    stepId: 'step-001',
    action: 'run',
    payload: { command: 'npm init -y' }
  })
});

// 3. Edit file
const editResponse = await fetch('http://localhost:3737/api/action', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    stepId: 'step-002',
    action: 'edit',
    payload: {
      file: 'index.js',
      operation: 'replace',
      content: 'console.log("Hello World");'
    }
  })
});

// 4. End session
await fetch('http://localhost:3737/api/session/end', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, status: 'completed' })
});
```

---

**For more examples, see the [examples](../examples/) directory.**
