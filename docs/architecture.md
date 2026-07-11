# Architecture

## Layers

```
UI (Expo Router screens)
  ↓
Features (hooks, feature components, orchestration)
  ↓
Services (sync, export, notifications)
  ↓
Repositories (SQLite) + Supabase Client
  ↓
Rule Engine (pure TypeScript, no RN/Supabase deps)
```

## Key modules

| Path | Responsibility |
|------|----------------|
| `src/app/` | Expo Router navigation |
| `src/features/` | Feature modules (auth, shifts, roster, etc.) |
| `src/rules/VisaRuleEngine.ts` | Visa compliance business logic |
| `src/database/` | SQLite schema and repositories |
| `src/services/syncService.ts` | Offline-first sync |
| `src/store/` | Zustand UI/auth state |

## Data flow

1. All reads come from SQLite (fast, offline)
2. Writes go to SQLite immediately, then enqueue sync mutation
3. SyncService pushes to Supabase when online
4. Realtime subscriptions pull remote changes

## Rule engine

The rule engine is completely independent of UI. Screens call `VisaRuleEngine` or module functions via hooks like `useCompliance()`.

Configuration-driven rule profiles in `src/rules/ruleProfiles.ts` allow policy changes without rewriting logic.
