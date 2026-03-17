const OAUTH_CALLBACK_PARAM_KEYS = [
  'code',
  'access_token',
  'refresh_token',
  'expires_at',
  'expires_in',
  'token_type',
  'provider_token',
  'provider_refresh_token',
  'error',
  'error_description',
] as const;

function getHashSearchParams(hash = window.location.hash) {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(normalizedHash);
}

export function hasAuthCallbackParams() {
  const url = new URL(window.location.href);
  const hashParams = getHashSearchParams(url.hash);

  return OAUTH_CALLBACK_PARAM_KEYS.some((key) => url.searchParams.has(key) || hashParams.has(key));
}

export function getAuthCallbackCode() {
  return new URL(window.location.href).searchParams.get('code');
}

export function getAuthCallbackError() {
  const url = new URL(window.location.href);
  const hashParams = getHashSearchParams(url.hash);
  const error = url.searchParams.get('error') || hashParams.get('error');
  const description = url.searchParams.get('error_description') || hashParams.get('error_description');

  if (!error && !description) {
    return null;
  }

  return description || error;
}

export function getAuthHashSessionTokens() {
  const hashParams = getHashSearchParams();
  const access_token = hashParams.get('access_token');
  const refresh_token = hashParams.get('refresh_token');

  if (!access_token || !refresh_token) {
    return null;
  }

  return { access_token, refresh_token };
}

export function clearAuthCallbackParams() {
  const url = new URL(window.location.href);
  const hashParams = getHashSearchParams(url.hash);
  let changed = false;

  OAUTH_CALLBACK_PARAM_KEYS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }

    if (hashParams.has(key)) {
      hashParams.delete(key);
      changed = true;
    }
  });

  if (!changed) {
    return;
  }

  const nextHash = hashParams.toString();
  const nextUrl = `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ''}`;
  window.history.replaceState({}, document.title, nextUrl);
}
