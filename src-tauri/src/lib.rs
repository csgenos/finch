pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::Manager;

                let salt_path = app
                    .path()
                    .app_local_data_dir()
                    .expect("could not resolve app local data path")
                    .join("stronghold-salt.txt");

                app.handle()
                    .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Flint");
}

