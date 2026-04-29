import { dset } from 'dset/merge';

/**
 * A nested object where each leaf is either:
 * - An `object`, representing a Firebase function created by the user.
 * - `undefined` if the function described by the ID key path does not need to be exported by this
 * functions instance.
 */
export type ExportMap = {
  [segment: string]: object | undefined | ExportMap;
};

/**
 * Builds an {@link ExportMap} from a flat list of `(exportKey, cloudFunction)` entries.
 *
 * Each `exportKey` is a dot-separated path (e.g. `"auth.onCreate"`) that becomes a
 * nested location in the returned map. Entries with overlapping prefixes are merged,
 * so `"auth.onCreate"` and `"auth.onDelete"` coexist under a shared `auth` object.
 *
 * @param entries - The flat list of cloud function exports to assemble.
 * @param entries[].exportKey - Dot-separated path describing where the function
 * should live in the export map.
 * @param entries[].cloudFunction - The Cloud Function object to place at that path.
 * @returns A nested {@link ExportMap} containing every entry.
 */
export function buildExportMap(
  entries: { exportKey: string; cloudFunction: object }[],
): ExportMap {
  const exportMap: ExportMap = {};
  for (const { exportKey, cloudFunction } of entries) {
    dset(exportMap, exportKey, cloudFunction);
  }
  return exportMap;
}
