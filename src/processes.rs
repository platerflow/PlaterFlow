use subprocess::Exec;

pub mod plater {
    use std::env;
    use std::fs;
    use std::io;
    use std::path::PathBuf;
    use glob::glob;
    
    pub fn get_input_dir() -> io::Result<PathBuf> {
        let mut currdir = env::current_dir()?;
        currdir.push("input/");
        println!("{:#?}", currdir);
        Ok(currdir)
    }
    
    pub fn create_list() {
        let files_list = fs::read_dir(&get_input_dir().unwrap()).unwrap();
        for file in files_list {
            println!("Name: {:#?}", file.unwrap().path().display())
        }
    }
    pub fn list_files() {
        for entry in glob("input\\**/*.stl").expect("Failed to read glob pattern") {
            match entry {
                Ok(path) => println!("{:#?}", path.display()),
                Err(e) => println!("{:#?}", e),
            }
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