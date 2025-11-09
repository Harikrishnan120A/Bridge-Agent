# 🚀 AI Bridge Agent - Quick Test & First Project Prompt

Copy this prompt to test your AI Bridge Agent and build your first project!

---

## 📋 PASTE THIS TO YOUR AI CHAT (ChatGPT/Claude/Gemini)

```
I have AI Bridge Agent running on http://localhost:3737

SYSTEM CONTEXT:
You are helping me test and use AI Bridge Agent, a VS Code extension that bridges 
between you (AI) and my local development environment.

HOW IT WORKS:
1. You give me JSON actions to execute
2. I run them via: curl -X POST http://localhost:3737/api/action -H "Content-Type: application/json" -d '{...}'
3. I paste the result back to you
4. You analyze and give me the next action
5. We loop until the project is complete

AVAILABLE ACTIONS:
- "status": Get workspace information
- "run": Execute terminal commands
- "edit": Create/modify files
- "test": Run test suites
- "diagnostics": Check for errors/warnings
- "preview": Launch browser and verify UI

ACTION FORMAT:
{
  "sessionId": "project-name-001",
  "stepId": "step-N",
  "action": "status|run|edit|test|diagnostics|preview",
  "payload": { /* action-specific data */ },
  "metadata": {
    "description": "What this step does",
    "reasoning": "Why this step is needed"
  }
}

YOUR RULES:
✅ Always start with a "status" action to check workspace
✅ Give ONE action at a time and wait for my result
✅ Include description and reasoning in metadata
✅ Verify results before proceeding to next step
✅ Handle errors gracefully with recovery actions
✅ Be incremental - small steps, not big jumps
✅ Celebrate when we complete the project!

PROJECT GOAL:
Build a simple Node.js Express API with these endpoints:
- GET /hello - Returns { message: "Hello World", timestamp: "..." }
- GET /status - Returns { status: "ok", uptime: 123 }
- POST /echo - Returns whatever JSON body you send

REQUIREMENTS:
- Use Express.js
- Add basic error handling
- Include package.json
- Server should run on port 3000
- Clean, readable code

SUCCESS CRITERIA:
✅ All endpoints work correctly
✅ Server starts without errors
✅ Browser preview confirms it's working

Please give me STEP 0 (status check) to begin!
```

---

## 🎯 ALTERNATIVE: Custom Project Prompt

If you want to build something else, use this template:

```
I have AI Bridge Agent running on http://localhost:3737

SYSTEM CONTEXT:
[Copy the system context from above]

PROJECT GOAL:
[Describe what you want to build]

Examples:
- "A React todo app with TypeScript and local storage"
- "A Python Flask API with SQLite database"
- "A static website with HTML/CSS/JS and Tailwind"
- "A Go HTTP server with JSON endpoints"

REQUIREMENTS:
[List your specific requirements]

Examples:
- Use TypeScript
- Include unit tests
- Add authentication
- Use specific libraries/frameworks
- Follow certain patterns

SUCCESS CRITERIA:
[What defines "done"?]

Examples:
✅ All features working
✅ Tests passing
✅ No linting errors
✅ Browser preview shows correct UI
✅ Server responds to all endpoints

Please give me STEP 0 (status check) to begin!
```

---

## ⚡ SUPER QUICK TEST (30 seconds)

If you just want to verify the bridge works, paste this:

```
I have AI Bridge Agent running on http://localhost:3737

Quick test: Give me a "status" action to verify the bridge is working.
Use sessionId "quick-test-001" and stepId "step-0".
```

---

## 🎓 LEARNING MODE PROMPT

Want to learn how the bridge works while building? Use this:

```
I have AI Bridge Agent running on http://localhost:3737

LEARNING MODE: I want to understand how this works while building.

For each action you give me:
1. Explain what the action will do
2. Explain why this step is necessary
3. Tell me what to expect in the result
4. After I paste the result, explain what happened

PROJECT: Let's build a simple "Hello World" Express API

Please give me STEP 0 with detailed explanations!
```

---

## 🔥 ADVANCED: Multi-Feature Project

For a more complex project:

```
I have AI Bridge Agent running on http://localhost:3737

ADVANCED PROJECT:
Build a full-stack Todo application:

BACKEND (Node.js + Express):
- GET /api/todos - List all todos
- POST /api/todos - Create todo
- PUT /api/todos/:id - Update todo
- DELETE /api/todos/:id - Delete todo
- Use JSON file for storage (todos.json)

FRONTEND (React + TypeScript):
- Todo list component
- Add todo form
- Mark complete functionality
- Delete functionality
- Use Tailwind CSS for styling

TESTING:
- Unit tests for API endpoints
- React component tests

REQUIREMENTS:
- TypeScript for both frontend and backend
- Proper error handling
- Input validation
- Responsive design
- Clean code architecture

SUCCESS CRITERIA:
✅ All API endpoints working
✅ Frontend renders correctly
✅ Can add/edit/delete todos
✅ Tests passing
✅ No TypeScript errors
✅ Browser preview shows working app

Break this into ~20-30 steps and guide me through!

Please give me STEP 0 (status check) to begin!
```

---

## 📝 PROMPT TEMPLATES BY LANGUAGE/FRAMEWORK

### Python + Flask
```
PROJECT: Build a Flask API with these endpoints:
- GET /api/users - List users
- POST /api/users - Create user
- GET /api/users/:id - Get single user
Use SQLite for storage.

REQUIREMENTS:
- Python 3.x
- Flask + Flask-CORS
- SQLAlchemy for DB
- Include requirements.txt
- Add basic validation

Please give me STEP 0 to begin!
```

### React + TypeScript
```
PROJECT: Build a Weather Dashboard:
- Fetch weather from API
- Display current weather
- 5-day forecast
- City search
- Responsive design

TECH STACK:
- React 18
- TypeScript
- Tailwind CSS
- Axios for API calls

Please give me STEP 0 to begin!
```

### Go + HTTP Server
```
PROJECT: Build a Go REST API:
- GET /api/items - List items
- POST /api/items - Create item
- PUT /api/items/:id - Update item
- DELETE /api/items/:id - Delete item

REQUIREMENTS:
- Standard library HTTP server
- JSON responses
- In-memory storage
- Proper error handling

Please give me STEP 0 to begin!
```

---

## 🎯 RECOMMENDED: START WITH THIS

For your first test, I recommend this simple prompt:

```
I have AI Bridge Agent running on http://localhost:3737

QUICK PROJECT: Build a simple Express API (5-10 steps)

GOAL: Create server.js with:
- GET /hello → { message: "Hello World" }
- GET /status → { status: "ok", timestamp: "..." }
- Server runs on port 3000

Keep it simple - just these basics to verify the bridge works!

Give me STEP 0 (status check) to begin!
```

---

## 💡 TIPS FOR BEST RESULTS

1. **Start Small**: Test with a simple project first
2. **Be Specific**: Clear requirements = better results
3. **Include Success Criteria**: AI knows when to stop
4. **Ask for Explanations**: If you want to learn along the way
5. **One Feature at a Time**: Don't overwhelm the AI

---

## 🚀 READY TO GO!

**Copy one of the prompts above** → **Paste to your AI chat** → **Follow the steps**!

The AI will give you JSON actions, you execute them, paste results back, and watch your project come to life! 🎉

---

## 📞 NEED HELP?

If something doesn't work:
1. Check VS Code Output panel: "AI Bridge Agent"
2. Verify server is running: `curl http://localhost:3737/api/status`
3. Check for error messages in the result JSON
4. Paste the error back to the AI - it will help you fix it!
