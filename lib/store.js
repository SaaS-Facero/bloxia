// Stockage des leads : Upstash/Vercel KV (REST) si configuré, sinon fichier local (dev).
const fs = require('fs'), path = require('path');
const findEnv = re => { const k = Object.keys(process.env).find(n => re.test(n) && process.env[n]); return k ? process.env[k] : undefined; };
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || findEnv(/(^|_)(KV_REST_API_URL|UPSTASH_REDIS_REST_URL)$/);
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || findEnv(/(^|_)(KV_REST_API_TOKEN|UPSTASH_REDIS_REST_TOKEN)$/);
// Sur Vercel sans Upstash, seul /tmp est inscriptible (temporaire : à remplacer par Upstash en production).
const FILE = process.env.VERCEL ? '/tmp/bloxia-leads.json' : path.join(__dirname, '..', 'data', 'leads.json');
const rest = async cmd => { const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) }); const j = await r.json(); if (j.error) throw new Error(j.error); return j.result; };
const fileAll = () => { try { return JSON.parse(fs.readFileSync(FILE)); } catch { return {}; } };
// Compteurs en mémoire (mode fichier/dev uniquement : non partagés, remis à zéro au redémarrage).
const mem = new Map();
module.exports = {
  remote: !!(URL_ && TOK),
  // Incrémente un compteur avec expiration ; renvoie la valeur courante. Sert à la limitation de débit et à l'anti-rejeu.
  async incr(k, ttlSec) {
    if (URL_ && TOK) { const n = await rest(['INCR', 'c:' + k]); if (n === 1) await rest(['EXPIRE', 'c:' + k, ttlSec]); return n; }
    const now = Date.now(), e = mem.get(k); if (!e || e.exp < now) { mem.set(k, { n: 1, exp: now + ttlSec * 1000 }); return 1; } e.n++; return e.n;
  },
  async get(id) { if (!id) return null; if (URL_ && TOK) { const v = await rest(['GET', 'lead:' + id]); return v ? JSON.parse(v) : null; } return fileAll()[id] || null; },
  async kget(k) { if (URL_ && TOK) { const v = await rest(['GET', k]); return v ? JSON.parse(v) : null; } return fileAll()['k:' + k] || null; },
  async kset(k, v) { if (URL_ && TOK) return rest(['SET', k, JSON.stringify(v)]); fs.mkdirSync(path.dirname(FILE), { recursive: true }); const d = fileAll(); d['k:' + k] = v; fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); },
  async set(id, v) { if (URL_ && TOK) return rest(['SET', 'lead:' + id, JSON.stringify(v)]); fs.mkdirSync(path.dirname(FILE), { recursive: true }); const d = fileAll(); d[id] = v; fs.writeFileSync(FILE, JSON.stringify(d, null, 1)); }
};
