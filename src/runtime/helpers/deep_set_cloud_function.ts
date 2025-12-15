import { dset } from 'dset/merge';
import { join } from 'path';
import { getAbsProjectRootPath } from "../../shared/paths";
import type { FunctionReference } from "../../shared/types/function_registry";
import { importCloudFunction } from './import_cloud_function';

/**
 * The default output directory containing compiled JavaScript files.
 *
 * This defaults to 'lib' as the default output directory for both JavaScript and
 * TypeScript projects. Users can configure this output directory via the FFSE config.
 */
export const DEFAULT_OUT_DIR = 'lib';


/**
 * Dynamically imports a Cloud Function from the given relative path and assigns it
 * into the export map under the appropriate export key derived from that path.
 *
 * @param functionId - The unique identifier for the function.
 * @param reference - The function reference containing the relative path and optional export key.
 * @param exportMap - The map to populate with the imported function.
 * @param outDir - The output directory containing compiled JavaScript files.
 */
export async function deepSetCloudFunction(
  functionId: string,
  reference: FunctionReference,
  exportMap: Record<string, unknown>,
  outDir: string,
) {
  const [relPath, exportKey] = reference;

  const absPath = join(
    getAbsProjectRootPath(),
    outDir,
    relPath,
  );

  const cloudFunction = await importCloudFunction(absPath);

  // The export key was only set if it was different to the function ID.
  const exportFunctionName = exportKey ?? functionId;

  dset(exportMap, exportFunctionName, cloudFunction);
}