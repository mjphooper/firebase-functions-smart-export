import { expect } from 'chai';
import fs from 'fs';
import { dirname, resolve } from 'path';
import { pathToFileURL } from 'url';
import { buildExportTree } from '../src/build_export_tree.js';
import type { ProjectLanguage } from '../src/project_language.js';
import { generateIndexFile, getGeneratedIndexFileName } from '../src/generate_index_file.js';
import type { ParsedFunction } from '../src/parse_function_files.js';
import type { Config } from '../src/config.js';
import { useSandbox } from './helpers/sandbox.js';

declare global {
  // Export keys of the function modules imported by the generated index, in load order.
  var ffseLoaded: string[];
}

function makeParsedFunction(exportKey: string, filePath: string): ParsedFunction {
  return { exportKey, filePath };
}

describe('generateIndexFile()', () => {
  const sandbox = useSandbox();
  const doubleQuoteConfig: Config = { useSingleQuotes: false };
  const originalEnv = process.env;

  beforeEach(() => {
    globalThis.ffseLoaded = [];
    process.env = { ...originalEnv };
    delete process.env.FUNCTION_TARGET;
    delete process.env.K_SERVICE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function readGeneratedFile(language: ProjectLanguage = 'js') {
    return fs.readFileSync(resolve(sandbox.path(), getGeneratedIndexFileName(language)), 'utf8');
  }

  /**
   * Writes a function module that records its export key in `globalThis.ffseLoaded`
   * when imported, then returns the matching `ParsedFunction`.
   */
  function writeFunction(exportKey: string, filePath: string, contents?: string): ParsedFunction {
    const fullPath = resolve(sandbox.path(), filePath);
    fs.mkdirSync(dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      contents ?? `globalThis.ffseLoaded.push(${JSON.stringify(exportKey)});\nexport default { id: ${JSON.stringify(exportKey)} };\n`,
    );
    return makeParsedFunction(exportKey, filePath);
  }

  /** Generates the index for the given functions into the sandbox. */
  function generate(functions: ParsedFunction[], config: Config = doubleQuoteConfig, language: ProjectLanguage = 'js') {
    return generateIndexFile(sandbox.path(), functions, buildExportTree(functions), config, language);
  }

  /** Generates the index for the given functions and imports it. */
  async function generateAndImport(functions: ParsedFunction[], config: Config = doubleQuoteConfig) {
    await generate(functions, config);
    return import(pathToFileURL(resolve(sandbox.path(), getGeneratedIndexFileName('js'))).href);
  }

  function writeExampleFunctions(): ParsedFunction[] {
    return [
      writeFunction('posts.https.createPost', 'posts/https/create_post.function.js'),
      writeFunction('auth.onCreate', 'auth/on_create.function.js'),
      writeFunction('hello', 'hello.function.js'),
    ];
  }

  it('throws if the functions list is empty', async () => {
    // Act
    const result = generate([]);

    // Assert
    await expect(result).to.be.rejectedWith(/no functions found/);
  });

  it('writes no bundled runtime, only literal imports relative to the generated file', async () => {
    // Act
    await generate([makeParsedFunction('auth.onCreate', 'auth/onCreate.function.js')]);

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain('import("./auth/onCreate.function.js")');
    expect(content).to.not.match(/process\.cwd|createExportMap|from ["']/);
  });

  describe('with no target set', () => {
    it('imports every function into nested exports', async () => {
      // Arrange
      const functions = writeExampleFunctions();

      // Act
      const module = await generateAndImport(functions);

      // Assert
      expect(globalThis.ffseLoaded).to.have.members(['posts.https.createPost', 'auth.onCreate', 'hello']);
      expect(module.posts).to.deep.equal({ https: { createPost: { id: 'posts.https.createPost' } } });
      expect(module.auth).to.deep.equal({ onCreate: { id: 'auth.onCreate' } });
      expect(module.hello).to.deep.equal({ id: 'hello' });
    });

    it('starts all imports before any of them finishes', async () => {
      // Arrange
      // Each module waits for every other one to start, which only resolves if
      // the generated index imports them in parallel.
      const blockingModule = (key: string) =>
        `globalThis.ffseLoaded.push(${JSON.stringify(key)});\n` +
        `while (globalThis.ffseLoaded.length < 2) await new Promise((r) => setTimeout(r, 5));\n` +
        `export default { id: ${JSON.stringify(key)} };\n`;
      const functions = [
        writeFunction('first', 'first.function.js', blockingModule('first')),
        writeFunction('second', 'second.function.js', blockingModule('second')),
      ];

      // Act
      const module = await generateAndImport(functions);

      // Assert
      expect(module.first).to.deep.equal({ id: 'first' });
      expect(module.second).to.deep.equal({ id: 'second' });
    });

    it('exports only the top-level names of the functions', async () => {
      // Arrange
      const functions = writeExampleFunctions();

      // Act
      const module = await generateAndImport(functions);

      // Assert
      expect(Object.keys(module)).to.have.members(['posts', 'auth', 'hello']);
    });
  });

  describe('with a target set', () => {
    it('imports only the target function', async () => {
      // Arrange
      const functions = writeExampleFunctions();
      process.env.FUNCTION_TARGET = 'auth.onCreate';

      // Act
      const module = await generateAndImport(functions);

      // Assert
      expect(globalThis.ffseLoaded).to.deep.equal(['auth.onCreate']);
      expect(module.auth).to.deep.equal({ onCreate: { id: 'auth.onCreate' } });
      expect(module.posts).to.deep.equal({ https: { createPost: undefined } });
      expect(module.hello).to.equal(undefined);
    });

    it('falls back to K_SERVICE, matching hyphens and case loosely', async () => {
      // Arrange
      const functions = writeExampleFunctions();
      process.env.K_SERVICE = 'posts-https-createpost';

      // Act
      const module = await generateAndImport(functions);

      // Assert
      expect(globalThis.ffseLoaded).to.deep.equal(['posts.https.createPost']);
      expect(module.posts).to.deep.equal({ https: { createPost: { id: 'posts.https.createPost' } } });
    });

    it('prefers FUNCTION_TARGET over K_SERVICE', async () => {
      // Arrange
      const functions = writeExampleFunctions();
      process.env.FUNCTION_TARGET = 'hello';
      process.env.K_SERVICE = 'auth-oncreate';

      // Act
      await generateAndImport(functions);

      // Assert
      expect(globalThis.ffseLoaded).to.deep.equal(['hello']);
    });

    it('throws a regenerate hint when the target is unknown', async () => {
      // Arrange
      const functions = writeExampleFunctions();
      process.env.FUNCTION_TARGET = 'posts.delete';

      // Act
      const result = generateAndImport(functions);

      // Assert
      await expect(result).to.be.rejectedWith(Error, /Function "posts\.delete" not found in index\.gen\.js\. Have you run ffse/);
      expect(globalThis.ffseLoaded).to.deep.equal([]);
    });
  });

  it('throws a plain Error naming the file when a module has no default export', async () => {
    // Arrange
    const functions = [writeFunction('hello', 'hello.function.js', 'export const hello = {};\n')];

    // Act
    const result = generateAndImport(functions);

    // Assert
    await expect(result).to.be.rejectedWith(Error, /\.\/hello\.function\.js has no default export/);
    await result.catch((error: Error) => expect(error.constructor).to.equal(Error));
  });

  it('quote style reflects config', async () => {
    // Arrange
    const config: Config = { useSingleQuotes: true };

    // Act
    await generate([makeParsedFunction('auth.onCreate', 'auth/onCreate.function.js')], config);

    // Assert
    const content = readGeneratedFile();
    expect(content).to.contain(`_load('auth.oncreate', './auth/onCreate.function.js', () => import('./auth/onCreate.function.js'))`);
    expect(content).to.contain(`|| '').replace(/-/g, '.')`);
  });

  describe('language', () => {
    it('writes an untyped index.gen.js for a JavaScript project', async () => {
      // Act
      await generate([makeParsedFunction('hello', 'hello.function.js')], doubleQuoteConfig, 'js');

      // Assert
      const content = readGeneratedFile('js');
      expect(content).to.contain('const _load = (key, path, importer) =>');
      expect(content).to.not.contain('declare const process');
      expect(fs.existsSync(resolve(sandbox.path(), 'index.gen.ts'))).to.equal(false);
    });

    it('writes a typed index.gen.ts for a TypeScript project', async () => {
      // Act
      await generate([makeParsedFunction('hello', 'hello.function.js')], doubleQuoteConfig, 'ts');

      // Assert
      const content = readGeneratedFile('ts');
      expect(content).to.contain('declare const process: { env: Record<string, string | undefined> };');
      expect(content).to.contain('const _load = <T>(key: string, path: string, importer: () => Promise<{ default?: T; [name: string]: unknown }>): Promise<T> | undefined =>');
      expect(content).to.contain('import("./hello.function.js")');
      expect(fs.existsSync(resolve(sandbox.path(), 'index.gen.js'))).to.equal(false);
    });
  });
});
