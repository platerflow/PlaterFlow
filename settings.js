module.exports = {
    superslicer: {
        // point this to the SuperSlicer binary. 
        location: '/Applications/SuperSlicer.app/Contents/MacOS/SuperSlicer',
        maxConcurrent: 2
    },
    printers: {
        // point these towards the moonraker URL
        k3: {
            ip: '192.168.1.114',
        },
        v2: {
            ip: '192.168.1.93',
        }
    },
    plater: {
        // point this to the location of the plater cli
        // in the repo the OSX, RPI and Windows are provided.
        location: './platerbinary/plater_cli_osx',
        threads: 2
    },
    profiles: {
        // list your superslicer location profiles here
        // example given
        titanx: [
            '/Users/gijs/Library/Application Support/SuperSlicer/printer/K3.ini',
            '/Users/gijs/Library/Application Support/SuperSlicer/filament/K3 - TitanX.ini',
            '/Users/gijs/Library/Application Support/SuperSlicer/print/K3 - TitanX.ini',
        ]
    }
}