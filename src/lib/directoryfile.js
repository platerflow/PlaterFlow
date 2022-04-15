import { readdirSync } from 'fs';
import { resolve } from 'path';
export default class DirectoryFile {
    constructor() {

    }

    recursiveRead(dir, callback) {
        const results = readdirSync(dir, { withFileTypes: true });

        results.forEach(result => {
            if ( result.isDirectory() ) {
                this.recursiveRead(dir+"/"+result.name, callback);
            } else if ( result.isFile() ) {
                if ( !result.name.startsWith(".") ) {
                    let data = this.analyzeName(result.name);


                    data.name = dir + "/" + data.name;
                    data.file = result.name;
                    callback(data);
                }
            }
        });
    }

    analyzeName(name) {
        let number = 1;
    
        let re = /\_x([0-9]+)/;
        const results = re.exec(name);
        if ( results ) {
            number = parseInt(results[1]);
        }
    
        return {
            times: number,
            name: name
        };
    };

    scan(directories, includePattern, excludePattern) {
        let results = [];
        directories.forEach(directory => {
            // convert from relative to absolute
            directory = resolve(directory);

            this.recursiveRead(directory, path => {
                let included;
                if ( includePattern.length > 0 ) {
                    included = false;
                    includePattern.forEach(pattern => {
                        if ( path.file.includes(pattern) ) {
                            included = true;
                        }
                    })
                } else {
                    included = true;
                }

                let excluded;
                if ( excludePattern.length > 0 ) {
                    excluded = false;
                    excludePattern.forEach(pattern => {
                        if ( path.file.includes(pattern) ) {
                            excluded = true;
                        }
                    })
                } else {
                    excluded = false;
                }

                if ( included && !excluded ) {
                    results.push(path)
                }
            })
        })

        return results;
    }
}