const { spawn } = require('child_process');
const fs = require('fs');

module.exports = class Plater {
	constructor(platerCliLocation, threads, outputDir, logger) {
        this.outputDir = outputDir;
        this.logger = logger;
        this.threads = threads;
        this.platerCliLocation = platerCliLocation;
	}

    plater(input, maxWidth, maxHeight, spacing) {
        return new Promise((res, rej) => {
            // create config file

            let str = "";
            input.forEach(i => {
                str += i.name + " " + i.times + "\r\n";
            });

            const platerConf = this.outputDir+"/plater.conf";
            fs.writeFileSync(platerConf, str);

            const args = [
                '-W ' + maxWidth,
                '-H ' + maxHeight,
                '-s ' + spacing,
                '-r 45',
                '-S',
                '-R',
                '-t ' + this.threads,
                '-o',
                'plater_%d',
                '-c',
                platerConf
            ];

            const bat = spawn(this.platerCliLocation, args, { });

			bat.stdout.on('data', (data) => {
                this.logger.debug("plater - " + data);
			});

			bat.stderr.on('data', (data) => {
                this.logger.debug("plater - " + data);
				// rej();
			});

			bat.on('exit', () => {
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

				res(plates);
			});
        });
    }
}