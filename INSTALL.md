# Installation

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| pnpm | 9+ | `npm install -g pnpm` |
| Rust | stable | `rustup toolchain install stable` |
| Tauri CLI | v2 | bundled via `@tauri-apps/cli` in devDeps |

For Tauri's native system dependencies see the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

## Web-only (no Rust required)

```bash
git clone https://github.com/csgenos/flint.git
cd flint
pnpm install
pnpm dev
# opens http://localhost:5173
```

## Desktop app

```bash
pnpm install
pnpm tauri:dev      # hot-reload desktop window
pnpm tauri:build    # produces a signed installer in src-tauri/target/release/bundle/
```

## Environment variables

No `.env` file is required for local development. Tauri-specific env vars (`TAURI_*`) are set automatically by the CLI.

## Troubleshooting

**`pnpm tauri:dev` fails on Linux** — install `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, and `librsvg2-dev`. See Tauri docs for your distro.

**Blank window on first launch** — the onboarding wizard should appear. If it doesn't, open DevTools (`Ctrl+Shift+I`) and check the console.

**Encrypted storage migration** — if you had data from a pre-encryption build (plaintext JSON in localStorage), the storage adapter will attempt a plaintext fallback on first read, then re-encrypt on write.
