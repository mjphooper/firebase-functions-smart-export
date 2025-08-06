import chalk from 'chalk';
import { join } from 'path';
import { argv } from 'process';
import { flattenFunctionRegistry } from '../shared/flatten_function_registry.js';
import { getAbsProjectRootPath } from '../shared/project_root_path.js';
import { styledConsoleOutput } from '../shared/styled_console_log.js';
import { generateIndexFile } from './codegen/generate_index_file.js';
import { generateRegistryFile } from './codegen/generate_registry_file.js';
import { getConfig } from './config_loader.js';
import { GENERATED_INDEX_FILE_NAME } from './constants/generated_index_file_name.js';
import { REGISTRY_FILE_NAME } from './constants/registry_file_name.js';
import { getAbsGeneratedIndexPath } from './filesystem/abs_generated_index_path.js';
import { deleteIndexFile } from './filesystem/delete_index_file.js';
import { deleteRegistryFile } from './filesystem/delete_registry_file.js';
import { findFunctionFiles } from './filesystem/find_function_files.js';
import { buildFunctionRegistry } from './function_registry/build_function_registry.js';


const HELP_MESSAGE = `
Usage:
  npx ffse [options]

Options:
  ${chalk.cyan('--dry-run')}     Print output without writing files
  ${chalk.cyan('--verbose')}     Show extra logs
  ${chalk.cyan('--help')}        Show this message
`;

function parseCliFlags(argv: string[]) {
  return {
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose'),
    help: argv.includes('--help'),
  };

}

export async function main() {
  try {
    const { dryRun, verbose, help } = parseCliFlags(argv);

    if (help) {
      console.log(HELP_MESSAGE);
      process.exit(0);
    }

    const startTime = performance.now()

    deleteRegistryFile();
    deleteIndexFile();

    const config = await getConfig(getAbsProjectRootPath());

    if (verbose) {
      styledConsoleOutput.info(
        config ? 'Config file loaded.' : 'No "ffse.config.json" file found.'
      );
    }

    const globWorkingDirectory = join(getAbsProjectRootPath(), 'lib');

    if (verbose) {
      styledConsoleOutput.info(`Searching '${globWorkingDirectory}' for ".function.js" files...`);
    }

    const files = findFunctionFiles(globWorkingDirectory, config.matchExtension);

    if (verbose) {
      styledConsoleOutput.info(`${files.length} file(s) found.`);
      for (const file of files) {
        styledConsoleOutput.info(file);
      }
    }

    const registry = buildFunctionRegistry(files, config);

    const flattenedRegistry = flattenFunctionRegistry(registry);

    const registrySize = Object.keys(flattenedRegistry).length;

    const isRegistryEmpty = registrySize === 0;

    if (verbose) {
      for (const id of Object.keys(flattenedRegistry)) {
        const reference = flattenedRegistry[id];
        styledConsoleOutput.info(`${id} (from "${reference[0]}")`);
      }
    }

    if (dryRun) {
      styledConsoleOutput.success(
        `✅ Dry run complete! ${registrySize} function(s) found to export in ${files.length} file(s).${verbose && !isRegistryEmpty ? ' To see the full list of exported functions, run with "--verbose".' : ''}`,
      )
      process.exit(0);
    }

    if (isRegistryEmpty) {
      styledConsoleOutput.warn('No functions found to export. Skipping file generation.');
      process.exit(0);
    }


    generateRegistryFile('', registry);

    if (verbose) styledConsoleOutput.info(`Generated "${REGISTRY_FILE_NAME}".`)

    await generateIndexFile(
      await getAbsGeneratedIndexPath(),
      registry,
      config,
    );

    if (verbose) styledConsoleOutput.info(`Generated "${GENERATED_INDEX_FILE_NAME}".`)


    const endTime = performance.now()
    const timeTakenMs = endTime - startTime;
    styledConsoleOutput.success(`Success! Exported ${registrySize} function(s) in ${timeTakenMs}ms`);

    process.exit(0)
  } catch (error) {
    styledConsoleOutput.error(`${error instanceof Error ? error.stack : error}`);
    process.exit(1)
  }
}
