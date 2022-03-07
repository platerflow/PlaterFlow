extern crate serde_derive;
use serde_derive::Deserialize;
use std::fs::File;
use std::io::Read;
use toml;

#[derive(Debug, Deserialize)]
struct Config {
    superslicer: Superslicer,
    plater: Plater,
}
#[derive(Debug, Deserialize)]
struct Plater {
    plater_path: String,
    size_x: u8,
    size_z: u8,
    size_y: u8,
}
#[derive(Debug, Deserialize)]
struct Superslicer {
    superslicer_path: String,
    superslicer_config_printer: String,
    superslicer_config_print: String,
    superslicer_config_filament: String,
}

pub fn check_present() -> bool {
    return std::path::Path::new("D:\\Projects\\PlaterFlow\\target\\debug\\config.toml").exists()
}

pub fn read_config() {
    let mut file = File::open("D:\\Projects\\PlaterFlow\\target\\debug\\config.toml").unwrap();
    let mut data = String::new();
    file.read_to_string(&mut data).unwrap();
    let decoded: Config = toml::from_str(&data).unwrap();
    
    println!("{:#?}", decoded);
}