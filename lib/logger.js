var colors = require('colors');
colors.enable();

module.exports = class Logger {
    constructor() {
        
    }

    info(message) {
        console.log(new Date().toISOString().red, message.green);
    }

    debug(message) {
        console.log(new Date().toISOString().red, message.yellow);
    }
}