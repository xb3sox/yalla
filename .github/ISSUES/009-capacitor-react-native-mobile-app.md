# [Jules] Phase 5: Cross-Platform Capacitor Mobile Application Wrapper & Native Plugins

**Labels**: `backlog`, `phase-5`, `mobile`, `capacitor`, `frontend`, `jules`
**Milestone**: Phase 5: Mobile Applications (Q3 2027)

---

## Problem & Context
To expand distribution across the Apple App Store and Google Play Store, Yalla requires a native mobile application build. Incorporating Capacitor onto the existing React 18 + Vite codebase allows 100% web code reuse while enabling native mobile features: Face ID / Touch ID biometric authentication, native push notification badges, haptic feedback, and deep linking.

---

## User Story
**As a** mobile smartphone user,
**I want** to install Yalla from the iOS App Store or Google Play,
**So that** I can unlock venue passes with Face ID, receive native OS push alerts, and enjoy a seamless native app experience.

---

## Technical Architecture & Scope

### 1. Capacitor Integration (`yalla-frontend`)
- Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`.
- Configuration in `capacitor.config.ts`:
  ```typescript
  import { CapacitorConfig } from '@capacitor/cli';

  const config: CapacitorConfig = {
    appId: 'app.yalla.mobile',
    appName: 'Yalla',
    webDir: 'dist',
    server: {
      androidScheme: 'https'
    },
    plugins: {
      PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"]
      }
    }
  };
  export default config;
  ```

### 2. Native Plugins Integration
- **Biometrics** (`@capgo/capacitor-native-biometric`): Unlock venue arrival PIN and pass with Face ID / fingerprint.
- **Haptics** (`@capacitor/haptics`): Provide light haptic vibration feedback on successful check-in or booking confirmation.
- **App Deep Links** (`@capacitor/app`): Handle custom scheme `yalla://arrival/:reservationId` and universal links (`https://yalla.app/arrival/:reservationId`).
- **StatusBar & SplashScreen** (`@capacitor/status-bar`, `@capacitor/splash-screen`): Native iOS/Android theme alignment.

### 3. Build & CI Pipelines
- Add build scripts in `package.json`:
  ```json
  "cap:build": "npm run build && npx cap sync",
  "cap:open:ios": "npx cap open ios",
  "cap:open:android": "npx cap open android"
  ```

---

## Acceptance Criteria
- [ ] Capacitor initialized with bundle ID `app.yalla.mobile` and integrated into frontend repository root.
- [ ] iOS and Android platform projects (`ios/`, `android/`) generated and synced via `npx cap sync`.
- [ ] Biometric prompt component (`src/components/BiometricAuthPrompt.tsx`) fallback smoothly to PIN entry on web or unsupported devices.
- [ ] Deep links (`yalla://` and universal links) route directly to target screens in mobile app.
- [ ] Haptic feedback triggers on booking confirmation and PIN check-in actions.
- [ ] Build script `npm run cap:build` completes without TypeScript or Vite bundle errors.

---

## Testing Requirements
- [ ] Add unit tests in `src/services/nativePlugins.test.ts` testing web fallback mocks for Capacitor plugins.
- [ ] Verify frontend build and tests pass: `npm run typecheck` and `npx vitest run`.

---

## SDLC & Security Guardrails
- **Security**: Store biometric authentication flags securely in Capacitor Secure Storage (`@capgo/capacitor-secure-storage`); never log sensitive tokens or private user data to native console logs.
