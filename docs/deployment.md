# Deployment Guide

## Environment variables (EAS)

Set in EAS secrets or `eas.json` env:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

## Build profiles

| Profile | Use |
|---------|-----|
| development | Dev client with debugging |
| preview | Internal APK/IPA testing |
| production | App Store / Play Store |

```bash
eas build --profile production --platform all
```

## Supabase production

1. Create production Supabase project (separate from dev)
2. Run migrations: `supabase db push`
3. Enable RLS on all tables (included in migrations)
4. Configure Auth redirect URLs for production app scheme
5. Deploy `delete-user` edge function

## App Store (iOS)

- Requires Apple Developer account
- Enable Sign in with Apple (mandatory if Google sign-in offered)
- Configure `bundleIdentifier`: `com.workguard.app`
- Submit via `eas submit --platform ios`

## Google Play (Android)

- Configure `package`: `com.workguard.app`
- Upload AAB via `eas submit --platform android`

## CI/CD

GitHub Actions runs lint, typecheck, tests, and web export on every push. See `.github/workflows/ci.yml`.
