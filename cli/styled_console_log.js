/* istanbul ignore file */
const LOG_PREFIX = '[firebase-functions-smart-export]';
const ANSI_CODES = {
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    green: '\x1b[32m',
};
function applyColor(message, color) {
    const resetColor = '\x1b[0m';
    return color ? `${ANSI_CODES[color]}${message}${resetColor}` : message;
}
/**
 * Returns the given message with the given color and optionally preceeded by an identifying prefix.
 */
function outputWithStyle(message, color, options = {}) {
    const styledMessage = applyColor(message, color);
    return options.skipPrefix ? styledMessage : `${LOG_PREFIX} ${styledMessage}`;
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
export const styledConsoleOutput = {
    log: (message, options) => {
        if (process.env.NODE_ENV !== 'test')
            console.log(outputWithStyle(message, undefined, options));
    },
    info: (message, options) => {
        if (process.env.NODE_ENV !== 'test')
            console.log(outputWithStyle(`INFO: ${message}`, 'blue', options));
    },
    warn: (message, options) => {
        if (process.env.NODE_ENV !== 'test')
            console.warn(outputWithStyle(`WARNING: ${message}`, 'yellow', options));
    },
    error: (message, options) => {
        if (process.env.NODE_ENV !== 'test')
            console.error(outputWithStyle(`ERROR: ${message}`, 'red', options));
    },
    success: (message, options) => {
        if (process.env.NODE_ENV !== 'test')
            console.log(outputWithStyle(message, 'green', options));
    },
};
