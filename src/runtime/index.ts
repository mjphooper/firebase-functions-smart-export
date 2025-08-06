import dlv from "dlv";
import { flattenFunctionRegistry } from "../shared/flatten_function_registry";
import { FunctionReference, FunctionRegistry } from "../shared/types/function_registry";
import { deepSetCloudFunction } from "./helpers/deep_set_cloud_function";
import { getInstanceTargetId } from "./helpers/get_instance_target_id";
import type { ExportMap } from "./types/export_map";


/**
 * Creates a map of function IDs to their corresponding Cloud Function exports.
 *
 * If the current instance's function target ID is set via environment variable,
 * it short-circuits to load only that function. Otherwise, it loads all
 * functions listed in the JSON registry.
 *
 * This is used to dynamically build the export object used in Firebase
 * Functions deployment, avoiding eager loading of all modules unless necessary.
 *
 * @returns A promise resolving to a map of function IDs to their exported
 * objects.
 */
export async function createExportMap(
  jsonRegistry: FunctionRegistry
): Promise<ExportMap> {

  const exportMap: ExportMap = {};

  const contextualDeepSetCloudFunction = (
    functionId: string,
    reference: FunctionReference,
  ) => deepSetCloudFunction(functionId, reference, exportMap);

  const targetId = getInstanceTargetId(process.env);

  if (targetId) {
    const reference = dlv(jsonRegistry, targetId);
    const isTargetRegistered = reference != undefined;

    if (!isTargetRegistered) {
      const https = await import('firebase-functions/https');
      throw new https.HttpsError(
        'failed-precondition',
        `Function ${targetId} is not registered. Have you run 'build' since adding the function?`,
      );
    }
    await contextualDeepSetCloudFunction(targetId, reference);
  } else {
    const flattenedRegistry = flattenFunctionRegistry(jsonRegistry);
    for (const id of Object.keys(flattenedRegistry)) {
      const reference = flattenedRegistry[id];
      await contextualDeepSetCloudFunction(id, reference);
    }
  }

  return exportMap;

}
