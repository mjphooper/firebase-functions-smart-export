var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dlv/dist/dlv.js
var require_dlv = __commonJS({
  "node_modules/dlv/dist/dlv.js"(exports, module) {
    module.exports = function(t, e, l, n, o) {
      for (e = e.split ? e.split(".") : e, n = 0; n < e.length; n++) t = t ? t[e[n]] : o;
      return t === o ? l : t;
    };
  }
});

// src/runtime/index.ts
var import_dlv = __toESM(require_dlv(), 1);

// src/shared/types/function_registry.ts
function isFunctionReference(value) {
  return Array.isArray(value) && typeof value[0] === "string" && (value.length === 1 || typeof value[1] === "string");
}

// src/shared/flatten_function_registry.ts
function flattenFunctionRegistry(registry) {
  const flatRecord = {};
  function recursiveTraverseAndFlatten(registry2, currentPath = []) {
    for (const [key, value] of Object.entries(registry2)) {
      const thisPath = [...currentPath, key];
      if (isFunctionReference(value)) {
        flatRecord[thisPath.join(".")] = value;
      } else {
        recursiveTraverseAndFlatten(value, thisPath);
      }
    }
  }
  recursiveTraverseAndFlatten(registry);
  return flatRecord;
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

// src/runtime/helpers/deep_set_cloud_function.ts
import { join as join2 } from "path";

// src/shared/paths.ts
import { join, resolve } from "path";
function getAbsProjectRootPath() {
  return resolve(process.cwd());
}

// src/runtime/helpers/import_cloud_function.ts
async function importCloudFunction(relPath) {
  const module = await import(relPath);
  const hasDefaultExport = module.default != void 0;
  if (!hasDefaultExport) {
    const https = await import("firebase-functions/https");
    throw new https.HttpsError(
      "failed-precondition",
      `Function at path ${relPath} has no default export. Did you forget to add "export default" to the function definition?`
    );
  }
  return module.default;
}

// src/runtime/helpers/deep_set_cloud_function.ts
var DEFAULT_COMPILED_DIRECTORY_RELATIVE_PATH = "lib";
async function deepSetCloudFunction(functionId, reference, exportMap) {
  const [relPath, exportKey] = reference;
  const absPath = join2(
    getAbsProjectRootPath(),
    DEFAULT_COMPILED_DIRECTORY_RELATIVE_PATH,
    relPath
  );
  const cloudFunction = await importCloudFunction(absPath);
  const exportFunctionName = exportKey ?? functionId;
  dset(exportMap, exportFunctionName, cloudFunction);
}

// src/runtime/helpers/get_instance_target_id.ts
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

// src/runtime/index.ts
async function createExportMap(jsonRegistry) {
  const exportMap = {};
  const contextualDeepSetCloudFunction = (functionId, reference) => deepSetCloudFunction(functionId, reference, exportMap);
  const targetId = getInstanceTargetId(process.env);
  if (targetId) {
    const reference = (0, import_dlv.default)(jsonRegistry, targetId);
    const isTargetRegistered = reference != void 0;
    if (!isTargetRegistered) {
      const https = await import("firebase-functions/https");
      throw new https.HttpsError(
        "failed-precondition",
        `Function ${targetId} is not registered. Have you run 'build' since adding the function?`
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
export {
  createExportMap
};
