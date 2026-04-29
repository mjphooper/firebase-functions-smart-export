import { join } from 'path';
import { buildExportMap, type ExportMap } from "./build_export_map.js";
import { getInstanceTargetId } from "./get_instance_target_id.js";
import { importCloudFunction } from "./import_cloud_function.js";

export async function createExportMap(
  functionMap: Record<string, string>,
  deps = {
    getInstanceTargetId,
    importCloudFunction,
    buildExportMap,
  },
): Promise<ExportMap> {
  const targetId = deps.getInstanceTargetId(process.env);
  const projectRoot = process.cwd();

  if (targetId) {
    const entry = Object.entries(functionMap).find(
      ([exportKey]) => exportKey.toLowerCase() === targetId,
    );
    if (!entry) {
      const https = await import('firebase-functions/https');
      throw new https.HttpsError(
        'not-found',
        `Function "${targetId}" not found. Have you regenerated index.gen.js?`,
      );
    }
    const [exportKey, relPath] = entry;
    return deps.buildExportMap([{
      exportKey,
      cloudFunction: await deps.importCloudFunction(join(projectRoot, relPath)),
    }]);
  }

  const entries = await Promise.all(
    Object.entries(functionMap).map(async ([exportKey, relPath]) => ({
      exportKey,
      cloudFunction: await deps.importCloudFunction(join(projectRoot, relPath)),
    })),
  );
  return deps.buildExportMap(entries);
}
