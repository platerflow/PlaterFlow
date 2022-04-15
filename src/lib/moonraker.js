import Bottleneck from 'bottleneck';
import { FormData } from 'formdata-node';
import { fileFromPathSync } from 'formdata-node/file-from-path';
import fetch from 'node-fetch';

export default class Moonraker {
    constructor(ip, maxConcurrent) {
        this.ip = ip;
        this.limiter = new Bottleneck({
            maxConcurrent: maxConcurrent,
        });
    }

    uploadFile(file, outputTo) {
        return this.limiter.schedule(() => new Promise((res, rej) => {
            
            const form = new FormData();
            form.append('print', 'false');
            form.append('path', outputTo);
            form.append('file', fileFromPathSync(file));

            fetch('http://' + this.ip + '/server/files/upload',{
                method: 'POST',
                body: form
            }).then(() => res()).catch(err => rej(err));
        }));

        // curl -k -F "print=false" -F "path=test" -F "file=@${conf}" "http://192.168.1.172/server/files/upload"
    }

    getInfo(file) {
        return fetch('http://' + this.ip + '/server/files/metadata?filename='+file, {
            method: 'GET',
        });
    }
}