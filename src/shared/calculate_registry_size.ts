import { FunctionRegistry, isFunctionReference } from "./types/function_registry.js";

/**
 * Returns the number of functions in the given registry.
 */
export function calculateRegistrySize(
  registry: FunctionRegistry,
  size: number = 0,
): number {
  return Object.values(registry).reduce(
    (acc, value) => acc + (isFunctionReference(value) ? 1 : calculateRegistrySize(value, size)),
    size,
  );
}