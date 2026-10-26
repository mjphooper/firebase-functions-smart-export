import type { Config } from "./config.js";

/**
 * Transforms a raw function directory path into an array of groups via the transformation
 * criteria defined by the user in their config file.
 */
export function transformGroups(initialGroups: string[], config: Config): string[] {
  if (config.disableGroups) return [];

  let groups = [...initialGroups];

  // Filter out explicitly ignored group names
  if (config.ignoreGroups) groups = groups.filter(g => !config.ignoreGroups?.includes(g));

  // Truncate to the configured max group depth
  if (config.maxGroupDepth !== undefined) {
    if (config.maxGroupDepth < 1) {
      throw Error('`maxGroupDepth` must be >= 1. Please change this value in your "ffse.config.js" file.');
    }
    groups = groups.slice(0, config.maxGroupDepth);
  }

  // Apply user-defined group remapping last, after all other transforms
  if (config.mapGroups) groups = config.mapGroups(groups);

  return groups;
}
