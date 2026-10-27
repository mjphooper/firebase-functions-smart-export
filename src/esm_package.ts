import fs from 'node:fs';
import { join } from 'node:path';

/**
 * Whether the project's `package.json` sets `"type": "module"`.
 *
 * The generated index is an ES module (named exports and a top-level `await`),
 * so the project must be one. Without it, deploy discovery still succeeds, but
 * the Cloud Functions runtime (`@google-cloud/functions-framework`) picks
 * `require()` from this field and fails every cold start with
 * `ERR_REQUIRE_ASYNC_MODULE`. TypeScript projects fail earlier: `tsc` under
 * `NodeNext` compiles to CommonJS and rejects the top-level `await`.
 *
 * @param projectRoot - The functions directory, which holds `package.json`.
 * @returns `false` if `package.json` is missing or sets any other type.
 */
export function isEsmPackage(projectRoot: string): boolean {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.type === 'module';
}
