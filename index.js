import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';

import PlaterFlow from './src/PlaterFlow.js';

const argv = yargs(hideBin(process.argv))
    .usage('$0 [options] --config <config file> --input <input config file>')
    .option('config', {
        alias: ['c'],
        describe: "Settings for PlaterFlow",
        requiresArg: true,
        config: true,
        // Wrap config in their own key for the parser
        configParser: (configPath) => ({platerFlowConfig: JSON.parse(readFileSync(configPath))}),
        demandOption: "A config is required" 
    })
    .option('input', {
        alias: ['i'],
        describe: "Settings for print files",
        requiresArg: true,
        config: true,
        // Wrap config in their own key for the parser
        configParser: (configPath) => ({inputConfig: JSON.parse(readFileSync(configPath))}),
        demandOption: "An input configuration is required"
    })
    .option('debug', {
        alias: ['v', 'd'],
        boolean: true,
        describe: "Turn on debug logging"
    })
    .help()
    .argv;

const platerFlow = new PlaterFlow(argv.platerFlowConfig, argv.inputConfig, argv.debug);
platerFlow.run();