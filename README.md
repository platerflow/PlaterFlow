# Plater Flow support app

This application takes STL files from a directory and plates them using Plater.
It can then slice them with SuperSlicer and upload them to your printer using Moonraker API.

The goal is to provide a quick way of getting a bunch of STL's printable with your common settings.
No hassle doing this all manually.

## Limitations

* Wherever you place the binary, inside that folder there should be input and output folders. This is a current requirement.
* SuperSlicer does not output thumbnails when used in CLI mode, sadly.
* Does currently not upload to moonraker (yet), I'm just glad I got it working at this point.


## TODO
* ~~create input, output folders~~ Done
* ~~handle no [a]~~ Done
* try to make it dummy proof by checking paths in config.toml
* moonraker support


## Install
Download from releases or build yourself:

![image](https://user-images.githubusercontent.com/227830/158068869-dd6cb941-8bd0-451b-abf4-5213a5f3be55.png)

## Usage

Upon first use a config.toml will be created. Edit it to your needs. Then run it again.

Add all the STLs you want sorted in the input folder. PlaterFlow will search recursively so directories are fine too.


![image](https://user-images.githubusercontent.com/227830/158069084-b97994f7-11f7-482e-baba-c36c8a8f8023.png)
