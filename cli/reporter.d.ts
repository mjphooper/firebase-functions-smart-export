import { Config } from '../shared/types/config.js';
import type { ValidatedFunction } from './validate_functions.js';
/**
 * Handles all CLI output and reporting.
 */
export declare class Reporter {
    private verbose;
    constructor(verbose: boolean);
    started(): void;
    customConfigLoaded(config: Config): void;
    searchStarted(config: Config): void;
    filesFound(files: string[]): void;
    functionsValidated(functions: ValidatedFunction[]): void;
    sourcePathResolved(sourcePath: string): void;
    dryRunComplete(functionCount: number): void;
    noFunctionsFound(): void;
    success(functionCount: number, startTime: number): void;
    error(error: unknown): void;
}
