/**
 * Removes groups listed in the `ignoreGroups` config.
 */
function stripAllGroups(groups, disableGroups) {
    if (!disableGroups)
        return groups;
    return [];
}
/**
 * Removes groups listed in the `ignoreGroups` config.
 */
function applyIgnoreGroups(groups, ignore) {
    if (!ignore)
        return groups;
    return groups.filter(group => { return !ignore?.includes(group); });
}
/**
 * Limits the group array to the maximum depth specified in config.
 *
 * @throws If `maxGroupDepth` is defined and less than 1.
 */
function applyMaxDepth(groups, maxDepth) {
    if (maxDepth === undefined)
        return groups;
    if (maxDepth < 1) {
        throw Error('`maxGroupDepth` must be >= 1. Please change this value in your "ffse.config.js" file.');
    }
    return groups = groups.slice(0, maxDepth);
}
/**
 * Applies custom group mapping logic from the config.
 */
function applyCustomMapping(groups, customMapping) {
    return customMapping ? customMapping(groups) : groups;
}
/**
 * Transforms a raw function directory path into an array of groups via the transformation
 * criteria defined by the user in their config file.
 */
export function transformGroups(initialGroups, config) {
    return [
        (groups) => stripAllGroups(groups, config.disableGroups),
        (groups) => applyIgnoreGroups(groups, config.ignoreGroups),
        (groups) => applyMaxDepth(groups, config.maxGroupDepth),
        (groups) => applyCustomMapping(groups, config.mapGroups),
    ].reduce((groups, fn) => fn(groups), initialGroups);
}
