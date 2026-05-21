# Installation

This guide is written for someone starting from scratch.

Do not run these commands from `C:\Windows\System32` or another protected system folder. Use a normal folder you own, such as `Documents`, `Desktop`, or `Projects`.

## Before You Start

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| pnpm | 11.1.3 | Install with `npm install -g pnpm@11.1.3` |
| Rust | stable | Needed for local desktop development/builds |
| Tauri CLI | v2 | Bundled through the project devDependencies |

If you only want the web version, you only need Node.js and pnpm.

If you want to run or build the desktop app locally, you also need Rust and the native Tauri prerequisites for your OS:
[Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

If you only want to install the finished desktop app, download the Windows installer from GitHub Releases after a release has been published.

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

## Desktop App Development Install

Use this if you want to run the actual Tauri desktop app window from source.

### Step 1: Install Node.js

Install Node.js 20 or newer.

Then confirm it works:

```bash
node -v
```

### Step 2: Install pnpm

```bash
npm install -g pnpm@11.1.3
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

### Step 5: Move to a normal working folder

Windows:

```powershell
cd $HOME\Documents
```

macOS or Linux:

```bash
cd ~/Documents
```

### Step 6: Clone the repository

```bash
git clone https://github.com/csgenos/flint.git
```

### Step 7: Enter the project folder

```bash
cd flint
```

### Step 8: Install JavaScript dependencies

```bash
pnpm install
```

### Step 9: Check the Tauri environment

```bash
pnpm tauri info
```

If this reports missing Rust or missing native build tools, install those first before continuing.

### Step 10: Start the desktop app in development mode

```bash
pnpm tauri:dev
```

This starts the Vite dev server and opens the native Tauri desktop window.

### Step 11: Build a desktop app bundle locally

When you want a packaged desktop build from your own machine:

```bash
pnpm tauri:build
```

The output bundle is written under `src-tauri/target/release/bundle/`.

## Production Desktop Release

Use this when you want a real Windows installer that appears in `C:\Program Files`, creates Start menu entries, and supports automatic updates.

### Step 1: Confirm the release setup exists

The desktop release workflow is here:

```text
.github/workflows/release-desktop.yml
```

The full release checklist is here:

```text
docs/desktop-release.md
```

### Step 2: Add the updater signing secret to GitHub

The updater public key is committed in `src-tauri/tauri.conf.json`. The private key is intentionally not committed.

On GitHub:

1. Open `csgenos/flint`.
2. Go to `Settings`.
3. Go to `Secrets and variables`.
4. Go to `Actions`.
5. Add a repository secret named `TAURI_SIGNING_PRIVATE_KEY`.
6. Paste the full contents of your local key file:

```text
src-tauri/.updater/flint-updater.key
```

If the key ever has a password, also add:

```text
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

### Step 3: Allow GitHub Actions to publish releases

On GitHub:

1. Go to `Settings`.
2. Go to `Actions`.
3. Go to `General`.
4. Find `Workflow permissions`.
5. Select `Read and write permissions`.
6. Save.

### Step 4: Update the version

Before every production release, set the same version in all three places:

```text
package.json
src-tauri/tauri.conf.json
src-tauri/Cargo.toml
```

Example: change all three to `0.2.1`.

### Step 5: Commit and push to main

```bash
git add .
git commit -m "Release Flint 0.2.1"
git push origin main
```

### Step 6: Create and push a version tag

```bash
git tag v0.2.1
git push origin v0.2.1
```

### Step 7: Wait for the release workflow

GitHub Actions will run `Release desktop app`.

When it passes, GitHub Releases will contain:

- Windows installer `.exe`
- Windows installer `.msi`
- updater signatures
- `latest.json` for automatic updates

### Step 8: Install Flint

Download the Windows installer from GitHub Releases and run it.

The NSIS installer is configured for a machine-wide install. Windows will ask for admin approval, then Flint installs under `C:\Program Files`.

## Auto Updates

Installed desktop builds check:

```text
https://github.com/csgenos/flint/releases/latest/download/latest.json
```

If a newer signed version is available, Flint prompts the user, installs it, and restarts.

The update signature key is separate from Windows code signing. Without a Windows code-signing certificate, Windows SmartScreen may still show an unknown publisher warning.

## Environment Variables

No `.env` file is required for local development.

For production desktop releases, GitHub Actions needs:

```text
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

The password secret is only needed if the private updater key has a password.

## Troubleshooting

**`git clone` fails with permission denied**

You are probably cloning into a protected folder such as `C:\Windows\System32`. Move into a normal folder first, such as `Documents`, then run `git clone` again.

**`pnpm install` fails with `EPERM` on Windows**

You are probably running the command from a protected folder. Run `cd $HOME\Documents`, then `cd flint`, then try again.

**`pnpm install` says build scripts were ignored**

The repo includes `pnpm-workspace.yaml` to allow the `esbuild` build script.

Run:

```bash
pnpm install
```

If you still see the warning, make sure you are using pnpm `11.1.3`.

**`localhost:5173` says the site cannot be reached**

The dev server probably never started. Look at the terminal where you ran `pnpm dev` and fix that error first.

**`pnpm tauri:dev` fails on Linux**

Install `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, and `librsvg2-dev`. See the Tauri docs for your distro.

**`pnpm tauri:dev` fails on Windows**

Run:

```bash
pnpm tauri info
```

If it says Rust, Cargo, or Visual Studio Build Tools are missing, install those first.

**`pnpm tauri:build` says `cargo` was not found**

Rust is missing or not on your PATH. Install Rust, close and reopen the terminal, then run:

```bash
rustc --version
cargo --version
```

Both commands must work before Tauri can build locally.

**GitHub release does not publish**

Check these first:

- `TAURI_SIGNING_PRIVATE_KEY` exists in GitHub Actions secrets.
- GitHub Actions has `Read and write permissions`.
- The pushed tag starts with `v`, such as `v0.2.1`.
- The version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` matches the tag number.

**Blank window on first launch**

The onboarding wizard should appear. If it does not, open DevTools with `Ctrl+Shift+I` and check the console.

**Encrypted storage migration**

If you had data from a pre-encryption build with plaintext JSON in `localStorage`, the storage adapter will attempt a legacy plaintext read on first load and then re-encrypt on the next write.
