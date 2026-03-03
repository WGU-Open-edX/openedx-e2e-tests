"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = (0, test_1.defineConfig)({
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
            use: { ...test_1.devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...test_1.devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...test_1.devices['Desktop Safari'] },
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
//# sourceMappingURL=playwright.config.js.map