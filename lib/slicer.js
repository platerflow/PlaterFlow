const SuperSlicer = require("./superslicer");
const Thumbnailer = require("./thumbnailer");

module.exports = class Slicer {

    /**
     * @param {SuperSlicer} superSlicer 
     * @param {Array} profiles 
     */
    constructor(superSlicer, profiles) {
        this.superSlicer = superSlicer;
        this.profiles = profiles;
        this.thumbnailer = new Thumbnailer(500, 500);
    }

	async resetXy(input, output, x, y, rotate) {
		await this.rotate(input, output, rotate);
		return this.superSlicer.doStlAction(this.profiles, output, [
			// '--align-xy',
			'--center',
			x + ',' + y,
			// '--rotate',
			// rotate,
			input,
		]);
	}

	rotate(input, output, rotate) {
		return this.superSlicer.doStlAction(this.profiles, output, [
			'--rotate',
			rotate,
			input,
		]);
	}

	scale(input, output, scale) {
		return this.superSlicer.doStlAction(this.profiles, output, [
			'--scale',
			(scale.toString()+"%"),
			input,
		]);
	}

    combine(inputFiles, output) {
		return this.superSlicer.doStlAction(this.profiles, output, [
			'--merge',
			'--dont-arrange',
			...inputFiles
		]);
	}

    async slice(inputFile, output, baseColor) {
		await this.superSlicer.doAction([
			'-g',
			...this.superSlicer.convertProfiles(this.profiles),
			'--output',
			output,
			inputFile
		]);

		return this.thumbnailer.addThumbnail(inputFile, output, baseColor);
	}
}