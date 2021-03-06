import { moveCursor, clearLine } from 'readline';

const clearLastLine = () => {
  moveCursor(process.stdout, 0, -1) // up one line
  clearLine(process.stdout, 1) // from cursor to end
}

const FgReset = "\x1b[0m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
// const FgWhite = "\x1b[37m";
const FgDim = "\x1b[2m";
// const FgBright = "\x1b[1m";
const FgMagenta = "\x1b[35m";

export default class Logger {
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
        this.colorLog(message, FgGreen);
    }

    clearLoader() {
        clearInterval(this.timer);
        this.dots = 0;
    }

    colorLog(message, color) {
        console.log(FgDim, new Date().toISOString(), FgReset, color, message, FgReset);
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
            this.colorLog((message+".".repeat(this.dots)), FgMagenta);
        };

        this.timer = setInterval(() => {
            loading()
        }, 500);
        loading();
    }

    debug(message) {
        if ( this.enableDebug ) {
            this.clearLoader();
            this.colorLog(message, FgYellow);
        }
    }
}