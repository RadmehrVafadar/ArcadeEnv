import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installCabinetNavigation } from '../src/cabinet-navigation.ts';

function fixture() {
  const page = new EventTarget();
  page.document = new EventTarget();
  page.location = { href: '/portfolio/' };
  const root = new EventTarget();
  page.document.defaultView = page;
  root.ownerDocument = page.document;
  const links = ['Start', 'Blog', 'Resume'].map(name => ({
    name, selected: false, clicks: 0,
    toggleAttribute(_name, selected) { this.selected = selected; },
    removeAttribute() { this.selected = false; },
    focus() {},
    click() { this.clicks++; },
  }));
  root.querySelectorAll = () => links;
  root.querySelector = () => links.find(link => link.back) || null;
  let ready = 0;
  page.addEventListener('arcade-controls-ready', () => ready++);
  const cleanup = installCabinetNavigation(root, '/portfolio/');
  return { page, links, cleanup, input: page.arcadeControls, ready,
    selected: () => links.find(link => link.selected)?.name };
}

test('cabinet menu steps once per tilt, wraps, and resets held sources', () => {
  const { input, links, selected, ready } = fixture();
  assert.equal(ready, 1);
  assert.equal(selected(), undefined, 'Standalone links remain unchanged');
  input.connect();
  assert.equal(selected(), 'Start');
  input.setDirection('stick', 'down');
  input.setDirection('stick', 'down');
  input.setDirection('other', null);
  assert.equal(selected(), 'Blog');
  input.setDirection('stick', null);
  input.setDirection('stick', 'down');
  assert.equal(selected(), 'Resume');
  input.action('read');
  assert.equal(links[2].clicks, 1, 'A activates the native link synchronously');
  input.reset();
  input.setDirection('stick', 'down');
  assert.equal(selected(), 'Start');
  input.setDirection('stick', 'up');
  assert.equal(selected(), 'Resume');
});

test('X does nothing on every main menu selection', () => {
  const { page, input, links, selected } = fixture();
  input.connect();
  for (const link of links) {
    assert.equal(selected(), link.name);
    input.action('open');
    const event = new Event('keydown', { cancelable: true });
    Object.assign(event, { key: 'x', code: 'KeyX' });
    page.document.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(selected(), link.name);
    assert.deepEqual(links.map(item => item.clicks), [0, 0, 0]);
    assert.equal(page.location.href, '/portfolio/');
    input.setDirection('stick', 'down');
    input.setDirection('stick', null);
  }
});

test('X activates the blog parent link independently of selection', () => {
  const { input, links } = fixture();
  input.connect();
  links[1].back = true;
  input.setDirection('stick', 'up');
  input.action('open');
  assert.equal(links[1].clicks, 1, 'Blog X follows the parent link');
  assert.equal(links[2].clicks, 0, 'X does not open the selected article');
  input.action('read');
  assert.equal(links[2].clicks, 1, 'Z still opens the selected article');
});

test('exit always returns home; disconnect and cleanup release navigation ownership', () => {
  const { page, input, selected, links, cleanup } = fixture();
  input.connect();
  page.location.href = '/portfolio/src/blog-website/blog.html#/tech';
  input.action('menu');
  assert.equal(page.location.href, '/portfolio/');
  input.disconnect();
  input.setDirection('stick', 'down');
  input.action('read');
  assert.equal(selected(), undefined);
  assert.equal(links[0].clicks, 0);
  input.connect();
  assert.equal(selected(), 'Start');
  cleanup();
  assert.equal(page.arcadeControls, undefined);
  assert.equal(selected(), undefined);
});

test('focused iframe keyboard navigation shares one-step selection and activation', () => {
  const { page, input, selected, links } = fixture();
  const key = (type, name, code = name) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { key: name, code });
    page.document.dispatchEvent(event);
  };
  input.connect();
  key('keydown', 'ArrowDown');
  key('keydown', 'ArrowDown');
  assert.equal(selected(), 'Blog');
  key('keyup', 'ArrowDown');
  key('keydown', 'ArrowDown');
  assert.equal(selected(), 'Resume');
  key('keydown', 'z', 'KeyZ');
  assert.equal(links[2].clicks, 1);
  page.location.href = '/portfolio/src/blog-website/blog.html';
  key('keydown', 'q', 'KeyQ');
  assert.equal(page.location.href, '/portfolio/');
  input.disconnect();
  key('keydown', 'ArrowDown');
  assert.equal(selected(), undefined);
});
