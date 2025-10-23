import * as vscode from 'vscode';
import { BridgeServer } from './server/bridge-server';
import { StatusBarManager } from './ui/status-bar';
import { OutputManager } from './ui/output-manager';
import { ConfigManager } from './config/config-manager';
import { SessionManager } from './session/session-manager';

let bridgeServer: BridgeServer | undefined;
let statusBar: StatusBarManager;
let outputManager: OutputManager;
let configManager: ConfigManager;
let sessionManager: SessionManager;

export async function activate(context: vscode.ExtensionContext) {
  console.log('AI Bridge Agent is now active');

  // Initialize managers
  outputManager = new OutputManager();
  configManager = new ConfigManager(context);
  sessionManager = new SessionManager(configManager, outputManager);
  statusBar = new StatusBarManager();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.start', async () => {
      await startServer(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.stop', async () => {
      await stopServer();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.status', () => {
      showStatus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.configure', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'aiBridge');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.cancelSession', async () => {
      await cancelCurrentSession();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiBridge.openDashboard', () => {
      outputManager.show();
      vscode.window.showInformationMessage('Dashboard feature coming soon!');
    })
  );

  // Initialize status bar
  statusBar.show('idle');

  // Show welcome message
  const shouldAutoStart = configManager.get<boolean>('autoStart', false);
  if (shouldAutoStart) {
    await startServer(context);
  } else {
    const action = await vscode.window.showInformationMessage(
      'AI Bridge Agent is ready. Start the server to accept connections from external AI.',
      'Start Server',
      'Configure'
    );

    if (action === 'Start Server') {
      await startServer(context);
    } else if (action === 'Configure') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'aiBridge');
    }
  }

  outputManager.log('AI Bridge Agent activated successfully');
}

async function startServer(context: vscode.ExtensionContext) {
  if (bridgeServer) {
    vscode.window.showWarningMessage('AI Bridge server is already running');
    return;
  }

  try {
    const port = configManager.get<number>('serverPort', 3737);
    
    statusBar.show('running');
    outputManager.log(`Starting AI Bridge server on port ${port}...`);

    bridgeServer = new BridgeServer(
      port,
      configManager,
      sessionManager,
      outputManager
    );

    await bridgeServer.start();

    const connectionUrl = `http://localhost:${port}`;
    outputManager.log(`✅ Server started successfully at ${connectionUrl}`);
    
    vscode.window.showInformationMessage(
      `AI Bridge server running at ${connectionUrl}`,
      'Copy URL',
      'Show Logs'
    ).then((action: string | undefined) => {
      if (action === 'Copy URL') {
        vscode.env.clipboard.writeText(connectionUrl);
        vscode.window.showInformationMessage('URL copied to clipboard');
      } else if (action === 'Show Logs') {
        outputManager.show();
      }
    });

  } catch (error) {
    statusBar.show('error');
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputManager.log(`❌ Failed to start server: ${errorMessage}`);
    vscode.window.showErrorMessage(`Failed to start AI Bridge: ${errorMessage}`);
  }
}

async function stopServer() {
  if (!bridgeServer) {
    vscode.window.showInformationMessage('AI Bridge server is not running');
    return;
  }

  try {
    statusBar.show('idle');
    outputManager.log('Stopping AI Bridge server...');

    await bridgeServer.stop();
    bridgeServer = undefined;

    outputManager.log('✅ Server stopped successfully');
    vscode.window.showInformationMessage('AI Bridge server stopped');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    outputManager.log(`❌ Error stopping server: ${errorMessage}`);
    vscode.window.showErrorMessage(`Error stopping server: ${errorMessage}`);
  }
}

function showStatus() {
  if (!bridgeServer) {
    vscode.window.showInformationMessage(
      'AI Bridge Status: Server not running',
      'Start Server'
    ).then((action: string | undefined) => {
      if (action === 'Start Server') {
        vscode.commands.executeCommand('aiBridge.start');
      }
    });
    return;
  }

  const status = bridgeServer.getStatus();
  const session = sessionManager.getCurrentSession();

  let message = `AI Bridge Status:\n` +
    `• Server: Running on port ${status.port}\n` +
    `• Session: ${status.sessionActive ? 'Active' : 'None'}\n`;

  if (session) {
    message += `• Steps: ${status.stepCount}/${status.maxSteps}\n` +
      `• Session ID: ${session.id}`;
  }

  vscode.window.showInformationMessage(message, 'Show Logs', 'Stop Server')
    .then((action: string | undefined) => {
      if (action === 'Show Logs') {
        outputManager.show();
      } else if (action === 'Stop Server') {
        vscode.commands.executeCommand('aiBridge.stop');
      }
    });
}

async function cancelCurrentSession() {
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    vscode.window.showInformationMessage('No active session to cancel');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    `Cancel session "${session.id}"? This will stop all ongoing operations.`,
    { modal: true },
    'Cancel Session',
    'Keep Running'
  );

  if (confirm === 'Cancel Session') {
    sessionManager.endSession(session.id, 'cancelled');
    outputManager.log(`Session ${session.id} cancelled by user`);
    vscode.window.showInformationMessage('Session cancelled');
  }
}

export function deactivate() {
  if (bridgeServer) {
    bridgeServer.stop();
  }
  outputManager.log('AI Bridge Agent deactivated');
}
