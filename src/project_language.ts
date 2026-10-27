import fs from 'node:fs';
import { join } from 'node:path';

/** Whether the project is written in JavaScript or TypeScript. */
export type ProjectLanguage = 'js' | 'ts';

/**
 * Detects whether the project is written in TypeScript or JavaScript, from
 * whether its source directory holds `index.ts` or `index.js`.
 *
 * The generated index is written in the same language, so `index` can import
 * it: `tsc` compiles an `index.gen.ts` like any other source file, but without
 * `allowJs` it neither type-checks nor copies an `index.gen.js`.
 *
 * `index` decides rather than the function files, since a TypeScript project
 * may also hold `.js` function files. Prefers TypeScript when both exist.
 *
 * @param sourceDir - The absolute path to the source directory.
 * @throws If the source directory holds neither file.
 */
export function detectProjectLanguage(sourceDir: string): ProjectLanguage {
  if (fs.existsSync(join(sourceDir, 'index.ts'))) return 'ts';
  if (fs.existsSync(join(sourceDir, 'index.js'))) return 'js';

  throw new Error(
    `Could not find index.ts or index.js in ${sourceDir}. ` +
    'FFSE writes index.gen.ts or index.gen.js to match, and your index should contain `export * from \'./index.gen.js\'`.'
  );
}
