import { readFileSync } from 'fs';

export default class PlaterFile {
    constructor() {

    }

    parse(file) {
        const fileContents = readFileSync(file).toString();

        const lines = fileContents.split(/\r?\n/);

        const results = [];

        lines.forEach(line => {
            const split = line.split(" ");

            const info = {
                times: 1
            };

            if ( split.length == 1 ) {
                if ( split[0] != '' ) {
                    info.name = split[0].join(' ');
                }
            } else if ( split.length > 0 ) {
                const times = parseInt(split[split.length-1]);
                if ( times ) {
                    info.name = split.slice(0, split.length-1).join(' ');
                    info.times = times;
                } else {
                    info.name = split.slice(0, split.length).join(' ');
                }
            } else {
                // empty line
            }

            if ( info.name != undefined ) {
                const splitted = info.name.split("/");
                const file = splitted[splitted.length-1];
                info.file = file;

                results.push(info);
            }
        });

        return results;
    }
}