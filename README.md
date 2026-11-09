# Z0 Native App — Frontend

A production-grade Expo app targeting iOS, Android, and Web with file-based routing, NativeWind styling, and better-auth authentication.

## Tech Stacks

- **Framework**: [Expo](https://expo.dev) SDK 55 with [Expo Router](https://docs.expo.dev/router/introduction/) v5
- **Styling**: [NativeWind](https://www.nativewind.dev) v5 (Tailwind CSS v4 for React Native)
- **Auth**: [better-auth](https://better-auth.com) React client with Expo integration
- **API Client**: [Hono RPC](https://hono.dev/docs/guides/rpc) for end-to-end type safety
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm

## Prerequisites

- Node.js 20 or later
- pnpm installed globally (`npm install -g pnpm`)
- Expo CLI and EAS CLI installed globally (`npm install -g expo-cli eas-cli`)
- For native testing: Expo Go app on your device or an iOS/Android simulator

## Project Structure

```
app/
  _layout.tsx              Root layout (global providers)
  index.tsx                Smart redirect based on auth state
  (auth)/
    _layout.tsx            Stack layout for auth screens
    login.tsx              Email/password login
    register.tsx           Name, email, password registration
    forgot-password.tsx    Request password reset
    reset-password.tsx     Set new password via token
  (app)/
    _layout.tsx            Protected layout with AuthGuard
    index.tsx              Home screen (user info + sign out)
components/
  ui/                      Generic, reusable UI primitives
    button.tsx             Pressable button with variants
    input.tsx              TextInput with label and error state
  auth/                    Auth domain components
    auth-guard.tsx         Redirects unauthenticated users to login
    auth-form-layout.tsx   Centered card layout for auth forms (web)
    auth-form-layout.native.tsx  KeyboardAvoidingView layout (native)
  app/                     App domain components
    app-screen-layout.tsx  Scrollable content layout (web)
    app-screen-layout.native.tsx  Native scroll layout
lib/
  auth-client.ts           better-auth client with Expo plugin
  api-client.ts            Hono RPC client
hooks/
  use-session.ts           Typed session hook
constants/
  index.ts                 App constants from environment variables
src/
  global.css               Tailwind v4 CSS imports and platform fonts
  tw/
    index.tsx              CSS-wrapped React Native components
    image.tsx              CSS-wrapped expo-image component
```

## Component Organization

Components are organized by domain module, not by type:

- **`components/ui/`** -- Generic, reusable UI primitives shared across the entire app (buttons, inputs, modals, cards, etc.). Only truly cross-cutting components belong here.
- **`components/<domain>/`** -- Domain-specific components grouped by feature module. Each module owns its layouts, guards, and feature components. Examples: `auth/` owns `auth-guard` and `auth-form-layout`; `app/` owns `app-screen-layout`.
- **Platform variants** use the `.native.tsx` suffix (e.g., `auth-form-layout.native.tsx` for iOS/Android, `auth-form-layout.tsx` for web). Metro/bundler auto-resolves the correct file.

When adding new features, create a new folder under `components/` (e.g., `profile/`, `settings/`, `onboarding/`) and place all related components there.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:3000`) |

## Local Development

1. Clone the repository and enter the directory:
   ```bash
   git clone https://github.com/rutzuu/z0-native-app-fe.git
   cd z0-native-app-fe
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Set `EXPO_PUBLIC_API_URL` to `http://localhost:3000`
   - For physical device testing: replace `localhost` with your machine's local network IP (e.g. `http://192.168.1.x:3000`) — the device must be on the same WiFi network

4. Install dependencies:
   ```bash
   pnpm install
   ```

5. Start the development server:
   ```bash
   pnpm web        # Browser
   pnpm start      # Expo dev server (native + web)
   pnpm ios        # iOS simulator
   pnpm android    # Android emulator
   ```

## Verifying the Connection

1. Make sure the backend is running at `http://localhost:3000` (see the backend README)
2. Open the app (web or native) — you should be redirected to the login screen
3. Navigate to the register screen and create a new account
4. A successful redirect to the home screen confirms the frontend is correctly communicating with the backend
5. In parallel, open `http://localhost:3000/docs` in a browser to test the same endpoints via Swagger UI

## Common Issues

- **CORS error in browser**: Confirm `FRONTEND_URL` in the backend `.env` exactly matches the origin the browser shows (including port)
- **Network error on Android emulator**: Use `http://10.0.2.2:3000` instead of `localhost` (10.0.2.2 is the emulator's alias for the host machine)
- **Network error on physical device**: Use your machine's LAN IP instead of `localhost` in `EXPO_PUBLIC_API_URL`
- **Auth session not persisting**: Confirm `BETTER_AUTH_URL` in the backend matches the actual URL the frontend is calling — a mismatch causes cookie domain issues
- **Styles not applying**: Ensure `@/src/global.css` is imported in `app/_layout.tsx` and the Metro config has `withNativewind` applied. Restart the dev server after changes to the CSS setup.

## Hono RPC Client — Type Safety

This project includes a Hono RPC client in `lib/api-client.ts` that can provide end-to-end type safety with the backend.

### Keeping AppType in Sync

The backend exports an `AppType` from `src/app.ts`. To use it:

1. **Option A — Copy types**: Copy the `AppType` type definition from the backend and paste it into the frontend. Quick but requires manual updates.

2. **Option B — npm/pnpm workspace**: If using a monorepo, add the backend as a workspace dependency and import `AppType` directly.

3. **Option C — Shared types package**: Publish a shared types package that both repos depend on.

Update the import in `lib/api-client.ts` once you choose an approach:

```typescript
import type { AppType } from "z0-native-app-be/src/app";
import { hc } from "hono/client";
import { API_URL } from "@/constants";

export const api = hc<AppType>(API_URL, {
  init: { credentials: "include" },
});
```

## Deployment — Web

### Option 1: Vercel

1. Connect your GitHub repo to Vercel
2. Set the build command: `pnpm build:web`
3. Set the output directory: `dist`
4. Add environment variable: `EXPO_PUBLIC_API_URL` = your deployed backend URL
5. The included `vercel.json` handles SPA rewrites automatically

### Option 2: Railway

1. Connect your GitHub repo to Railway
2. Railway's [Railpack](https://railpack.com) builder will auto-detect the project
3. `railway.json` configures the build and serves the static export with `serve`
4. Add environment variable: `EXPO_PUBLIC_API_URL` = your deployed backend URL

## Deployment — Native (iOS & Android)

### EAS Build Profiles

The included `eas.json` defines three build profiles:

| Profile | Distribution | Use Case |
|---|---|---|
| `development` | Internal | Development builds with dev client |
| `preview` | Internal | Testing builds for team members |
| `production` | Store | App Store / Play Store releases |

### Build Commands

```bash
# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to Stores

```bash
eas submit --platform ios
eas submit --platform android
```

Before submitting, update `EXPO_PUBLIC_API_URL` in the `production` profile of `eas.json` to point to your deployed backend URL.

## Scripts

| Script | Description |
|---|---|
| `pnpm start` | Start Expo dev server |
| `pnpm web` | Start for web browser |
| `pnpm ios` | Start for iOS simulator |
| `pnpm android` | Start for Android emulator |
| `pnpm build:web` | Export static web build to `dist/` |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |

## License

MIT
