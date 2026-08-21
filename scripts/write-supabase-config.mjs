import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('public/supabase-config.json');
const environmentUrl = process.env.POLLAPP_SUPABASE_URL;
const environmentKey = process.env.POLLAPP_SUPABASE_PUBLISHABLE_KEY;

if (Boolean(environmentUrl) !== Boolean(environmentKey)) {
  throw new Error(
    'POLLAPP_SUPABASE_URL and POLLAPP_SUPABASE_PUBLISHABLE_KEY must be provided together.',
  );
}

const cliEnvironment = readLocalSupabaseEnvironment();
const supabaseUrl = environmentUrl || cliEnvironment.API_URL;
const publishableKey = environmentKey || cliEnvironment.PUBLISHABLE_KEY || cliEnvironment.ANON_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    'Unable to find the local Supabase URL and browser key. Start Supabase before running this command.',
  );
}

if (!isHttpUrl(supabaseUrl)) {
  throw new Error('Refusing to write Supabase configuration: the URL must use HTTP or HTTPS.');
}

if (!isBrowserKey(publishableKey)) {
  throw new Error(
    'Refusing to write Supabase configuration: use only a browser-safe publishable or legacy anon key.',
  );
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({ supabaseUrl, supabasePublishableKey: publishableKey }, null, 2)}\n`,
  'utf8',
);

console.log(`Wrote browser-safe Supabase configuration to ${outputPath}.`);

function readLocalSupabaseEnvironment() {
  if (process.env.POLLAPP_SUPABASE_URL && process.env.POLLAPP_SUPABASE_PUBLISHABLE_KEY) {
    return {};
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const output = execFileSync(command, ['supabase', 'status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map((match) => [match[1], unquote(match[2])]),
  );
}

function unquote(value) {
  const trimmedValue = value.trim();

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    return trimmedValue.slice(1, -1);
  }

  return trimmedValue;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isBrowserKey(value) {
  if (value.startsWith('sb_publishable_')) {
    return true;
  }

  const encodedPayload = value.split('.')[1];

  if (!encodedPayload) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return payload.role === 'anon';
  } catch {
    return false;
  }
}
