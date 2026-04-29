import { randomUUID } from 'crypto';
import fs from 'fs';
import { resolve } from 'path';

/**
 * Root directory under which all per-test sandbox directories are created.
 *
 * Lives under `test/sandboxes/` so it sits alongside the test files but never
 * pollutes any source tree. The directory is created and torn down by
 * {@link useSandbox} on each suite that opts in.
 */
const SANDBOXES_ROOT = resolve(import.meta.dirname, '..', 'sandboxes');

/** Handle returned by {@link useSandbox} for retrieving the active sandbox path. */
export interface SandboxHandle {
  /** Absolute path to the sandbox directory for the currently running test. */
  path: () => string;
}

/**
 * Registers Mocha hooks that give each test in the calling suite an isolated,
 * empty sandbox directory on disk.
 *
 * Lifecycle (registered against the enclosing `describe`):
 * - `before`: ensures {@link SANDBOXES_ROOT} exists.
 * - `beforeEach`: creates a fresh `<SANDBOXES_ROOT>/<uuid>` directory for the test.
 * - `afterEach`: removes that directory (recursive + force, so a failed test
 *   mid-write cannot leak state into the next one).
 * - `after`: removes {@link SANDBOXES_ROOT} entirely.
 *
 * Use the returned handle's `path()` from inside `it` blocks (or from
 * `beforeEach` hooks registered *after* this call, since Mocha runs hooks in
 * registration order). Calling `path()` outside an active test will throw,
 * since the per-test directory has not been assigned yet.
 *
 * @example
 * describe('my suite', () => {
 *   const sandbox = useSandbox();
 *
 *   it('writes a file', () => {
 *     fs.writeFileSync(resolve(sandbox.path(), 'hello.txt'), 'hi');
 *   });
 * });
 */
export function useSandbox(): SandboxHandle {
  let current: string | undefined;

  before(() => {
    fs.mkdirSync(SANDBOXES_ROOT, { recursive: true });
  });

  after(() => {
    fs.rmSync(SANDBOXES_ROOT, { recursive: true, force: true });
  });

  beforeEach(() => {
    current = resolve(SANDBOXES_ROOT, randomUUID());
    fs.mkdirSync(current);
  });

  afterEach(() => {
    if (current) fs.rmSync(current, { recursive: true, force: true });
    current = undefined;
  });

  return {
    path: () => {
      if (!current) {
        throw new Error('useSandbox: path() called outside an active test');
      }
      return current;
    },
  };
}
