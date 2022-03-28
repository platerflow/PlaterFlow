var colors = require('colors');
colors.enable();

const readline = require('readline')

const clearLastLine = () => {
  readline.moveCursor(process.stdout, 0, -1) // up one line
  readline.clearLine(process.stdout, 1) // from cursor to end
}
module.exports = class Logger {
    constructor(enableDebug) {
        this.enableDebug = enableDebug;
        if ( this.enableDebug ) {
            this.debug('enabled debug logging');
        }
        this.timer = undefined;
        this.dots = 0;
    }

    info(message) {
        this.clearLoader();
        console.log(new Date().toISOString().red, message.green);
    }

    clearLoader() {
        clearInterval(this.timer);
        this.dots = 0;
    }

    loading(message) {
        this.clearLoader();

        let first = true;
        const loading = () => {
            this.dots++;
            if ( this.dots > 3 ) {
                this.dots = 0;
            }

            if ( !first ) {
                clearLastLine();
            } else {
                first = false;
            }
            console.log(new Date().toISOString().red, (message+".".repeat(this.dots)).red);
        };

        this.timer = setInterval(() => {
            loading()
        }, 500);
        loading();
    }

    debug(message) {
        if ( this.enableDebug ) {
            this.clearLoader();
            console.log(new Date().toISOString().red, message.yellow);
        }
    }
}