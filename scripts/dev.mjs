import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: {
  host: { type: 'string', default: '127.0.0.1' },
  port: { type: 'string', default: '5173' },
  'portfolio-port': { type: 'string', default: '5174' },
  strictPort: { type: 'boolean', default: true },
} });
process.env.ARCADE_PORT = values.port;
process.env.PORTFOLIO_PORT = values['portfolio-port'];
const servers = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.allSettled(servers.map(server => server.close()));
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => void stop());
try {
  for (const [app, port] of [['portfolio', values['portfolio-port']], ['arcade', values.port]]) {
    if (stopping) break;
    const appRoot = resolve(root, 'apps', app);
    const require = createRequire(resolve(appRoot, 'package.json'));
    const vitePath = resolve(dirname(require.resolve('vite/package.json')), 'dist/node/index.js');
    const { createServer } = await import(pathToFileURL(vitePath));
    const server = await createServer({ root: appRoot, server: {
      host: app === 'portfolio' ? '127.0.0.1' : values.host,
      port: Number(port),
      strictPort: true,
    } });
    servers.push(server);
    if (stopping) { await server.close(); break; }
    await server.listen();
    server.httpServer.on('error', error => { console.error(error); void stop(1); });
    server.printUrls();
  }
} catch (error) {
  console.error(error);
  await stop(1);
}
