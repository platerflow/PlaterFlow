module.exports = {
    uploadToFolder: 'test-plater-flow',
    plate: { width: 145, height: 145, spacing: 1.3 },
    sets: [
        {
            name: 'accent',
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