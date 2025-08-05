

/**
 * Configuration options for resolving and exporting Firebase Functions.
 */
export interface Config {
  /**
   * The custom file extension (excluding `.js`) used to identify function files.
   *
   * For example, if set to `'fn'`, the matcher will include files like `myFunction.fn.js`.
   *
   * This is used to differentiate function files from other JavaScript modules.
   * Defaults to `'function'` if not provided.
   */
  matchExtension?: string,

  /**
   * A list of groups to exclude from the final exported function name.
   *
   * Function groups are inherited directly from the function's file path. This
   * list can be used to omit groups corresponding to structural or redundant
   * folders that are irrelevant to the exported function.
   *
   * For example, a function at path
   * `features/chats/functions/callable/createChat.function.ts`
   * will produce a function export name of `chats-callable-createChat` given an
   * `ignoreGroups` value of `[features, functions]`.
   *
   * Applied before `transformPath`, if both are used.
   */
  ignoreGroups?: string[],


  /**
   * An optional function that transforms the list of groups derived from a function's file path.
   *
   * This allows full control over how group segments are included in the exported function name.
   * For example, you might rewrite or reorder the segments, or remove them entirely.
   *
   * Returning an empty array will remove all groups from the export function.
   *
   * If provided, this function runs after all other group transformations,
   * including `ignoreGroups` and `maxGroupDepth`.
   */
  mapGroups?: (groups: string[]) => string[],

  /**
   * Whether to remove groups from all exported functions.
   */
  disableGroups?: boolean,


  /**
   * The maximum number of groups that a function can be categorized under. Any
   * groups derived from the filesystem that exceed this number will be removed
   * from the function's final export ID.
   * 
   * Must be `>=1`. If given, the group depth limit will be applied immediately after `ignoreGroups`.
   * 
   * If omitted, no max depth will be enforced.
   */
  maxGroupDepth?: number,


  /**
   * Whether to show function export logs.
   * 
   * Defaults to `false`.
   */
  logs?: boolean,

  /**
   * Whether to use single quotes (instead of double) in the generated code.
   * 
   * Defaults to `false`.
   */
  useSingleQuotes?: boolean,
}