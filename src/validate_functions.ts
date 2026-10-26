import { isKeyword, isStrictBindReservedWord } from '@babel/helper-validator-identifier';
import type { ParsedFunction } from './parse_function_files.js';

/** Maximum length of a Firebase Cloud Function name. */
export const FUNCTION_NAME_CHARACTER_LIMIT = 62;

/**
 * A single problem found by `validateFunctions()`.
 *
 * Every issue carries a user-facing `message` and the files involved. `type`
 * and the remaining fields describe what was found, for callers and tests that
 * need more than the message.
 */
type ValidationIssue = {
  /** What is wrong and, where useful, how to fix it. */
  message: string;
  /** The function files involved, relative to the source directory. */
  filePaths: string[];
} & (
    | { type: 'too-long'; exportKey: string; limit: number }
    | { type: 'reserved-word'; exportKey: string; word: string }
    | { type: 'leading-non-letter'; exportKey: string }
    | { type: 'invalid-characters'; exportKey: string }
    | { type: 'duplicate-names'; exportKeys: string[] }
    | { type: 'prefix-collision'; exportKey: string; nestedExportKeys: string[] }
  );

/** String prompting the user to rename an invalid function. */
const RENAME_HINT = 'Rename the file or folder, or remap it in "ffse.config.js".';

/** Formats a list of names as "a", "b" and "c". */
const listFormat = new Intl.ListFormat('en-GB', { type: 'conjunction' });

/**
 * Runs every check against the parsed functions and returns all issues found.
 *
 * Checks never short-circuit: a function that fails one check is still passed
 * to the rest, so a single run reports everything that needs fixing. Issues
 * from per-function checks come first, in check order, followed by collisions
 * between functions. An empty result means the functions are safe to export.
 */
export function validateFunctions(functions: ParsedFunction[]): ValidationIssue[] {
  const checks = [checkLength, checkReservedWord, checkLeadingLetter, checkCharacters];
  const functionIssues = checks.flatMap(check => functions.map(check).filter(issue => issue !== null));

  return [...functionIssues, ...findDuplicateNames(functions), ...findPrefixCollisions(functions)];
}

/**
 * Flags an export key longer than {@link FUNCTION_NAME_CHARACTER_LIMIT}.
 *
 * The limit applies to the full dot-separated export key, including any group
 * segments.
 */
function checkLength({ exportKey, filePath }: ParsedFunction): ValidationIssue | null {
  if (exportKey.length <= FUNCTION_NAME_CHARACTER_LIMIT) return null;
  return {
    type: 'too-long',
    exportKey,
    limit: FUNCTION_NAME_CHARACTER_LIMIT,
    filePaths: [filePath],
    message: `"${exportKey}" exceeds the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit for function names.`,
  };
}

/**
 * Flags a top-level name that is a JavaScript reserved word.
 *
 * Only the first segment is checked: it becomes `export const <name>` in the
 * generated index, where a reserved word is a syntax error. Nested segments are
 * plain object keys, so `v2.delete` is fine.
 *
 * Module code is always strict, so this covers keywords, literals, strict-mode
 * and module-only reserved words (`let`, `await`, ...), and `arguments` / `eval`,
 * which can't be bound in strict mode.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#reserved_words
 */
function checkReservedWord({ exportKey, filePath }: ParsedFunction): ValidationIssue | null {
  const word = exportKey.split('.')[0];
  if (!isKeyword(word) && !isStrictBindReservedWord(word, true)) return null;
  return {
    type: 'reserved-word',
    exportKey,
    word,
    filePaths: [filePath],
    message: `"${exportKey}" can't be exported: "${word}" is a reserved word in JavaScript. ${RENAME_HINT}`,
  };
}

/**
 * Flags an export key that does not start with an ASCII letter.
 *
 * The Firebase CLI (as of v15.34.1) rejects function IDs that don't start with
 * a letter, and the top-level name must be a valid identifier. Firebase joins
 * group segments with hyphens to form the ID, so only the first character is
 * constrained: nested segments may start with a digit (`v2.2fa` deploys as
 * `v2-2fa`).
 *
 * @see https://github.com/firebase/firebase-tools/blob/v15.34.1/src/deploy/functions/validate.ts#L349-L359
 * @see https://github.com/firebase/firebase-functions/blob/v7.4.0/src/runtime/loader.ts#L95
 */
