interface OutputOptions {
    skipPrefix?: boolean;
}
/**
 * Provides color-coded and prefixed logging methods for console output.
 *
 * All messages are prefixed with a standard package identifier, and each method applies a consistent color and label:
 *
 * - `log`: Unstyled general log message.
 * - `info`: Informational message in blue, prefixed with "INFO:".
 * - `warn`: Warning message in yellow, prefixed with "WARNING:".
 * - `error`: Error message in red, prefixed with "ERROR:".
 * - `success`: Success message in green.
 *
 * Intended for use throughout the CLI for standardized and readable terminal output.
 *
 * istanbul ignore next
 */
export declare const styledConsoleOutput: {
    log: (message: string, options?: OutputOptions) => void;
    info: (message: string, options?: OutputOptions) => void;
    warn: (message: string, options?: OutputOptions) => void;
    error: (message: string, options?: OutputOptions) => void;
    success: (message: string, options?: OutputOptions) => void;
};
export {};
