jest.unstable_mockModule('../../src/runtime/helpers/get_instance_target_id.js', async () => {
  return { getInstanceTargetId: jest.fn() };
});
jest.unstable_mockModule('../../src/runtime/helpers/import_cloud_function.js', async () => {
  return { importCloudFunction: jest.fn() };
});

import { jest } from '@jest/globals';
import { FunctionRegistry } from '../../src/shared/types/function_registry.js';
const { createExportMap } = await import('../../src/runtime/index.js');
const { importCloudFunction } = await import('../../src/runtime/helpers/import_cloud_function.js');
const { getInstanceTargetId } = await import('../../src/runtime/helpers/get_instance_target_id.js');

// Fakes
const fakeCloudFunction: object = { data: 'Hello, I am a Cloud Function.' };

// Mocks
const mockGetInstanceTargetId = getInstanceTargetId as jest.Mock<() => string | null>;
const mockImportCloudFunction = importCloudFunction as jest.Mock<(relPath: string) => Promise<object>>;

describe('createExportMap()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads only the target function when one is provided', async () => {
    // Arrange
    const targetId = 'target.function';
    const registry: FunctionRegistry = {
      target: { function: ['path/to/target.function.js'] },
      other: { function: ['path/to/other.function.js'] },
    };
    mockGetInstanceTargetId.mockReturnValue(targetId);
    mockImportCloudFunction.mockResolvedValue(fakeCloudFunction);

    // Act
    const result = await createExportMap(registry);

    // Assert
    expect(mockGetInstanceTargetId).toHaveBeenCalled();
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
    const registry: FunctionRegistry = {
      target: { function: ['path/to/foo.function.js'] },
      other: { function: ['path/to/bar.function.js'] },
    };
    mockGetInstanceTargetId.mockReturnValue(null);
    mockImportCloudFunction.mockResolvedValue(fakeCloudFunction);

    // Act
    const result = await createExportMap(registry);

    // Assert
    expect(mockGetInstanceTargetId).toHaveBeenCalledTimes(1);
    expect(mockImportCloudFunction).toHaveBeenCalledWith(
      expect.stringContaining('path/to/foo.function.js'),
    );
    expect(mockImportCloudFunction).toHaveBeenCalledWith(
      expect.stringContaining('path/to/bar.function.js'),
    );
    expect(result).toEqual({
      target: { function: fakeCloudFunction },
      other: { function: fakeCloudFunction },
    });
  });


  it('throws if target function is not in the registry', async () => {
    // Arrange
    const targetId = 'not.registered';
    mockGetInstanceTargetId.mockReturnValue(targetId);

    // Act & Assert
    await expect(createExportMap({})).rejects.toThrow();
  });
});