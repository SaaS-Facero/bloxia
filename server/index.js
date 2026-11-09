const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
try { fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }); } catch {}
const E_ = process.env, PORT = +E_.PORT || 8790, BASE = E_.BASE_URL || `http://localhost:${PORT}`;
const PUB = path.join(ROOT, 'public'), DB = path.join(ROOT, 'data', 'leads.json');
const pack = require('./pack');
fs.mkdirSync(path.dirname(DB), { recursive: true });
const load = () => { try { return JSON.parse(fs.readFileSync(DB)); } catch { return {}; } };
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 1));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = req => new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
const clean = (s, n = 200) => String(s ?? '').slice(0, n);

function verifySig(raw, h) {
  const secret = E_.WHOP_WEBHOOK_SECRET; if (!secret) return false;
  const id = h['webhook-id'], ts = h['webhook-timestamp'], sigs = h['webhook-signature'];
  if (!id || !ts || !sigs || Math.abs(Date.now() / 1000 - +ts) > 300) return false;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
  const exp = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(' ').some(s => { const [v, b] = s.split(','); if (v !== 'v1' || !b) return false; const x = Buffer.from(b, 'base64'); return x.length === exp.length && crypto.timingSafeEqual(x, exp); });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, BASE), p = u.pathname;
  try {
    if (req.method === 'POST' && p === '/api/lead') {
      const b = JSON.parse((await body(req)).toString() || '{}'), d = load();
      const id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex');
      d[id] = { id, token, email: clean(b.email), name: clean(b.name, 60), answers: b.answers || {}, paid: false, created: Date.now() };
      save(d); return send(res, 200, { id, token });
    }
    if (req.method === 'POST' && p === '/api/checkout') {
      const b = JSON.parse((await body(req)).toString() || '{}'), d = load(), l = d[b.id];
      if (!l || l.token !== b.token) return send(res, 403, { error: 'invalid' });
      if (!E_.WHOP_API_KEY) return send(res, 200, { url: `${BASE}/merci.html?id=${l.id}&token=${l.token}&dev=1` });
      const r = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
        method: 'POST', headers: { Authorization: `Bearer ${E_.WHOP_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: { company_id: E_.WHOP_COMPANY_ID, currency: E_.WHOP_CURRENCY || 'eur', initial_price: +E_.WHOP_PRICE || 29, plan_type: 'one_time' }, metadata: { leadId: l.id }, redirect_url: `${BASE}/merci.html?id=${l.id}&token=${l.token}` })
      });
      const j = await r.json(); if (!r.ok) return send(res, 502, { error: 'whop', detail: j });
      return send(res, 200, { id: j.id, url: j.purchase_url || `https://whop.com/checkout/${j.id}` });
    }
    if (req.method === 'POST' && p === '/webhook/whop') {
      const raw = (await body(req)).toString();
      if (!verifySig(raw, req.headers)) return send(res, 400, { error: 'bad signature' });
      const ev = JSON.parse(raw), lid = ev?.data?.metadata?.leadId, d = load();
      if (/payment\.succeeded|membership\.activated/.test(ev.type || ev.action || '') && d[lid]) { d[lid].paid = true; d[lid].paidAt = Date.now(); save(d); }
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && p === '/api/status') {
      const l = load()[u.searchParams.get('id')];
      return send(res, 200, { paid: !!(l && l.token === u.searchParams.get('token') && l.paid) });
    }
    if (req.method === 'POST' && p === '/api/dev-pay' && !E_.WHOP_API_KEY) { // dev uniquement
      const b = JSON.parse((await body(req)).toString() || '{}'), d = load();
      if (d[b.id]?.token === b.token) { d[b.id].paid = true; save(d); return send(res, 200, { ok: true }); }
      return send(res, 403, {});
    }
    if (req.method === 'GET' && p === '/api/pack') {
      const l = load()[u.searchParams.get('id')];
      if (!l || l.token !== u.searchParams.get('token') || !l.paid) return send(res, 402, { error: 'unpaid' });
      return send(res, 200, pack(l));
    }
    if (req.method === 'GET' && p === '/api/bg') {
      const dir = path.join(PUB, 'img'); let l = [];
      try { l = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().map(f => '/img/' + f); } catch {}
      return send(res, 200, l);
    }
    // statique, whitelist public/
    let f = path.normalize(path.join(PUB, p === '/' ? 'index.html' : p));
    if (!f.startsWith(PUB + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  } catch (e) { send(res, 500, { error: 'server' }); }
});
server.listen(PORT, () => console.log('Bloxia sur ' + BASE));
