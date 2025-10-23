import { TestResult, TestFailure } from '../types';
import { CommandExecutor } from './command-executor';
import { OutputManager } from '../ui/output-manager';

export class TestRunner {
  private commandExecutor: CommandExecutor;
  private outputManager: OutputManager;

  constructor(commandExecutor: CommandExecutor, outputManager: OutputManager) {
    this.commandExecutor = commandExecutor;
    this.outputManager = outputManager;
  }

  async runTests(command: string, cwd: string, timeout: number = 300): Promise<TestResult> {
    const startTime = Date.now();

    try {
      this.outputManager.log(`Running tests: ${command}`);

      // Execute test command
      const result = await this.commandExecutor.execute(command, cwd, timeout);

      // Parse test output
      const framework = this.detectFramework(command);
      const parsed = this.parseTestOutput(result.stdout + result.stderr, framework);

      const duration = Date.now() - startTime;

      return {
        success: result.exitCode === 0,
        total: parsed.total,
        passed: parsed.passed,
        failed: parsed.failed,
        skipped: parsed.skipped,
        failures: parsed.failures,
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputManager.logError(`Test execution failed: ${errorMessage}`);

      return {
        success: false,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        failures: [],
        duration: Date.now() - startTime
      };
    }
  }

  private detectFramework(command: string): string {
    if (command.includes('jest')) return 'jest';
    if (command.includes('mocha')) return 'mocha';
    if (command.includes('pytest')) return 'pytest';
    if (command.includes('go test')) return 'go';
    if (command.includes('cargo test')) return 'rust';
    if (command.includes('npm test') || command.includes('yarn test')) return 'npm';
    
    return 'generic';
  }

  private parseTestOutput(output: string, framework: string): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    failures: TestFailure[];
  } {
    switch (framework) {
      case 'jest':
        return this.parseJestOutput(output);
      
      case 'pytest':
        return this.parsePytestOutput(output);
      
      case 'go':
        return this.parseGoTestOutput(output);
      
      default:
        return this.parseGenericOutput(output);
    }
  }

  private parseJestOutput(output: string): ReturnType<TestRunner['parseTestOutput']> {
    const failures: TestFailure[] = [];
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Parse summary line: "Tests: 1 failed, 2 passed, 3 total"
    const summaryMatch = output.match(/Tests:\s+(?:(\d+)\s+failed,?\s*)?(?:(\d+)\s+skipped,?\s*)?(?:(\d+)\s+passed,?\s*)?(\d+)\s+total/i);
    if (summaryMatch) {
      failed = parseInt(summaryMatch[1] || '0');
      skipped = parseInt(summaryMatch[2] || '0');
      passed = parseInt(summaryMatch[3] || '0');
      total = parseInt(summaryMatch[4] || '0');
    }

    // Parse failure details
    const failureRegex = /●\s+(.+?)\n\n\s+(.+?)\n\n/gs;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      failures.push({
        name: match[1].trim(),
        file: 'unknown',
        message: match[2].trim(),
        stack: undefined
      });
    }

    return { total, passed, failed, skipped, failures };
  }

  private parsePytestOutput(output: string): ReturnType<TestRunner['parseTestOutput']> {
    const failures: TestFailure[] = [];
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Parse summary line: "5 passed, 1 failed, 2 skipped in 1.23s"
    const summaryMatch = output.match(/(?:(\d+)\s+passed)?(?:,\s*(\d+)\s+failed)?(?:,\s*(\d+)\s+skipped)?/i);
    if (summaryMatch) {
      passed = parseInt(summaryMatch[1] || '0');
      failed = parseInt(summaryMatch[2] || '0');
      skipped = parseInt(summaryMatch[3] || '0');
      total = passed + failed + skipped;
    }

    // Parse failure details
    const failureRegex = /FAILED\s+(.+?)::.+?\s+-\s+(.+?)\n/g;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      failures.push({
        name: match[0],
        file: match[1],
        message: match[2],
        stack: undefined
      });
    }

    return { total, passed, failed, skipped, failures };
  }

  private parseGoTestOutput(output: string): ReturnType<TestRunner['parseTestOutput']> {
    const failures: TestFailure[] = [];
    let total = 0;
    let passed = 0;
    let failed = 0;

    // Count PASS and FAIL
    const passMatches = output.match(/--- PASS:/g);
    const failMatches = output.match(/--- FAIL:/g);

    passed = passMatches ? passMatches.length : 0;
    failed = failMatches ? failMatches.length : 0;
    total = passed + failed;

    // Parse failures
    const failureRegex = /--- FAIL:\s+(\S+)\s+\([\d.]+s\)\n\s+(.+)/g;
    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      failures.push({
        name: match[1],
        file: 'unknown',
        message: match[2],
        stack: undefined
      });
    }

    return { total, passed, failed, skipped: 0, failures };
  }

  private parseGenericOutput(output: string): ReturnType<TestRunner['parseTestOutput']> {
    // Try to extract numbers from output
    const passMatch = output.match(/(\d+)\s+pass(?:ed)?/i);
    const failMatch = output.match(/(\d+)\s+fail(?:ed)?/i);
    const skipMatch = output.match(/(\d+)\s+skip(?:ped)?/i);

    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;
    const total = passed + failed + skipped;

    return {
      total,
      passed,
      failed,
      skipped,
      failures: []
    };
  }
}
