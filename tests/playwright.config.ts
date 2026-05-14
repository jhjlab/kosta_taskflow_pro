import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 15000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    video: 'off',
    trace: 'off',
    actionTimeout: 8000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-360',
      use: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 },
    },
  ],
  outputDir: 'results',
});
