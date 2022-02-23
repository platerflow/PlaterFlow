# Plater Flow support app

This application takes STL files from a directory and plates them using Plater.
It can then slice them with SuperSlicer and upload them to your printer using Moonraker API.

The goal is to provide a quick way of getting a bunch of STL's printable with your common settings.
No hassle doing this all manually.

Tested on Windows and OSX for the moment.

## Usage

Make sure NodeJS is installed and install the dependencies with:
```bash
npm install
```

Alter the base configuration in `baseconfig.js`.
Create your own config.js (example in `frominput.js`).

And run it like this (example):
```bash
node index.js ./frominput.js
```

After the command has finished you can view all the created files in the output directory.
The Gcodes are uploaded towards your printer as well.
