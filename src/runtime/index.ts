import { join } from 'path';
import { getConfig } from "../shared/config_loader";
import { DEFAULT_MATCH_EXTENSION, findFunctionFiles } from "../shared/find_function_files";
import { parseExportKeyFromPath, parseFunctionIdFromPath } from "../shared/function_path_parser";
import { getAbsProjectRootPath } from "../shared/paths";
import { buildExportMap } from "./build_export_map";
import { getInstanceTargetId } from "./get_instance_target_id";
import { importCloudFunction } from "./import_cloud_function";
import type { ExportMap } from "./types/export_map";

/**
 * The default output directory containing compiled JavaScript files.
 */
const DEFAULT_OUT_DIR = 'lib';

/**
 * Creates a map of function IDs to their corresponding Cloud Function exports.
 *
 * Loads the project configuration, globs the output directory for function files,
 * and dynamically imports the matched functions.
 *
 * If the current instance's function target ID is set via environment variable,
 * it short-circuits to load only that function. Otherwise, it loads all
 * discovered functions.
 *
 * @returns A promise resolving to a map of function IDs to their exported objects.
 */
export async function createExportMap(): Promise<ExportMap> {
  const config = await getConfig();
  const outDir = config.outDir ?? DEFAULT_OUT_DIR;
  const absOutDir = join(getAbsProjectRootPath(), outDir);
  const matchExtension = config.matchExtension ?? DEFAULT_MATCH_EXTENSION;

  const { files } = findFunctionFiles(absOutDir, matchExtension);
  const targetId = getInstanceTargetId(process.env);

  // If this instance has no target (deploy), export all functions.
  if (!targetId) {
    const entries = [];
    for (const filePath of files) {
      entries.push({
        exportKey: parseExportKeyFromPath(filePath, config),
        cloudFunction: await importCloudFunction(join(absOutDir, filePath)),
      });
    }
    return buildExportMap(entries);
  }

  // Find the file path of the exported function.
  const filePath = files.find(
    (path) => parseFunctionIdFromPath(path, config) === targetId,
  );

  if (!filePath) {
    const https = await import('firebase-functions/https');
    throw new https.HttpsError(
      'not-found',
      `Function "${targetId}" not found in ${outDir}/. Have you compiled your functions?`,
    )
  }

  return buildExportMap([{
    exportKey: parseExportKeyFromPath(filePath, config),
    cloudFunction: await importCloudFunction(join(absOutDir, filePath)),
  }]);
}
