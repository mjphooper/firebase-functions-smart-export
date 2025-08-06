import { dset } from 'dset/merge';
import { join } from 'path';
import { getAbsProjectRootPath } from "../../shared/project_root_path";
import type { FunctionReference } from "../../shared/types/function_registry";
import { importCloudFunction } from './import_cloud_function';



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
  const absPath = join(getAbsProjectRootPath(), 'lib', relPath);
  const cloudFunction = await importCloudFunction(absPath);

  dset(
    exportMap,
    // The exportKey is only provided if it is different to the ID.
    exportKey ?? functionId,
    cloudFunction,
  );
}