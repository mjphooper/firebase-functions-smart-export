/**
 * A unique identifier for a Firebase function, expressed in dot notation.
 * Each segment represents a namespace or grouping, and the entire ID must be lowercase.
 *
 * Example: `usermessages.triggers.onmessagecreated`
 */
export type FunctionId = string;
/**
 * A key used during module exports for Firebase functions.
 *
 * This mirrors the structure of {@link FunctionId}, except each segment in the ID may be displayed in camel case.
 * This is to aid readibility of the exported functions.
 *
 * For example: `userMessages.triggers.onMessageCreated`
 */
export type FunctionExportKey = string;
/**
 * A type representing a string which may be either a function group or name.
 */
export type FunctionGroupOrName = string;
