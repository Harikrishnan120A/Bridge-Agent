import express, { Request, Response } from 'express';
import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingAction, OutgoingResult, BridgeStatus, Step } from '../types';
import { ConfigManager } from '../config/config-manager';
import { SessionManager } from '../session/session-manager';
import { OutputManager } from '../ui/output-manager';
import { ApprovalManager } from '../session/approval-manager';
import { CommandExecutor } from '../execution/command-executor';
import { FileEditor } from '../execution/file-editor';
import { TestRunner } from '../execution/test-runner';
import { DiagnosticsReader } from '../execution/diagnostics-reader';
import { BrowserAutomation } from '../execution/browser-automation';
import { RateLimiter } from '../security/rate-limiter';
import { CredentialMasker } from '../security/credential-masker';
import { v4 as uuidv4 } from 'uuid';

export class BridgeServer {
  private app: express.Application;
  private server: HTTPServer | null = null;
  private wss: WebSocketServer | null = null;
  private port: number;
  
  private configManager: ConfigManager;
  private sessionManager: SessionManager;
  private outputManager: OutputManager;
  private approvalManager: ApprovalManager;
  
  private commandExecutor: CommandExecutor;
  private fileEditor: FileEditor;
  private testRunner: TestRunner;
  private diagnosticsReader: DiagnosticsReader;
  private browserAutomation: BrowserAutomation;
  
  private rateLimiter: RateLimiter;
  private credentialMasker: CredentialMasker;
  
  private clients: Set<WebSocket> = new Set();

