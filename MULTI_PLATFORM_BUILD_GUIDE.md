# 🌍 Multi-Platform Build Guide

This project is configured to build native applications for **macOS (Intel & Apple Silicon)**, **Windows**, and **Fedora Linux**.

## 🏗️ Build Configuration

The `package.json` has been updated to support the following targets:

| Platform | Architecture | Format | Notes |
|----------|-------------|--------|-------|
| **macOS** | `x64` (Intel) | `.dmg` | Standard macOS installer |
| **macOS** | `arm64` (Apple Silicon) | `.dmg` | Optimized for M1/M2/M3 chips |
| **Windows** | `x64` | `.exe` (NSIS) | Standard Windows installer |
| **Linux (Fedora)** | `x64` | `.rpm` | Native Red Hat/Fedora package |
| **Linux (General)** | `x64` | `.AppImage`| Universal Linux executable |
| **Linux (Debian)** | `x64` | `.deb` | Ubuntu/Debian package |

---

## 🚀 How to Build

To build the application for all configured platforms, run:

```bash
npm run electron:build
```

This command performs the following steps:
1.  **Type Check**: Runs TypeScript compiler (`tsc`) to ensure code quality.
2.  **Vite Build**: Bundles the React application for production.
3.  **Electron Build**: Compiles the Electron main process.
4.  **Package**: Uses `electron-builder` to generate installers for all targets.

### 📂 Output Location

All built installers can be found in the `dist-electron/` directory:

- **macOS**: 
  - `DStudiosLab-1.1.3-x64.dmg` (Intel)
  - `DStudiosLab-1.1.3-arm64.dmg` (Apple Silicon)
- **Windows**: 
  - `DStudiosLab Setup 1.1.3.exe`
- **Linux**: 
  - `DStudiosLab-1.1.3.x86_64.rpm` (Fedora)
  - `DStudiosLab-1.1.3.AppImage`
  - `DStudiosLab_1.1.3_amd64.deb`

---

## 🛠️ Platform-Specific Notes

### macOS
- **Codesigning**: The current build is unsigned. Users will need to right-click and select "Open" on the first launch.
- **Intel vs. Apple Silicon**: We generate separate builds for optimal performance. You can distribute both or build a "Universal" binary by changing the config to `universal`.

### Windows
- **NSIS Installer**: Creates a standard setup wizard.
- **Building from Mac**: Building Windows apps from macOS usually requires `wine` to be installed if using NSIS. If you see errors about missing `wine`, install it via Homebrew (`brew install wine`).

### Linux (Fedora)
- **RPM**: The `.rpm` file can be installed on Fedora/RHEL using `sudo dnf install ./filename.rpm`.
- **AppImage**: A portable executable that works on almost any Linux distribution. specific "install" not required, just make executable (`chmod +x`) and run.

---

## ⚠️ Troubleshooting

**Build Fails on Windows Target?**
If building for Windows from macOS fails, ensure you have **Wine** installed:
```bash
brew install wine-stable
```

**Build Fails on Linux Target?**
Building RPMs might require `rpmbuild`. On macOS, you can install it via:
```bash
brew install rpm
```
