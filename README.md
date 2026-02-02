# React Native File Upload App

A simple Expo-based React Native app for uploading, viewing and managing files from a device. This project demonstrates a small production-like flow with authentication, file picking, local storage and a dashboard UI.

**Key features**

- Upload files from device storage using a file picker
- Preview and view uploaded files in-app (images, documents)
- Download or share files from the app
- Authentication flow (signup / login) with token storage
- Simple dashboard listing uploaded files with metadata
- Local persistence using SQLite for file metadata

**Tech stack (with versions)**

- Expo: ~54.0.33
- React: 19.1.0
- React Native: 0.81.5
- Expo Router: ~6.0.23
- TypeScript: ~5.9.2 (dev)
- Formik: ^2.4.9
- Yup: ^1.7.1
- Expo packages: expo-file-system ~19.0.21, expo-document-picker ~14.0.8, expo-secure-store ~15.0.8, expo-sqlite ~16.0.10

See `package.json` for the full list of dependencies and exact versions.

## Getting started (development)

1. Install repository dependencies

```bash
npm install
```

2. Start the Expo development server

```bash
npx expo start
```

3. Run the app

- Android emulator or device (recommended dev-build for native modules):

```bash
npx expo run:android
```

- Or open in Expo Go from the Metro output QR code (limited native support).

## USB -> Wireless Android ADB (optional)

If you want to run on a physical Android device over Wi‑Fi, first connect via USB and enable TCP mode:

```bash
# connect device via USB and verify
adb devices
# enable TCP mode on port 5555
adb tcpip 5555
# find device IP (on-device or via adb shell)
adb shell ip -f inet addr show wlan0
# disconnect USB and connect over network
adb connect <device-ip>:5555
adb devices
```

## Project structure

- `app/` — application routes and screens
- `components/` — reusable UI components
- `services/` — network, auth and file services
- `storage/` — local DB and token storage

## Notes

-- This project targets Android only and uses file-based routing from `expo-router` — edit files inside `app/` to add or change screens.
-- For native modules or working with device file APIs, prefer running on an Android emulator/device or a development build rather than Expo Go.

---
