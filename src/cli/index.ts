import indentString from 'indent-string';
import { buildExportTree } from './build_export_tree.js';
import { DEFAULT_MATCH_EXTENSION, DEFAULT_SOURCE_DIR } from './config.js';
import { getConfig } from './config_loader.js';
import { findFunctionFiles } from './find_function_files.js';
import { generateIndexFile } from './generate_index_file.js';
import { parseFunctionFile } from './parse_function_files.js';
import { getAbsSourceDirPath } from './paths.js';
import { styledConsoleOutput } from './styled_console_log.js';
import { validateFunctions } from './validate_functions.js';

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

    if ('outDir' in config) {
      styledConsoleOutput.error('`outDir` is no longer supported. Remove it from ffse.config.js: index.gen.js now imports functions relative to itself.');
      return 1;
    }

    const absSourcePath = getAbsSourceDirPath(cwd, config.sourceDir);
    styledConsoleOutput.info(`Resolved source code path to: ${absSourcePath}`);

    if (verbose) {
      const sourceDir = config.sourceDir ?? DEFAULT_SOURCE_DIR;
      const matchExtension = config.matchExtension ?? DEFAULT_MATCH_EXTENSION;
      styledConsoleOutput.info(`Searching for .${matchExtension} files in ${sourceDir}/`);
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

    const issues = validateFunctions(functions);
    if (issues.length > 0) {
      const entries = issues.map(issue => `- ${issue.message}\n${indentString(issue.filePaths.join('\n'), 4)}`);
      styledConsoleOutput.error(`Found ${issues.length} problem(s) with your functions:\n\n${indentString(entries.join('\n'), 2)}`);
      return 1;
    }

    if (verbose) {
      for (const fn of functions) styledConsoleOutput.info(`${fn.exportKey} (from "${fn.filePath}")`);
    }

    if (dryRun) {
      styledConsoleOutput.success(`Dry run complete! ${functionCount} function(s) found to export.`);
      return 0;
    }

    const exportTree = buildExportTree(functions);
    await generateIndexFile(absSourcePath, functions, exportTree, config);

    const timing = verbose ? ` in ${Math.round(performance.now() - startTime)}ms` : '';
    styledConsoleOutput.success(`[ffse] ✅ Success! Exported ${functionCount} function(s)${timing}`);
    return 0;
  } catch (error) {
    styledConsoleOutput.error(`${error instanceof Error ? error.stack : error}`);
    return 1;
  }
}
