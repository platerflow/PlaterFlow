import Bottleneck from "bottleneck";
import ExternalProgram from './external.js';

export default class SuperSlicer extends ExternalProgram {
	constructor(location, logger, maxConcurrent) {
		super(location, logger, 'superslicer')
		this.logger = logger;
		this.limiter = new Bottleneck({
			maxConcurrent: maxConcurrent,
		});
	}

	async doAction(args) {
		// console.log(args);
		return this.limiter.schedule(() => this.execute(args));
	}

	async doStlAction(profiles, outputFile, args) {
		return this.doAction([
			'--export-stl',
			...this.convertProfiles(profiles),
			'--output',
			outputFile,
			...args
		]);
	}

	convertProfiles(profiles) {
		const args = [];
		profiles.forEach(profile => {
			args.push('--load');
			args.push(profile);
		});
		return args;
	}
}