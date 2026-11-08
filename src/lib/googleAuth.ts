import authClient from './authClient';

const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function buildGoogleUrl(appName: string) {
  const env = import.meta.env as Record<string, string | undefined>;
  const clientId = env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = env.VITE_GOOGLE_AUTH_PROXY;
  if (!clientId || !redirectUri) return null;
  const state = btoa(JSON.stringify({ origin: window.location.origin, appName }));
  return `{{https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}}}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(state)}`;
}

export function signInWithGoogle(appName = 'منصة تلاقي القطرية للزواج') {
  const url = buildGoogleUrl(appName);
  if (!url) {
    console.warn('[google-auth] Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_AUTH_PROXY');
    return;
  }

  window.open(url, 'google-auth', isMobile() ? '' : 'width=500,height=600');

  const handler = async (event: MessageEvent) => {
    if (event.data?.type === 'google-auth-denied') {
      window.removeEventListener('message', handler);
      return;
    }
    if (event.data?.type !== 'google-auth-success') return;
    window.removeEventListener('message', handler);
    if (event.data.access_token && event.data.refresh_token) {
      const { error } = await authClient.auth.setSession({ access_token: event.data.access_token, refresh_token: event.data.refresh_token });
      if (error) console.error('[google-auth] setSession failed:', error.message);
    } else if (event.data.id_token) {
      const { error } = await authClient.auth.signInWithIdToken({ provider: 'google', token: event.data.id_token });
      if (error) console.error('[google-auth] signInWithIdToken failed:', error.message);
    }
  };
  window.addEventListener('message', handler);
}

export async function handleGoogleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('google_id_token');
  if (!token) return;
  window.history.replaceState({}, '', window.location.pathname);
  const { error } = await authClient.auth.signInWithIdToken({ provider: 'google', token });
  if (error) {
    console.error('[google-auth] signInWithIdToken failed:', error.message);
    return;
  }
  try { window.close(); } catch {}
}
