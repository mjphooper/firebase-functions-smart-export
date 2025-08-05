import * as fs from 'fs';
import { join } from 'path';
import { styledConsoleOutput } from '../shared/styled_console_log.js';
import { Config } from '../shared/types/config.js';

/** The name of the user created configuration file. */
export const CONFIG_FILE_NAME = 'ffse.config.js';

/**
 * Returns the default export of the config module at the given path.
 * 
 * Returns an `unknown` object to reflect we have no control over the contents of
 * the config.
 * @param configPath 
 * @returns 
 */
export async function getModuleDefault(configPath: string): Promise<unknown> {
  const module = await import(configPath);
  return module.default;

}

export async function importConfig(modulePath: string): Promise<Config> {

  const defaultExport: unknown = await getModuleDefault(modulePath);

  if (defaultExport == undefined) {
    styledConsoleOutput.warn('A config file exists with no default export.\nDid you forget to write `export default defineConfig...`?')
    return {};
  }

  const defaultExportType = typeof defaultExport;

  if (defaultExportType !== 'object') {
    throw new Error(`"ffse.config.js" expects to default export type "object", but instead exported type "${defaultExportType}".\nAre you using "export default defineConfig({...})"?`)
  }

  return defaultExport;
}

export function moduleExists(modulePath: string) {
  return fs.existsSync(modulePath);
}

/**
 * Loads the user-defined configuration from the local config file if it exists.
 *
 * If a file named "ffse.config.js" exists in the specified directory, it attempts to dynamically import it
 * and return its default export as a partial configuration object. If the file does not exist, an empty
 * object is returned. If the file exists but does not export an object, an error is thrown.
 *
 * @param dirPath - The absolute path to the directory in which to look for the config file.
 * @returns A promise resolving to a partial configuration object.
 */
export async function getConfig(dirPath: string): Promise<Config> {
  const path = join(dirPath, CONFIG_FILE_NAME);
  return moduleExists(path) ? await importConfig(path) : {};
}