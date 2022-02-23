const NodeStl = require("node-stl");
const BinPacking2D = require('binpackingjs').BP2D;
const { Bin, Box, Packer } = BinPacking2D;
const fs = require('fs');

module.exports = class PlaterJs {
	constructor(superslicer, profiles, outputDir, logger) {
        this.superslicer = superslicer;
        this.profiles = profiles;
        this.outputDir = outputDir;
        this.logger = logger;
	}

    enrichWithStl(input, margin) {
        input.forEach((result, i) => {
            var stl = new NodeStl(fs.readFileSync(result.name));
            input[i].width = stl.boundingBox[0] + 2*margin;
            input[i].height = stl.boundingBox[1] + 2*margin;
            input[i].stl = stl;
        });
        return input;
    }

    explodeNumberOfTimes(input) {
        let results = [];

        input.forEach((result, i) => {
            for (let i = 0; i < result.times; i++) {
                results.push({
                    ...result,
                    instance: i
                })
            }
        });
        return results;
    }

    resetXy(bins, margin) {
        let latest = undefined;

        bins.forEach((bin, i) => {
            if ( bin.boxes.length > 0 ) {
                bin.boxes.forEach(box => {
                    const x = box.y + margin;
                    const y = box.x + margin;
                    latest = this.superslicer.resetXy(this.profiles, box.item.name, this.outputDir+'/plate_'+i+'_object_x' + box.item.instance + '_'+box.item.file, x, y);
                });
            }
        });
        return latest;
    }

    createPlates(bins) {
        return new Promise((res, rej) => {
            let latest = undefined;
            const plates = [];
        
            bins.forEach((bin, i) => {
                if ( bin.boxes.length > 0 ) {
                    const boxes = bin.boxes.map(box => this.outputDir+'/plate_'+i+'_object_x' + box.item.instance + '_'+box.item.file);
                    const plateName = this.outputDir+'/plate_'+i+'.stl';
                    plates.push({
                        file: plateName,
                        fileOnly: 'plate_'+i+'.stl',
                        number: i
                    });

                    latest = this.superslicer.combine(this.profiles, boxes, plateName);
                    latest.then(() => {
                        this.logger.info("combined to " + plateName)
                    })
                }
            });

            latest.then(() => {
                this.logger.info("all plates created")
                res(plates);
            });
        });
    }

    plater(input, maxWidth, maxHeight, margin) {
        return new Promise((res, rej) => {
            input = this.enrichWithStl(input, margin);
        
            input = this.explodeNumberOfTimes(input);

            const bins = this.pack(input, maxWidth, maxHeight);

            this.resetXy(bins, margin).then(() => {
                this.logger.info("all xy coordinates on stls set - combining to plates");
           
                this.createPlates(bins).then((plates) => {
                    res(plates)
                });   
            })
        });
    }

    pack(input, maxWidth, maxHeight) {
        let numberOfPlatesTrying = 1;

        let bins = [];
        let boxes = [];

        while(true) {
            this.logger.info("Trying to plate in " + numberOfPlatesTrying + " plates");

            // create bins
            bins = [];
            for (let i = 0; i < numberOfPlatesTrying; i++) {
                bins.push(new Bin(maxWidth, maxHeight));
            }

            // create boxes
            boxes = input.map(r => {
                var b = new Box(r.height, r.width, true);
                b.item = r;
                return b;
            });

            let packer = new Packer(bins);
            packer.pack(boxes);

            let allBoxesPacked = true;
            boxes.forEach(box => {
                if ( box.packed == false ) {
                    allBoxesPacked = false;
                }
            })

            if ( allBoxesPacked ) {
                return bins;
            } else {
                numberOfPlatesTrying++;
            }
        }
    }
}