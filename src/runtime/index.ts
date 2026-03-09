import { join } from 'path';
import { getConfig } from "../shared/config_loader";
import { DEFAULT_MATCH_EXTENSION, findFunctionFiles } from "../shared/find_function_files";
import { parseExportKeyFromPath, parseFunctionIdFromPath } from "../shared/function_path_parser";
import { getAbsProjectRootPath } from "../shared/paths";
import { deepSetCloudFunction } from "./helpers/deep_set_cloud_function";
import { getInstanceTargetId } from "./helpers/get_instance_target_id";
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
  const exportMap: ExportMap = {};

  if (targetId) {
    for (const filePath of files) {
      const functionId = parseFunctionIdFromPath(filePath, config);
      if (functionId === targetId) {
        const exportKey = parseExportKeyFromPath(filePath, config);
        await deepSetCloudFunction(filePath, exportKey, exportMap, absOutDir);
        return exportMap;
      }
    }

    const https = await import('firebase-functions/https');
    throw new https.HttpsError(
      'not-found',
      `Function "${targetId}" not found in ${outDir}/. Have you compiled your functions?`,
    );
  } else {
    for (const filePath of files) {
      const exportKey = parseExportKeyFromPath(filePath, config);
      await deepSetCloudFunction(filePath, exportKey, exportMap, absOutDir);
    }
  }

  return exportMap;
}
