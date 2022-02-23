const Bottleneck = require("bottleneck");
const fs = require('fs');
const request = require('request');

module.exports = class Moonraker {
    constructor(ip, maxConcurrent) {
        this.ip = ip;
        this.limiter = new Bottleneck({
            maxConcurrent: maxConcurrent,
        });
    }

    uploadFile(file, outputTo) {
        return this.limiter.schedule(() => new Promise((res, rej) => {
            const formData = {
                print: 'false',
                path: outputTo,
                file: fs.createReadStream(file),
            };

            request.post({
                url: 'http://' + this.ip + '/server/files/upload',
                formData: formData
            }, (err, httpResponse, body) => {
                if (err) {
                    console.error('upload failed:', err);
                    rej();
                }
                res();
            });
        }));

        // curl -k -F "print=false" -F "path=test" -F "file=@${conf}" "http://192.168.1.172/server/files/upload"
    }

    getInfo(file) {
        return new Promise((res, rej) => {
            request.get({
                url: 'http://' + this.ip + '/server/files/metadata?filename='+file,
            }, (err, httpResponse, body) => {
                if (err) {
                    console.error('upload failed:', err);
                    rej();
                }
                res(body);
            });
        });
    }
}