const fs = require('fs');
const SuperSlicer = require('./lib/superslicer');
const PlaterFile = require('./lib/platerfile');
const Moonraker = require('./lib/moonraker')
const Logger = require('./lib/logger');
const DirectoryFile = require('./lib/directoryfile');
const resolve = require('path').resolve;
const process = require('process');

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

const Plater = require('./lib/plater');
const logger = new Logger();

const ss = new SuperSlicer(baseconfig.superslicer.location, logger, (baseconfig.superslicer.maxConcurrent || 1));
const pf = new PlaterFile();
const df = new DirectoryFile();

const PlaterFlow = class PlaterFlow {
    constructor() {
        this.moonraker = new Moonraker(baseconfig.moonraker.ip, (baseconfig.moonraker.maxConcurrent || 1));
    }

    run() {
        if ( fs.existsSync(config.baseFolder) ) {
            logger.info("Output folder already exists (probably from previous run) - clear it first");
            // process.exit(-1);
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

    createHalves(halves, profiles, set, setDir) {
        const promises = [];
        halves.forEach((plate, index) => {
            logger.info("create half plates for set " + set.name);

            const halfOne = plate.slice(0, Math.floor(plate.length/2)).map(e => e.file);
            const halfTwo = plate.slice(Math.floor(plate.length/2)).map(e => e.file);

            promises.push(ss.combine(profiles, halfOne, setDir+"/"+set.name+"_platehalf_"+index+"_half_1.stl"));
            promises.push(ss.combine(profiles, halfTwo, setDir+"/"+set.name+"_platehalf_"+index+"_half_2.stl"));
        });
        return Promise.all(promises);
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

        const threads = (baseconfig.plater.threads || 1);
        const plater = new Plater(baseconfig.plater.location, threads, setDir, logger);
        
        plater.plater(files, plateSettings.width, plateSettings.height, plateSettings.spacing).then(plates => {
            
            logger.info(plates.plates.length + " plates created for set " + set.name)

            let halfCreation = Promise.resolve();
            if ( (set.createHalfPlates || false) ) {
                logger.info("going to create half plates");
                halfCreation = this.createHalves(plates.info, profiles, set, setDir);
            }

            halfCreation.then(() => {
                this.slicePlates(plates.plates, profiles, set, setDir).then(() => {

                    logger.info("done slicing all plates for " + set.name);

                    if ( config.uploadToFolder != undefined ) {
                        logger.info("uploading plates for " + set.name);

                        this.uploadFiles(plates.plates, set, setDir).then(() => {
                            logger.info("done uploading all plates for " + set.name);

                            this.getInfo(plates.plates, set, setDir).then(info => {
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
                });
            });
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