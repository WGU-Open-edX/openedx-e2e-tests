import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  outputDir: './artifacts/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: './artifacts/playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://apps.local.openedx.io:1996',
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--disable-web-security'],
    },
    // Record everything when RECORD_VIDEO env var is set, otherwise only on failure
    screenshot: process.env.RECORD_VIDEO ? 'on' : 'only-on-failure',
    video: process.env.RECORD_VIDEO ? 'on' : 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // webServer configuration removed since edX is running externally
});
