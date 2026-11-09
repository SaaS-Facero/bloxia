// Stockage des leads : Upstash/Vercel KV (REST) si configuré, sinon fichier local (dev).
const fs = require('fs'), path = require('path');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const FILE = path.join(__dirname, '..', 'data', 'leads.json');
const rest = async cmd => { const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) }); const j = await r.json(); if (j.error) throw new Error(j.error); return j.result; };
const fileAll = () => { try { return JSON.parse(fs.readFileSync(FILE)); } catch { return {}; } };
module.exports = {
  remote: !!(URL_ && TOK),
  async get(id) { if (!id) return null; if (URL_ && TOK) { const v = await rest(['GET', 'lead:' + id]); return v ? JSON.parse(v) : null; } return fileAll()[id] || null; },
  async kget(k) { if (URL_ && TOK) { const v = await rest(['GET', k]); return v ? JSON.parse(v) : null; } return fileAll()['k:' + k] || null; },
  async kset(k, v) { if (URL_ && TOK) return rest(['SET', k, JSON.stringify(v)]); fs.mkdirSync(path.dirname(FILE), { recursive: true }); const d = fileAll(); d['k:' + k] = v; fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); },
  async set(id, v) { if (URL_ && TOK) return rest(['SET', 'lead:' + id, JSON.stringify(v)]); fs.mkdirSync(path.dirname(FILE), { recursive: true }); const d = fileAll(); d[id] = v; fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); }
};
