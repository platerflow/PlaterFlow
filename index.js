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
const { exit } = require('process');
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

    resetForHalves(halves, profiles) {
        let promises = [];
        halves.forEach((plate, index) => {
            plate.forEach(f => {
                promises.push(ss.resetXy(profiles, f.file, f.file, f.posX, f.posY, f.rotation));
            });
        });
        return Promise.all(promises);
    }

    createHalves(halves, profiles, set, setDir) {
        return new Promise((res, rej) => {
            if ( halves.length < 2 ) {
                res([]);
            }

            this.resetForHalves(halves, profiles).then(() => {
                let promises = [];
                let halveFiles = [];

                halves.forEach((plate, index) => {
                    logger.info("create half plates for set " + set.name);
                    const halfOne = plate.slice(0, Math.floor(plate.length/2)).map(e => e.file);
                    const halfTwo = plate.slice(Math.floor(plate.length/2)).map(e => e.file);

                    const createHalfPlate = (halve, nr) => {
                        const fileName = set.name+"_platehalf_"+index+"_half_"+nr+".stl";
                        const totalPath = setDir+"/" + fileName;
                        halveFiles.push({ file: totalPath, fileOnly: fileName });
                        return ss.combine(profiles, halve, totalPath);
                    };

                    promises.push(createHalfPlate(halfOne, 1));
                    promises.push(createHalfPlate(halfTwo, 2));
                });

                Promise.all(promises).then(() => res(halveFiles));
            });
        });
    }

    slicePlates(plates, profiles, set, setDir, baseColor) {
        let latest = Promise.resolve();
        plates.forEach(plate => {
            logger.info("slicing plate " + plate.file + " for set " + set.name);
            latest = ss.slice(profiles, plate.file, setDir+"/"+set.name+"_"+plate.fileOnly+".gcode", baseColor);
            latest.then(() => {
                logger.info("done slicing plate " + plate.file + " for set " + set.name);
            })
        });
        return latest;
    }

    uploadFiles(plates, set, setDir, uploadDir) {
        let latest = Promise.resolve();
        plates.forEach(plate => {
            const file = setDir+"/"+set.name+"_"+plate.fileOnly+".gcode";
            latest = this.moonraker.uploadFile(file, uploadDir);
            latest.then(() => {
                logger.info("uploading plate "+file+" for " + set.name);
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

    copyFiles(files, dir) {
        let fileI = 0;
        files.forEach(file => {
            for (let index = 0; index < file.times; index++) {
                fs.copyFileSync(file.name, dir+"/"+fileI+"_"+index+"_"+file.file);
                fileI++;
            }
        });
    }

    processSet(set, baseFolder) {
        const setDir = this.ensureOutputDirectoryExists(set.name, baseFolder);

        const sourceDir = setDir+"/source";
        
        if ( !fs.existsSync(sourceDir) ) {
            const files = this.getFiles(set);
            fs.mkdirSync(sourceDir);
            this.copyFiles(files, sourceDir);
        }

        let files = [];
        df.recursiveRead(sourceDir, file => {
            file.times = 1;
            files.push(file);
        });

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

            halfCreation.then(halves => {
                const slicing = [];

                const baseColor = set.color || 0xff0000;

                slicing.push(this.slicePlates(plates.plates, profiles, set, setDir, baseColor));
                slicing.push(this.slicePlates(halves, profiles, set, setDir, baseColor));
                
                Promise.all(slicing).then(() => {
                    logger.info("done slicing all plates for " + set.name);

                    if ( config.uploadToFolder != undefined ) {
                        logger.info("uploading plates for " + set.name);

                        console.log(halves);
                        console.log(plates.plates)
                        
                        // upload halves first
                        this.uploadFiles(halves, set, setDir, config.uploadToFolder+"/halves/").then(() => {
                            this.uploadFiles(plates.plates, set, setDir, config.uploadToFolder).then(() => {
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