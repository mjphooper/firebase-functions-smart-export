import { FunctionGroupOrName } from './function_id.js';

/**
 * A reference to a user-defined function.
 * 
 * This is a tuple where the first item is the relative path to the function, and the optional second item
 * is the camel-case export name of the function.
 */
export type FunctionReference = [string, string?];

/**
 * Checks if a value matches the `FunctionReference` tuple type.
 *
 * Returns true if the value is an array with a string as the first element,
 * and optionally a string as the second element.
 */
export function isFunctionReference(value: unknown): value is FunctionReference {
  return (
    Array.isArray(value) &&
    typeof value[0] === 'string' &&
    (value.length === 1 || typeof value[1] === 'string')
  );
}

/****
 * A recursive registry mapping lowercase Firebase function IDs to either
 * relative file paths or nested function groupings.
 *
 * Each key is a unique, lowercase function ID segment, and values are either:
 * - a `string` representing the relative path to a function file, or
 * - another `FunctionRegistry` object representing nested groupings.
 *
 * IDs are stored in dot notation for hierarchy, e.g., `"events.callable.createevent"`,
 * and all keys must be lowercase due to Cloud Run's case-insensitive handling.
 *
 * This registry is used for discovery, export, and deployment of Firebase functions.
 */
export type FunctionRegistry = {
  [key: FunctionGroupOrName]: FunctionRegistry | FunctionReference,
}
