# React Native File Upload App

A React Native (Expo) app for uploading, viewing and sharing files. The project is organized with a service-driven architecture so UI code never calls HTTP directly; this makes it easy to swap between a mock API during development and a real backend later.

## Key features

- Upload files from device storage using a file picker
- Preview and open files in-app (images, documents, media)
- Share files with other users (search by username/email)
- Inbox: files shared with you with unread state and remove-from-inbox
- File-level actions: download/open, delete (owner)
- Filter files by type (Documents, Images, Videos, Audio, Others) in Dashboard and Inbox
- Centralized services, adapters, and an optional mock API for frontend work

## Tech stack (high level)

- Expo, React, React Native (see `package.json` for exact versions)
- TypeScript for type safety
- Axios for HTTP (centralized in `services/api-client.ts`)
- Expo packages: file-system, document-picker, secure-store, etc.

## Getting started (development)

1. Install dependencies

```bash
npm install
```

2. Start the Expo development server

```bash
npx expo start
```

3. Run the app (Android recommended for full feature set)

```bash
npx expo run:android
```

Or open in Expo Go from the Metro QR code (some native features may be limited).

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

- `app/` — application routes and screens (expo-router)
- `components/` — reusable UI components
- `services/` — API client, auth/file/share/user services, adapters, and mock API
- `storage/` — token helpers and local persistence helpers

## Mock API and switching to a real backend

- The repo includes a mock API adapter for frontend development. It is enabled by default.
- To switch to a real backend: set `ENABLE_MOCK_API = false` in `services/mock-api.ts` and update `API_BASE_URL` in `services/api-client.ts`.
- Adapters in `services/adapters/` translate backend responses to the app's internal models; update them if your backend uses different field names.

## Linting & tests

- Lint:

```bash
npm run lint
```

- Tests (if present):

```bash
npm test
```

## Notes for backend integration

- Recommended endpoints (logical operations; exact paths negotiable):
	- Auth: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
	- Files: `POST /files/upload`, `GET /files/my-files`, `GET /files/:id`, `DELETE /files/:id`, `GET /files/check-duplicate`
	- Shares: `POST /shares`, `GET /shares/inbox`, `GET /shares/unread-count`, `PATCH /shares/:id/read`, `DELETE /shares/:id`
	- Users: `GET /users/search`, `GET /users/:id`, `GET /users/username/:username`

- Frontend expects stable IDs and download URLs (signed URLs are fine).

## Branching & PRs

- Ongoing work is on `feature/backend-refactor` (contains mock API and adapter changes); keep `main` stable.
- Open a PR for merging: run lint/tests locally, push the branch, then create a PR on GitHub and wait for CI/reviews.

---
