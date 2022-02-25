const fs = require('fs');
const SuperSlicer = require('./lib/superslicer');
// const PlaterJs = require('./lib/platerjs');
const PlaterFile = require('./lib/platerfile');
const Moonraker = require('./lib/moonraker')
const Logger = require('./lib/logger');
const DirectoryFile = require('./lib/directoryfile');
const resolve = require('path').resolve;

const baseconfig = require('./baseconfig.js');

const Plater = require('./lib/plater');
const ss = new SuperSlicer(baseconfig.superslicer.location, (baseconfig.superslicer.maxConcurrent || 1));
const pf = new PlaterFile();
const df = new DirectoryFile();
const logger = new Logger();

// load config
let config;
if ( process.argv[2] == undefined ) {
    config = require('./config.js');
} else {
    config = require(process.argv[2]);
}

const PlaterFlow = class PlaterFlow {
    constructor() {
        this.moonraker = new Moonraker(baseconfig.moonraker.ip, (baseconfig.moonraker.maxConcurrent || 1));
    }

    run() {
        if ( fs.existsSync(config.baseFolder) ) {
            logger.info("Output folder already exists (probably from previous run) - clear it first");
            process.exit(-1);
        } else {
            fs.mkdirSync(config.baseFolder);
        }

        config.sets.forEach(set => {
            this.processSet(set, config.baseFolder);
        });
    }

    getPlateSettings(set) {
        if ( set.plate != undefined ) {
            return set.plate;
        } else if ( config.plate != undefined ) {
            return config.plate;
        } else if ( baseconfig.plate != undefined ) {
            return baseconfig.plate;
        } else {
            this.exitWithMessage("no plates settings found in config or baseconfig");
        }
    }

    getProfiles(set) {
        if ( set.profiles != undefined ) {
            return set.profiles;
        } else if ( set.profile != undefined ) {
            return baseconfig.profiles[set.profile];
        } else if ( config.profiles != undefined ) {
            return config.profiles;
        } else if ( config.profile != undefined ) {
            return baseconfig.profiles[config.profile];
        } else {
            this.exitWithMessage("no profile settings found in config or baseconfig");
        }
    }

    exitWithMessage(message) {
        logger.info("no plate settings found")
        process.exit();
    }

    slicePlates(plates, profiles, set, setDir) {
        let latest = Promise.resolve();
        plates.forEach(plate => {
            logger.info("slicing plate " + plate.file + " for set " + set.name);
            latest = ss.slice(profiles, plate.file, setDir+"/"+set.name+"_"+plate.fileOnly+".gcode");
            latest.then(() => {
                logger.info("done slicing plate " + plate.file + " for set " + set.name);
            })
        });
        return latest;
    }

    uploadFiles(plates, set, setDir) {
        let latest = Promise.resolve();
        plates.forEach(plate => {
            latest = this.moonraker.uploadFile(setDir+"/"+set.name+"_"+plate.fileOnly+".gcode", config.uploadToFolder);
            latest.then(() => {
                logger.info("uploading plate "+(plate.number+1)+" for " + set.name);
            });
        });
        return latest;
    }

    getInfo(plates, set, setDir) {
        let info = [];
        let latest = Promise.resolve();
        plates.forEach(plate => {
            latest = this.moonraker.getInfo(config.uploadToFolder+"/"+set.name+"_"+plate.fileOnly+".gcode");
            latest.then(body => info.push(JSON.parse(body)));
        });

        return new Promise((res, rej) => {
            latest.then(() => {
                res(info)
            });
        });
    }

    processSet(set, baseFolder) {
        const setDir = this.ensureOutputDirectoryExists(set.name, baseFolder);
        
        const files = this.getFiles(set);

        const plateSettings = this.getPlateSettings(set);
        const profiles = this.getProfiles(set);

        // const plater = new PlaterJs(ss, profiles, setDir, logger);
        const plater = new Plater(baseconfig.plater.location, setDir, logger);
            
        plater.plater(files, plateSettings.width, plateSettings.height, plateSettings.spacing).then(plates => {
            
            logger.info(plates.length + " plates created for set " + set.name)

            this.slicePlates(plates, profiles, set, setDir).then(() => {

                logger.info("done slicing all plates for " + set.name);

                if ( config.uploadToFolder != undefined ) {
                    logger.info("uploading plates for " + set.name);

                    this.uploadFiles(plates, set, setDir).then(() => {
                        logger.info("done uploading all plates for " + set.name);

                        this.getInfo(plates, set, setDir).then(info => {
                            let totalWeight = 0;
                            let totalTime = 0;
                            info.forEach(i => {
                                totalWeight += i.result.filament_weight_total;
                                totalTime += i.result.estimated_time;
                            });

                            logger.info("total filament used is " + Math.round(totalWeight) + " gram for " + set.name);
                            logger.info("total time used is " + Math.round(totalTime/60) + " minutes for " + set.name);
                        });
                    });
                }
            })
        })

    }

    ensureOutputDirectoryExists(name, baseFolder) {
        const setDir = resolve(baseFolder+'/'+name);
        if ( !fs.existsSync(setDir) ) {
            logger.info("Created directory: " + name)
            fs.mkdirSync(setDir);
        }
        return setDir;
    }

    getFiles(set) {
        if ( set.source.type == 'platter' ) {
            return pf.parse(set.source.location);
        } else if ( set.source.type == 'directories' ) {
            return df.scan(set.source.directories, (set.source.includePattern || []), (set.source.excludePattern || []));
        }
        return [];
    }
}

const app = new PlaterFlow();
app.run();