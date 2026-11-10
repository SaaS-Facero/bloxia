const crypto = require('crypto'), store = require('./store'), pack = require('./pack'), PLANS = require('./plans'), genai = require('./genai');
const GEN_STALE_MS = 9 * 60 * 1000;
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
  // Diagnostic sans secret : quel stockage est utilisé, quelles variables sont présentes (noms seulement).
  if (method === 'GET' && p === '/health') {
    let storeOk = null;
    try { await store.kset('health:ping', { t: Date.now() }); storeOk = !!(await store.kget('health:ping')); } catch (e) { storeOk = 'erreur : ' + String(e && e.message || e).slice(0, 120); }
    return out(200, { store: store.remote ? 'upstash' : 'fichier temporaire', storeOk, ai: genai.enabled(), testPay: DEV, whop: !!E.WHOP_API_KEY, webhook: !!E.WHOP_WEBHOOK_SECRET, company: !!E.WHOP_COMPANY_ID, product: !!E.WHOP_PRODUCT_ID });
  }
  if (method === 'GET' && p === '/plans') return out(200, { discount: PLANS.discount, trialDays: PLANS.trialDays, remaining: PLANS.offerMs, plans: PLANS.list, local: true });
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
      body: JSON.stringify({ plan: { company_id: E.WHOP_COMPANY_ID, ...(E.WHOP_PRODUCT_ID ? { product_id: E.WHOP_PRODUCT_ID } : {}), currency: E.WHOP_CURRENCY || 'eur', plan_type: 'renewal', billing_period: yearly ? 365 : 30, initial_price: first, renewal_price: full, ...(yearly ? { trial_period_days: PLANS.trialDays } : {}) }, metadata: { leadId: l.id, plan: plan.id, cycle: l.cycle }, redirect_url: ret })
    });
    const j = await r.json().catch(() => ({})); if (!r.ok) { console.error('whop checkout', r.status, JSON.stringify(j).slice(0, 800)); return out(502, { error: 'whop', status: r.status, detail: (j.error && (j.error.message || j.error)) || j.message || '' }); }
    return out(200, { id: j.id, url: j.purchase_url || `https://whop.com/checkout/${j.id}` });
  }
  if (method === 'POST' && p === '/webhook/whop') {
    if (!verifySig(raw, headers)) return out(400, { error: 'bad signature' });
    const ev = parse(raw), l = await store.get(ev?.data?.metadata?.leadId);
    const t = ev?.type || ev?.action || ''; if (!l) console.log('whop webhook sans lead', t);
    if (l && /payment\.succeeded|membership\.(activated|went_valid)/.test(t)) { l.paid = true; l.paidAt = Date.now(); l.membership = ev?.data?.id || l.membership; await store.set(l.id, l); }
    // abandon : résiliation effective ou remboursement, l'accès se ferme
    if (l && /membership\.(deactivated|went_invalid)|refund\.(created|succeeded)/.test(t)) { l.paid = false; l.endedAt = Date.now(); await store.set(l.id, l); }
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
  // Progression de l'espace client, sauvegardée sur le compte (suit le client sur tous ses appareils).
  if (method === 'POST' && p === '/progress') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || l.token !== b.token || !l.paid) return out(403, { error: 'invalid' });
    const done = Array.isArray(b.done) ? b.done.filter(x => typeof x === 'string' && x.length < 40).slice(0, 600) : [];
    l.progress = l.progress || {};
    l.progress.done = done;
    if (!l.progress.start) l.progress.start = Date.now();
    l.progress.updated = Date.now();
    await store.set(l.id, l);
    return out(200, { ok: true, start: l.progress.start });
  }
  // Aperçu avant paiement : vrais chiffres et débuts de fichiers, jamais le contenu complet.
  if (method === 'GET' && p === '/preview') {
    const l = await store.get(q.get('id'));
    if (!l || l.token !== q.get('token')) return out(403, { error: 'invalid' });
    const k = pack(l), HEAD = 26;
    const files = k.scripts.map(sc => { const lines = sc.code.split('\n');
      const fns = [...sc.code.matchAll(/(?:local\s+)?function\s+([A-Za-z_][\w.:]*)|([A-Za-z_][\w.]*)\s*=\s*function/g)].map(m => m[1] || m[2]).filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 12);
      return { nom: sc.nom, type: sc.type, ou: sc.ou, role: sc.role, lines: lines.length, chars: sc.code.length, widths: lines.map(x => Math.min(80, x.replace(/\t/g, '    ').length)), head: lines.slice(0, HEAD).join('\n'), functions: fns }; });
    return out(200, {
      titre: k.titre, genre: k.genre, theme: k.theme,
      files, totalLines: files.reduce((a, f) => a + f.lines, 0), functions: files.reduce((a, f) => a + f.functions.length, 0),
      prompts: k.prompts.map((pr, i) => ({ titre: pr.titre, but: pr.but, chars: pr.texte.length, head: i === 0 ? pr.texte : pr.texte.slice(0, 140) })),
      shop: k.shop.map((it, i) => ({ name: it.name, type: it.type, price: i === 0 ? it.price : null })),
      plan: k.plan.length, checks: k.checklist.length
    });
  }
  // Génération sur mesure (Fable) : lancée par l'espace client, une seule fois par pack, résultat sauvegardé.
  if (method === 'POST' && p === '/generate') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || l.token !== b.token || !l.paid) return out(402, { error: 'unpaid' });
    if (!genai.enabled()) return out(200, { status: 'disabled' });
    const c = l.custom || {};
    if (c.status === 'ready') return out(200, { status: 'ready' });
    if (c.status === 'running' && Date.now() - c.startedAt < GEN_STALE_MS) return out(200, { status: 'running' });
    if ((c.attempts || 0) >= 3) return out(200, { status: 'failed' });
    l.custom = { status: 'running', startedAt: Date.now(), attempts: (c.attempts || 0) + 1 }; await store.set(l.id, l);
    let result;
    try { result = await genai.generateCustom(l); } catch (e) { result = { status: 'failed', reason: String(e && e.message || e).slice(0, 300) }; }
    const fresh = await store.get(l.id);
    fresh.custom = Object.assign({ attempts: l.custom.attempts, finishedAt: Date.now() }, result);
    await store.set(fresh.id, fresh);
    return out(200, { status: result.status });
  }
  return null;
};
