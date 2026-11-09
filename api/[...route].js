const handle = require('../lib/core');
module.exports = async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const u = new URL(req.url, 'http://x');
  try {
    const r = await handle({ method: req.method, path: u.pathname, q: u.searchParams, raw: Buffer.concat(chunks).toString(), headers: req.headers });
    if (!r) { res.statusCode = 404; return res.end('{}'); }
    res.statusCode = r.code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(r.json));
  } catch { res.statusCode = 500; res.end('{"error":"server"}'); }
};
module.exports.config = { api: { bodyParser: false } };
