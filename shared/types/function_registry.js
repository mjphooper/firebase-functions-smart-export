/**
 * Checks if a value matches the `FunctionReference` tuple type.
 *
 * Returns true if the value is an array with a string as the first element,
 * and optionally a string as the second element.
 */
export function isFunctionReference(value) {
    return (Array.isArray(value) &&
        typeof value[0] === 'string' &&
        (value.length === 1 || typeof value[1] === 'string'));
}
