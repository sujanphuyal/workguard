# Setup Guide

## Prerequisites

- Node.js 20+
- npm
- Expo CLI (`npx expo`)
- Supabase account
- Supabase CLI (optional, for local migrations)

## 1. Clone and install

```bash
git clone <repo-url>
cd workguard
npm install --legacy-peer-deps
```

## 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy **Project URL** and **anon public key**
3. Create `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 3. Run migrations

```bash
npx supabase login
npx supabase link --project-ref <your-ref>
npx supabase db push
```

Or apply SQL files in `supabase/migrations/` via the Supabase SQL editor.

## 4. Configure Auth

In Supabase Dashboard → Authentication → Providers:

- Enable Email
- Enable Google (add OAuth client ID/secret)
- Enable Apple (iOS requires Apple Developer setup)

Add **all** of these redirect URLs in Supabase Dashboard → Authentication → URL Configuration:

- `workguard://auth/callback` (dev build / production)
- The Expo Go URL printed in Metro when you tap **Continue with Google** (looks like `exp://192.168.x.x:8081/--/auth/callback`)

The app logs the exact redirect URI to the Metro console in development — copy it into Supabase if Google sign-in opens but does not return to the app.

## 5. Deploy Edge Function (delete account)

```bash
npx supabase functions deploy delete-user
```

## 6. Run the app

```bash
npm start
```

Press `a` for Android or `i` for iOS simulator.

## 7. EAS Build (production)

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

See [deployment.md](deployment.md) for store submission.
