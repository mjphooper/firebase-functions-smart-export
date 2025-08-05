import { runContext } from './run_context.js';
/* istanbul ignore file */
import chalk, { ChalkInstance } from 'chalk';

const LOG_PREFIX = '[firebase-functions-smart-export]';

/**
 * Returns the given message with the given color and preceeded by an identifying prefix.
 */
function outputWithStyle(message: string, chalkColor?: ChalkInstance): string {
  const styledMessage = chalkColor ? chalkColor(message) : message;
  return `${LOG_PREFIX} ${styledMessage}`;
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
  log: (message: string) => {
    if (!runContext.isTest) console.log(outputWithStyle(message));
  },
  info: (message: string) => {
    if (!runContext.isTest) console.log(outputWithStyle(`INFO: ${message}`, chalk.blue));
  },
  warn: (message: string) => {
    if (!runContext.isTest) console.warn(outputWithStyle(`WARNING: ${message}`, chalk.yellow));
  },
  error: (message: string) => {
    if (!runContext.isTest) console.error(outputWithStyle(`ERROR: ${message}`, chalk.red));
  },
  success: (message: string) => {
    if (!runContext.isTest) console.log(outputWithStyle(`${message}`, chalk.green));
  },
};
