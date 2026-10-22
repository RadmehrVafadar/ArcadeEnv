import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  failOnFlakyTests: true,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE || 'test-results/report.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'development-hmr', testMatch: '**/hmr.spec.js', use: { ...devices['Desktop Chrome'] } },
    ...['development', 'production'].flatMap(mode => [
      ...['desktop', 'mobile'].map(device => ({
        name: `${mode}-${device}`,
        dependencies: ['development-hmr'],
        testIgnore: ['**/override.spec.js', '**/hmr.spec.js'],
        ...(mode === 'development' ? { grep: /@development|@smoke/ } : { grepInvert: /@development/ }),
        use: {
          ...devices[device === 'desktop' ? 'Desktop Chrome' : 'Pixel 7'],
          deviceScaleFactor: 1,
          baseURL: `http://127.0.0.1:${mode === 'development' ? 4173 : 4174}`,
        },
      })),
    ]),
    { name: 'external-override', dependencies: ['development-hmr'], testMatch: '**/override.spec.js', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4175' } },
  ],
  webServer: [
    { command: 'node scripts/dev.mjs --port 4173 --portfolio-port 5174', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
    { command: 'node scripts/dev.mjs --port 4175 --portfolio-port 5176', url: 'http://127.0.0.1:4175', env: { VITE_IFRAME_URL: 'https://external-portfolio.test/' }, reuseExistingServer: false },
  ],
});
