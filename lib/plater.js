const fs = require('fs');
const ExternalProgram = require('./external');

module.exports = class Plater extends ExternalProgram {
	constructor(platerCliLocation, threads, outputDir, logger) {
        super(platerCliLocation, logger, 'plater');
        this.outputDir = outputDir;
        this.logger = logger;
        this.threads = threads;
	}

    getPlateInfo() {
        const infoFile = this.outputDir+"/plates.csv";
        
        let results = [];
        if ( fs.existsSync(infoFile) ) {
            const info = fs.readFileSync(infoFile).toString();
            const lines = info.split("\n");
            // plate,part,posX,posY,rotation

            for (let index = 1; index < lines.length; index++) {
                const cols = lines[index].split(',');
                if ( cols.length == 5 ) {
                    const plateNr = parseInt(cols[0]);
                    if ( results[plateNr] == undefined ) {
                        results[plateNr] = [];
                    }

                    results[plateNr].push({
                        file: cols[1],
                        posX: parseFloat(cols[2]),
                        posY: parseFloat(cols[3]),
                        rotation: parseFloat(cols[4])
                    });
                }
            }
        }
        return results;
    }

    getPlates() {
        // figure out what has been produced
        const results = fs.readdirSync(this.outputDir, { withFileTypes: true });
        const plates = [];

        let plate = 0;
        results.forEach(result => {
            if ( result.isFile() ) {
                if ( result.name.startsWith("plater_") ) {
                    plates.push({
                        file: this.outputDir+"/"+result.name,
                        fileOnly: result.name,
                        number: plate++
                    });
                }
            }
        });
        return plates;
    }

    getPlaterInfo() {
        return {
            plates: this.getPlates(),
            info: this.getPlateInfo(),
        };
    }

    plater(input, maxWidth, maxHeight, spacing) {
        return new Promise((res, rej) => {
            // create config file
            const platerConf = this.outputDir+"/plater.conf";

            const done = () => res(this.getPlaterInfo());

            if ( fs.existsSync(platerConf) ) {
                this.logger.info("Plates already produced - returning produced plates");
                done();
                return;
            }

            let str = "";
            input.forEach(i => {
                str += i.name + " " + i.times + "\r\n";
            });

            fs.writeFileSync(platerConf, str);

            /*
                -h: Display this help
                -v: Verbose mode
                The size of the bed plate (topview, 2D):
                -W width: Setting the plate width (default: 150mm)
                -H height: Setting the plate height (default: 150mm)
                -D diameter: Set the plate diameter, in mm. If set, this will put the plate in circular mode
                -j precision: Sets the precision (in mm, default: 0.5)
                -s spacing: Change the spacing between parts (in mm, default: 1.5)
                -d delta: Sets the interval of place grid (in mm, default: 1.5)
                -r rotation: Sets the interval of rotation (in °, default: 90)
                -S: Trying multiple sort possibilities
                -R random: Sets the number of random (shuffled parts) iterations (only with -S)
                -o pattern: output file pattern (default: plate_%03d)
                -p: will output ppm of the plates
                -t threads: sets the number of threads (default 1)
                -c: enables the output of plates.csv containing plates infos
            */
            this.execute([
                '-W ' + maxWidth,
                '-H ' + maxHeight,
                '-s ' + spacing,
                '-r 45',
                '-S',
                '-R',
                '-t ' + this.threads,
                '-r 45',
                '-o',
                'plater_%d',
                '-c',
                platerConf
            ]).then(() => done());
        });
    }
}