import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import { preview } from 'vite';

let server;
let origin;

before(async () => {
  server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } });
  origin = server.resolvedUrls.local[0];
});

after(async () => {
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
});

test('production includes every existing menu destination and the resume', async () => {
  for (const href of ['/portfolio/', '/portfolio/src/portfolio-game/game.html', '/portfolio/src/blog-website/blog.html', '/portfolio/RVafadar_Resume.pdf']) {
    const response = await fetch(new URL(href, origin));
    assert.equal(response.status, 200, href);
    if (href.endsWith('.pdf')) {
      assert.match(response.headers.get('content-type'), /application\/pdf/, href);
      const pdf = Buffer.from(await response.arrayBuffer());
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', href);
      assert.deepEqual(pdf, await readFile(new URL('../public/RVafadar_Resume.pdf', import.meta.url)));
    } else {
      const html = await response.text();
      if (href !== '/portfolio/') assert.ok(!html.includes('id="root"'), `${href} must serve its own page, not the homepage fallback`);
      for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
        assert.ok(asset.startsWith('/portfolio/'), `${asset} must use the portfolio base`);
        const resource = await fetch(new URL(asset, response.url));
        assert.equal(resource.status, 200, asset);
        assert.match(resource.headers.get('content-type'), /javascript|css/, asset);
      }
    }
  }
});
