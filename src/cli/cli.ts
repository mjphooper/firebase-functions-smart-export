import { argv } from 'process';
import { getConfig } from './config_loader.js';
import { findFunctionFiles } from './find_function_files.js';
import { getAbsSourceDirPath } from './paths.js';
import { styledConsoleOutput } from './styled_console_log.js';
import { generateIndexFile } from './generate_index_file.js';
import { validateFunctions } from './validate_functions.js';


const HELP_MESSAGE = `
Usage:
  npx ffse [options]

Options:
  \x1b[36m--dry-run\x1b[0m     Print output without writing files
  \x1b[36m--verbose\x1b[0m     Show extra logs
  \x1b[36m--help\x1b[0m        Show this message
`;

function parseCliFlags(argv: string[]) {
  return {
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose'),
    help: argv.includes('--help'),
  };
}

export async function main() {
  const { dryRun, verbose, help } = parseCliFlags(argv);

  try {
    if (help) {
      console.log(HELP_MESSAGE);
      process.exit(0);
    }

    styledConsoleOutput.info('⚡️ Running Firebase Functions Smart Export (FFSE)...', { skipPrefix: true });

    const startTime = performance.now();
    const config = await getConfig();

    if (verbose) {
      const hasCustomConfig = Object.keys(config).length > 0;
      if (hasCustomConfig) styledConsoleOutput.info('⚙️ Custom config loaded from ffse.config.js');
    }

    const absSourcePath = getAbsSourceDirPath(config.sourceDir);
    styledConsoleOutput.info(`Resolved source code path to: ${absSourcePath}`);

    if (verbose) {
      const sourceDir = config.sourceDir ?? 'src';
      const outDir = config.outDir ?? 'lib';
      const matchExtension = config.matchExtension ?? 'function';
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
      process.exit(0);
    }

    if (verbose) {
      styledConsoleOutput.info(`${files.length} function(s) found.`);
      for (const file of files) styledConsoleOutput.info(file);
    }

    const { functions } = validateFunctions(files, config);

    if (verbose) {
      for (const fn of functions) styledConsoleOutput.info(`${fn.functionId} (from "${fn.filePath}")`);
    }

    if (dryRun) {
      styledConsoleOutput.success(`Dry run complete! ${functionCount} function(s) found to export.`);
      process.exit(0);
    }

    await generateIndexFile(absSourcePath, functions, config);

    const timing = verbose ? ` in ${Math.round(performance.now() - startTime)}ms` : '';
    styledConsoleOutput.success(`[ffse] ✅ Success! Exported ${functionCount} function(s)${timing}`);
    process.exit(0);
  } catch (error) {
    styledConsoleOutput.error(`${error instanceof Error ? error.stack : error}`);
    process.exit(1);
  }
}
