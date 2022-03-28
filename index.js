const fs = require('fs');
const SuperSlicer = require('./lib/superslicer');
const Logger = require('./lib/logger');
const resolve = require('path').resolve;
const process = require('process');
const Set = require('./lib/set');

const PlaterFlow = class PlaterFlow {
    async run() {
        // load base config
        let baseconfig;
        if ( process.argv[3] == undefined ) {
            baseconfig = require('./baseconfig.js');
        } else {
            baseconfig = require(resolve(process.cwd()+"/"+process.argv[3]));
        }

        // load config
        let config;
        if ( process.argv[2] == undefined ) {
            config = require('./config.js');
        } else {
            config = require(resolve(process.cwd()+"/"+process.argv[2]));
        }

        const enableDebug = process.argv.indexOf('--debug') != -1;
        
        const logger = new Logger(enableDebug);

        if ( fs.existsSync(config.baseFolder) ) {
            logger.info("Output folder already exists (probably from previous run) - clear it first");
            // process.exit(-1);
        } else {
            fs.mkdirSync(config.baseFolder);
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