  constructor(
    port: number,
    configManager: ConfigManager,
    sessionManager: SessionManager,
    outputManager: OutputManager
  ) {
    this.port = port;
    this.configManager = configManager;
    this.sessionManager = sessionManager;
    this.outputManager = outputManager;
    
    // Initialize components
    this.approvalManager = new ApprovalManager(configManager, outputManager);
    this.commandExecutor = new CommandExecutor(configManager, outputManager, this.approvalManager);
    this.fileEditor = new FileEditor(configManager, outputManager);
    this.testRunner = new TestRunner(this.commandExecutor, outputManager);
    this.diagnosticsReader = new DiagnosticsReader(outputManager);
    this.browserAutomation = new BrowserAutomation(configManager, outputManager);
    this.rateLimiter = new RateLimiter();
    this.credentialMasker = new CredentialMasker();
    
    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '50mb' }));
    
    // CORS
    this.app.use((req: any, res: any, next: any) => {
      const config = this.configManager.getConfig();
      if (config.server.cors.enabled) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
      }
      next();
    });

    // Logging
    this.app.use((req: any, res: any, next: any) => {
      this.outputManager.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: any, res: any) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Get status
    this.app.get('/api/status', (req: any, res: any) => {
      res.json(this.getStatus());
    });

    // Submit action
    this.app.post('/api/action', async (req: any, res: any) => {
      try {
        const action: IncomingAction = req.body;
        const result = await this.handleAction(action);
        res.json(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: errorMessage });
      }
    });

    // Session management
    this.app.post('/api/session/start', (req: any, res: any) => {
      const { goal, metadata } = req.body;
      const session = this.sessionManager.createSession(goal, metadata);
      res.json({ sessionId: session.id });
    });

    this.app.post('/api/session/end', (req: any, res: any) => {
      const { sessionId, status } = req.body;
      this.sessionManager.endSession(sessionId, status || 'completed');
      res.json({ success: true });
    });

    this.app.get('/api/session/:id', (req: any, res: any) => {
      const session = this.sessionManager.getSession(req.params.id);
      if (session) {
        res.json(session);
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    });

    this.app.delete('/api/session/:id', (req, res) => {
      const session = this.sessionManager.getSession(req.params.id);
      if (session) {
        this.sessionManager.endSession(req.params.id, 'cancelled');
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    });
  }

  private async handleAction(action: IncomingAction): Promise<OutgoingResult> {
    const startTime = Date.now();

    try {
      // Rate limiting
      await this.rateLimiter.checkLimit('actionsPerMinute', action.sessionId);

      // Create step
      const step: Step = {
        id: action.stepId,
        action: action.action,
        payload: action.payload,
        startTime: new Date()
      };

      // Add to session
      this.sessionManager.addStep(action.sessionId, step);

      // Broadcast to WebSocket clients
      this.broadcast('action.executing', { sessionId: action.sessionId, stepId: action.stepId });

      // Check if approval needed
      if (this.approvalManager.requiresApproval(action)) {
        const approved = await this.approvalManager.requestApproval(action);
        
        if (!approved) {
          step.error = { code: 'APPROVAL_DENIED', message: 'User denied approval' };
          step.endTime = new Date();
          this.sessionManager.updateStep(action.sessionId, action.stepId, step);

          return {
            sessionId: action.sessionId,
            stepId: action.stepId,
            success: false,
            action: action.action,
            result: {},
            error: step.error,
            timestamp: new Date().toISOString(),
            approvalGranted: false
          };
        }

        step.approved = true;
        step.approvalTime = new Date();
      }

      // Execute action
      const result = await this.executeAction(action);

      // Update step
      step.endTime = new Date();
      step.result = result.result;
      if (!result.success) {
        step.error = result.error;
      }
      this.sessionManager.updateStep(action.sessionId, action.stepId, step);

      // Broadcast completion
      this.broadcast('action.completed', { 
        sessionId: action.sessionId, 
        stepId: action.stepId,
        success: result.success
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputManager.logError(`Action failed: ${errorMessage}`);

      this.broadcast('action.failed', {
        sessionId: action.sessionId,
        stepId: action.stepId,
        error: errorMessage
      });

      return {
        sessionId: action.sessionId,
        stepId: action.stepId,
        success: false,
        action: action.action,
        result: {},
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  private async executeAction(action: IncomingAction): Promise<OutgoingResult> {
    const config = this.configManager.getConfig();
    const workspaceRoot = this.configManager.getWorkspaceRoot2();

    switch (action.action) {
      case 'run': {
        const result = await this.commandExecutor.execute(
          action.payload.command || '',
          action.payload.cwd || workspaceRoot,
          action.payload.timeout || config.security.commandTimeout
        );

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: result.success,
          action: 'run',
          result: {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            duration: result.duration
          },
          timestamp: new Date().toISOString()
        };
      }

      case 'test': {
        const testResult = await this.testRunner.runTests(
          action.payload.command || '',
          action.payload.cwd || workspaceRoot,
          action.payload.timeout || config.security.commandTimeout
        );

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: testResult.success,
          action: 'test',
          result: testResult,
          timestamp: new Date().toISOString()
        };
      }

      case 'edit': {
        const editResult = await this.fileEditor.edit({
          type: action.payload.operation || 'replace',
          file: action.payload.file || '',
          content: action.payload.content,
          lineStart: action.payload.lineStart,
          lineEnd: action.payload.lineEnd
        });

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: editResult.success,
          action: 'edit',
          result: editResult,
          timestamp: new Date().toISOString()
        };
      }

      case 'diagnostics': {
        const diagnostics = await this.diagnosticsReader.getDiagnostics(action.payload.files);
        const { errors, warnings } = await this.diagnosticsReader.getErrorsAndWarnings();

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: true,
          action: 'diagnostics',
          result: { errors, warnings },
          timestamp: new Date().toISOString()
        };
      }

      case 'preview': {
        const previewResult = await this.browserAutomation.preview(
          action.payload.url || '',
          action.payload.actions || [],
          action.payload.captureScreenshot !== false
        );

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: previewResult.success,
          action: 'preview',
          result: previewResult,
          timestamp: new Date().toISOString()
        };
      }

      case 'status': {
        const status = this.getStatus();

        return {
          sessionId: action.sessionId,
          stepId: action.stepId,
          success: true,
          action: 'status',
          result: status,
          timestamp: new Date().toISOString()
        };
      }

      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  getStatus(): BridgeStatus {
    const session = this.sessionManager.getCurrentSession();

    return {
      serverRunning: this.server !== null,
      port: this.port,
      sessionActive: session !== null,
      currentSessionId: session?.id,
      stepCount: session?.steps.length || 0,
      maxSteps: session?.maxSteps || 0
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          this.outputManager.log(`HTTP server listening on port ${this.port}`);
          
          // Start WebSocket server
          this.startWebSocketServer();
          
          resolve();
        });

        this.server.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private startWebSocketServer(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.outputManager.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.outputManager.log(`WebSocket message: ${data.type}`);

          // Handle WebSocket messages
          if (data.type === 'action.submit') {
            const result = await this.handleAction(data.action);
            ws.send(JSON.stringify({ type: 'action.result', result }));
          }

        } catch (error) {
          this.outputManager.logError('WebSocket message error', error as Error);
        }
      });

      ws.on('close', () => {
        this.outputManager.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to AI Bridge Agent',
        timestamp: new Date().toISOString()
      }));
    });

    this.outputManager.log('WebSocket server started');
  }

  private broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close WebSocket connections
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();

      // Close WebSocket server
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }

      // Close HTTP server
      if (this.server) {
        this.server.close(() => {
          this.outputManager.log('Server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }

      // Cleanup
      this.browserAutomation.dispose();
      this.commandExecutor.dispose();
      this.rateLimiter.dispose();
    });
  }
}
