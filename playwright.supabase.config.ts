/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'supabase-read.integration.spec.ts',
  workers: 1,
  use: { baseURL },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      'npm run supabase:config && npm run ng -- serve --host 127.0.0.1 --port 4200 --live-reload=false --hmr=false',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
  },
});
