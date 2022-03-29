const Slicer = require("./slicer");
const SuperSlicer = require("./superslicer");
const fs = require('fs');
const Plater = require("./plater");
const DirectoryFile = require('./directoryfile');
const PlaterFile = require('./platerfile');

const df = new DirectoryFile();
const pf = new PlaterFile();
const resolve = require('path').resolve;

const Moonraker = require('./moonraker');

module.exports = class Set {

    /**
     * @param {Array} set 
     * @param {string} baseFolder 
     * @param {SuperSlicer} superSlicer 
     */
    constructor(baseconfig, set, config, superSlicer, logger) {
        this.set = set;
        this.baseFolder = config.baseFolder;
        this.baseconfig = baseconfig;
        this.config = config;
        this.logger = logger;

        this.plateSettings = this.getPlateSettings();

        this.slicer = new Slicer(superSlicer, this.getProfiles());
        this.setDir = this.ensureOutputDirectoryExists(this.set.name, this.baseFolder);
    }

    async process() {
        const sourceDir = this.setDir+"/source";

        const printer = this.getPrinter();
        this.moonraker = new Moonraker(printer.ip, (printer.maxConcurrent || 1));
        
        if ( !fs.existsSync(sourceDir) ) {
            const files = this.getFiles();
            fs.mkdirSync(sourceDir);
            this.copyFiles(files, sourceDir);
        }

        let files = [];
        df.recursiveRead(sourceDir, file => {
            file.times = 1;
            files.push(file);
        });

        const threads = (this.baseconfig.plater.threads || 1);
        const plater = new Plater(this.baseconfig.plater.location, threads, this.setDir, this.logger);

        // rotation
        const rotationNeeded = (this.set.rotate || 0);
        const dontRotate = rotationNeeded != 0;
        await this.rotate(files, rotationNeeded);

        // scaling
        const scalingNeeded = (this.set.scale || 100);
        await this.scale(files, scalingNeeded);

        const plates = await plater.plater(files, this.plateSettings.width, this.plateSettings.height, this.plateSettings.spacing, dontRotate);
        
        this.log(plates.plates.length + " plate(s) created")

        let halves = [];
        
        if ( (this.set.createHalfPlates || false) ) {
            this.log("going to create plates with half of a full plate");
            halves = await this.createHalves(plates.info);
        }

        const baseColor = this.set.color || 0xff0000;

        this.log("slicing full plates...");
        await this.slicePlates(plates.plates, baseColor);

        this.log("slicing half plates...");
        await this.slicePlates(halves, baseColor);
        
        this.log("done slicing all plates");

        if ( this.config.uploadToFolder != undefined ) {
            this.loading("uploading half plates...");

            // half plates
            await this.uploadFiles(halves, this.config.uploadToFolder+"/halves/");
            this.log("done uploading all half plates");

            // full plates
            this.loading("uploading full plates...");

            await this.uploadFiles(plates.plates, this.config.uploadToFolder)
            this.log("done uploading full plates");

            const info = await this.getInfo(plates.plates);

            let totalWeight = 0;
            let totalTime = 0;
            info.forEach(i => {
                totalWeight += i.result.filament_weight_total;
                totalTime += i.result.estimated_time;
            });

            this.log("total filament used is " + Math.round(totalWeight) + " gram");
            this.log("total time used is " + Math.round(totalTime/60) + " minutes");
        }
    }

    log(message) {
        this.logger.info("set " + this.set.name + ": " + message);
    }

    loading(message) {
        this.logger.loading("set " + this.set.name + ": " + message);
    }

    async slicePlates(plates, baseColor) {
        for ( const plate of plates ) {
            this.loading("slicing plate " + plate.file);
            await this.slicer.slice(plate.file, this.setDir+"/"+this.set.name+"_"+plate.fileOnly+".gcode", baseColor);
            this.log("done slicing plate " + plate.file);
        }
    }

    async createHalves(halves) {
        await this.resetForHalves(halves);

        let halveFiles = [];

        let index = 0;
        for ( const plate of halves ) {
            this.log("creating half plates");

            if ( plate.length < 2 ) {
                continue;
            }
            
            const halfOne = plate.slice(0, Math.floor(plate.length/2)).map(e => e.file);
            const halfTwo = plate.slice(Math.floor(plate.length/2)).map(e => e.file);

            const createHalfPlate = async (halve, nr) => {
                const fileName = this.set.name+"_platehalf_"+index+"_half_"+nr+".stl";
                const totalPath = this.setDir+"/" + fileName;
                halveFiles.push({ file: totalPath, fileOnly: fileName });
                return this.slicer.combine(halve, totalPath);
            };

            await createHalfPlate(halfOne, 1);
            await createHalfPlate(halfTwo, 2);

            index++;
        }
        return halveFiles;
    }

    async resetForHalves(halves) {
        for (const halfPlate of halves) {
            for (const f of halfPlate) {
                await this.slicer.resetXy(f.file, f.file, f.posX, f.posY, f.rotation);
            }
        }
    }

    async rotate(files, rotate) {
        for ( const file of files ) {
            let useRotation = rotate;
            let re = /\_r([0-9]+)/;
            const results = re.exec(file.file);
            if ( results ) {
                useRotation = parseInt(results[1]);
            }

            if ( useRotation != 0 ) {
                await this.slicer.rotate(file.name, file.name, useRotation);
            }
        }
    }

    async scale(files, scale) {
        for ( const file of files ) {
            let useScale = scale;
            let re = /\_s([0-9]+)/;
            const results = re.exec(file.file);
            if ( results ) {
                useScale = parseInt(results[1]);
            }

            if ( useScale != 100 ) {
                await this.slicer.scale(file.name, file.name, useScale);
            }
        }
    }

    getPlateSettings() {
        if ( this.set.plate != undefined ) {
            return this.set.plate;
        } else if ( this.config.plate != undefined ) {
            return this.config.plate;
        } else if ( this.baseconfig.plate != undefined ) {
            return this.baseconfig.plate;
        } else {
            this.exitWithMessage("no plates settings found in config or baseconfig");
        }
    }

    getProfiles() {
        if ( this.set.profiles != undefined ) {
            return this.set.profiles;
        } else if ( this.set.profile != undefined ) {
            return this.baseconfig.profiles[this.set.profile];
        } else if ( this.config.profiles != undefined ) {
            return this.config.profiles;
        } else if ( this.config.profile != undefined ) {
            return this.baseconfig.profiles[this.config.profile];
        } else {
            this.exitWithMessage("no profile settings found in config or baseconfig");
        }
    }

    getPrinter() {
        if ( this.set.printer != undefined ) {
            return this.baseconfig.printers[this.set.printer];
        } else if ( this.config.printer != undefined ) {
            return this.baseconfig.printers[this.config.printer];
        } else {
            this.exitWithMessage("no printer settings found in set or general config");
        }
    }

    exitWithMessage(message) {
        this.log(message);
        process.exit();
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

    ensureOutputDirectoryExists(name, baseFolder) {
        const setDir = resolve(baseFolder+'/'+name);
        if ( !fs.existsSync(setDir) ) {
            this.log("Created directory: " + name)
            fs.mkdirSync(setDir);
        }
        return setDir;
    }

    getFiles() {
        if ( this.set.source.type == 'platter' ) {
            return pf.parse(this.set.source.location);
        } else if ( this.set.source.type == 'directories' ) {
            return df.scan(this.set.source.directories, (this.set.source.includePattern || []), (this.set.source.excludePattern || []));
        }
        return [];
    }

    async uploadFiles(plates, uploadDir) {
        for (const plate of plates) {
            const file = this.setDir+"/"+this.set.name+"_"+plate.fileOnly+".gcode";
            await this.moonraker.uploadFile(file, uploadDir);
            this.log("uploading plate "+file);
        }
    }

    async getInfo(plates) {
        let info = [];
        for (const plate of plates) {
            const response = await this.moonraker.getInfo(this.config.uploadToFolder+"/"+this.set.name+"_"+plate.fileOnly+".gcode");
            const body = await response.json();
            info.push(body);
        }
        return info;
    }
}