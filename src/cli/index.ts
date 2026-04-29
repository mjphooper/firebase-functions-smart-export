import { DEFAULT_MATCH_EXTENSION, DEFAULT_OUT_DIR, DEFAULT_SOURCE_DIR } from './config.js';
import { getConfig } from './config_loader.js';
import { findFunctionFiles } from './find_function_files.js';
import { generateIndexFile } from './generate_index_file.js';
import { findDuplicateFunctions, findOversizedFunctions, FUNCTION_NAME_CHARACTER_LIMIT, parseFunctionFile } from './parse_function_files.js';
import { getAbsSourceDirPath } from './paths.js';
import { styledConsoleOutput } from './styled_console_log.js';

export async function main({
  dryRun = false,
  verbose = false,
  cwd = process.cwd(),
}: { dryRun?: boolean; verbose?: boolean; cwd?: string } = {}): Promise<number> {
  try {
    styledConsoleOutput.info('⚡️ Running Firebase Functions Smart Export (FFSE)...', { skipPrefix: true });

    const startTime = performance.now();
    const config = await getConfig(cwd);

    if (verbose) {
      const hasCustomConfig = Object.keys(config).length > 0;
      if (hasCustomConfig) styledConsoleOutput.info('⚙️ Custom config loaded from ffse.config.js');
    }

    const absSourcePath = getAbsSourceDirPath(cwd, config.sourceDir);
    styledConsoleOutput.info(`Resolved source code path to: ${absSourcePath}`);

    if (verbose) {
      const sourceDir = config.sourceDir ?? DEFAULT_SOURCE_DIR;
      const outDir = config.outDir ?? DEFAULT_OUT_DIR;
      const matchExtension = config.matchExtension ?? DEFAULT_MATCH_EXTENSION;
      styledConsoleOutput.info(`Searching for .${matchExtension} files in ${sourceDir}/, outputting to ${outDir}/`);
    }

    const { files, hasMixedFileTypes } = findFunctionFiles(absSourcePath, config.matchExtension);

    if (hasMixedFileTypes) {
      styledConsoleOutput.warn(
        'Found both .ts and .js function files. Set `allowJs: true` in tsconfig.json to include .js files in compilation.'
      );
    }

    const functionCount = files.length;

    if (functionCount === 0) {
      styledConsoleOutput.warn('No functions found to export. Skipping file generation.');
      return 0;
    }

    if (verbose) {
      styledConsoleOutput.info(`${files.length} function(s) found.`);
      for (const file of files) styledConsoleOutput.info(file);
    }

    const functions = files.map(file => parseFunctionFile(file, config));

    const oversized = findOversizedFunctions(functions, FUNCTION_NAME_CHARACTER_LIMIT);
    if (oversized.length > 0) {
      const lines = oversized.map(fn => `  - ${fn.exportKey} (${fn.filePath})`);
      throw new Error(
        `Function names exceed the ${FUNCTION_NAME_CHARACTER_LIMIT} character limit:\n${lines.join('\n')}`
      );
    }

    const duplicates = findDuplicateFunctions(functions);
    if (duplicates.length > 0) {
      const lines = duplicates.map(group =>
        `  - ${group.map(fn => `${fn.exportKey} (${fn.filePath})`).join(', ')}`
      );
      throw new Error(
        `Conflicting function names found:\n${lines.join('\n')}\n\n` +
        `Firebase function names must be unique within a project, ignoring case. ` +
        `Please change either your file structure or "ffse.config.json" to resolve the conflict.`
      );
    }

    if (verbose) {
      for (const fn of functions) styledConsoleOutput.info(`${fn.exportKey} (from "${fn.filePath}")`);
    }

    if (dryRun) {
      styledConsoleOutput.success(`Dry run complete! ${functionCount} function(s) found to export.`);
      return 0;
    }

    await generateIndexFile(absSourcePath, functions, config);

    const timing = verbose ? ` in ${Math.round(performance.now() - startTime)}ms` : '';
    styledConsoleOutput.success(`[ffse] ✅ Success! Exported ${functionCount} function(s)${timing}`);
    return 0;
  } catch (error) {
    styledConsoleOutput.error(`${error instanceof Error ? error.stack : error}`);
    return 1;
  }
}
