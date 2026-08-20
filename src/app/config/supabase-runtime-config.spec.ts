import { parseSupabaseRuntimeConfig } from './supabase-runtime-config';

describe('Supabase runtime configuration', () => {
  it('accepts a browser-safe local configuration', () => {
    expect(
      parseSupabaseRuntimeConfig({
        supabaseUrl: 'http://127.0.0.1:54321',
        supabasePublishableKey: browserJwt('anon'),
      }),
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      publishableKey: browserJwt('anon'),
    });
  });

  it('accepts the current publishable key format', () => {
    expect(
      parseSupabaseRuntimeConfig({
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'sb_publishable_example',
      }),
    ).not.toBeNull();
  });

  it.each([
    null,
    {},
    { supabaseUrl: 'not-a-url', supabasePublishableKey: browserJwt('anon') },
    { supabaseUrl: 'http://127.0.0.1:54321', supabasePublishableKey: 'secret-value' },
    { supabaseUrl: 'http://127.0.0.1:54321', supabasePublishableKey: browserJwt('service_role') },
  ])('rejects invalid or unsafe configuration %#', (value) => {
    expect(parseSupabaseRuntimeConfig(value)).toBeNull();
  });
});

function browserJwt(role: string): string {
  return `header.${btoa(JSON.stringify({ role }))}.signature`;
}
