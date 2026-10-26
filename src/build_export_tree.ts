import type { ParsedFunction } from './parse_function_files.js';

/**
 * The nested structure of the generated exports. Each key is a group or
 * function name; each leaf is the function's index in the list it was built
 * from.
 *
 * A `Map`, not a plain object, because `constructor` and other
 * `Object.prototype` names are valid export names.
 */
export type ExportTree = Map<string, ExportTree | number>;

/**
 * Builds the {@link ExportTree} for a list of functions, nesting each one under
 * its groups. Functions that share a group share one subtree.
 *
 * Each leaf is the function's position in `functions`. Names and groups keep
 * their first-seen order.
 *
 * Assumes validated export keys: no function shares its name with a group.
 *
 * @example
 * buildExportTree([
 *   { exportKey: 'auth.onCreate', filePath: 'auth/on_create.function.js' },
 *   { exportKey: 'hello', filePath: 'hello.function.js' },
 * ]);
 * // Map { 'auth' => Map { 'onCreate' => 0 }, 'hello' => 1 }
 */
export function buildExportTree(functions: ParsedFunction[]): ExportTree {
  const root: ExportTree = new Map();
  functions.forEach(({ exportKey }, index) => deepSet(root, exportKey.split('.'), index));
  return root;
}

/**
 * Sets `value` at the nested `path` in `tree`, creating subtrees as needed.
 *
 * This deep-set implementation purposefully allows prototype-named keys, such as
 * `constructor` and `prototype`, as these are valid function names. Libraries
 * like `dset` silently skip them to guard against prototype pollution.
 */
function deepSet(tree: ExportTree, path: string[], value: number): void {
  const segments = [...path];
  const last = segments.pop();
  let node = tree;
  for (const segment of segments) {
    if (!node.has(segment)) node.set(segment, new Map());
    node = node.get(segment) as ExportTree;
  }
  node.set(last, value);
}
