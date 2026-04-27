import type { Config } from './types/config.js';
/** The name of the user created configuration file. */
export declare const CONFIG_FILE_NAME = "ffse.config.js";
/**
 * Returns the default export of the config module at the given path.
 *
 * Returns an `unknown` object to reflect we have no control over the contents of
 * the config.
 */
export declare function getModuleDefault(configPath: string): Promise<unknown>;
export declare function importConfig(modulePath: string): Promise<Config>;
export declare function moduleExists(modulePath: string): boolean;
/**
 * Loads the user-defined configuration from the local config file if it exists.
 *
 * Looks for "ffse.config.js" in the project root directory. If found, dynamically imports it
 * and returns its default export. If the file does not exist, returns an empty object.
 * Throws if the file exists but does not export an object.
 *
 * @param absRootPath - Optional absolute path to the project root. Defaults to `process.cwd()`.
 * @returns A promise resolving to the configuration object.
 */
export declare function getConfig(absRootPath?: string): Promise<Config>;
