
export function getUnexpectedTargetNameErrorMessage(name: string) {
  return `Unexpected function target name: "${name}". Expected pattern: one or more alphanumeric groups separated by dashes.`;
}

/**
 * Returns the function target ID for the currently executing instance by inspecting
 * environment variables, typically set by Firebase Functions or Cloud Run.
 *
 * It checks the `FUNCTION_TARGET` environment variable first, and if it's not set,
 * falls back to `K_SERVICE`. The latter returns the function name in lowercase, as is
 * the {@link https://github.com/firebase/firebase-functions/issues/1279#issuecomment-1297447202|documented behavior of Cloud Run}.
 *  This fallback is necessary because Cloud Run may provide
 * the function name through `K_SERVICE`, often in lowercase and with hyphens.
 * Hyphens are replaced with dots, and the result is lowercased to ensure consistency.
 *
 * @param processEnv - The environment object, typically `process.env`, from which
 * target function identifiers are resolved.
 * @returns The resolved target ID in dot notation, or `null` if no ID could be found.
 *
 * See the list of reserved environment variables: https://firebase.google.com/docs/functions/config-env?gen=1st#reserved-names
 */
export function getInstanceTargetId(processEnv: NodeJS.ProcessEnv): string | null {
  const target = processEnv.FUNCTION_TARGET || processEnv.K_SERVICE;

  if (!target) return null;

  const isValidPattern = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(target);
  if (!isValidPattern) {
    throw new Error(
      getUnexpectedTargetNameErrorMessage(target),
    );
  }

  return target.replaceAll('-', '.').toLowerCase();
}