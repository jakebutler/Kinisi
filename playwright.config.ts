import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables for Playwright process so auth fixture derives correct Supabase project ref
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'e2e-auth',
      testMatch: [
        /e2e\/(survey.*\.spec\.ts)$/,
        /e2e\/(programSchedule\.spec\.ts)$/,
        /e2e\/(dashboardSchedule\.spec\.ts)$/,
        /e2e\/(dashboardGenerateSchedule\.spec\.ts)$/,
      ],
    },
    {
      name: 'e2e-anon',
      testMatch: [
        /e2e\/(assessmentFeedback\.spec\.ts)$/,
      ],
    },
  ],
});
