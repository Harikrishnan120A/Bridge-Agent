import { v4 as uuidv4 } from 'uuid';
import { Session, Step, SessionMetadata } from '../types';
import { ConfigManager } from '../config/config-manager';
import { OutputManager } from '../ui/output-manager';
import * as path from 'path';
import * as fs from 'fs';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private currentSession: Session | null = null;
  private configManager: ConfigManager;
  private outputManager: OutputManager;

  constructor(configManager: ConfigManager, outputManager: OutputManager) {
    this.configManager = configManager;
    this.outputManager = outputManager;
  }

  createSession(goal?: string, metadata?: SessionMetadata): Session {
    const config = this.configManager.getConfig();
    const workspaceRoot = this.configManager.getWorkspaceRoot2();
    const sessionId = uuidv4();

    // Create backup directory for this session
    const backupPath = path.join(
      config.backup.path,
      sessionId
    );

    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const session: Session = {
      id: sessionId,
      startTime: new Date(),
      status: 'active',
      steps: [],
      currentStep: 0,
      maxSteps: config.security.maxStepsPerSession,
      workspaceRoot,
      backupPath,
      metadata: {
        projectGoal: goal,
        ...metadata
      }
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;

    this.outputManager.log(`📝 Session created: ${sessionId}`);
    if (goal) {
      this.outputManager.log(`Goal: ${goal}`);
    }

    return session;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  addStep(sessionId: string, step: Step): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check max steps limit
    if (session.steps.length >= session.maxSteps) {
      throw new Error(`Maximum steps (${session.maxSteps}) exceeded for session`);
    }

    session.steps.push(step);
    session.currentStep = session.steps.length;

    this.outputManager.logAction(step);
  }

  updateStep(sessionId: string, stepId: string, updates: Partial<Step>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const step = session.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in session ${sessionId}`);
    }

    Object.assign(step, updates);

    if (updates.endTime) {
      step.duration = updates.endTime.getTime() - step.startTime.getTime();
      this.outputManager.logResult(step);
    }
  }

  endSession(sessionId: string, status: 'completed' | 'failed' | 'cancelled'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = status;
    session.endTime = new Date();

    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }

    const duration = session.endTime.getTime() - session.startTime.getTime();
    const durationMinutes = Math.floor(duration / 60000);

    this.outputManager.log(`\n${'═'.repeat(80)}`);
    this.outputManager.log(`Session ${sessionId} ended: ${status.toUpperCase()}`);
    this.outputManager.log(`Duration: ${durationMinutes} minutes`);
    this.outputManager.log(`Steps completed: ${session.steps.length}/${session.maxSteps}`);
    this.outputManager.log(`${'═'.repeat(80)}\n`);

    // Generate and save report
    this.saveSessionReport(session);
  }

  getSessionReport(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const successfulSteps = session.steps.filter(s => !s.error).length;
    const failedSteps = session.steps.filter(s => s.error).length;
    const totalDuration = session.steps.reduce((sum, s) => sum + (s.duration || 0), 0);

    const modifiedFiles = new Set<string>();
    session.steps.forEach(step => {
      if (step.result?.filesModified) {
        step.result.filesModified.forEach((file: string) => modifiedFiles.add(file));
      }
    });

    let report = `# Session Report: ${session.id}\n\n`;
    report += `**Goal:** ${session.metadata.projectGoal || 'Not specified'}\n`;
    report += `**Status:** ${session.status}\n`;
    report += `**Started:** ${session.startTime.toISOString()}\n`;
    report += `**Ended:** ${session.endTime?.toISOString() || 'In progress'}\n\n`;

    report += `## Statistics\n\n`;
    report += `- Total steps: ${session.steps.length}\n`;
    report += `- Successful: ${successfulSteps}\n`;
    report += `- Failed: ${failedSteps}\n`;
    report += `- Total duration: ${Math.floor(totalDuration / 1000)}s\n`;
    report += `- Files modified: ${modifiedFiles.size}\n\n`;

    report += `## Steps\n\n`;
    session.steps.forEach((step, index) => {
      const status = step.error ? '❌' : '✅';
      report += `${index + 1}. ${status} **${step.action}** (${step.duration || 0}ms)\n`;
      if (step.error) {
        report += `   Error: ${step.error.message}\n`;
      }
    });

    if (modifiedFiles.size > 0) {
      report += `\n## Modified Files\n\n`;
      Array.from(modifiedFiles).forEach(file => {
        report += `- ${file}\n`;
      });
    }

    return report;
  }

  private saveSessionReport(session: Session): void {
    const report = this.getSessionReport(session.id);
    const reportPath = path.join(session.backupPath, 'session-report.md');

    try {
      fs.writeFileSync(reportPath, report);
      this.outputManager.log(`📄 Session report saved: ${reportPath}`);
    } catch (error) {
      this.outputManager.logError('Failed to save session report', error as Error);
    }
  }

  cleanupOldSessions(): void {
    const config = this.configManager.getConfig();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.endTime) {
        const age = now - session.endTime.getTime();
        if (age > maxAge) {
          this.sessions.delete(sessionId);
          this.outputManager.log(`Cleaned up old session: ${sessionId}`);
        }
      }
    }
  }
}
