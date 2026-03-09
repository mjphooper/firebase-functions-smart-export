import { dset } from 'dset/merge';
import { join } from 'path';

/**
 * Dynamically imports a Cloud Function from the given absolute path,
 * validating that it has a default export.
 */
async function importCloudFunction(absPath: string): Promise<object> {
  const module = await import(absPath);
  const hasDefaultExport: boolean = module.default != undefined;

  if (!hasDefaultExport) {
    const https = await import('firebase-functions/https');
    throw new https.HttpsError(
      'failed-precondition',
      `Function at path ${absPath} has no default export. Did you forget to add "export default" to the function definition?`,
    );
  }

  return module.default;
}

/**
 * Dynamically imports a Cloud Function from the given relative path and assigns it
 * into the export map under the appropriate export key.
 *
 * @param relPath - The relative path to the function file within the output directory.
 * @param exportKey - The dot-separated key to use when setting the function in the export map.
 * @param exportMap - The map to populate with the imported function.
 * @param absOutDir - The absolute path to the output directory containing compiled JavaScript files.
 */
export async function deepSetCloudFunction(
  relPath: string,
  exportKey: string,
  exportMap: Record<string, unknown>,
  absOutDir: string,
) {
  const absPath = join(absOutDir, relPath);
  const cloudFunction = await importCloudFunction(absPath);
  dset(exportMap, exportKey, cloudFunction);
}
