import { Injectable } from '@angular/core';

const STORAGE_KEY = 'pollapp.anonymous-voter-token';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class AnonymousVoterToken {
  readonly value = resolveAnonymousVoterToken();
}

function resolveAnonymousVoterToken(): string {
  const storedToken = readStoredToken();

  if (storedToken && UUID_PATTERN.test(storedToken)) {
    return storedToken;
  }

  const generatedToken = globalThis.crypto.randomUUID();
  storeToken(generatedToken);

  return generatedToken;
}

function readStoredToken(): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // The service instance retains the token when browser storage is unavailable.
  }
}
