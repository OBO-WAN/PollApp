export interface SupabaseRuntimeConfig {
  readonly url: string;
  readonly publishableKey: string;
}

interface SupabaseRuntimeConfigDocument {
  readonly supabaseUrl?: unknown;
  readonly supabasePublishableKey?: unknown;
}

export async function loadSupabaseRuntimeConfig(): Promise<SupabaseRuntimeConfig | null> {
  const configUrl = new URL('supabase-config.json', document.baseURI);

  try {
    const response = await fetch(configUrl);

    if (!response.ok) {
      return null;
    }

    return parseSupabaseRuntimeConfig(await response.json());
  } catch {
    return null;
  }
}

export function parseSupabaseRuntimeConfig(value: unknown): SupabaseRuntimeConfig | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const document = value as SupabaseRuntimeConfigDocument;
  const url = typeof document.supabaseUrl === 'string' ? document.supabaseUrl.trim() : '';
  const publishableKey =
    typeof document.supabasePublishableKey === 'string'
      ? document.supabasePublishableKey.trim()
      : '';

  if (!isHttpUrl(url) || !isBrowserKey(publishableKey)) {
    return null;
  }

  return { url, publishableKey };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isBrowserKey(value: string): boolean {
  if (value.startsWith('sb_publishable_')) {
    return true;
  }

  const encodedPayload = value.split('.')[1];

  if (!encodedPayload) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(normalizeBase64Url(encodedPayload))) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function normalizeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
}
