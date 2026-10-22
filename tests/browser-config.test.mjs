import assert from 'node:assert/strict';
import { test } from 'node:test';
import { devices } from '@playwright/test';
import config from '../playwright.config.js';

const project = name => config.projects.find(project => project.name === name);
const selects = (project, title) => (!project.grep || project.grep.test(title)) &&
  (!project.grepInvert || !project.grepInvert.test(title));

test('production retains full feature coverage while development checks its integration paths', () => {
  for (const device of ['desktop', 'mobile']) {
    const production = project(`production-${device}`);
    const development = project(`development-${device}`);
    assert.ok(selects(production, 'cabinet appearance @webgl'));
    assert.ok(selects(production, 'game controls'));
    assert.ok(selects(development, 'embedded navigation @webgl @smoke'));
    assert.ok(selects(development, 'unpublished article fixture @development'));
    assert.ok(!selects(development, 'cabinet appearance @webgl'), 'Do not repeat the full scene suite in development');
    assert.ok(!selects(production, 'unpublished article fixture @development'));
    assert.ok(development.dependencies.includes('development-hmr'));
    assert.ok(production.dependencies.includes('development-hmr'));
  }
  assert.ok(project('external-override'));
});

test('mobile keeps touch and viewport emulation without multiplying software-rendered pixels', () => {
  for (const name of ['development-mobile', 'production-mobile']) {
    const { use } = project(name);
    assert.equal(use.isMobile, true);
    assert.equal(use.hasTouch, true);
    assert.deepEqual(use.viewport, devices['Pixel 7'].viewport);
    assert.equal(use.deviceScaleFactor, 1);
  }
});

test('passing tests do not record traces and flaky retries still fail the run', () => {
  assert.equal(config.use.trace, 'on-first-retry');
  assert.equal(config.failOnFlakyTests, true);
});
