#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import { checkConfig } from './commands/check';

// Load environment variables
dotenv.config();

// Simple color functions to replace chalk
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`
};

const program = new Command();

program
  .name('turnkey-copilot')
  .description('A smart assistant that fixes common Turnkey integration blockers and simulates policy behavior')
  .version('0.1.0');

program
  .command('check')
  .description('Check a Turnkey policy or configuration file for issues')
  .argument('<file>', 'Path to the policy JSON or config file')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (file, options) => {
    try {
      await checkConfig(file, options);
    } catch (error) {
      console.error(colors.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add a default action when no command is provided
program.addHelpText('after', `
Examples:
  $ turnkey-copilot check ./config.json
  $ turnkey-copilot check ./policy.json --verbose
`);

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}