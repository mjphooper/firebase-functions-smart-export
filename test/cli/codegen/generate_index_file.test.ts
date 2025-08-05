import { Project, SourceFile } from 'ts-morph';
import { EMPTY_REGISTRY_ERROR_MESSAGE, generateIndexFile } from '../../../src/cli/codegen/generate_index_file.js';
import { Config } from '../../../src/shared/types/config.js';
import { FunctionReference, FunctionRegistry } from '../../../src/shared/types/function_registry.js';


describe('generateIndexFile()', () => {
  const project = new Project({ useInMemoryFileSystem: true });
  const doubleQuoteConfig: Config = { useSingleQuotes: false };
  const emptyReference: FunctionReference = [''];

  let file: SourceFile;

  beforeEach(() => {
    file = project.createSourceFile('index.gen.js', '', { overwrite: true });
  });

  test('throws if the function registry is empty', async () => {
    // Arrange
    const registry: FunctionRegistry = {};
    const file = new Project({ useInMemoryFileSystem: true })
      .createSourceFile('index.gen.js', '');

    // Act & Assert
    await expect(generateIndexFile(file, registry, doubleQuoteConfig)).rejects.toThrow(
      EMPTY_REGISTRY_ERROR_MESSAGE
    );
  });

  test('writes imports and exportMap initialization', async () => {
    // Arrange
    const registry: FunctionRegistry = { foo: emptyReference };

    // Act
    await generateIndexFile(file, registry, doubleQuoteConfig);

    // Expect
    const content = file.getFullText();
    expect(content).toContain('import { createExportMap } from "firebase-functions-smart-export";');
    expect(content).toContain('const exportMap = await createExportMap(registry);');
  });

  test('writes named exports for each top-level key', async () => {
    // Arrange
    const registry: FunctionRegistry = {
      foo: emptyReference,
      bar: {
        baz: emptyReference,
      },
    };

    // Act
    await generateIndexFile(file, registry, doubleQuoteConfig);

    // Assert
    const content = file.getFullText();
    expect(content).toContain('export const foo = exportMap.foo;');
    expect(content).toContain('export const bar = exportMap.bar;');
  });

  test('quote style reflects config', async () => {
    const registry: FunctionRegistry = { foo: emptyReference };
    const config: Config = { useSingleQuotes: true };

    await generateIndexFile(file, registry, config);

    const content = file.getFullText();
    expect(content).toContain(`import { createExportMap } from 'firebase-functions-smart-export';`);
  });
});
