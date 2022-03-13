use subprocess::Exec;
use std::env;
use std::path::*;
use glob::*;
use crate::config::Config;
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
        let options = super::MatchOptions {
            case_sensitive: false,
            require_literal_separator: false,
            require_literal_leading_dot: false,
        };
        for entry in super::glob_with(&_gid, options).expect("Failed to read glob pattern") {
            match entry {
                Ok(path) => write_plater_conf(path),
                Err(e) => println!("{:#?}", e),
            }
        }
    }
    
    pub fn write_plater_conf(filename: super::PathBuf) {
        use std::fs::OpenOptions;
        use std::io::prelude::*;
        let mut accentfile = OpenOptions::new()
            .write(true)
            .create(true)
            .append(true)
            .open(super::get_accent_conf())
            .unwrap();
        let mut mainfile = OpenOptions::new()
            .write(true)
            .create(true)
            .append(true)
            .open(super::get_main_conf())
            .unwrap();
        let file = filename.file_name().unwrap().to_str().unwrap().to_string();
        let mut number = 1u32;
        if analyze_name(&file).is_some() {
              number = analyze_name(&file).unwrap();
        }
        if file.starts_with("[a]") {
            if let Err(e) = writeln!(accentfile, "{} {}", filename.to_str().unwrap().to_string(), number) {
                println!("Error writing accentfile {:?} {}", super::get_accent_conf(), e);
            }
        }
        else {
            if let Err(e) = writeln!(mainfile, "{} {}", filename.to_str().unwrap().to_string(), number) {
                println!("Error writing mainfile {:?} {}", super::get_main_conf(), e);
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
    pub fn run(config: &super::Config) {
        use std::io::{BufRead, BufReader};
        let cpus = num_cpus::get() / 2;
        println!("Running plater for the main color on {} cores", cpus);
        let path = &config.plater.path;
        let x = super::Exec::cmd(&path)
                .arg("-W")
                .arg(config.plater.size_x.to_string())
                .arg("-H")
                .arg(config.plater.size_y.to_string())
                .arg("-s")
                .arg(config.plater.size_spacing.to_string())
                .arg("-t")
                .arg(cpus.to_string())
                .arg("-o")
                .arg("plater_main_%d")
                .arg(super::get_main_conf())
                .stream_stdout()
                .unwrap();
        let br = BufReader::new(x);
        for (i, line) in br.lines().enumerate() {
            println!("{}: {}", i, line.unwrap());
        }
        println!("Done.");
        println!("Running plater for the accent color on {} cores", cpus);
        let x = super::Exec::cmd(&path)
                .arg("-W")
                .arg(config.plater.size_x.to_string())
                .arg("-H")
                .arg(config.plater.size_y.to_string())
                .arg("-s")
                .arg(config.plater.size_spacing.to_string())
                .arg("-t")
                .arg(cpus.to_string())
                .arg("-o")
                .arg("plater_accent_%d")
                .arg(super::get_accent_conf())
                .stream_stdout()
                .unwrap();
        let br = BufReader::new(x);
        for (i, line) in br.lines().enumerate() {
            println!("{}: {}", i, line.unwrap());
        }
        println!("Done.");
    }
}

pub mod superslicer {
    pub fn run(config: &super::Config) {
        let mut _gid: String = super::get_output_dir().display().to_string();
        _gid.push_str("**/*.stl");
        let options = super::MatchOptions {
            case_sensitive: false,
            require_literal_separator: false,
            require_literal_leading_dot: false,
        };
        for entry in super::glob_with(&_gid, options).expect("Failed to read glob pattern") {
            match entry {
                Ok(path) => slice(path, &config),
                Err(e) => println!("{:#?}", e),
            }
        }
    }
    fn slice(path: super::PathBuf, config: &super::Config) {
        use std::io::{BufRead, BufReader};
        
        println!("Running SuperSlicer on {:?}", path);
        let x = super::Exec::cmd(config.superslicer.path.to_string())
                .arg("--load")
                .arg(config.superslicer.config_printer.to_string())
                .arg("--load")
                .arg(config.superslicer.config_filament.to_string())
                .arg("--load")
                .arg(config.superslicer.config_print.to_string())
                .arg("-g")
                .arg(path)
                .stream_stdout()
                .unwrap();
        let br = BufReader::new(x);
        for (i, line) in br.lines().enumerate() {
            println!("{}: {}", i, line.unwrap());
        }
    }
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