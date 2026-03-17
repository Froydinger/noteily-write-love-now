const CURRENT_PROJECT_REF = 'zupjsghppxyvmgwxvycc';
const AUTH_KEY_PATTERNS = ['supabase.auth', 'sb-', CURRENT_PROJECT_REF];

function collectMatchingStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && patterns.some((pattern) => key.includes(pattern))) {
      keysToRemove.push(key);
    }
  }

  return keysToRemove;
}

function clearStorageKeys(storage: Storage, patterns: string[]) {
  const keysToRemove = collectMatchingStorageKeys(storage, patterns);
  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove.length;
}

export function clearStaleAuthCache() {
  // No stale project refs to clear anymore
}

export function clearAllAuthCache() {
  clearStorageKeys(localStorage, AUTH_KEY_PATTERNS);
  clearStorageKeys(sessionStorage, AUTH_KEY_PATTERNS);
}
