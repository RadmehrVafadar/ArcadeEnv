import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['apps/**', 'dist/**', '.local-backups/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
