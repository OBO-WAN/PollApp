import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4200';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run ng -- serve --host 127.0.0.1 --port 4200',
    url: baseURL,
    reuseExistingServer: !process.env['CI'],
  },
});
