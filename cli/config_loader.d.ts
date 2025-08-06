import type { Config } from '../shared/types/config.js';
/** The name of the user created configuration file. */
export declare const CONFIG_FILE_NAME = "ffse.config.js";
/**
 * Returns the default export of the config module at the given path.
 *
 * Returns an `unknown` object to reflect we have no control over the contents of
 * the config.
 * @param configPath
 * @returns
 */
export declare function getModuleDefault(configPath: string): Promise<unknown>;
export declare function importConfig(modulePath: string): Promise<Config>;
export declare function moduleExists(modulePath: string): boolean;
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
export declare function getConfig(dirPath: string): Promise<Config>;
