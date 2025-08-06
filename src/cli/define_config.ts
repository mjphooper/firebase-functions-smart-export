import type { Config } from '../shared/types/config.js';
/* istanbul ignore file */

/**
 * Defines a Firebase Functions Smart Export configuration object.
 *
 * This helper is used in your `ffse.config.ts` file to provide type safety
 * and IntelliSense support when authoring configuration.
 *
 * The returned object should be the file's default export and not modified in
 * any way.
 * 
 * @example
 * // ffse.config.ts
 * export default defineConfig({
 *   extensionIdentifier: "function",
 *   useSingleQuotes: true,
 * });
 */
export function defineConfig(config: Config): Config {
  return config;
};