function checkLeadingLetter({ exportKey, filePath }: ParsedFunction): ValidationIssue | null {
  if (/^[a-z]/i.test(exportKey)) return null;
  return {
    type: 'leading-non-letter',
    exportKey,
    filePaths: [filePath],
    message: `"${exportKey}" must start with a letter. ${RENAME_HINT}`,
  };
}

/**
 * Flags an export key with an empty segment or a character other than an ASCII
 * letter or digit.
 *
 * The Firebase CLI (as of v15.34.1) allows ASCII letters, digits, `_` and `-`
 * in a function ID. This is stricter: the runtime turns hyphens in the target
 * name back into dots and accepts only `[a-z0-9]+(\.[a-z0-9]+)*` (see
 * `getInstanceTargetId()`), so `_` and empty segments would fail at cold
 * start. `camelCase` already strips `_` and `-` from file and folder names, so
 * in practice this catches non-ASCII letters and segments that camelCase to
 * nothing (e.g. a folder named `_`).
 *
 * @see https://github.com/firebase/firebase-tools/blob/v15.34.1/src/deploy/functions/validate.ts#L349-L359
 */
function checkCharacters({ exportKey, filePath }: ParsedFunction): ValidationIssue | null {
  if (/^[a-z0-9]+(\.[a-z0-9]+)*$/i.test(exportKey)) return null;
  return {
    type: 'invalid-characters',
    exportKey,
    filePaths: [filePath],
    message:
      `"${exportKey}" contains characters that can't be used in a function name. ` +
      'Each dot-separated segment must be non-empty and use only ASCII letters and digits.',
  };
}

/**
 * Returns one issue per group of functions whose export keys collide
 * case-insensitively.
 *
 * Case-insensitive comparison is required because the Cloud Run runtime resolves
 * `FUNCTION_TARGET` / `K_SERVICE` in lowercase, so names that differ only in
 * case would collide at runtime.
 */
function findDuplicateNames(functions: ParsedFunction[]): ValidationIssue[] {
  const grouped = Map.groupBy(functions, fn => fn.exportKey.toLowerCase());

  return [...grouped.values()]
    .filter(group => group.length > 1)
    .map(group => {
      const exportKeys = group.map(fn => fn.exportKey);

      return {
        type: 'duplicate-names',
        exportKeys,
        filePaths: group.map(fn => fn.filePath),
        message:
          `Conflicting function names ${listFormat.format(exportKeys.map(key => `"${key}"`))}. ` +
          'Names must be unique within a project, ignoring case. ' +
          'Change your file structure or "ffse.config.js" to resolve the conflict.',
      };
    });
}

/**
 * Returns one issue per function whose export key is also a group holding
 * other functions, compared case-insensitively.
 *
 * `posts` and `posts.create` would make `posts` both a Cloud Function and an
 * object holding `create`, and which one is deployed depends on load order.
 * Any depth counts (`a.b` vs `a.b.c`, or `a` vs `a.b.c`), but only whole
 * segments: `post` and `posts.create` don't collide. Case is ignored for the
 * same reason as in {@link findDuplicateNames}.
 */
function findPrefixCollisions(functions: ParsedFunction[]): ValidationIssue[] {
  return functions.flatMap((fn): ValidationIssue[] => {
    const groupPrefix = `${fn.exportKey.toLowerCase()}.`;
    const nested = functions.filter(other => other.exportKey.toLowerCase().startsWith(groupPrefix));
    if (nested.length === 0) return [];

    const nestedExportKeys = nested.map(other => other.exportKey);
    return [{
      type: 'prefix-collision',
      exportKey: fn.exportKey,
      nestedExportKeys,
      filePaths: [fn.filePath, ...nested.map(other => other.filePath)],
      message:
        `"${fn.exportKey}" is both a function and a group holding ` +
        `${listFormat.format(nestedExportKeys.map(key => `"${key}"`))}. ${RENAME_HINT}`,
    }];
  });
}
