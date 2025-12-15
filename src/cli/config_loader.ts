import * as fs from 'fs';
import { join } from 'path';
import { getAbsProjectRootPath } from '../shared/paths.js';
import { styledConsoleOutput } from '../shared/styled_console_log.js';
import type { Config } from '../shared/types/config.js';

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
 * Looks for "ffse.config.js" in the project root directory. If found, dynamically imports it
 * and returns its default export. If the file does not exist, returns an empty object.
 * Throws if the file exists but does not export an object.
 *
 * @returns A promise resolving to the configuration object.
 */
export async function getConfig(): Promise<Config> {
  const absRootPath = getAbsProjectRootPath();
  const path = join(absRootPath, CONFIG_FILE_NAME);
  return moduleExists(path) ? await importConfig(path) : {};
}