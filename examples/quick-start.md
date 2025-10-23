# Quick Start Example

This example demonstrates a complete workflow using AI Bridge Agent to create a simple web application.

## Prerequisites

1. VS Code installed
2. Node.js installed
3. AI Bridge Agent extension installed
4. An external AI (ChatGPT, Claude, or Gemini)

## Step 1: Start AI Bridge

In VS Code:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: **AI Bridge: Start Server**
3. Note the URL: `http://localhost:3737`

## Step 2: Start Session with AI

Copy and paste this into your AI chat:

```
I'm using AI Bridge Agent at http://localhost:3737

Please help me create a simple Express.js API with these requirements:
1. A GET /api/users endpoint that returns a list of users
2. A POST /api/users endpoint that creates a new user
3. Input validation
4. Jest tests for both endpoints
5. TypeScript

Work step-by-step, verify each step works, and handle any errors.
```

## Expected AI Workflow

The AI will execute these actions through the bridge:

### Action 1: Initialize Project
```bash
npm init -y
npm install express typescript @types/express @types/node ts-node nodemon
```

### Action 2: Create TypeScript Config
Creates `tsconfig.json` with proper compiler options.

### Action 3: Create Server File
Creates `src/server.ts` with:
- Express app setup
- User interface definition
- GET /api/users endpoint
- POST /api/users endpoint
- Input validation
- Error handling

### Action 4: Check for Errors
Runs diagnostics to ensure no TypeScript errors.

### Action 5: Create Tests
Creates `src/server.test.ts` with Jest tests for both endpoints.

### Action 6: Install Test Dependencies
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### Action 7: Configure Jest
Creates `jest.config.js` with TypeScript support.

### Action 8: Run Tests
Executes `npm test` and reports results.

### Action 9: Fix Any Issues
If tests fail, the AI will:
1. Analyze the error
2. Identify the problem
3. Apply a fix
4. Re-run tests

### Action 10: Start Server
Starts the development server and confirms it's running.

## Monitoring in VS Code

While the AI works, you'll see:

1. **Status Bar**: Shows active session and step count
2. **Output Channel**: Real-time logs of all actions
3. **Approval Dialogs**: For sensitive operations
4. **File Changes**: Files being created/edited in real-time

## Example Output

### Terminal Commands
```
[12:00:00] Executing: npm init -y
[12:00:02] ✅ Completed in 2000ms with exit code 0

[12:00:03] Executing: npm install express typescript
[12:00:15] ✅ Completed in 12000ms with exit code 0
```

### File Edits
```
[12:00:16] File edited: src/server.ts (45 lines, 150ms)
[12:00:16] Backup created: .aiBridge/backups/server.ts.2025-10-23T12-00-16.bak
```

### Test Results
```
[12:00:30] Running tests: npm test
[12:00:35] ✅ Tests completed in 5000ms
[12:00:35] Total: 4, Passed: 4, Failed: 0, Skipped: 0
```

## Handling Approvals

When the AI needs approval, you'll see a dialog:

```
AI Bridge wants to: Install Express framework

Command: npm install express typescript @types/express

Reason: Needed for building the API server

[Approve] [Deny] [View Details]
```

Click **Approve** to continue.

## Session Report

At the end, AI Bridge generates a report:

```markdown
# Session Report: 550e8400-e29b-41d4-a716-446655440000

**Goal:** Create Express.js API with user endpoints
**Status:** completed
**Started:** 2025-10-23T12:00:00Z
**Ended:** 2025-10-23T12:05:00Z

## Statistics

- Total steps: 10
- Successful: 10
- Failed: 0
- Total duration: 300s
- Files modified: 4

## Steps

1. ✅ **run** (2000ms)
2. ✅ **run** (12000ms)
3. ✅ **edit** (150ms)
4. ✅ **diagnostics** (500ms)
5. ✅ **edit** (200ms)
6. ✅ **run** (8000ms)
7. ✅ **edit** (100ms)
8. ✅ **test** (5000ms)
9. ✅ **run** (3000ms)
10. ✅ **status** (50ms)

## Modified Files

- src/server.ts
- src/server.test.ts
- tsconfig.json
- jest.config.js
```

## Testing the Result

After the AI completes:

1. Check the files created
2. Review the code
3. Run the server: `npm run dev`
4. Test the endpoints:

```bash
# Get users
curl http://localhost:3000/api/users

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## Next Steps

Continue the conversation with your AI:

```
Great! Now let's add:
1. User authentication with JWT
2. Database integration with MongoDB
3. API documentation with Swagger
4. Docker configuration

Continue using the AI Bridge.
```

The AI will continue building on the existing code!

## Troubleshooting

### Server Won't Start
```
Error: Port 3737 already in use
```
**Solution:** Change port in settings or stop other applications.

### Commands Timing Out
```
Error: Command timed out after 600 seconds
```
**Solution:** Increase timeout in settings: `"aiBridge.commandTimeout": 1200`

### Files Not Being Created
Check the Output Channel for errors:
1. **View** → **Output**
2. Select **AI Bridge Agent** from dropdown

### Tests Failing
The AI should automatically fix test failures. If not, manually review:
1. Check test output in Output Channel
2. Review error messages
3. Ask AI to investigate: "The tests are failing, please debug"

## Tips

1. **Be Specific**: Clearly describe what you want
2. **Incremental**: Let AI work step-by-step
3. **Verify**: Check results before continuing
4. **Trust**: The AI will handle errors
5. **Monitor**: Watch the Output Channel

---

**Congratulations! You've completed your first AI Bridge session! 🎉**

Now try building something more complex:
- Full-stack applications
- Microservices
- CI/CD pipelines
- Complex refactoring tasks
- Performance optimizations

The possibilities are endless!
