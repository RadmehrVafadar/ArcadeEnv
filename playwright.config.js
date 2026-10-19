import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    ...['development', 'production'].flatMap(mode => [
      { name: `${mode}-desktop`, testIgnore: '**/override.spec.js', use: { ...devices['Desktop Chrome'], baseURL: `http://127.0.0.1:${mode === 'development' ? 4173 : 4174}` } },
      { name: `${mode}-mobile`, testIgnore: '**/override.spec.js', use: { ...devices['Pixel 7'], baseURL: `http://127.0.0.1:${mode === 'development' ? 4173 : 4174}` } },
    ]),
    { name: 'external-override', testMatch: '**/override.spec.js', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4175' } },
  ],
  webServer: [
    { command: 'node scripts/dev.mjs --port 4173 --portfolio-port 5174', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
    { command: 'node scripts/dev.mjs --port 4175 --portfolio-port 5176', url: 'http://127.0.0.1:4175', env: { VITE_IFRAME_URL: 'https://external-portfolio.test/' }, reuseExistingServer: false },
  ],
});
