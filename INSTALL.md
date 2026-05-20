# Installation

This guide is written for someone starting from scratch.

Do not run these commands from `C:\Windows\System32` or another protected system folder.
Use a normal folder you own, such as `Documents`, `Desktop`, or `Projects`.

## Before You Start

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| pnpm | 9+ | Install with `npm install -g pnpm` |
| Rust | stable | Needed for the desktop app |
| Tauri CLI | v2 | Bundled through the project devDependencies |

If you only want the web version, you only need Node.js and pnpm.

If you want the desktop app, you also need Rust and the native Tauri prerequisites for your OS:
[Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

## Web-Only Install

Use this if you want to run Flint in the browser and do not need the Tauri desktop window.

### Step 1: Open a terminal

Examples:

- Windows: PowerShell
- macOS: Terminal
- Linux: your usual shell terminal

### Step 2: Move to a normal working folder

Windows:

```powershell
cd $HOME\Documents
```

macOS or Linux:

```bash
cd ~/Documents
```

You can use another folder if you prefer. The important part is that it is a folder you can write to.

### Step 3: Clone the repository

```bash
git clone https://github.com/csgenos/flint.git
```

This creates a new folder named `flint`.

### Step 4: Enter the project folder

```bash
cd flint
```

### Step 5: Install dependencies

```bash
pnpm install
```

### Step 6: Start the web development server

```bash
pnpm dev
```

### Step 7: Open the app in your browser

Open:

```text
http://localhost:5173
```

If the terminal says Vite is running on a different port, open the port shown there instead.

## Desktop App Install

Use this if you want the actual Tauri desktop app window.

### Step 1: Install Node.js

Install Node.js 20 or newer.

Then confirm it works:

```bash
node -v
```

### Step 2: Install pnpm

```bash
npm install -g pnpm
```

Then confirm it works:

```bash
pnpm -v
```

### Step 3: Install Rust

Install Rust with `rustup`.

Then confirm both commands work:

```bash
rustc --version
cargo --version
```

### Step 4: Install the native Tauri prerequisites for your OS

Follow the official guide here:
[Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

On Windows, this usually means installing Visual Studio Build Tools with the MSVC and Windows SDK components.

### Step 5: Open a terminal

Use PowerShell, Terminal, or your normal shell.

### Step 6: Move to a normal working folder

Windows:

```powershell
cd $HOME\Documents
```

macOS or Linux:

```bash
cd ~/Documents
```

### Step 7: Clone the repository

```bash
git clone https://github.com/csgenos/flint.git
```

### Step 8: Enter the project folder

```bash
cd flint
```

### Step 9: Install JavaScript dependencies

```bash
pnpm install
```

### Step 10: Check the Tauri environment

```bash
pnpm tauri info
```

If this reports missing Rust or missing native build tools, install those first before continuing.

### Step 11: Start the desktop app in development mode

```bash
pnpm tauri:dev
```

This starts the Vite dev server and opens the native Tauri desktop window.

### Step 12: Build a desktop app bundle

When you want a packaged desktop build:

```bash
pnpm tauri:build
```

The output bundle is written under `src-tauri/target/release/bundle/`.

## Environment Variables

No `.env` file is required for local development.
Tauri-specific environment variables such as `TAURI_*` are set automatically by the CLI.

## Troubleshooting

**`git clone` fails with permission denied**

You are probably cloning into a protected folder such as `C:\Windows\System32`.
Move into a normal folder first, such as `Documents`, then run `git clone` again.

**`pnpm install` fails with `EPERM` on Windows**

You are probably running the command from a protected folder.
Run `cd $HOME\Documents`, then `cd flint`, then try again.

**`localhost:5173` says the site cannot be reached**

The dev server probably never started.
Look at the terminal where you ran `pnpm dev` and fix that error first.

**`pnpm tauri:dev` fails on Linux**

Install `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, and `librsvg2-dev`.
See the Tauri docs for your distro.

**`pnpm tauri:dev` fails on Windows**

Run:

```bash
pnpm tauri info
```

If it says Rust, Cargo, or Visual Studio Build Tools are missing, install those first.

**Blank window on first launch**

The onboarding wizard should appear.
If it does not, open DevTools with `Ctrl+Shift+I` and check the console.

**Encrypted storage migration**

If you had data from a pre-encryption build with plaintext JSON in `localStorage`, the storage adapter will attempt a legacy plaintext read on first load and then re-encrypt on the next write.
