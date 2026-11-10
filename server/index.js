// Serveur local (dev) : fichiers statiques + mêmes routes /api que sur Vercel.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
try { fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2]; }); } catch {}
const handle = require('../lib/core'), PORT = +process.env.PORT || 3000, PUB = path.join(ROOT, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`), p = u.pathname;
  try {
    if (p.startsWith('/api/')) {
      const c = []; let sz = 0; for await (const d of req) { sz += d.length; if (sz > 65536) { res.writeHead(413); return res.end('{"error":"too_large"}'); } c.push(d); }
      const r = await handle({ method: req.method, path: p, q: u.searchParams, raw: Buffer.concat(c).toString(), headers: req.headers });
      res.writeHead(r ? r.code : 404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(r ? r.json : {}));
    }
    const f = path.normalize(path.join(PUB, p === '/' ? 'index.html' : p));
    if (!f.startsWith(PUB + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  } catch { res.writeHead(500); res.end('{"error":"server"}'); }
}).listen(PORT, () => console.log('Bloxia sur http://localhost:' + PORT));
