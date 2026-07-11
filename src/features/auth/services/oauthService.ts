import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { syncService } from '@/services/syncService';
import type { Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

let oauthFlowActive = false;
let completingOAuth: Promise<Session> | null = null;

/** Redirect URI sent to Supabase — must be allowlisted in the Supabase Auth settings. */
export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'workguard',
    path: 'auth/callback',
  });
}

export function isOAuthFlowActive(): boolean {
  return oauthFlowActive;
}

export function getOAuthSetupHint(): string {
  const redirect = getOAuthRedirectUri();
  const inExpoGo = Constants.appOwnership === 'expo';
  if (inExpoGo) {
    return `Add this redirect URL in Supabase → Authentication → URL Configuration:\n${redirect}\n(Expo Go uses a dynamic exp:// URL — copy it from Metro logs if sign-in fails.)`;
  }
  return `Add this redirect URL in Supabase → Authentication → URL Configuration:\n${redirect}`;
}

async function dismissAuthBrowser(): Promise<void> {
  try {
    await WebBrowser.dismissBrowser();
  } catch {
    // Browser may already be closed
  }
  if (Platform.OS === 'android') {
    try {
      await WebBrowser.coolDownAsync();
    } catch {
      // ignore
    }
  }
}

async function finalizeSession(session: Session): Promise<Session> {
  await syncService.pullFromRemote(session.user.id);
  await dismissAuthBrowser();
  return session;
}

function watchForOAuthSession(): { promise: Promise<Session>; cancel: () => void } {
  let settled = false;

  const promise = new Promise<Session>((resolve) => {
    let pollId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let subscription: { unsubscribe: () => void } | undefined;

    const finish = (session: Session) => {
      if (settled) return;
      settled = true;
      cleanup();
      void dismissAuthBrowser();
      resolve(session);
    };

    const cleanup = () => {
      subscription?.unsubscribe();
      if (pollId) clearInterval(pollId);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        finish(session);
      }
    });
    subscription = sub;

    pollId = setInterval(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) finish(data.session);
      });
    }, 250);

    timeoutId = setTimeout(() => {
      cleanup();
    }, 120_000);
  });

  return {
    promise,
    cancel: () => {
      settled = true;
    },
  };
}

export async function completeOAuthFromUrl(url: string): Promise<Session> {
  if (completingOAuth) {
    return completingOAuth;
  }

  completingOAuth = (async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url);
    if (exchangeError) {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) {
        throw new Error(`Sign-in error: ${errorCode}`);
      }
      if (params.access_token && params.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) throw sessionError;
      } else {
        throw exchangeError;
      }
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      throw new Error('Sign-in completed but no session was created.');
    }

    return finalizeSession(data.session);
  })();

  try {
    return await completingOAuth;
  } finally {
    completingOAuth = null;
  }
}

export async function startOAuthSignIn(provider: 'google'): Promise<Session> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }

  const redirectTo = getOAuthRedirectUri();

  if (__DEV__) {
    console.info(`[OAuth] provider=${provider} redirectTo=${redirectTo}`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error(`Could not start ${provider} sign-in.`);
  }

  oauthFlowActive = true;
  const watcher = watchForOAuthSession();

  try {
    const browserResult = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        showInRecents: true,
        ...(Platform.OS === 'android' ? { createTask: false } : {}),
      }),
      watcher.promise.then(() => ({ type: 'background' as const })),
    ]);

    if ('type' in browserResult && browserResult.type === 'success' && browserResult.url) {
      watcher.cancel();
      return completeOAuthFromUrl(browserResult.url);
    }

    if ('type' in browserResult && browserResult.type === 'background') {
      watcher.cancel();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        return finalizeSession(sessionData.session);
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      watcher.cancel();
      return finalizeSession(sessionData.session);
    }

    if (
      'type' in browserResult &&
      (browserResult.type === 'cancel' || browserResult.type === 'dismiss')
    ) {
      throw new Error('Google sign-in was cancelled.');
    }

    throw new Error(
      `Google sign-in did not finish. ` +
        `Confirm Supabase allows redirect: ${redirectTo}`,
    );
  } finally {
    watcher.cancel();
    oauthFlowActive = false;
    await dismissAuthBrowser();
  }
}

export function isOAuthCallbackUrl(url: string): boolean {
  return url.includes('auth/callback') || url.includes('access_token=') || url.includes('code=');
}
