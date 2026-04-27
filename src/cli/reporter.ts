import { styledConsoleOutput } from './styled_console_log.js';
import { Config } from './types/config.js';
import type { ValidatedFunction } from './validate_functions.js';

/**
 * Handles all CLI output and reporting.
 */
export class Reporter {
  constructor(private verbose: boolean) { }

  started(): void {
    styledConsoleOutput.info(
      '⚡️ Running Firebase Functions Smart Export (FFSE)...',
      { skipPrefix: true },
    );
  }

  customConfigLoaded(config: Config): void {
    if (!this.verbose) return;

    const hasCustomConfig = Object.keys(config).length > 0;
    if (hasCustomConfig) {
      styledConsoleOutput.info('⚙️ Custom config loaded from ffse.config.js');
    }
  }

  searchStarted(config: Config): void {
    if (!this.verbose) return;

    const sourceDir = config.sourceDir ?? 'src';
    const outDir = config.outDir ?? 'lib';
    const matchExtension = config.matchExtension ?? 'function';

    styledConsoleOutput.info(
      `Searching for .${matchExtension} files in ${sourceDir}/, outputting to ${outDir}/`
    );
  }

  filesFound(files: string[]): void {
    if (!this.verbose) return;
    styledConsoleOutput.info(`${files.length} function(s) found.`);
    for (const file of files) {
      styledConsoleOutput.info(file);
    }
  }

  functionsValidated(functions: ValidatedFunction[]): void {
    if (!this.verbose) return;

    for (const fn of functions) {
      styledConsoleOutput.info(`${fn.functionId} (from "${fn.filePath}")`);
    }
  }

  sourcePathResolved(sourcePath: string): void {
    styledConsoleOutput.info(`Resolved source code path to: ${sourcePath}`);
  }

  dryRunComplete(functionCount: number): void {
    styledConsoleOutput.success(`Dry run complete! ${functionCount} function(s) found to export.`);
  }

  noFunctionsFound(): void {
    styledConsoleOutput.warn('No functions found to export. Skipping file generation.');
  }

  success(functionCount: number, startTime: number): void {
    const timing = this.verbose
      ? ` in ${Math.round(performance.now() - startTime)}ms`
      : '';
    styledConsoleOutput.success(`[ffse] ✅ Success! Exported ${functionCount} function(s)${timing}`);
  }

  error(error: unknown): void {
    styledConsoleOutput.error(`${error instanceof Error ? error.stack : error}`);
  }
}
