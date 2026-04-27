import type { Config } from "./types/config.js";
/**
 * Transforms a raw function directory path into an array of groups via the transformation
 * criteria defined by the user in their config file.
 */
export declare function transformGroups(initialGroups: string[], config: Config): string[];
