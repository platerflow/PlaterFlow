mod config;
mod processes;

use std::process;
use std::fs;
use config::Config;
use std::fs::OpenOptions;
use std::io::prelude::*;

fn main() {
    if config::init::check_present() {
        println!("Config found.");
        let config: Config = config::init::read_config();
        
    } else {
        println!("No config found, creating one.");
        config::init::create_config();
        println!("Due to current development, we're closing this app for the time being so you can edit");
        println!("the config.toml currently created in the directory of which this app is located. Fire me up when ready! ;)");
        process::exit(exitcode::OK);
    }
    println!("Clearing output folder.");
    fs::remove_dir_all(processes::get_output_dir()).unwrap();
    fs::create_dir(processes::get_output_dir()).unwrap();
    
    processes::plater::list_files();
    
}
