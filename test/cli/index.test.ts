import { expect } from 'chai';
import fs from 'fs';
import { dirname, join, resolve } from 'path';
import sinon from 'sinon';
import { pathToFileURL } from 'url';
import type { Config } from '../../src/cli/config.js';
import { GENERATED_INDEX_FILE_NAME } from '../../src/cli/generate_index_file.js';
import { main } from '../../src/cli/index.js';
import { styledConsoleOutput } from '../../src/cli/styled_console_log.js';
import { useSandbox } from '../helpers/sandbox.js';

/**
 * Dynamically imports the generated index file and returns its module namespace.
 *
 * Temporarily switches `process.cwd()` to `projectRoot` for the duration of the
 * import, since the runtime resolves function paths against the current working
 * directory. The original cwd is restored before this helper returns.
 */
async function importGeneratedIndex(projectRoot: string, sourceDir = 'src'): Promise<Record<string, unknown>> {
  const originalCwd = process.cwd();
  process.chdir(projectRoot);
  try {
    return await import(pathToFileURL(resolve(projectRoot, sourceDir, GENERATED_INDEX_FILE_NAME)).href);
  } finally {
    process.chdir(originalCwd);
  }
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

  /** Writes an `ffse.config.js` at the project root with the given config as its default export. */
  function writeConfigFile(config: Config): void {
    const filePath = resolve(projectRoot, 'ffse.config.js');
    fs.writeFileSync(filePath, `export default ${JSON.stringify(config)};\n`);
  }

  /** Absolute path where the generated index file is expected to land. */
  function indexPath(sourceDir = 'src'): string {
    return resolve(projectRoot, sourceDir, GENERATED_INDEX_FILE_NAME);
  }

  /** Reads the generated index file's contents. Throws if it doesn't exist. */
  function readGeneratedIndex(sourceDir = 'src'): string {
    return fs.readFileSync(indexPath(sourceDir), 'utf8');
  }

  /** Whether the generated index file exists on disk. */
  function generatedIndexExists(sourceDir = 'src'): boolean {
    return fs.existsSync(indexPath(sourceDir));
  }

  beforeEach(() => {
    projectRoot = sandbox.path();
    fs.mkdirSync(join(projectRoot, 'src'), { recursive: true });
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
    expect(content).to.contain('"hello": "lib/hello.function.js"');
    expect(content).to.contain('export const hello = exportMap.hello;');
  });

  it('produces a runnable index file whose named exports resolve to the source functions', async () => {
    // Arrange
    // outDir: 'src' so the functionMap path resolves to where the (uncompiled)
    // source file actually lives — there's no tsc step in tests.
    writeFunctionFile('hello.function.js', 'src', 'export default { id: "hello" };');
    writeConfigFile({ outDir: 'src' });

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
    writeConfigFile({ outDir: 'src' });

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
      writeConfigFile({ sourceDir: 'app', useSingleQuotes: true });

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(0);
      expect(readGeneratedIndex('app')).to.contain(`'foo': 'lib/foo.function.js'`);
    });

    it('honours outDir', async () => {
      // Arrange
      writeFunctionFile('foo.function.js');
      writeConfigFile({ outDir: 'build' });

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(0);
      expect(readGeneratedIndex()).to.contain('"foo": "build/foo.function.js"');
    });

    it('honours matchExtension', async () => {
      // Arrange
      writeFunctionFile('hello.fn.js');
      writeConfigFile({ matchExtension: 'fn' });

      // Act
      const code = await main({ cwd: projectRoot });

      // Assert
      expect(code).to.equal(0);
      expect(readGeneratedIndex()).to.contain('"hello": "lib/hello.fn.js"');
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
    expect(readGeneratedIndex()).to.contain('export const v2 = exportMap.v2;');
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

  it('generates the index and warns about allowJs when given mixed .ts and .js function files', async () => {
    // Arrange
    writeFunctionFile('foo.function.ts');
    writeFunctionFile('bar.function.js');
    const warnStub = sinon.stub(styledConsoleOutput, 'warn');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    const content = readGeneratedIndex();
    expect(content).to.contain('"foo": "lib/foo.function.js"');
    expect(content).to.contain('"bar": "lib/bar.function.js"');
    expect(warnStub).to.have.been.calledWithMatch(/allowJs/);
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

  it('falls back to lib/ as the source directory when src/ does not exist', async () => {
    // Arrange
    fs.rmSync(join(projectRoot, 'src'), { recursive: true });
    writeFunctionFile('hello.function.js', 'lib');

    // Act
    const code = await main({ cwd: projectRoot });

    // Assert
    expect(code).to.equal(0);
    expect(generatedIndexExists('lib')).to.equal(true);
  });
});
