#!/usr/bin/env node
import { Command } from 'commander';
import { main } from '../lib/cli.js';

const program = new Command()
  .name('ffse')
  .description('Smart, dynamic exporting for Firebase Functions.')
  .option('--dry-run', 'Print output without writing files', false)
  .option('--verbose', 'Show extra logs', false)
  .parse();

main(program.opts()).then(process.exit);
