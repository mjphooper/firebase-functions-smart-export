// src/runtime/index.ts
import { join as join2 } from "path";

// src/shared/paths.ts
import { join, resolve } from "path";
function getAbsProjectRootPath() {
  return resolve(process.cwd());
}

// node_modules/dset/merge/index.mjs
function merge(a, b, k) {
  if (typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (k = 0; k < b.length; k++) {
        a[k] = merge(a[k], b[k]);
      }
    } else {
      for (k in b) {
        if (k === "__proto__" || k === "constructor" || k === "prototype") break;
        a[k] = merge(a[k], b[k]);
      }
    }
    return a;
  }
  return b;
}
function dset(obj, keys, val) {
  keys.split && (keys = keys.split("."));
  var i = 0, l = keys.length, t = obj, x, k;
  while (i < l) {
    k = "" + keys[i++];
    if (k === "__proto__" || k === "constructor" || k === "prototype") break;
    t = t[k] = i === l ? merge(t[k], val) : typeof (x = t[k]) === typeof keys ? x : keys[i] * 0 !== 0 || !!~("" + keys[i]).indexOf(".") ? {} : [];
  }
}

// src/runtime/build_export_map.ts
function buildExportMap(entries) {
  const exportMap = {};
  for (const { exportKey, cloudFunction } of entries) {
    dset(exportMap, exportKey, cloudFunction);
  }
  return exportMap;
}

// src/runtime/get_instance_target_id.ts
function getUnexpectedTargetNameErrorMessage(name) {
  return `Unexpected function target name: "${name}". Expected pattern: one or more alphanumeric groups separated by dots (.) or dashes (-).`;
}
function getInstanceTargetId(processEnv) {
  const target = processEnv.FUNCTION_TARGET || processEnv.K_SERVICE;
  if (!target) return null;
  const targetId = target.replaceAll("-", ".").toLowerCase();
  const isValidPattern = /^[a-z0-9]+(\.[a-z0-9]+)*$/.test(targetId);
  if (!isValidPattern) {
    throw new Error(
      getUnexpectedTargetNameErrorMessage(target)
    );
  }
  return targetId;
}

// src/runtime/import_cloud_function.ts
async function importCloudFunction(absPath) {
  const module = await import(absPath);
  const hasDefaultExport = module.default != void 0;
  if (!hasDefaultExport) {
    const https = await import("firebase-functions/https");
    throw new https.HttpsError(
      "failed-precondition",
      `Function at path ${absPath} has no default export. Did you forget to add "export default" to the function definition?`
    );
  }
  return module.default;
}

// src/runtime/index.ts
async function createExportMap(functionMap, deps = {
  getInstanceTargetId,
  importCloudFunction,
  buildExportMap,
  getAbsProjectRootPath
}) {
  const targetId = deps.getInstanceTargetId(process.env);
  const projectRoot = deps.getAbsProjectRootPath();
  if (targetId) {
    const entry = Object.entries(functionMap).find(
      ([exportKey2]) => exportKey2.toLowerCase() === targetId
    );
    if (!entry) {
      const https = await import("firebase-functions/https");
      throw new https.HttpsError(
        "not-found",
        `Function "${targetId}" not found. Have you regenerated index.gen.js?`
      );
    }
    const [exportKey, relPath] = entry;
    return deps.buildExportMap([{
      exportKey,
      cloudFunction: await deps.importCloudFunction(join2(projectRoot, relPath))
    }]);
  }
  const entries = await Promise.all(
    Object.entries(functionMap).map(async ([exportKey, relPath]) => ({
      exportKey,
      cloudFunction: await deps.importCloudFunction(join2(projectRoot, relPath))
    }))
  );
  return deps.buildExportMap(entries);
}
export {
  createExportMap
};
