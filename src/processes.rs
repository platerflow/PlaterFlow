use subprocess::Exec;
use std::env;
use std::fs;
use std::io;
use std::path::*;
use glob::glob;

pub fn get_input_dir() -> PathBuf {
    let mut currdir: PathBuf = env::current_dir().unwrap();
    currdir.push("input/");
    return currdir
}
pub fn get_output_dir() -> PathBuf {
    let mut currdir: PathBuf = env::current_dir().unwrap();
    currdir.push("output/");
    return currdir
}
fn get_accent_conf() -> PathBuf {
    let mut currdir: PathBuf = env::current_dir().unwrap();
    currdir.push("output/");
    currdir.push("accent.conf");
    return currdir
}
fn get_main_conf() -> PathBuf {
    let mut currdir: PathBuf = env::current_dir().unwrap();
    currdir.push("output/");
    currdir.push("main.conf");
    return currdir
}
pub mod plater {
    pub fn list_files() {
        let mut _gid: String = super::get_input_dir().display().to_string();
        _gid.push_str("**/*.stl");
        for entry in super::glob(&_gid).expect("Failed to read glob pattern") {
            match entry {
                Ok(path) => write_plater_file(path),
                Err(e) => println!("{:#?}", e),
            }
        }
    }
    
    pub fn write_plater_file(filename: super::PathBuf) {
        use std::fs::OpenOptions;
        use std::io::prelude::*;
        let accent = super::get_accent_conf();
        let main = super::get_main_conf();
        let mut accentfile = OpenOptions::new()
            .write(true)
            .create(true)
            .append(true)
            .open(accent)
            .unwrap();
        let mut mainfile = OpenOptions::new()
            .write(true)
            .create(true)
            .append(true)
            .open(main)
            .unwrap();
        let filestr = filename.file_name().unwrap().to_str();
        let file = filestr.unwrap().to_string();
        let mut number = 1u32;
        if analyze_name(&file).is_some() {
              number = analyze_name(&file).unwrap();
        }
        if file.starts_with("[a]") {
            if let Err(e) = writeln!(accentfile, "{:?} {:#?}", filename, number) {
                println!("Error writing accentfile {:?} {}", super::get_accent_conf(), e);
            }
        }
        else {
            if let Err(e) = writeln!(mainfile, "{:?} {:#?}", filename, number) {
                println!("Error writing accentfile {:?} {}", super::get_main_conf(), e);
            }
        }
    }
    fn analyze_name(name: &str) -> Option<u32> {
        name
            .to_ascii_lowercase()
            .strip_suffix(".stl")?
            .rsplit_once("_x")?
            .1
            .parse()
            .ok()
    }
}

pub mod superslicer {
    
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