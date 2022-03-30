import { existsSync, mkdirSync, readFile, readFileSync } from 'fs';
import SuperSlicer from './lib/superslicer.js';
import Logger from './lib/logger.js';
import { resolve } from 'path';
import { argv, cwd } from 'process';
import Set from './lib/set.js';

const PlaterFlow = class PlaterFlow {

    async getBaseconfig() {
        return this.getJsonFromFile(this.getFileNameFromArg(3, './settings.js'));
    }

    getFileNameFromArg(nr, defaultFile) {
        return argv[nr] == undefined ? defaultFile : resolve(cwd()+"/"+argv[nr]);
    }

    async getPrintConfig() {
        const file = this.getFileNameFromArg(2, './prints.js');
        return this.getJsonFromFile(file);
    }

    async getJsonFromFile(file) {
        const contents = readFileSync(file);
        return JSON.parse(contents);
    }

    async run() {
        let baseconfig = await this.getBaseconfig();
        let config = await this.getPrintConfig();
        
        const enableDebug = argv.indexOf('--debug') != -1;
        
        const logger = new Logger(enableDebug);

        if ( existsSync(config.baseFolder) ) {
            logger.info("Output folder already exists (probably from previous run) - clear it first");
            // process.exit(-1);
        } else {
            mkdirSync(config.baseFolder);
        }
        
        const superSlicer = new SuperSlicer(baseconfig.superslicer.location, logger, (baseconfig.superslicer.maxConcurrent || 1));

        for (const set of config.sets) {
            const setToProcess = new Set(baseconfig, set, config, superSlicer, logger);
            await setToProcess.process();
        }
    }
}

const app = new PlaterFlow();
app.run();