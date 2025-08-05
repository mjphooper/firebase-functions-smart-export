import { isFunctionReference } from "./types/function_registry.js";
/**
 * Recursively flattens a nested FunctionRegistry object into a flat map where keys
 * are function IDs and values are the corresponding FunctionReferences.
 *
 * This simplifies nested structures into a single-level record suitable for
 * quick lookups and iteration.
 *
 * For example, a registry with nested groups like:
 * ```typescript
 * {
 *   firstGroup: {
 *     firstFunction: [...]
 *   },
 *   secondGroup: {
 *     subgroup: {
 *       secondFunction: [...]
 *     }
 *   }
 * }
 * ```
 * becomes:
 * ```typescript
 * {
 *   "firstgroup.firstfunction": [...],
 *   "secondgroup.subgroup.secondfunction": [...]
 * }
 * ```
 *
 * @param registry The nested FunctionRegistry to flatten.
 * @param pathSegments An internal parameter used during recursion to track the current path (should be omitted when called externally).
 * @returns A flat record mapping dot-separated function IDs to FunctionReferences.
 */
export function flattenFunctionRegistry(registry) {
    const flatRecord = {};
    function recursiveTraverseAndFlatten(registry, currentPath = []) {
        for (const [key, value] of Object.entries(registry)) {
            const thisPath = [...currentPath, key];
            if (isFunctionReference(value)) {
                flatRecord[thisPath.join('.')] = value;
            }
            else {
                recursiveTraverseAndFlatten(value, thisPath);
            }
        }
    }
    recursiveTraverseAndFlatten(registry);
    return flatRecord;
}
