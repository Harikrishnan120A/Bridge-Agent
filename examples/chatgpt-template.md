# ChatGPT Integration Template

Use this template when starting a development session with AI Bridge Agent and ChatGPT.

## Initial Setup Message

```
I'm using AI Bridge Agent, a VS Code extension that lets you automate development tasks.

Connection: http://localhost:3737

You can:
- Execute terminal commands
- Create and edit files
- Run tests
- Check for errors
- Preview applications in browser

All actions require you to make HTTP POST requests to the bridge API.

Important: Always include these fields in requests:
- sessionId: (I'll provide this)
- stepId: (increment for each step: step-001, step-002, etc.)
- metadata.description: (what you're doing)
- metadata.reasoning: (why you're doing it)

Let's start by creating a new session. Make this API call:

POST http://localhost:3737/api/session/start
Content-Type: application/json

{
  "goal": "Build a [describe your project]",
  "metadata": {
    "framework": "[React/Vue/Express/etc]",
    "language": "[TypeScript/JavaScript/Python/etc]"
  }
}

Once you get the sessionId, proceed with development.
```

## Example Conversation Flow

### User Request
```
Build a simple Express REST API for a todo list application with:
- GET /todos - list all todos
- POST /todos - create a todo
- PUT /todos/:id - update a todo
- DELETE /todos/:id - delete a todo

Include TypeScript, tests with Jest, and proper error handling.
```

### ChatGPT Response Structure

```
I'll help you build this step-by-step using AI Bridge Agent.

**Step 1: Start Session**

Making API call to start session...

[API call details]

**Step 2: Initialize Project**

I'll create a new Node.js project with TypeScript.

POST http://localhost:3737/api/action

{
  "sessionId": "[session-id]",
  "stepId": "step-001",
  "action": "run",
  "payload": {
    "command": "npm init -y",
    "cwd": "./"
  },
  "metadata": {
    "description": "Initialize Node.js project",
    "reasoning": "Create package.json for dependency management"
  }
}

[Wait for response]

**Step 3: Install Dependencies**

[Next action...]

[Continue iteratively...]
```

## Development Workflow Template

### 1. Project Initialization
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-001",
  "action": "run",
  "payload": {
    "command": "npm init -y && npm install express typescript @types/express @types/node",
    "cwd": "./"
  },
  "metadata": {
    "description": "Initialize project and install dependencies",
    "reasoning": "Set up project foundation"
  }
}
```

### 2. Create Configuration Files
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-002",
  "action": "edit",
  "payload": {
    "file": "tsconfig.json",
    "operation": "replace",
    "content": "{\n  \"compilerOptions\": {\n    \"target\": \"ES2020\",\n    \"module\": \"commonjs\",\n    \"outDir\": \"./dist\",\n    \"rootDir\": \"./src\",\n    \"strict\": true,\n    \"esModuleInterop\": true\n  }\n}"
  },
  "metadata": {
    "description": "Create TypeScript configuration",
    "reasoning": "Configure TypeScript compiler options"
  }
}
```

### 3. Create Source Files
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-003",
  "action": "edit",
  "payload": {
    "file": "src/server.ts",
    "operation": "replace",
    "content": "import express, { Request, Response } from 'express';\n\nconst app = express();\nconst PORT = 3000;\n\napp.use(express.json());\n\ninterface Todo {\n  id: number;\n  title: string;\n  completed: boolean;\n}\n\nlet todos: Todo[] = [];\nlet nextId = 1;\n\napp.get('/todos', (req: Request, res: Response) => {\n  res.json(todos);\n});\n\napp.post('/todos', (req: Request, res: Response) => {\n  const { title } = req.body;\n  const todo: Todo = {\n    id: nextId++,\n    title,\n    completed: false\n  };\n  todos.push(todo);\n  res.status(201).json(todo);\n});\n\napp.put('/todos/:id', (req: Request, res: Response) => {\n  const id = parseInt(req.params.id);\n  const todo = todos.find(t => t.id === id);\n  if (!todo) {\n    return res.status(404).json({ error: 'Todo not found' });\n  }\n  Object.assign(todo, req.body);\n  res.json(todo);\n});\n\napp.delete('/todos/:id', (req: Request, res: Response) => {\n  const id = parseInt(req.params.id);\n  const index = todos.findIndex(t => t.id === id);\n  if (index === -1) {\n    return res.status(404).json({ error: 'Todo not found' });\n  }\n  todos.splice(index, 1);\n  res.status(204).send();\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on http://localhost:${PORT}`);\n});\n\nexport default app;"
  },
  "metadata": {
    "description": "Create Express server with todo endpoints",
    "reasoning": "Implement CRUD operations for todos"
  }
}
```

### 4. Check for Errors
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-004",
  "action": "diagnostics",
  "payload": {}
}
```

