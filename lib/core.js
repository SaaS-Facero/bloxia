const crypto = require('crypto'), store = require('./store'), pack = require('./pack'), PLANS = require('./plans');
const round2 = n => Math.round(n * 100) / 100;
const remaining = l => Math.max(0, (l.offerStart || Date.now()) + PLANS.offerMs - Date.now());
const E = process.env, ON_VERCEL = !!E.VERCEL, DEV = !E.WHOP_API_KEY && (E.BLOXIA_TEST_PAY === '1' || (!ON_VERCEL && E.NODE_ENV !== 'production'));
const clean = (s, n = 200) => String(s ?? '').slice(0, n);
const out = (code, json) => ({ code, json });
const base = h => E.BASE_URL || `${h['x-forwarded-proto'] || 'http'}://${h['x-forwarded-host'] || h.host}`;
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
const okPw = (u, pw) => { const a = Buffer.from(hashPw(pw, u.salt), 'hex'), b = Buffer.from(u.hash, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const normEmail = e => String(e ?? '').trim().toLowerCase().slice(0, 120);
const cleanAns = a => { const o = {}; if (a && typeof a === 'object') for (const [k, v] of Object.entries(a)) if (!k.startsWith('_') && (typeof v === 'string' || typeof v === 'number')) o[k.slice(0, 30)] = String(v).slice(0, 200); return o; };
const parse = raw => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };

function verifySig(raw, h) {
  const secret = E.WHOP_WEBHOOK_SECRET; if (!secret) return false;
  const id = h['webhook-id'], ts = h['webhook-timestamp'], sigs = h['webhook-signature'];
  if (!id || !ts || !sigs || Math.abs(Date.now() / 1000 - +ts) > 300) return false;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
  const exp = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(' ').some(s => { const [v, b] = s.split(','); if (v !== 'v1' || !b) return false; const x = Buffer.from(b, 'base64'); return x.length === exp.length && crypto.timingSafeEqual(x, exp); });
}

// handle({method, path, q: URLSearchParams, raw: string, headers}) -> {code, json}
module.exports = async function handle({ method, path: p, q, raw, headers }) {
  p = p.replace(/^\/api/, '').replace(/\/+$/, '');
  if (method === 'POST' && p === '/lead') {
    const b = parse(raw), id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex');
    await store.set(id, { id, token, email: clean(b.email), name: clean(b.name, 60), answers: b.answers || {}, paid: false, created: Date.now() });
    return out(200, { id, token });
  }
  if (method === 'POST' && (p === '/signup' || p === '/login')) {
    const b = parse(raw), email = normEmail(b.email), pw = String(b.password ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email) || !pw) return out(400, { error: 'invalid' });
    const u = await store.kget('user:' + email);
    if (u) {
      if (!okPw(u, pw)) return out(401, { error: p === '/signup' ? 'exists' : 'bad' });
      const l = await store.get(u.leadId); if (!l) return out(500, { error: 'lead' });
      return out(200, { id: l.id, token: l.token, existing: true, name: l.name, answers: l.answers || {} });
    }
    if (p === '/login') return out(401, { error: 'bad' });
    const id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex'), salt = crypto.randomBytes(16).toString('hex');
    await store.set(id, { id, token, email, name: clean(b.name, 60), answers: cleanAns(b.answers), paid: false, created: Date.now() });
    await store.kset('user:' + email, { email, salt, hash: hashPw(pw, salt), leadId: id, created: Date.now() });
    return out(200, { id, token, existing: false });
  }
  if (method === 'POST' && p === '/lead/update') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || l.token !== b.token) return out(403, { error: 'invalid' });
    l.answers = Object.assign(l.answers || {}, cleanAns(b.answers)); if (b.name) l.name = clean(b.name, 60); await store.set(l.id, l);
    return out(200, { ok: true });
  }
  if (method === 'GET' && p === '/offer') {
    const l = await store.get(q.get('id'));
    if (!l || l.token !== q.get('token')) return out(403, { error: 'invalid' });
    if (!l.offerStart) { l.offerStart = Date.now(); await store.set(l.id, l); }
    return out(200, { discount: PLANS.discount, trialDays: PLANS.trialDays, remaining: remaining(l), plans: PLANS.list });
  }
  if (method === 'POST' && p === '/checkout') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || l.token !== b.token) return out(403, { error: 'invalid' });
    const plan = PLANS.list.find(x => x.id === b.plan) || PLANS.list.find(x => x.featured);
    const yearly = b.cycle === 'year', full = yearly ? plan.annual : plan.price;
    const disc = l.offerStart && remaining(l) > 0, first = round2(full * (disc ? 1 - PLANS.discount : 1));
    l.plan = plan.id; l.cycle = yearly ? 'year' : 'month'; l.planFirst = first; await store.set(l.id, l);
    const B = base(headers), ret = `${B}/merci.html?id=${l.id}&token=${l.token}`;
    if (!E.WHOP_API_KEY) return DEV ? out(200, { url: ret + '&dev=1' }) : out(500, { error: 'whop not configured' });
    const r = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
      method: 'POST', headers: { Authorization: `Bearer ${E.WHOP_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: { company_id: E.WHOP_COMPANY_ID, currency: E.WHOP_CURRENCY || 'eur', plan_type: 'renewal', billing_period: yearly ? 365 : 30, initial_price: first, renewal_price: full, ...(yearly ? { trial_period_days: PLANS.trialDays } : {}) }, metadata: { leadId: l.id, plan: plan.id, cycle: l.cycle }, redirect_url: ret })
    });
    const j = await r.json(); if (!r.ok) return out(502, { error: 'whop' });
    return out(200, { id: j.id, url: j.purchase_url || `https://whop.com/checkout/${j.id}` });
  }
  if (method === 'POST' && p === '/webhook/whop') {
    if (!verifySig(raw, headers)) return out(400, { error: 'bad signature' });
    const ev = parse(raw), l = await store.get(ev?.data?.metadata?.leadId);
    if (l && /payment\.succeeded|membership\.activated/.test(ev.type || ev.action || '')) { l.paid = true; l.paidAt = Date.now(); await store.set(l.id, l); }
    return out(200, { ok: true });
  }
  if (method === 'GET' && p === '/status') {
    const l = await store.get(q.get('id'));
    return out(200, { paid: !!(l && l.token === q.get('token') && l.paid) });
  }
  if (method === 'POST' && p === '/dev-pay' && DEV) {
    const b = parse(raw), l = await store.get(b.id);
    if (l && l.token === b.token) { l.paid = true; await store.set(l.id, l); return out(200, { ok: true }); }
    return out(403, {});
  }
  if (method === 'GET' && p === '/pack') {
    const l = await store.get(q.get('id'));
    if (!l || l.token !== q.get('token') || !l.paid) return out(402, { error: 'unpaid' });
    return out(200, pack(l));
  }
  return null;
};
