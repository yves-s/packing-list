import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000', viewport: { width: 390, height: 844 } },
  projects: [{ name: 'mobile-safari', use: { ...devices['iPhone 13'] } }],
  webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true },
})
