{
	"uploadToFolder": "test-plater-flow",
	
	"plate": { "width": 145, "height": 145, "spacing": 1.3 },

    "baseFolder": "./output-temp",

    "printer": "v2",
	
	"sets": [
        {
            "printer": "v2",
            "name": "accent",
            
            "color": 16711680,

            "createHalfPlates": true,

            "rotate": 30,
            "source": {
                "type": "directories",
                "directories": [
                    "./input"
                ],
                "includePattern": ["[a]", "[A]"]
            },
            "profile": "titanx"
        },
        {
            "name": "otheraccent",
            "color": 16711680,
            "createHalfPlates": true,
            "rotate": 30,
            "scale": 50,
            "source": {
                "type": "directories",
                "directories": [
                    "./input"
                ],
                "includePattern": ["[b]", "[B]"]
            },
            "profile": "titanx"
        },
        {
            "name": "base",
            "color": 6975093,
            "createHalfPlates": true,
            "rotate": 30,
            "source": {
                "type": "directories",
                "directories": [
                    "./input"
                ],
                "excludePattern": ["[a]", "[A]", "[b]", "[B]"]
            },
            "profile": "titanx"
        }
    ]
}