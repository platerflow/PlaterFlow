use std::io::{BufRead, BufReader};
use subprocess::Exec;
use std::process;
use config::Config;
mod config;



fn main() {
    if config::init::check_present() {
        println!("Config found.");
        let config: Config = config::init::read_config();
        println!("{}", config.superslicer.path);
        
    } else {
        println!("No config found, creating one.");
        config::init::create_config();
        println!("Due to current development, we're closing this app for the time being so you can edit");
        println!("the config.toml currently created in the directory of which this app is located. Fire me up when ready! ;)");
        process::exit(exitcode::OK);
    }
    
    /*let x = Exec::cmd("C:\\Users\\leand\\Desktop\\SuperSlicer_2.3.57.11_win64_220213\\superslicer_console.exe")
            .arg("-g")
            .arg("C:\\Users\\leand\\Downloads\\connector_trim_jig.stl")
            .stream_stdout()
            .unwrap();
    let br = BufReader::new(x);
    for (i, line) in br.lines().enumerate() {
        println!("{}: {}", i, line.unwrap());
    }*/
}
