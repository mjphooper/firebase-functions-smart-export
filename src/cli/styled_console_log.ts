/* istanbul ignore file */

import chalk from 'chalk';

const LOG_PREFIX = '[firebase-functions-smart-export]';

interface OutputOptions {
  skipPrefix?: boolean;
}

function withPrefix(message: string, options: OutputOptions = {}): string {
  return options.skipPrefix ? message : `${LOG_PREFIX} ${message}`;
}

export const styledConsoleOutput = {
  log: (message: string, options?: OutputOptions) => {
    if (process.env.NODE_ENV !== 'test') console.log(withPrefix(message, options));
  },
  info: (message: string, options?: OutputOptions) => {
    if (process.env.NODE_ENV !== 'test') console.log(chalk.blue(withPrefix(`INFO: ${message}`, options)));
  },
  warn: (message: string, options?: OutputOptions) => {
    if (process.env.NODE_ENV !== 'test') console.warn(chalk.yellow(withPrefix(`WARNING: ${message}`, options)));
  },
  error: (message: string, options?: OutputOptions) => {
    if (process.env.NODE_ENV !== 'test') console.error(chalk.red(withPrefix(`ERROR: ${message}`, options)));
  },
  success: (message: string, options?: OutputOptions) => {
    if (process.env.NODE_ENV !== 'test') console.log(chalk.green(withPrefix(message, options)));
  },
};
