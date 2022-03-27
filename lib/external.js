const { spawn } = require('child_process');

module.exports = class ExternalProgram {
    constructor(programLocation, logger, name) {
        this.programLocation = programLocation;
        this.logger = logger;
        this.name = name;
	}

    async execute(args) {
        return new Promise((res, rej) => {
            const bat = spawn(this.programLocation, args, { });
            bat.stdout.on('data', (data) => this.logProgram(data));
            bat.stderr.on('data', (data) => this.logProgram(data));
            bat.on('exit', () => res());
        });
    }

    logProgram(data) {
        this.logger.debug(this.name +" - " + data);
    }
}