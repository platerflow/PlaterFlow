const StlThumbnailer = require('node-stl-to-thumbnail');
const fs = require('fs');

module.exports = class Thumbnailer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    addThumbnail(inputFile, outputFile, baseColor) {
        return new Promise((res, rej) => {
            new StlThumbnailer({
                filePath: inputFile,
                requestThumbnails: [
                    {
                        width: this.width,
                        height: this.height,
                        baseOpacity: 1,
                        cameraAngle: [10, 10, 100],
                        backgroundColor: 0x00ff00,
                        baseColor: baseColor,
                        lineColor: 0x000000
                    }
                ]
            }).then(thumbnails => {
                thumbnails[0].toBuffer((err, buf) => {
                    var base64 = buf.toString('base64');

                    // fs.writeFileSync(plate.file+".png", buf);

                    let str = ";\r\n"
                    str += "; thumbnail begin "+this.width+"x"+this.height+" " + base64.length + " \r\n";
                    str += "; " + this.chunkSubstr(base64, 78).join("\r\n; ") + "\r\n"
                    str += "; thumbnail end"
                    str += ";"

                    this.prependToFile(str, outputFile);

                    // structure of thumbnail to document

                    // ;
                    // ; thumbnail begin 48x48 3856
                    // ; iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAALEUlEQVR4AY1a31NTZxrOTHLwT9hLx+
                    // ; u/3wCNW/pZlsejjAAAAABJRU5ErkJggg==
                    // ; thumbnail end
                    // ;

                    res();
                });
            });
        });
    }

	chunkSubstr(str, size) {
		const numChunks = Math.ceil(str.length / size)
		const chunks = new Array(numChunks)

		for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
			chunks[i] = str.substr(o, size)
		}

		return chunks;
	}

	prependToFile(str, file) {
		let data = fs.readFileSync(file).toString().split("\n");
		data.splice(1, 0, str);
		let text = data.join("\n");

		fs.writeFileSync(file, text);
	}
}