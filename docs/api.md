# API Reference

## Supabase Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| Email sign up | `supabase.auth.signUp` | Creates user + profile trigger |
| Email sign in | `supabase.auth.signInWithPassword` | Returns session |
| OAuth | `supabase.auth.signInWithOAuth` | Google, Apple |
| Reset password | `supabase.auth.resetPasswordForEmail` | Sends reset email |
| Sign out | `supabase.auth.signOut` | Clears session |

## Tables (PostgREST)

All tables require authenticated JWT. RLS enforces user isolation.

- `GET/POST/PATCH/DELETE /rest/v1/profiles`
- `GET/PATCH /rest/v1/settings`
- `GET/POST/PATCH/DELETE /rest/v1/employers`
- `GET/POST/PATCH/DELETE /rest/v1/work_shifts`
- `GET/POST/PATCH/DELETE /rest/v1/semester_breaks`

## Realtime

Subscribe to postgres changes:

```typescript
supabase.channel('sync').on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'work_shifts',
  filter: `user_id=eq.${userId}`,
}, callback);
```

## Edge Functions

### delete-user

`POST /functions/v1/delete-user`

Requires `Authorization: Bearer <access_token>`. Cascades delete of all user data and auth record.
