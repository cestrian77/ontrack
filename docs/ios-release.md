# iOS release checklist (OnTrack)

Use this after opening **`ios/App/App.xcodeproj`** in Xcode (SwiftUI app, no CocoaPods).

## Before TestFlight

1. **Bundle ID** — Set in Xcode target → Signing & Capabilities; must match the identifier in [App Store Connect](https://appstoreconnect.apple.com). Default in repo: `uk.co.ontrack.planner`.
2. **Versioning** — Xcode target → General: **Version** (marketing, e.g. `1.0.2`) and **Build** (monotonic integer per upload).
3. **Signing** — Enable “Automatically manage signing”, select your **Team**.
4. **Deployment target** — iOS **17.0**+ (SwiftData).
5. **Privacy manifest** — In Xcode: **File → New → File → App Privacy** (or add `PrivacyInfo.xcprivacy` to the app target). Declare tracking (`NSPrivacyTracking` = false for OnTrack as shipped) and any **required-reason APIs** if Xcode validates them for your SDK version. Revisit when adding analytics or third-party SDKs.
6. **App Privacy (nutrition labels)** — In App Store Connect → App Privacy: OnTrack is **local-first**; disclose only what you actually collect (e.g. crash analytics if you add them later).
7. **Export compliance** — Standard HTTPS only → typically exempt; reassess if you ship custom encryption for backups.
8. **Archive** — Product → Archive → Distribute App → App Store Connect / TestFlight.

## App Store (external)

- Screenshots per required device sizes, description, keywords, support URL, **privacy policy URL**.
- Review notes: financial projections are **on-device**; no account; explain any test credentials if applicable.

## Ongoing updates

- Web: `npm run build` → deploy `dist` (e.g. Cloudflare Pages).
- iOS: bump version/build in Xcode → Archive → upload. Numeric parity with web is guarded by `fixtures/engine-goldens/` and `npm run test:ios-engine` (see [ENGINE_DUAL_PLATFORM.md](./ENGINE_DUAL_PLATFORM.md)).
