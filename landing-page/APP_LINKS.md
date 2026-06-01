# App Links (Android) and Universal Links (iOS)

These files live under [.well-known/](./.well-known/) and deploy to:

- https://flean.ai/.well-known/assetlinks.json
- https://flean.ai/.well-known/apple-app-site-association

## Current configuration

| Item | Value |
|------|--------|
| Android package | `ai.flean.shop` |
| iOS `appID` | `4YSZ772A2Y.ai.flean.shop` (Team ID + bundle ID) |
| URL scope | Matches the Android app manifest intent filter: HTTPS `flean.ai` with path prefix **`/product`** (`/product`, `/product/...`). |
| Product share fallback | [`product/deeplink.html`](./product/deeplink.html) — CloudFront rewrites `/product/{id}` to this page; opens the app when installed, else Play Store / App Store. |

### Android fingerprints

[`assetlinks.json`](./.well-known/assetlinks.json) includes the **local debug keystore** SHA-256 and the **release keystore** (`android/flean.jks`) fingerprint for local release builds.

**Google Play builds** use [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756). If Play re-signs your APK/AAB, also add the **App signing key certificate** SHA-256 from Play Console:

**Release** → **App integrity** → **App signing** → **App signing key certificate**

Append that fingerprint (colon-separated uppercase hex, same format as debug) as an **additional** string in `sha256_cert_fingerprints` so production installs pass `autoVerify`.

## Deploy

[`sync-s3-production.sh`](./sync-s3-production.sh) uploads `.well-known` with `Cache-Control: no-cache` and `Content-Type: application/json`.

[`sync-cloudfront-function.sh`](./sync-cloudfront-function.sh) publishes URI rewrites (onelink, flean-score, **product deeplink**) to CloudFront function `flean-score-rewrite-index`.

## Troubleshooting

If `curl -I https://flean.ai/.well-known/assetlinks.json` shows **`Content-Type: text/html`** and a large **`content-length`**, CloudFront/S3 is almost certainly returning your **`index.html` fallback** (common for SPA 403/404 remap). That happens when **`/.well-known/...`** objects do not exist yet, or caches have not invalidated.

Fix: upload the keys **`/.well-known/assetlinks.json`** and **`/.well-known/apple-app-site-association`** to the bucket (run `sync-s3-production.sh`), then invalidate CloudFront. After that, **`Content-Type`** should be **`application/json`** and the Digital Asset Links check should succeed.

## Verification

After deploy:

```bash
curl -sfI https://flean.ai/.well-known/assetlinks.json
curl -sfI https://flean.ai/.well-known/apple-app-site-association
curl -sf "https://flean.ai/.well-known/assetlinks.json" | python3 -m json.tool
curl -sf "https://flean.ai/.well-known/apple-app-site-association" | python3 -m json.tool
```

Digital Asset Links (Google):

```text
https://digitalassetlinks.googleapis.com/v1/statements:list?relation=delegate_permission/common.handle_all_urls&source.web.site=https://flean.ai
```

Android device (installed app):

```bash
adb shell pm get-app-links ai.flean.shop
adb shell pm verify-app-links --re-verify ai.flean.shop
```

iOS: use Apple’s [Associated Domains / universal links validation](https://developer.apple.com/documentation/xcode/supporting-associated-domains) tooling and tap a `https://flean.ai/product/...` link in Notes/Mail while the app is installed.
