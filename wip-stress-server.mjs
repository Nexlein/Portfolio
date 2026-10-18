// Logs every connection and request so a stalled WebKit navigation can be matched to server activity.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { preview } = await import(pathToFileURL(createRequire(process.cwd() + '/').resolve('vite')).href);
const t0 = Date.now();
const log = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(3), ...a);
await preview({
    preview: { port: 4173, strictPort: true },
    plugins: [
        {
            name: 'log',
            configurePreviewServer(s) {
                s.httpServer.on('connection', (sock) => {
                    const p = sock.remotePort;
                    log('conn+', p);
                    sock.on('close', () => log('conn-', p));
                });
                s.middlewares.use((req, res, next) => {
                    const p = req.socket.remotePort;
                    log('req', p, req.method, req.url, req.headers.range || '');
                    res.on('finish', () => log('fin', p, res.statusCode, req.url));
                    res.on('close', () => !res.writableFinished && log('abort', p, req.url));
                    next();
                });
            }
        }
    ]
});
log('listening');
