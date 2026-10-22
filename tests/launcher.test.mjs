import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import net from 'node:net';
import { test } from 'node:test';
import { portfolioProxy } from '../scripts/portfolio-proxy.mjs';

async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}
const close = server => new Promise(resolve => server.close(resolve));
async function waitForServer(port, child) {
  for (let attempt = 0; attempt < 200; attempt++) {
    assert.equal(child.exitCode, null, 'launcher exited before readiness');
    try {
      if ((await fetch(`http://127.0.0.1:${port}/`)).ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail(`Server did not start on ${port}`);
}
async function assertReleased(port) {
  const server = net.createServer();
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
  await close(server);
}
function start(arcadePort, portfolioPort, options = {}) {
  return spawn(process.execPath, ['scripts/dev.mjs', '--port', String(arcadePort), '--portfolio-port', String(portfolioPort)], { stdio: 'ignore', ...options });
}

test('portfolio proxy survives abrupt HMR disconnects without deprecated APIs or socket errors', { timeout: 30000 }, async () => {
  const arcade = await reservePort();
  const portfolio = await reservePort();
  const arcadePort = arcade.address().port;
  const portfolioPort = portfolio.address().port;
  await close(arcade);
  await close(portfolio);
  const child = start(arcadePort, portfolioPort, { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data; });
  let socket;
  try {
    await waitForServer(arcadePort, child);
    const response = await fetch(`http://127.0.0.1:${arcadePort}/portfolio/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /@vite\/client/);
    socket = net.connect(arcadePort, '127.0.0.1');
    await once(socket, 'connect');
    socket.write('GET /portfolio/__hmr HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Protocol: vite-hmr\r\n\r\n');
    const [handshake] = await once(socket, 'data');
    assert.match(handshake.toString(), /101 Switching Protocols/);
    socket.resetAndDestroy();
    // Let the reset reach the proxy before checking its logs and readiness.
    await new Promise(resolve => setTimeout(resolve, 200));
    assert.equal((await fetch(`http://127.0.0.1:${arcadePort}/portfolio/`)).status, 200);
    assert.doesNotMatch(output, /DEP0060|ECONNRESET|ws proxy socket error/);
  } finally {
    socket?.destroy();
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }
});

test('portfolio proxy reports unavailable upstreams and returns 502', { timeout: 30000 }, async () => {
  const upstream = await reservePort();
  const previousPort = process.env.PORTFOLIO_PORT;
  process.env.PORTFOLIO_PORT = String(upstream.address().port);
  await close(upstream);
  const plugin = portfolioProxy();
  const errors = [];
  const server = http.createServer();
  try {
    plugin.configureServer({
      httpServer: server,
      config: { logger: { error: message => errors.push(message) } },
      middlewares: { use: middleware => server.on('request', middleware) },
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/portfolio/`);
    assert.equal(response.status, 502);
    assert.match(errors.join('\n'), /Portfolio proxy error.*ECONNREFUSED/);
  } finally {
    plugin.closeBundle();
    await close(server);
    if (previousPort === undefined) delete process.env.PORTFOLIO_PORT;
    else process.env.PORTFOLIO_PORT = previousPort;
  }
});

test('startup failure releases the already-started portfolio server', { timeout: 30000 }, async () => {
  const occupied = await reservePort();
  const available = await reservePort();
  const portfolioPort = available.address().port;
  await close(available);
  const child = start(occupied.address().port, portfolioPort);
  try {
    const [code] = await once(child, 'exit');
    assert.equal(code, 1);
    await assertReleased(portfolioPort);
  } finally {
    child.kill();
    await close(occupied);
  }
});

test('interruption releases both development ports', { timeout: 30000 }, async () => {
  const arcade = await reservePort();
  const portfolio = await reservePort();
  const arcadePort = arcade.address().port;
  const portfolioPort = portfolio.address().port;
  await close(arcade);
  await close(portfolio);
  const child = start(arcadePort, portfolioPort);
  try {
    await waitForServer(arcadePort, child);
    const exited = once(child, 'exit');
    child.kill('SIGINT');
    await exited;
    await assertReleased(arcadePort);
    await assertReleased(portfolioPort);
  } finally {
    child.kill();
  }
});
