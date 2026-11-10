const handle = require('../lib/core');
// fixed : chemin imposé (fichiers api/webhook/whop.js, api/lead/update.js) ; sinon /api/* réécrit par vercel.json
const make = fixed => async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const u = new URL(req.url, 'http://x');
  const rt = u.searchParams.get('__route'); u.searchParams.delete('__route');
  const path = fixed || (rt != null ? '/api/' + rt.replace(/^\/+/, '') : u.pathname);
  try {
    const r = await handle({ method: req.method, path, q: u.searchParams, raw: Buffer.concat(chunks).toString(), headers: req.headers });
    if (!r) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'not found', path })); }
    res.statusCode = r.code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(r.json));
  } catch { res.statusCode = 500; res.end('{"error":"server"}'); }
};
module.exports = make();
module.exports.make = make;
module.exports.config = { api: { bodyParser: false } };
