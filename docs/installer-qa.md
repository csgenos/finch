# Installer QA

## Stable Installer

1. Install `Flint` on a clean Windows VM.
2. Confirm Windows creates a Start menu entry.
3. Confirm the app launches without a blank window.
4. Complete onboarding and create sample finance data.
5. Export an encrypted backup.
6. Uninstall Flint.
7. Confirm the app is removed from the Start menu.
8. Confirm `C:\Program Files\Flint` is removed.
9. Reinstall Flint from the same release.
10. Restore the encrypted backup and confirm counts match.

## Update Flow

1. Install the current stable release.
2. Create sample data and note the visible totals.
3. Publish the next stable release with a higher app version.
4. Launch the installed older app.
5. Accept the in-app update prompt.
6. Confirm the app restarts into the new version.
7. Confirm accounts, transactions, and settings remain intact.

## Beta Channel

1. Install `Flint Beta`.
2. Confirm it installs side-by-side with stable Flint.
3. Confirm it uses a separate updater feed and separate app identity.
4. Publish a new beta build from the `beta` branch.
5. Launch the existing beta build and confirm it offers the beta update.
6. Confirm stable Flint does not offer the beta update.

## Code Signing

1. Download the signed installer from GitHub Releases.
2. Confirm the file properties show the expected publisher.
3. Confirm signtool verification passes on the signed artifact.
4. Confirm SmartScreen behavior on a clean VM.
5. If SmartScreen still warns, confirm whether the certificate is OV or EV before treating it as a release blocker.
