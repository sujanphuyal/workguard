<p align="center">
  <img src="assets/images/logo.png" alt="WorkGuard" width="160" />
</p>

# WorkGuard

A mobile app for Android and iOS that helps international students in Australia track work hours and stay within visa compliance limits.

WorkGuard lets you log shifts, plan rosters, and see how your hours add up over a rolling 14-day window — so you can work smart and stay compliant.

> **Disclaimer:** WorkGuard is a personal work-hours tracking and planning tool. It does not provide legal or migration advice.

## What you can do

- Track shifts across multiple employers
- See rolling 14-day hour limits and compliance warnings
- View upcoming shifts on the dashboard and calendar
- Use employer-specific shift labels for quick time entry
- Import rosters from CSV and export weekly CSV reports
- Work offline with local storage; sync to the cloud when signed in
- Try the app in **Guest mode** without creating an account

## Quick start

**Prerequisites:** Node.js 20+, npm, and [Expo Go](https://expo.dev/go) on your phone (optional).

```bash
git clone <your-repo-url>
cd workguard
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm start
```

Scan the QR code in Expo Go, or press `a` for Android / `i` for iOS simulator.

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
```

Supabase is **optional** for Guest mode. It is required for sign-in, cloud sync, and Google authentication.

For database migrations, OAuth, and production builds, see the [Setup Guide](docs/setup.md).

## Try without a backend

On the login screen, choose **Continue as Guest**. Your data stays on the device only and is not synced to the cloud. You can create an account later to enable sync.

## Documentation

| Guide | Description |
|-------|-------------|
| [Setup](docs/setup.md) | Supabase, auth, migrations, and EAS build |
| [Architecture](docs/architecture.md) | App structure and rule engine |
| [Deployment](docs/deployment.md) | Store submission |
| [API](docs/api.md) | Backend API reference |
| [Database schema](docs/database-schema.md) | Tables and relationships |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run generate:brand-assets` | Regenerate app icons and splash images |

## Tech stack

Expo SDK 56 · React Native · TypeScript · Supabase · Expo SQLite · React Native Paper (Material Design 3)

## License

MIT — see [LICENSE](LICENSE).
