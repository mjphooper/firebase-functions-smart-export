import { argv } from 'process';
import { getConfig } from '../shared/config_loader.js';
import { findFunctionFiles } from '../shared/find_function_files.js';
import { getAbsSourceDirPath } from '../shared/paths.js';
import { styledConsoleOutput } from './styled_console_log.js';
import { generateIndexFile } from './generate_index_file.js';
import { validateFunctions } from './validate_functions.js';
import { Reporter } from './reporter.js';
const HELP_MESSAGE = `
Usage:
  npx ffse [options]

Options:
  \x1b[36m--dry-run\x1b[0m     Print output without writing files
  \x1b[36m--verbose\x1b[0m     Show extra logs
  \x1b[36m--help\x1b[0m        Show this message
`;
function parseCliFlags(argv) {
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
        reporter.sourcePathResolved(absSourcePath);
        reporter.searchStarted(config);
        const { files, hasMixedFileTypes } = findFunctionFiles(absSourcePath, config.matchExtension);
        if (hasMixedFileTypes) {
            styledConsoleOutput.warn('Found both .ts and .js function files. Set `allowJs: true` in tsconfig.json to include .js files in compilation.');
        }
        const functionCount = files.length;
        if (functionCount === 0) {
            reporter.noFunctionsFound();
            process.exit(0);
        }
        reporter.filesFound(files);
        const { functions } = validateFunctions(files, config);
        reporter.functionsValidated(functions);
        if (dryRun) {
            reporter.dryRunComplete(functionCount);
            process.exit(0);
        }
        await generateIndexFile(absSourcePath, functions, config);
        reporter.success(functionCount, startTime);
        process.exit(0);
    }
    catch (error) {
        reporter.error(error);
        process.exit(1);
    }
}
