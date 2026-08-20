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
