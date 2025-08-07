import { dset } from 'dset/merge';
import { join } from 'path';
import { getAbsProjectRootPath } from "../../shared/paths";
import type { FunctionReference } from "../../shared/types/function_registry";
import { importCloudFunction } from './import_cloud_function';

/**
 * The path, relative to the project root, containing the compiled JavaScript files.
 */
export const DEFAULT_COMPILED_DIRECTORY_RELATIVE_PATH = 'lib';


/**
 * Dynamically imports a Cloud Function from the given relative path and assigns it
 * into the export map under the appropriate export key derived from that path.
 */
export async function deepSetCloudFunction(
  functionId: string,
  reference: FunctionReference,
  exportMap: Record<string, unknown>,
) {
  const [relPath, exportKey] = reference;

  const absPath = join(
    getAbsProjectRootPath(),
    DEFAULT_COMPILED_DIRECTORY_RELATIVE_PATH,
    relPath,
  );

  const cloudFunction = await importCloudFunction(absPath);

  // The export key was only set if it was different to the function ID.
  const exportFunctionName = exportKey ?? functionId;

  dset(exportMap, exportFunctionName, cloudFunction);
}