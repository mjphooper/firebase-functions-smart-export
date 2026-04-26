/**
 * A nested object where each leaf is either:
 * - An `object`, representing a Firebase function created by the user.
 * - `undefined` if the function described by the ID key path does not need to be exported by this
 * functions instance.
 */
export type ExportMap = {
  [segment: string]: object | undefined | ExportMap;
};
