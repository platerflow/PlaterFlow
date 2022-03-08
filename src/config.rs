extern crate serde_derive;
use serde_derive::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    superslicer: Superslicer,
    plater: Plater,
}
#[derive(Debug, Deserialize)]
pub struct Plater {
    path: String,
    size_x: u8,
    size_z: u8,
    size_y: u8,
}
#[derive(Debug, Deserialize)]
pub struct Superslicer {
    path: String,
    config_printer: String,
    config_print: String,
    config_filament: String,
}
pub mod init {
    pub fn check_present() -> bool {
        return std::path::Path::new("D:\\Projects\\PlaterFlow\\target\\debug\\config.toml").exists()
    }
    
    pub fn read_config() {
        use std::fs::File;
        use std::io::Read;
        use crate::config::Config;
        
        let mut file = File::open("D:\\Projects\\PlaterFlow\\target\\debug\\config.toml").unwrap();
        let mut data = String::new();
        file.read_to_string(&mut data).unwrap();
        let decoded: Config = toml::from_str(&data).unwrap();
        
        println!("{:#?}", decoded);
    }
    
    pub fn create_config() {
        use std::fs;
        
        let mut config_data_sample =  r#"[plater]
        size_x = 165
        size_y = 165
        size_z = 165
        path = "D:\\Projects\\PlaterFlow\\platerbinary\\plater_cli_win.exe"
        [superslicer]
        path = "C:\\Users\\leand\\Desktop\\SuperSlicer_2.3.57.11_win64_220213\\superslicer_console.exe"
        config_printer = "C:\\Users\\leand\\AppData\\Roaming\\SuperSlicer\\printer\\K3.ini"
        config_filament = "C:\\Users\\leand\\AppData\\Roaming\\SuperSlicer\\filament\\FF Black K3 ASA.ini"
        config_print = "C:\\Users\\leand\\AppData\\Roaming\\SuperSlicer\\print\\K3 ABS FF.ini""#;
        
        let mut file = fs::write("D:\\Projects\\PlaterFlow\\target\\debug\\config.toml", config_data_sample);
        self::read_config();
    }
}