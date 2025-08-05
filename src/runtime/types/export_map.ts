import { FunctionGroupOrName } from "../../shared/types/function_id";

/**
 * A nested object similar in structure to {@link FunctionRegistry} except each leaf is either:
 * - An `object`, representing a Firebase function created by the user.
 * - `undefined` if the function described by the ID key path does not need to be exported by this
 * functions instance.
 */
export type ExportMap = {
  [segment: FunctionGroupOrName]: (object | undefined) | ExportMap;
};
