/**
 * Dynamically imports a Firebase Cloud Function from the given relative path.
 *
 * This is used to load function implementations on demand based on the metadata
 * provided in the registry file.
 */
export async function importCloudFunction(relPath: string): Promise<object> {
  const module = await import(relPath);
  const hasDefaultExport: boolean = module.default != undefined;

  if (!hasDefaultExport) {
    const https = await import('firebase-functions/https');
    throw new https.HttpsError(
      'failed-precondition',
      `Function at path ${relPath} has no default export. Did you forget to add "export default" to the function definition?`,
    );
  }

  return module.default;
}
