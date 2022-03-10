mod config;
mod processes;

use std::process;
use config::Config;

fn main() {
    if config::init::check_present() {
        println!("Config found.");
        let config: Config = config::init::read_config();
        println!("{:#?}", config.superslicer.path);
        
    } else {
        println!("No config found, creating one.");
        config::init::create_config();
        println!("Due to current development, we're closing this app for the time being so you can edit");
        println!("the config.toml currently created in the directory of which this app is located. Fire me up when ready! ;)");
        process::exit(exitcode::OK);
    }
}
