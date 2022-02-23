# Plater Flow support app

This application takes STL files from a directory and plates them using Plater.
It can then slice them with SuperSlicer and upload them to your printer using Moonraker API.

The goal is to provide a quick way of getting a bunch of STL's printable with your common settings.
No hassle doing this all manually.

Tested on Windows and OSX for the moment.

## Install

Make sure [NodeJS](https://nodejs.org/en/download/) is currently installed. 
After making sure it is, start a terminal and navigate to the desired directory you're going to put PlaterFlow in.

Clone the git repository:
```bash
git clone https://github.com/GijsvanDulmen/PlaterFlow
```
And navigate to the folder
```bash
cd PlaterFlow
```
After which you're going to want to make sure all the deps are installed for the application to run, like so
```bash
npm install
```
After which it'll be ready for usage.

## Usage

Alter the base configuration in `baseconfig.js`.
Create your own config.js (example in `frominput.js`).

And run it like this (example):
```bash
node index.js ./frominput.js
```

After the command has finished you can view all the created files in the output directory.
The Gcodes are uploaded towards your printer as well.
