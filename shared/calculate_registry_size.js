import { isFunctionReference } from "./types/function_registry.js";
/**
 * Returns the number of functions in the given registry.
 */
export function calculateRegistrySize(registry, size = 0) {
    return Object.values(registry).reduce((acc, value) => acc + (isFunctionReference(value) ? 1 : calculateRegistrySize(value, size)), size);
}
