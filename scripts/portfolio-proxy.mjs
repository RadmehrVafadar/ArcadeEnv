import { createProxyServer } from 'http-proxy-3';

export function portfolioProxy() {
  let proxy;
  const sockets = new Set();
  return {
    name: 'portfolio-proxy',
    apply: 'serve',
    configureServer(server) {
      proxy = createProxyServer({ target: `http://127.0.0.1:${process.env.PORTFOLIO_PORT || 5174}` });
      proxy.on('error', (error, request, response) => {
        // Browsers can reset HMR sockets while navigating or closing a context.
        if (['ECONNRESET', 'ECONNABORTED', 'EPIPE'].includes(error.code) &&
          response.destroyed && !('writeHead' in response)) return;
        server.config.logger.error(`Portfolio proxy error at ${request.url}: ${error.stack}`);
        if ('writeHead' in response) {
          if (!response.headersSent) response.writeHead(502);
          response.end();
        } else response.destroy();
      });
      server.middlewares.use((request, response, next) => {
        if (request.url.startsWith('/portfolio/')) proxy.web(request, response);
        else next();
      });
      server.httpServer.on('upgrade', (request, socket, head) => {
        if (!request.url.startsWith('/portfolio/')) return;
        sockets.add(socket);
        socket.once('close', () => sockets.delete(socket));
        proxy.ws(request, socket, head);
      });
    },
    closeBundle() {
      for (const socket of sockets) socket.destroy();
      sockets.clear();
      proxy?.close();
    },
  };
}
