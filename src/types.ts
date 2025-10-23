// Message Protocol Types

export interface IncomingAction {
  sessionId: string;
  stepId: string;
  action: 'run' | 'edit' | 'test' | 'diagnostics' | 'preview' | 'status' | 'reset';
  payload: ActionPayload;
  requiresApproval?: boolean;
  metadata?: {
    description?: string;
    reasoning?: string;
  };
}

export interface ActionPayload {
  // For 'run' and 'test'
  command?: string;
  cwd?: string;
  timeout?: number;
  
  // For 'edit'
  file?: string;
  operation?: 'replace' | 'insert' | 'delete' | 'patch';
  content?: string;
  lineStart?: number;
  lineEnd?: number;
  
  // For 'preview'
  url?: string;
  actions?: BrowserAction[];
  captureScreenshot?: boolean;
  
  // For 'diagnostics'
  files?: string[];
}

export interface BrowserAction {
  type: 'goto' | 'click' | 'type' | 'wait' | 'screenshot';
  selector?: string;
  value?: string;
  timeout?: number;
}

export interface OutgoingResult {
  sessionId: string;
  stepId: string;
  success: boolean;
  action: string;
  result: ActionResult;
  error?: ErrorInfo;
  timestamp: string;
  needsApproval?: boolean;
  approvalGranted?: boolean;
}

export interface ActionResult {
  // For 'run' and 'test'
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  duration?: number;
  
  // For 'edit'
  filesModified?: string[];
  linesChanged?: number;
  
  // For 'diagnostics'
  errors?: Diagnostic[];
  warnings?: Diagnostic[];
  
  // For 'preview'
  screenshot?: string;
  httpStatus?: number;
  consoleErrors?: string[];
  
  // For 'status'
  workspaceRoot?: string;
  activeBranch?: string;
  dirtyFiles?: string[];
  openFiles?: string[];
  runningProcesses?: string[];
}

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
}

export interface ErrorContext {
  workingDirectory?: string;
  openFiles?: string[];
  recentChanges?: string[];
  diagnostics?: Diagnostic[];
  systemInfo?: SystemInfo;
}

export interface SystemInfo {
  platform: string;
  nodeVersion: string;
  vscodeVersion: string;
  workspaceType?: string;
}

// Session Types

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  steps: Step[];
  currentStep: number;
  maxSteps: number;
  workspaceRoot: string;
  backupPath: string;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  projectGoal?: string;
  framework?: string;
  language?: string;
}

export interface Step {
  id: string;
  action: string;
  payload: any;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: any;
  approved?: boolean;
  approvalTime?: Date;
}

// Execution Types

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  command: string;
}

export interface EditOperation {
  type: 'replace' | 'insert' | 'delete' | 'patch';
  file: string;
  content?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface EditResult {
  success: boolean;
  filesModified: string[];
  linesChanged: number;
  backupPath?: string;
}

export interface TestResult {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  failures: TestFailure[];
  duration: number;
}

export interface TestFailure {
  name: string;
  file: string;
  message: string;
  stack?: string;
}

export interface PreviewResult {
  success: boolean;
  screenshot?: string;
  httpStatus?: number;
  consoleErrors: string[];
  duration: number;
}

// Configuration Types

export interface BridgeConfig {
  version: string;
  server: ServerConfig;
  security: SecurityConfig;
  execution: ExecutionConfig;
  browser: BrowserConfig;
  logging: LoggingConfig;
  backup: BackupConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  enableWebSocket: boolean;
  cors: {
    enabled: boolean;
    origins: string[];
  };
}

export interface SecurityConfig {
  requireApproval: {
    fileOperations: boolean;
    commandExecution: boolean;
    networkAccess: boolean;
    dangerousCommands: boolean;
  };
  allowedCommands: string[];
  blockedCommands: string[];
  allowedPaths: string[];
  maxStepsPerSession: number;
  commandTimeout: number;
}

export interface ExecutionConfig {
  workingDirectory: string;
  shell: string;
  environment: Record<string, string>;
}

export interface BrowserConfig {
  enabled: boolean;
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
  defaultTimeout: number;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  maskCredentials: boolean;
  saveToFile: boolean;
  logPath: string;
}

export interface BackupConfig {
  enabled: boolean;
  path: string;
  maxBackups: number;
}

// Status Types

export type ServerStatus = 'idle' | 'running' | 'waiting' | 'error';

export interface BridgeStatus {
  serverRunning: boolean;
  port: number;
  sessionActive: boolean;
  currentSessionId?: string;
  stepCount: number;
  maxSteps: number;
}

// Security Types

export interface SanitizedCommand {
  original: string;
  sanitized: string;
  isSafe: boolean;
  warnings: string[];
}

export interface RateCounter {
  count: number;
  resetTime: Date;
}

// Error Types

export enum ErrorType {
  COMMAND_FAILED = 'COMMAND_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  APPROVAL_DENIED = 'APPROVAL_DENIED',
  MAX_STEPS_EXCEEDED = 'MAX_STEPS_EXCEEDED'
}

export interface RecoveryResult {
  attempted: boolean;
  successful: boolean;
  message?: string;
}
