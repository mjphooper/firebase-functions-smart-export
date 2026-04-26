jest.unstable_mockModule('../../src/shared/config_loader.js', async () => {
  return { getConfig: jest.fn() };
});
jest.unstable_mockModule('../../src/shared/find_function_files.js', async () => {
  return { findFunctionFiles: jest.fn(), DEFAULT_MATCH_EXTENSION: 'function' };
});
jest.unstable_mockModule('../../src/shared/function_path_parser.js', async () => {
  return {
    parseFunctionIdFromPath: jest.fn(),
    parseExportKeyFromPath: jest.fn(),
  };
});
jest.unstable_mockModule('../../src/runtime/get_instance_target_id.js', async () => {
  return { getInstanceTargetId: jest.fn() };
});
jest.unstable_mockModule('../../src/runtime/import_cloud_function.js', async () => {
  return { importCloudFunction: jest.fn() };
});

import { jest } from '@jest/globals';
const { createExportMap } = await import('../../src/runtime/index.js');
const { getConfig } = await import('../../src/shared/config_loader.js');
const { findFunctionFiles } = await import('../../src/shared/find_function_files.js');
const { parseFunctionIdFromPath, parseExportKeyFromPath } = await import('../../src/shared/function_path_parser.js');
const { getInstanceTargetId } = await import('../../src/runtime/get_instance_target_id.js');
const { importCloudFunction } = await import('../../src/runtime/import_cloud_function.js');

// Fakes
const fakeCloudFunction: object = { data: 'Hello, I am a Cloud Function.' };

// Mocks
const mockGetConfig = getConfig as jest.Mock<() => Promise<object>>;
const mockFindFunctionFiles = findFunctionFiles as jest.Mock;
const mockParseFunctionIdFromPath = parseFunctionIdFromPath as jest.Mock;
const mockParseExportKeyFromPath = parseExportKeyFromPath as jest.Mock;
const mockGetInstanceTargetId = getInstanceTargetId as jest.Mock<() => string | null>;
const mockImportCloudFunction = importCloudFunction as jest.Mock<() => Promise<object>>;

function setupMocks(options: {
  targetId: string | null;
  files: string[];
  idMap?: Record<string, string>;
  keyMap?: Record<string, string>;
}) {
  mockGetConfig.mockResolvedValue({});
  mockFindFunctionFiles.mockReturnValue({ files: options.files, hasMixedFileTypes: false });
  mockGetInstanceTargetId.mockReturnValue(options.targetId);
  mockImportCloudFunction.mockResolvedValue(fakeCloudFunction);

  mockParseFunctionIdFromPath.mockImplementation((filePath: string) => {
    return options.idMap?.[filePath] ?? filePath;
  });
  mockParseExportKeyFromPath.mockImplementation((filePath: string) => {
    return options.keyMap?.[filePath] ?? filePath;
  });
}

describe('createExportMap()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads only the target function when one is provided', async () => {
    // Arrange
    setupMocks({
      targetId: 'target.function',
      files: ['path/to/target.function.js', 'path/to/other.function.js'],
      idMap: {
        'path/to/target.function.js': 'target.function',
        'path/to/other.function.js': 'other.function',
      },
      keyMap: {
        'path/to/target.function.js': 'target.function',
        'path/to/other.function.js': 'other.function',
      },
    });

    // Act
    const result = await createExportMap();

    // Assert
    expect(mockImportCloudFunction).toHaveBeenCalledTimes(1);
    expect(mockImportCloudFunction).toHaveBeenCalledWith(
      expect.stringContaining('path/to/target.function.js'),
    );
    expect(result).toEqual({
      target: {
        function: fakeCloudFunction,
      },
    });
  });

  it('loads all functions when no target is provided', async () => {
    // Arrange
    setupMocks({
      targetId: null,
      files: ['path/to/foo.function.js', 'path/to/bar.function.js'],
      keyMap: {
        'path/to/foo.function.js': 'target.function',
        'path/to/bar.function.js': 'other.function',
      },
    });

    // Act
    const result = await createExportMap();

    // Assert
    expect(mockImportCloudFunction).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      target: { function: fakeCloudFunction },
      other: { function: fakeCloudFunction },
    });
  });

  it('throws if target function is not found', async () => {
    // Arrange
    setupMocks({
      targetId: 'not.registered',
      files: ['path/to/something.function.js'],
      idMap: {
        'path/to/something.function.js': 'something.else',
      },
    });

    // Act & Assert
    await expect(createExportMap()).rejects.toThrow();
  });
});