### 5. Create Tests
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-005",
  "action": "edit",
  "payload": {
    "file": "src/server.test.ts",
    "operation": "replace",
    "content": "import request from 'supertest';\nimport app from './server';\n\ndescribe('Todo API', () => {\n  test('GET /todos returns empty array initially', async () => {\n    const response = await request(app).get('/todos');\n    expect(response.status).toBe(200);\n    expect(response.body).toEqual([]);\n  });\n\n  test('POST /todos creates a new todo', async () => {\n    const response = await request(app)\n      .post('/todos')\n      .send({ title: 'Test todo' });\n    expect(response.status).toBe(201);\n    expect(response.body).toHaveProperty('id');\n    expect(response.body.title).toBe('Test todo');\n  });\n});"
  },
  "metadata": {
    "description": "Create Jest tests for todo endpoints",
    "reasoning": "Ensure API works correctly"
  }
}
```

### 6. Install Test Dependencies
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-006",
  "action": "run",
  "payload": {
    "command": "npm install --save-dev jest @types/jest ts-jest supertest @types/supertest"
  },
  "metadata": {
    "description": "Install testing dependencies",
    "reasoning": "Set up Jest test environment"
  }
}
```

### 7. Run Tests
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-007",
  "action": "test",
  "payload": {
    "command": "npm test"
  },
  "metadata": {
    "description": "Run test suite",
    "reasoning": "Verify all tests pass"
  }
}
```

### 8. Fix Issues (if tests fail)
```
If tests fail:
1. Review the error messages from the test result
2. Use diagnostics action to check for compilation errors
3. Make necessary fixes using edit action
4. Re-run tests
5. Repeat until all tests pass
```

### 9. Start Development Server
```json
{
  "sessionId": "[SESSION_ID]",
  "stepId": "step-008",
  "action": "run",
  "payload": {
    "command": "npm run dev",
    "timeout": 10
  },
  "metadata": {
    "description": "Start development server",
    "reasoning": "Launch application for manual testing"
  }
}
```

### 10. End Session
```json
{
  "sessionId": "[SESSION_ID]",
  "status": "completed"
}

POST http://localhost:3737/api/session/end
```

## Response Handling Template

### Success Response
```
✅ Step [N] completed successfully!

Result:
[Display relevant result data]

Next: [Describe next step]
```

### Error Response
```
❌ Step [N] failed!

Error: [Error message]

Analysis: [Analyze what went wrong]

Fix: [Propose solution]

Let me apply the fix...
[Make correction API call]
```

## Common Patterns

### Pattern: Create-Test-Fix Loop
```
1. Create code → 2. Check diagnostics → 3. Fix errors → 4. Run tests → 5. Fix failures → Repeat until green
```

### Pattern: Incremental Development
```
1. Implement minimum viable feature
2. Test it
3. Verify it works
4. Add next feature
5. Test everything
6. Repeat
```

### Pattern: Debug Session
```
1. Get diagnostics
2. Analyze errors
3. Read relevant files
4. Identify root cause
5. Apply fix
6. Verify fix works
7. Run tests
```

## Tips for ChatGPT

### DO ✅
- Explain each step before executing
- Wait for results before proceeding
- Handle errors gracefully
- Use incremental step IDs
- Include descriptive metadata
- Check diagnostics after edits
- Run tests frequently

### DON'T ❌
- Make multiple changes without testing
- Ignore error messages
- Skip approval dialogs
- Use generic step descriptions
- Proceed without verifying previous step

---

**Copy this template to start your AI Bridge session with ChatGPT!**
