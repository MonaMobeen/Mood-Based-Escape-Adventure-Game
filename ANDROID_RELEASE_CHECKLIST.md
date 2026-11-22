# Android Google Play Release & Packaging Checklist

This web application is built as a responsive mobile-first Vite + React + TypeScript bundle ready to wrap for Android via **Capacitor** or **Trusted Web Activity (TWA)**, plus offline-friendly PWA metadata (`/public/manifest.webmanifest`).

## 1. Capacitor Android Wrapper Setup
1. Build production web assets:
   ```bash
   npm run build
   ```
2. Install Capacitor & initialize Android project:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Malibu Runway Dash" "com.coastal.dreamhouse.runway" --web-dir dist
   npx cap add android
   npx cap sync android
   ```
3. Configure `android/app/build.gradle`:
   - Set `minSdkVersion 24` and `targetSdkVersion 35` (Google Play requirement).
   - Enable `minifyEnabled true` and `shrinkResources true` for release builds using R8/ProGuard.
   - Maintain a dedicated release signing keystore (never commit `.jks` or passwords to git).

## 2. Google Play Billing (In-App Purchases)
`src/components/CommercialStorePanel.tsx` uses a **Play Billing Sandbox Preview** with an inline **Parental Gate Math Verification Modal** for web testing. Before shipping to Google Play:
- Wire native billing via `@capacitor-community/in-app-purchases` or a custom Capacitor plugin wrapping **Google Play Billing Library v7+**.
- Map these exact product SKUs in Google Play Console:
  - `com.coastal.dreamhouse.emerald_pack` (Consumable/Pack: Emerald Tide Starter Pack)
  - `com.coastal.dreamhouse.ad_free` (Non-consumable: Ad-Free Coastal Pass)
  - `com.coastal.dreamhouse.vip_club` (Non-consumable/Entitlement: Ocean Club VIP Pass)
- Verify purchase tokens server-side via Google Play Developer API (`purchases.products.get`) and call `acknowledgePurchase` within 3 days.
- Restore non-consumable entitlements (`ad_free`, `vip_club`) on app launch via `queryPurchasesAsync`.

## 3. Google Mobile Ads (AdMob) Integration
The web build provides a 5-second **Opt-In Rewarded Showcase Bonus** (capped at 5/day) and an **optional skippable post-run showcase toggle** (`interstitialOptIn`), both disabled automatically when `adFree` or `vipPass` is active.
- Integrate `@capacitor-community/admob` with test ad unit IDs during QA and production unit IDs only in signed release builds.
- Enforce frequency caps, never interrupt active gameplay, and honor `save.commercial.adFree`.
- If targeting a younger/family audience on Google Play, tag AdMob requests with `tagForChildDirectedTreatment` / `maxAdContentRating: G` per **Google Play Families Policy**.

## 4. Privacy, Analytics & Data Safety
- Local gameplay quality telemetry (`src/game/analytics.ts`) is stored exclusively in `localStorage` (`barbie_coastal_analytics_v1`) with a user-accessible reset control in **Profile & Settings**.
- Declare exact SDK data collection (AdMob / Play Billing) in Google Play Console's **Data Safety** form and host a public Privacy Policy URL.

## 5. Final QA Before Play Console Submission
- Build signed Android App Bundle:
  ```bash
  cd android && ./gradlew bundleRelease
  ```
- Test on physical low- and mid-tier Android devices (portrait & landscape, gesture navigation insets, audio focus interruption on incoming calls, hardware back-button pause behavior).
- Upload `.aab` to **Internal Testing** track and run Google Play Pre-Launch Report checks.
