import {
  getOAuthRedirectUri,
  startOAuthSignIn,
} from '@/features/auth/services/oauthService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { syncService } from '@/services/syncService';

export {
  completeOAuthFromUrl,
  getOAuthRedirectUri,
  getOAuthSetupHint,
  isOAuthCallbackUrl,
  startOAuthSignIn,
} from '@/features/auth/services/oauthService';

const redirectTo = getOAuthRedirectUri();

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user) await syncService.pullFromRemote(data.user.id);
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function signInWithGoogle() {
  return startOAuthSignIn('google');
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates as never)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters.');
  }
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    throw new Error('Current password is incorrect.');
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function deleteAccount() {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const { error } = await supabase.functions.invoke('delete-user');
  if (error) throw error;
  await signOut();
}
