import { defineConfig, devices } from '@playwright/test';
import { cpus, release } from 'node:os';

const baseURL = 'http://localhost:8222';

export default defineConfig({
  testDir: '.',
  testMatch: [
    '_elements/**/*.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : (cpus().length / 2) || 4,
  timeout: 30000,

  reporter: [
    ['line'],
    ['html'],
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    ...release().includes('gentoo') ? [] : [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }],
  ],

  webServer: {
    command: 'npm run demo',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
    wait: {
      stdout: /Server started on/,
    },
    gracefulShutdown: {
      signal: 'SIGTERM',
      timeout: 500,
    },
  },

  use: {
    baseURL,
  },
});
