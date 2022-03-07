use std::io::{BufRead, BufReader};
use subprocess::Exec;
mod config;



fn main() {
    let cfg_exists = config::check_present();
    println!("Config exists? {}", cfg_exists);
    if cfg_exists {
        config::read_config();
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
