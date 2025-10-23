import { chromium, Browser, Page, Browser as PlaywrightBrowser } from 'playwright';
import { BrowserAction, PreviewResult } from '../types';
import { ConfigManager } from '../config/config-manager';
import { OutputManager } from '../ui/output-manager';

export class BrowserAutomation {
  private browser: PlaywrightBrowser | null = null;
  private configManager: ConfigManager;
  private outputManager: OutputManager;

  constructor(configManager: ConfigManager, outputManager: OutputManager) {
    this.configManager = configManager;
    this.outputManager = outputManager;
  }

  async initialize(): Promise<void> {
    if (this.browser) {
      return; // Already initialized
    }

    try {
      const config = this.configManager.getConfig();
      
      this.outputManager.log('Launching browser...');
      
      this.browser = await chromium.launch({
        headless: config.browser.headless,
        timeout: 30000
      });

      this.outputManager.log('✅ Browser launched successfully');

    } catch (error) {
      this.outputManager.logError('Failed to launch browser', error as Error);
      throw error;
    }
  }

  async preview(url: string, actions: BrowserAction[] = [], captureScreenshot: boolean = true): Promise<PreviewResult> {
    const startTime = Date.now();

    try {
      // Ensure browser is initialized
      await this.initialize();

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const config = this.configManager.getConfig();
      const page = await this.browser.newPage({
        viewport: config.browser.viewport
      });

      const consoleErrors: string[] = [];

      // Capture console errors
      page.on('console', (msg: any) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Capture page errors
      page.on('pageerror', (error: Error) => {
        consoleErrors.push(error.message);
      });

      this.outputManager.log(`Navigating to: ${url}`);

      // Navigate to URL
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.browser.defaultTimeout
      });

      const httpStatus = response?.status() || 0;

      // Execute actions
      for (const action of actions) {
        await this.executeAction(page, action);
      }

      // Capture screenshot
      let screenshot: string | undefined;
      if (captureScreenshot) {
        this.outputManager.log('Capturing screenshot...');
        const buffer = await page.screenshot({
          fullPage: true,
          type: 'png'
        });
        screenshot = buffer.toString('base64');
      }

      await page.close();

      const duration = Date.now() - startTime;

      this.outputManager.log(`✅ Preview completed in ${duration}ms`);

      return {
        success: true,
        screenshot,
        httpStatus,
        consoleErrors,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.outputManager.logError(`Preview failed: ${errorMessage}`);

      return {
        success: false,
        consoleErrors: [errorMessage],
        duration
      };
    }
  }

  private async executeAction(page: Page, action: BrowserAction): Promise<void> {
    this.outputManager.log(`Executing browser action: ${action.type}`);

    try {
      switch (action.type) {
        case 'goto':
          if (action.value) {
            await page.goto(action.value, { waitUntil: 'networkidle' });
          }
          break;

        case 'click':
          if (action.selector) {
            await page.click(action.selector, { timeout: action.timeout });
          }
          break;

        case 'type':
          if (action.selector && action.value) {
            await page.fill(action.selector, action.value);
          }
          break;

        case 'wait':
          const waitTime = action.timeout || 1000;
          await page.waitForTimeout(waitTime);
          break;

        case 'screenshot':
          // Screenshot will be captured at the end
          break;

        default:
          this.outputManager.logWarning(`Unknown browser action: ${action.type}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputManager.logWarning(`Browser action failed: ${errorMessage}`);
      // Don't throw - continue with other actions
    }
  }

  async checkHealth(url: string): Promise<{ healthy: boolean; status: number }> {
    try {
      await this.initialize();

      if (!this.browser) {
        return { healthy: false, status: 0 };
      }

      const page = await this.browser.newPage();
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const status = response?.status() || 0;
      const healthy = status >= 200 && status < 400;

      await page.close();

      return { healthy, status };

    } catch (error) {
      return { healthy: false, status: 0 };
    }
  }

  async dispose(): Promise<void> {
    if (this.browser) {
      this.outputManager.log('Closing browser...');
      await this.browser.close();
      this.browser = null;
      this.outputManager.log('Browser closed');
    }
  }
}
