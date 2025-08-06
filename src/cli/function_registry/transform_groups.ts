import type { Config } from "../../shared/types/config.js";


/**
 * Removes groups listed in the `ignoreGroups` config.
 */
function stripAllGroups(groups: string[], disableGroups?: boolean) {
  if (!disableGroups) return groups;
  return [];
}

/**
 * Removes groups listed in the `ignoreGroups` config.
 */
function applyIgnoreGroups(groups: string[], ignore?: string[]) {
  if (!ignore) return groups;
  return groups.filter(group => { return !ignore?.includes(group); });
}

/**
 * Limits the group array to the maximum depth specified in config.
 * 
 * @throws If `maxGroupDepth` is defined and less than 1.
 */
function applyMaxDepth(groups: string[], maxDepth?: number) {
  if (maxDepth === undefined) return groups;
  if (maxDepth < 1) {
    throw Error('`maxGroupDepth` must be >= 1. Please change this value in your "ffse.config.js" file.');
  }
  return groups = groups.slice(0, maxDepth);
}

/**
 * Applies custom group mapping logic from the config.
 */
function applyCustomMapping(
  groups: string[],
  customMapping?: (groups: string[]) => string[],
) {
  return customMapping ? customMapping(groups) : groups;
}


/**
 * Transforms a raw function directory path into an array of groups via the transformation
 * criteria defined by the user in their config file.
 */
export function transformGroups(initialGroups: string[], config: Config) {
  return [
    (groups: string[]) => stripAllGroups(groups, config.disableGroups),
    (groups: string[]) => applyIgnoreGroups(groups, config.ignoreGroups),
    (groups: string[]) => applyMaxDepth(groups, config.maxGroupDepth),
    (groups: string[]) => applyCustomMapping(groups, config.mapGroups),
  ].reduce(
    (groups, fn) => fn(groups), initialGroups,
  );
}
