use subprocess::Exec;

pub mod plater {
    use std::env;
    use std::fs;
    use std::io;
    use std::path::PathBuf;
    use glob::glob;

    
    fn get_input_dir() -> std::path::PathBuf {
        let mut currdir: PathBuf = env::current_dir().unwrap();
        currdir.push("input/");
        return currdir
    }
    fn get_output_dir() -> std::path::PathBuf {
        let mut currdir: PathBuf = env::current_dir().unwrap();
        currdir.push("output/");
        return currdir
    }

    pub fn list_files() {
        let mut _gid: String = get_input_dir().display().to_string();
        _gid.push_str("**/*.stl");
        for entry in glob(&_gid).expect("Failed to read glob pattern") {
            match entry {
                Ok(path) => write_plater_file(path),
                Err(e) => println!("{:#?}", e),
            }
        }
    }
    
    pub fn write_plater_file(filename: PathBuf) {
        let file = filename.file_name().unwrap().to_str().unwrap().to_string();
        if file.starts_with("[a]") {
            println!("{:?}{:?}", file, filename);
        }
        else {
            println!("{:?}{:?}", file, filename);
        }
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