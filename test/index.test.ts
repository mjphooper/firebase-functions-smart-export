import { expect } from 'chai';
import { spawnSync } from 'child_process';
import fs from 'fs';
import { createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import sinon from 'sinon';
import { pathToFileURL } from 'url';
import type { Config } from '../src/config.js';
import type { ProjectLanguage } from '../src/project_language.js';
import { getGeneratedIndexFileName } from '../src/generate_index_file.js';
import { main } from '../src/index.js';
import { styledConsoleOutput } from '../src/styled_console_log.js';
import { useSandbox } from './helpers/sandbox.js';

/** The compiler options from the `firebase init` TypeScript template (firebase-tools 15.28.2). */
const FIREBASE_TEMPLATE_COMPILER_OPTIONS = {
  module: 'NodeNext',
  esModuleInterop: true,
  moduleResolution: 'nodenext',
  noImplicitReturns: true,
  noUnusedLocals: true,
  outDir: 'lib',
  rootDir: 'src',
  sourceMap: true,
  strict: true,
  target: 'es2017',
};

const TSC_PATH = createRequire(import.meta.url).resolve('typescript/bin/tsc');

/** Dynamically imports the generated index file and returns its module namespace. */
async function importGeneratedIndex(projectRoot: string, sourceDir = 'src'): Promise<Record<string, unknown>> {
  return import(pathToFileURL(resolve(projectRoot, sourceDir, getGeneratedIndexFileName('js'))).href);
}

describe('cli main()', () => {
  const sandbox = useSandbox();
  let projectRoot: string;

  /** Creates a function file at `<projectRoot>/<sourceDir>/<relPath>` with optional contents. */
  function writeFunctionFile(relPath: string, sourceDir = 'src', contents = ''): void {
    const full = resolve(projectRoot, sourceDir, relPath);
    fs.mkdirSync(dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }

  /** Writes `<projectRoot>/<sourceDir>/index.<language>`, re-exporting the generated index. */
  function writeIndexFile(sourceDir = 'src', language: ProjectLanguage = 'js'): void {
    const full = resolve(projectRoot, sourceDir, `index.${language}`);
    fs.mkdirSync(dirname(full), { recursive: true });
    fs.writeFileSync(full, `export * from './index.gen.js';\n`);
  }

  /** Writes a `package.json` at the project root with the given fields. */
  function writePackageJson(fields: Record<string, unknown>): void {
    fs.writeFileSync(resolve(projectRoot, 'package.json'), JSON.stringify(fields));
  }

  /** Writes an `ffse.config.js` at the project root with the given config as its default export. */
  function writeConfigFile(config: Config): void {
    const filePath = resolve(projectRoot, 'ffse.config.js');
    fs.writeFileSync(filePath, `export default ${JSON.stringify(config)};\n`);
  }

  /** Absolute path where the generated index file is expected to land. */
  function indexPath(sourceDir = 'src', language: ProjectLanguage = 'js'): string {
    return resolve(projectRoot, sourceDir, getGeneratedIndexFileName(language));
  }

  /** Reads the generated index file's contents. Throws if it doesn't exist. */
  function readGeneratedIndex(sourceDir = 'src', language: ProjectLanguage = 'js'): string {
    return fs.readFileSync(indexPath(sourceDir, language), 'utf8');
  }

  /** Whether the generated index file exists on disk. */
  function generatedIndexExists(sourceDir = 'src', language: ProjectLanguage = 'js'): boolean {
    return fs.existsSync(indexPath(sourceDir, language));
  }

  beforeEach(() => {
    projectRoot = sandbox.path();
    writeIndexFile();
    writePackageJson({ type: 'module' });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns 1 and logs an error when the source directory cannot be resolved', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src'), { recursive: true });
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/Could not find source directory/);
  });

  it('returns 0 and writes no index file when no functions are found', async () => {
    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('generates an index file with the export key for a single top-level function', async () => {
    // Arrange
    writeFunctionFile('hello.function.js');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    const content = readGeneratedIndex();
    expect(content).to.contain('import("./hello.function.js")');
    expect(content).to.contain('export const hello = _functions[0];');
  });

  it('produces a runnable index file whose named exports resolve to the source functions', async () => {
    // Arrange
    writeFunctionFile('hello.function.js', 'src', 'export default { id: "hello" };');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    const indexModule = await importGeneratedIndex(projectRoot);
    expect(indexModule.hello).to.deep.equal({ id: 'hello' });
  });

  it('assembles nested function files into a working nested export map', async () => {
    // Arrange
    writeFunctionFile('auth/onCreate.function.js', 'src', 'export default { id: "auth.onCreate" };');
    writeFunctionFile('chats/messages/onSend.function.js', 'src', 'export default { id: "chats.messages.onSend" };');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    const indexModule = await importGeneratedIndex(projectRoot) as {
      auth: { onCreate: unknown };
      chats: { messages: { onSend: unknown } };
    };
    expect(indexModule.auth.onCreate).to.deep.equal({ id: 'auth.onCreate' });
    expect(indexModule.chats.messages.onSend).to.deep.equal({ id: 'chats.messages.onSend' });
  });

  describe('given a custom ffse.config.js', () => {
    it('honours sourceDir and useSingleQuotes', async () => {
      // Arrange
      writeFunctionFile('foo.function.js', 'app');
      writeIndexFile('app');
      writeConfigFile({ sourceDir: 'app', useSingleQuotes: true });

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(0);
      expect(readGeneratedIndex('app')).to.contain(`import('./foo.function.js')`);
    });

    it('returns 1 without writing the index when outDir is set', async () => {
      // Arrange
      writeFunctionFile('foo.function.js');
      writeConfigFile({ outDir: 'build' } as Config);
      const errorStub = sinon.stub(styledConsoleOutput, 'error');

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(1);
      expect(errorStub).to.have.been.calledWithMatch(/`outDir` is no longer supported/);
      expect(generatedIndexExists()).to.equal(false);
    });

    it('honours matchExtension', async () => {
      // Arrange
      writeFunctionFile('hello.fn.js');
      writeConfigFile({ matchExtension: 'fn' });

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(0);
      expect(readGeneratedIndex()).to.contain('import("./hello.fn.js")');
    });
  });

  it('returns 1 and logs an error when an export key exceeds the character limit', async () => {
    // Arrange
    writeFunctionFile(`${'a'.repeat(63)}.function.js`);
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/exceeds the \d+ character limit/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('returns 1 and logs an error when two functions resolve to the same export key', async () => {
    // Arrange
    writeFunctionFile('auth/foo.function.js');
    writeFunctionFile('chats/foo.function.js');
    writeConfigFile({ disableGroups: true });
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/Conflicting function names/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('returns 1 and names both files when a function shares its name with a group', async () => {
    // Arrange
    writeFunctionFile('posts.function.js');
    writeFunctionFile('posts/create.function.js');
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/"posts" is both a function and a group/);
    expect(errorStub).to.have.been.calledWithMatch(/posts\.function\.js/);
    expect(errorStub).to.have.been.calledWithMatch(/posts\/create\.function\.js/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('returns 1 and reports every problem in one error when several checks fail', async () => {
    // Arrange
    writeFunctionFile(`${'a'.repeat(63)}.function.js`);
    writeFunctionFile('auth/foo.function.js');
    writeFunctionFile('chats/foo.function.js');
    writeConfigFile({ disableGroups: true });
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    sinon.assert.calledOnce(errorStub);
    const [report] = errorStub.firstCall.args;
    expect(report).to.match(/exceeds the \d+ character limit/);
    expect(report).to.contain('Conflicting function names');
    expect(report).to.contain('auth/foo.function.js');
    expect(report).to.contain('chats/foo.function.js');
    expect(generatedIndexExists()).to.equal(false);
  });

  it('returns 1 and names the file when a top-level group is a reserved word', async () => {
    // Arrange
    writeFunctionFile('delete/thing.function.js');
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/"delete" is a reserved word/);
    expect(errorStub).to.have.been.calledWithMatch(/delete\/thing\.function\.js/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('returns 1 and names the file when a top-level group starts with a digit', async () => {
    // Arrange
    writeFunctionFile('2fa/verify.function.js');
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/must start with a letter/);
    expect(errorStub).to.have.been.calledWithMatch(/2fa\/verify\.function\.js/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('exports a top-level group whose name ends in a digit', async () => {
    // Arrange
    writeFunctionFile('v2/thing.function.js');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(readGeneratedIndex()).to.contain('export const v2 = { thing: _functions[0] };');
  });

  it('returns 1 without reporting success when a dry run finds validation errors', async () => {
    // Arrange
    writeFunctionFile(`${'a'.repeat(63)}.function.js`);
    sinon.stub(styledConsoleOutput, 'error');
    const successStub = sinon.stub(styledConsoleOutput, 'success');

    // Act
    const code = await main({ cwd: projectRoot, dryRun: true });

    // Assert
    expect(code).to.equal(1);
    sinon.assert.notCalled(successStub);
  });

  it('generates the index and warns about allowJs when a TypeScript project has .js function files', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src', 'index.js'));
    writeIndexFile('src', 'ts');
    writeFunctionFile('foo.function.ts');
    writeFunctionFile('bar.function.js');
    const warnStub = sinon.stub(styledConsoleOutput, 'warn');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    const content = readGeneratedIndex('src', 'ts');
    expect(content).to.contain('import("./foo.function.js")');
    expect(content).to.contain('import("./bar.function.js")');
    expect(warnStub).to.have.been.calledWithMatch(/allowJs/);
  });

  it('does not warn about allowJs when a JavaScript project has mixed function files', async () => {
    // Arrange
    writeFunctionFile('foo.function.ts');
    writeFunctionFile('bar.function.js');
    const warnStub = sinon.stub(styledConsoleOutput, 'warn');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(warnStub).to.not.have.been.calledWithMatch(/allowJs/);
  });

  it('returns 1 without writing the index when the source directory has no index file', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src', 'index.js'));
    writeFunctionFile('hello.function.js');
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/Could not find index\.ts or index\.js/);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('writes index.gen.ts when the source directory holds index.ts', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src', 'index.js'));
    writeIndexFile('src', 'ts');
    writeFunctionFile('hello.function.ts');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists('src', 'ts')).to.equal(true);
    expect(generatedIndexExists('src', 'js')).to.equal(false);
  });

  it('returns 1 without writing the index when package.json does not set "type": "module"', async () => {
    // Arrange
    writePackageJson({ main: 'lib/index.js' });
    writeFunctionFile('hello.function.js');
    const errorStub = sinon.stub(styledConsoleOutput, 'error');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(1);
    expect(errorStub).to.have.been.calledWithMatch(/package\.json must set "type": "module"/);
    expect(generatedIndexExists()).to.equal(false);
  });

  describe('given a TypeScript project with the firebase init tsconfig', () => {
    beforeEach(() => {
      fs.rmSync(join(projectRoot, 'src', 'index.js'));
      writeIndexFile('src', 'ts');
      // `types: []` keeps this repo's own @types packages out of the sandbox,
      // which also shows the generated file needs no @types/node.
      const tsconfig = { compilerOptions: { ...FIREBASE_TEMPLATE_COMPILER_OPTIONS, types: [] as string[] }, include: ['src'] };
      fs.writeFileSync(resolve(projectRoot, 'tsconfig.json'), JSON.stringify(tsconfig));
    });

    /** Runs this repo's `tsc` against the sandbox project. */
    function compile() {
      return spawnSync(process.execPath, [TSC_PATH, '-p', projectRoot], { encoding: 'utf8' });
    }

    it('compiles the generated index without allowJs, and the output runs', async function () {
      this.timeout(30_000);

      // Arrange
      writeFunctionFile('posts/create.function.ts', 'src', 'export default (name: string): string => `created ${name}`;\n');
      writeFunctionFile('hello.function.ts', 'src', `export default { id: 'hello' };\n`);

      // Act
      const code = await main({ cwd: projectRoot });
      const result = compile();

      // Assert
      expect(code).to.equal(0);
      expect(result.stdout).to.equal('');
      expect(result.status).to.equal(0);
      const indexModule = await import(pathToFileURL(resolve(projectRoot, 'lib', 'index.js')).href);
      expect(indexModule.posts.create('post')).to.equal('created post');
      expect(indexModule.hello).to.deep.equal({ id: 'hello' });
    });

    it('keeps each function\'s type on its export', async function () {
      this.timeout(30_000);

      // Arrange
      writeFunctionFile('hello.function.ts', 'src', `export default { id: 'hello' };\n`);
      fs.writeFileSync(
        resolve(projectRoot, 'src', 'uses_hello.ts'),
        `import { hello } from './index.gen.js';\nexport const id: number | undefined = hello?.id;\n`,
      );

      // Act
      await main({ cwd: projectRoot });
      const result = compile();

      // Assert
      expect(result.stdout).to.match(/uses_hello\.ts.*error TS2322: Type 'string \| undefined' is not assignable to type 'number \| undefined'/);
    });
  });

  it('returns 0 without writing the index file when dryRun is true', async () => {
    // Arrange
    writeFunctionFile('hello.function.js');

    // Act
    const code = await main({ cwd: projectRoot, dryRun: true });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists()).to.equal(false);
  });

  it('writes the index file and emits verbose-only logs when verbose is true', async () => {
    // Arrange
    writeFunctionFile('hello.function.js');
    writeConfigFile({ useSingleQuotes: false });
    const infoStub = sinon.stub(styledConsoleOutput, 'info');

    // Act
    const code = await main({ cwd: projectRoot, verbose: true });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists()).to.equal(true);
    expect(infoStub).to.have.been.calledWithMatch(/function\(s\) found/);
    expect(infoStub).to.have.been.calledWithMatch(/Custom config loaded/);
  });

  it('runs with no config on the firebase init JavaScript layout', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src'), { recursive: true });
    writePackageJson({ type: 'module', main: 'index.js' });
    writeIndexFile('.');
    writeFunctionFile('hello.function.js', '.', 'export default { id: "hello" };');
    writeFunctionFile('node_modules/some-package/other.function.js', '.');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(readGeneratedIndex('.')).to.not.contain('node_modules');
    const indexModule = await importGeneratedIndex(projectRoot, '.');
    expect(indexModule).to.have.keys('hello');
  });

  it('falls back to lib/ as the source directory when src/ does not exist', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src'), { recursive: true });
    writeFunctionFile('hello.function.js', 'lib');
    writeIndexFile('lib');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists('lib')).to.equal(true);
  });
});
