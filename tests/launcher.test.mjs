import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { test } from 'node:test';

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
function start(arcadePort, portfolioPort) {
  return spawn(process.execPath, ['scripts/dev.mjs', '--port', String(arcadePort), '--portfolio-port', String(portfolioPort)], { stdio: 'ignore' });
}

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
