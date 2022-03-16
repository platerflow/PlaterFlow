module.exports = {
	// Possibility to auto upload to a certain directory for gcode files, example given
    // uploadToFolder: 'test-plater-flow',
	
	// Plater settings.
    // Width and height refer to build plate dimensions.
    // Spacing refers to the minimum amount of mm between objects, example given
    plate: { width: 145, height: 145, spacing: 1.3 },

    // Base folder to put all the files after generation
    baseFolder: './output-temp',
	
	// Your sets.
    // Provided is an example of auto rename (to accent and base) based on a pattern inside the name of the STLs.
    sets: [
        {
            name: 'accent',
            createHalfPlates: true,
            source: {
                type: 'directories',
                directories: [
                    './input'
                ],
                includePattern: ['[a]', '[A]']
            },
            profile: 'titanx'
        },
        {
            name: 'base',
            createHalfPlates: true,
            source: {
                type: 'directories',
                directories: [
                    './input'
                ],
                excludePattern: ['[a]', '[A]']
            },
            profile: 'titanx'
        }
    ]
}