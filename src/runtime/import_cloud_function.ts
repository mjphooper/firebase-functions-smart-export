/**
 * Dynamically imports a compiled Cloud Function module and returns its default export.
 *
 * The default export is the contract this library enforces between user code and the
 * generated index — every function file must `export default` the Cloud Function it
 * defines. If the module is missing a default export, a `failed-precondition`
 * `HttpsError` is thrown with guidance for the user.
 *
 * @param absPath - Absolute path to the compiled `.js` module to import.
 * @returns A promise resolving to the module's default export.
 * @throws {import('firebase-functions/https').HttpsError} With code `failed-precondition`
 * if the imported module has no default export.
 */
export async function importCloudFunction(absPath: string): Promise<object> {
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
