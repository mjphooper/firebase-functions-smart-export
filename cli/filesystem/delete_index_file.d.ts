/**
 * Deletes the generated index file if it exists.
 *
 * This function removes the previously generated index file,
 * if one is present at the configured path. It should be run
 * before regeneration to avoid stale or partial output.
 *
 * This operation is silent if the file does not exist.
 */
export declare function deleteIndexFile(): Promise<void>;
