import { existsSync, mkdirSync } from 'fs';

import Logger from './lib/logger.js';
import Set from './lib/set.js';
import SuperSlicer from './lib/superslicer.js';

export default class PlaterFlow {
    constructor(config, input, debug = false) {
        this.config = config;
        this.input = input;
        this.debug = debug;
    }

    checkForOutputFolder(logger) {
        if (this.input.baseFolder && existsSync(this.input.baseFolder)) {
            logger.info("Output folder already exists (probably from previous run) - clear it first");
        } else {
            mkdirSync(this.input.baseFolder);
        }
    }

    async run() {
        const logger = new Logger(this.debug);

        this.checkForOutputFolder(logger);

        const superSlicer = new SuperSlicer(this.config.superslicer.location, logger, (this.config.superslicer.maxConcurrent || 1));

        let processes = [];
        for (const set of this.input.sets) {
            const setToProcess = new Set(this.config, set, this.input, superSlicer, logger);
            processes.push(setToProcess.process());
        }

        // Asyncronously process all processes
        await Promise.all(processes);
        logger.info('Done processsing');
    }
}