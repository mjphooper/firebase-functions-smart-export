import { argv } from 'process';
import { getAbsSourceDirPath } from '../shared/paths.js';
import { generateIndexFile } from './codegen/generate_index_file.js';
import { generateRegistryFile } from './codegen/generate_registry_file.js';
import { getConfig } from './config_loader.js';
import { cleanupGeneratedFiles } from './filesystem/cleanup_generated_files.js';
import { findFunctionFiles } from './filesystem/find_function_files.js';
import { buildFunctionRegistry } from './function_registry/build_function_registry.js';
import { Reporter } from './reporter.js';


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
  const reporter = new Reporter(verbose);

  try {
    if (help) {
      console.log(HELP_MESSAGE);
      process.exit(0);
    }

    reporter.started();

    const startTime = performance.now();
    const config = await getConfig();
    const absSourcePath = getAbsSourceDirPath(config.sourceDir);

    reporter.customConfigLoaded(config);
    cleanupGeneratedFiles(config.sourceDir);
    reporter.sourcePathResolved(absSourcePath);
    reporter.searchStarted(config);

    const files = findFunctionFiles(absSourcePath, config.matchExtension);
    const functionCount = files.length;



    if (functionCount === 0) {
      reporter.noFunctionsFound();
      process.exit(0);
    }

    reporter.filesFound(files);

    const registry = buildFunctionRegistry(files, config);

    reporter.registryBuilt(registry);

    if (dryRun) {
      reporter.dryRunComplete(functionCount);
      process.exit(0);
    }

    generateRegistryFile(registry);
    generateIndexFile(absSourcePath, registry, config);

    reporter.success(functionCount, startTime);
    process.exit(0);
  } catch (error) {
    reporter.error(error);
    process.exit(1);
  }
}
