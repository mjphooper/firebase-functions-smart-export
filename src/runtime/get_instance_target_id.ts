/**
 * Builds the error message thrown when a target name does not match the expected
 * `[a-z0-9]+(\.[a-z0-9]+)*` pattern. Exported so tests can assert against it.
 *
 * @param name - The raw target name as read from the environment.
 * @returns The formatted error message.
 */
export function getUnexpectedTargetNameErrorMessage(name: string): string {
  return `Unexpected function target name: "${name}". Expected pattern: one or more alphanumeric groups separated by dots (.) or dashes (-).`;
}

/**
 * Resolves the function target ID for the currently executing instance by inspecting
 * environment variables typically set by Firebase Functions or Cloud Run.
 *
 * `FUNCTION_TARGET` is preferred; if unset, falls back to `K_SERVICE`. The resolved
 * value is normalised to lowercase dot notation (hyphens become dots), matching the
 * {@link https://github.com/firebase/firebase-functions/issues/1279#issuecomment-1297447202 | documented behavior of Cloud Run}.
 *
 * See the list of reserved environment variables:
 * {@link https://firebase.google.com/docs/functions/config-env?gen=1st#reserved-names}.
 *
 * @param processEnv - The environment object, typically `process.env`, from which
 * target function identifiers are resolved.
 * @returns The resolved target ID in lowercase dot notation, or `null` if neither
 * variable is set.
 * @throws {Error} If the resolved target name does not match the expected pattern.
 */
export function getInstanceTargetId(processEnv: NodeJS.ProcessEnv): string | null {
  const target = processEnv.FUNCTION_TARGET || processEnv.K_SERVICE;

  if (!target) return null;

  const targetId = target.replaceAll('-', '.').toLowerCase();

  const isValidPattern = /^[a-z0-9]+(\.[a-z0-9]+)*$/.test(targetId);
  if (!isValidPattern) {
    throw new Error(
      getUnexpectedTargetNameErrorMessage(target),
    );
  }

  return targetId;
}
