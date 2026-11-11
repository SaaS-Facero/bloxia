const crypto = require('crypto'), store = require('./store'), pack = require('./pack'), PLANS = require('./plans'), genai = require('./genai');
const GEN_STALE_MS = 9 * 60 * 1000;
const round2 = n => Math.round(n * 100) / 100;
const remaining = l => Math.max(0, (l.offerStart || Date.now()) + PLANS.offerMs - Date.now());
const E = process.env, ON_VERCEL = !!E.VERCEL, DEV = !E.WHOP_API_KEY && (E.BLOXIA_TEST_PAY === '1' || (!ON_VERCEL && E.NODE_ENV !== 'production'));
// ID client Google (public, exposé au navigateur). Surchargable par la variable d'env GOOGLE_CLIENT_ID.
const GCID = E.GOOGLE_CLIENT_ID || '74630653399-r2fjv6oscsms467nhghhf7r9o0bcqpl3.apps.googleusercontent.com';
// Affiliation : taux de commission, seuil de paiement, secret admin.
const AFF_RATE = +E.AFF_RATE || 0.30, AFF_MIN = +E.AFF_MIN || 20, ADMIN_SECRET = E.ADMIN_SECRET || 'bloxia-admin-2026';
const affToken = () => crypto.randomBytes(16).toString('hex');
const mkCode = name => (String(name || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bloxia') + crypto.randomBytes(2).toString('hex');
const normCode = r => String(r || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
const validRef = async r => { r = normCode(r); return r && (await store.kget('aff:' + r)) ? r : null; };
// Montant d'une vente Whop (plusieurs noms possibles selon l'événement), sinon le prix stocké sur le lead.
const whopAmount = (d, l) => Number(d.final_amount ?? d.settled_amount ?? d.subtotal ?? d.amount ?? d.total) || (l && l.planFirst) || 0;
// Vue publique d'un affilié (jamais le hash).
const pubAff = a => ({ code: a.code, name: a.name, email: a.email, rate: a.rate, clicks: a.clicks || 0, signups: a.signups || 0, sales: a.sales || 0, earned: round2(a.earned || 0), pending: round2(a.pending || 0), paid: round2(a.paid || 0), min: AFF_MIN, payout: a.payout || null, log: (a.log || []).slice(0, 30), createdAt: a.createdAt });
const clean = (s, n = 200) => String(s ?? '').slice(0, n);
const out = (code, json) => ({ code, json });
const base = h => E.BASE_URL || `${h['x-forwarded-proto'] || 'http'}://${h['x-forwarded-host'] || h.host}`;
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
const okPw = (u, pw) => { const a = Buffer.from(hashPw(pw, u.salt), 'hex'), b = Buffer.from(u.hash, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const normEmail = e => String(e ?? '').trim().toLowerCase().slice(0, 120);
const cleanAns = a => { const o = {}; if (a && typeof a === 'object') for (const [k, v] of Object.entries(a)) if (!k.startsWith('_') && (typeof v === 'string' || typeof v === 'number')) o[k.slice(0, 30)] = String(v).slice(0, 200); return o; };
const parse = raw => { try { return JSON.parse(raw || '{}'); } catch { return {}; } };
// Comparaison de token à temps constant (évite une fuite par timing).
const okTok = (a, b) => { a = String(a ?? ''); b = String(b ?? ''); const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// Égalise le temps de /login quand l'e-mail n'existe pas (anti-énumération par timing).
const DUMMY_SALT = 'bloxia-timing-equalizer';
const burnCpu = pw => { try { crypto.scryptSync(String(pw).slice(0, 1024), DUMMY_SALT, 32); } catch {} };
// IP client (derrière le proxy Vercel).
const ipOf = h => String(h['x-forwarded-for'] || h['x-real-ip'] || 'unknown').split(',')[0].trim().slice(0, 45);
// Limitation de débit : renvoie true si le quota est dépassé. Tolérante aux pannes de store (fail-open).
const limited = async (key, max, winSec) => { try { return (await store.incr(key, winSec)) > max; } catch { return false; } };

function verifySig(raw, h) {
  const secret = E.WHOP_WEBHOOK_SECRET; if (!secret) return false;
  const id = h['webhook-id'], ts = h['webhook-timestamp'], sigs = h['webhook-signature'];
  const n = Number(ts);
  if (!id || !ts || !sigs || !Number.isFinite(n) || Math.abs(Date.now() / 1000 - n) > 300) return false;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : Buffer.from(secret);
  const exp = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(' ').some(s => { const [v, b] = s.split(','); if (v !== 'v1' || !b) return false; const x = Buffer.from(b, 'base64'); return x.length === exp.length && crypto.timingSafeEqual(x, exp); });
}

// Affiliation : compte un filleul inscrit, crédite une vente, rembourse une commission.
async function creditSignup(ref) { const a = await store.kget('aff:' + ref); if (a) { a.signups = (a.signups || 0) + 1; await store.kset('aff:' + ref, a); } }
async function creditSale(l, d) { const a = await store.kget('aff:' + l.ref); if (!a) return; const amt = whopAmount(d, l), c = round2(amt * (a.rate || AFF_RATE)); if (c <= 0) return; a.sales = (a.sales || 0) + 1; a.earned = round2((a.earned || 0) + c); a.pending = round2((a.pending || 0) + c); a.log = [{ t: Date.now(), amt: round2(amt), commission: c, plan: l.plan || '' }, ...(a.log || [])].slice(0, 60); await store.kset('aff:' + l.ref, a); }
async function clawback(l, d) { const a = await store.kget('aff:' + l.ref); if (!a) return; const amt = whopAmount(d, l), c = round2(amt * (a.rate || AFF_RATE)); a.pending = round2(Math.max(0, (a.pending || 0) - c)); a.earned = round2(Math.max(0, (a.earned || 0) - c)); a.log = [{ t: Date.now(), refund: true, commission: -c }, ...(a.log || [])].slice(0, 60); await store.kset('aff:' + l.ref, a); }

// handle({method, path, q: URLSearchParams, raw: string, headers}) -> {code, json}
module.exports = async function handle({ method, path: p, q, raw, headers }) {
  p = p.replace(/^\/api/, '').replace(/\/+$/, '');
  const ip = ipOf(headers);
  if (method === 'POST' && p === '/lead') {
    if (await limited('lead:' + ip, 30, 3600)) return out(429, { error: 'too_many' });
    const b = parse(raw), id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex'), ref = await validRef(b.ref);
    await store.set(id, { id, token, email: normEmail(b.email), name: clean(b.name, 60), answers: cleanAns(b.answers), paid: false, created: Date.now(), ...(ref ? { ref } : {}) });
    if (ref) await creditSignup(ref);
    return out(200, { id, token });
  }
  if (method === 'POST' && (p === '/signup' || p === '/login')) {
    const b = parse(raw), email = normEmail(b.email), pw = String(b.password ?? '');
    if (!/^\S+@\S+\.\S+$/.test(email) || !pw) return out(400, { error: 'invalid' });
    if (pw.length > 1024) return out(400, { error: 'invalid' }); // borne anti-DoS CPU (scrypt)
    // Anti-brute-force : par IP et par compte visé.
    if (await limited('auth:' + ip, 20, 900) || await limited('auth:' + email, 8, 900)) return out(429, { error: 'too_many' });
    const u = await store.kget('user:' + email);
    if (u) {
      if (!okPw(u, pw)) return out(401, { error: p === '/signup' ? 'exists' : 'bad' });
      const l = await store.get(u.leadId); if (!l) return out(500, { error: 'lead' });
      return out(200, { id: l.id, token: l.token, existing: true, name: l.name, answers: l.answers || {} });
    }
    if (p === '/login') { burnCpu(pw); return out(401, { error: 'bad' }); } // scrypt factice : même temps que si l'e-mail existait
    const id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex'), salt = crypto.randomBytes(16).toString('hex'), ref = await validRef(b.ref);
    await store.set(id, { id, token, email, name: clean(b.name, 60), answers: cleanAns(b.answers), paid: false, created: Date.now(), ...(ref ? { ref } : {}) });
    await store.kset('user:' + email, { email, salt, hash: hashPw(pw, salt), leadId: id, created: Date.now() });
    if (ref) await creditSignup(ref);
    return out(200, { id, token, existing: false });
  }
  // Config publique (ID client Google) pour afficher le bouton « Connexion Google ».
  if (method === 'GET' && p === '/pubcfg') return out(200, { googleClientId: GCID });
  // Connexion / inscription via Google : vérifie le jeton d'identité, puis crée ou retrouve le compte par e-mail.
  if (method === 'POST' && p === '/google') {
    if (await limited('auth:' + ip, 20, 900)) return out(429, { error: 'too_many' });
    const b = parse(raw), cred = String(b.credential || '');
    if (!cred || !GCID) return out(400, { error: 'google_unavailable' });
    let info; try { const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(cred)); info = await r.json(); if (!r.ok) throw 0; } catch { return out(401, { error: 'bad_token' }); }
    if (info.aud !== GCID || info.email_verified === 'false' || info.email_verified === false || !info.email) return out(401, { error: 'bad_token' });
    const email = normEmail(info.email), name = clean(info.name || info.given_name || '', 60);
    let u = await store.kget('user:' + email);
    if (u) { const l = await store.get(u.leadId); if (!l) return out(500, { error: 'lead' }); return out(200, { id: l.id, token: l.token, existing: true, name: l.name, answers: l.answers || {} }); }
    const id = crypto.randomUUID(), token = crypto.randomBytes(16).toString('hex'), ref = await validRef(b.ref);
    await store.set(id, { id, token, email, name, answers: cleanAns(b.answers), paid: false, created: Date.now(), provider: 'google', ...(ref ? { ref } : {}) });
    await store.kset('user:' + email, { email, provider: 'google', leadId: id, created: Date.now() });
    if (ref) await creditSignup(ref);
    return out(200, { id, token, existing: false, name });
  }
  // ===== Affiliation (partenaires créateurs) =====
  // Clic sur un lien d'affiliation (1 compté par IP et par jour).
  if (method === 'GET' && p === '/aff/click') {
    const code = normCode(q.get('code')); const a = code && await store.kget('aff:' + code);
    if (a && !(await limited('affclick:' + code + ':' + ip, 1, 86400))) { a.clicks = (a.clicks || 0) + 1; await store.kset('aff:' + code, a); }
    return out(200, { ok: !!a });
  }
  // Devenir partenaire : crée un compte affilié + un code.
  if (method === 'POST' && p === '/aff/apply') {
    if (await limited('aff:' + ip, 10, 900)) return out(429, { error: 'too_many' });
    const b = parse(raw), email = normEmail(b.email), pw = String(b.password ?? ''), name = clean(b.name, 60);
    if (!/^\S+@\S+\.\S+$/.test(email) || !pw || pw.length > 1024 || !name) return out(400, { error: 'invalid' });
    if (await store.kget('affmail:' + email)) return out(409, { error: 'exists' });
    let code; for (let i = 0; i < 5; i++) { code = mkCode(name); if (!(await store.kget('aff:' + code))) break; }
    const salt = crypto.randomBytes(16).toString('hex'), token = affToken();
    const aff = { code, name, email, salt, hash: hashPw(pw, salt), token, rate: AFF_RATE, payout: clean(b.payout, 140) || null, clicks: 0, signups: 0, sales: 0, earned: 0, pending: 0, paid: 0, log: [], createdAt: Date.now() };
    await store.kset('aff:' + code, aff); await store.kset('affmail:' + email, code);
    const idx = (await store.kget('affindex')) || []; idx.push(code); await store.kset('affindex', idx);
    return out(200, { code, token });
  }
  // Connexion partenaire.
  if (method === 'POST' && p === '/aff/login') {
    if (await limited('aff:' + ip, 20, 900)) return out(429, { error: 'too_many' });
    const b = parse(raw), email = normEmail(b.email), pw = String(b.password ?? '');
    const code = email && await store.kget('affmail:' + email), a = code && await store.kget('aff:' + code);
    if (!a || !okPw(a, pw)) { burnCpu(pw); return out(401, { error: 'bad' }); }
    if (!a.token) { a.token = affToken(); await store.kset('aff:' + code, a); }
    return out(200, { code: a.code, token: a.token });
  }
  // Données du dashboard partenaire.
  if (method === 'GET' && p === '/aff/me') {
    const a = await store.kget('aff:' + normCode(q.get('code')));
    if (!a || !okTok(a.token, q.get('token'))) return out(403, { error: 'invalid' });
    return out(200, pubAff(a));
  }
  // Admin : liste des affiliés (protégé par un secret).
  if (method === 'GET' && p === '/aff/admin') {
    if (!okTok(ADMIN_SECRET, q.get('secret'))) return out(403, { error: 'invalid' });
    const idx = (await store.kget('affindex')) || []; const list = [];
    for (const c of idx) { const a = await store.kget('aff:' + c); if (a) list.push(pubAff(a)); }
    return out(200, { rate: AFF_RATE, min: AFF_MIN, affiliates: list.sort((x, y) => y.pending - x.pending) });
  }
  // Admin : marquer un paiement effectué (déplace "en attente" vers "payé").
  if (method === 'POST' && p === '/aff/payout') {
    const b = parse(raw); if (!okTok(ADMIN_SECRET, b.secret)) return out(403, { error: 'invalid' });
    const a = await store.kget('aff:' + normCode(b.code)); if (!a) return out(404, { error: 'not_found' });
    const amt = round2(Math.min(+b.amount || a.pending || 0, a.pending || 0));
    a.pending = round2((a.pending || 0) - amt); a.paid = round2((a.paid || 0) + amt);
    a.log = [{ t: Date.now(), payout: true, amt }, ...(a.log || [])].slice(0, 60); await store.kset('aff:' + a.code, a);
    return out(200, { ok: true, paid: a.paid, pending: a.pending });
  }
  if (method === 'POST' && p === '/lead/update') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || !okTok(l.token, b.token)) return out(403, { error: 'invalid' });
    l.answers = Object.assign(l.answers || {}, cleanAns(b.answers)); if (b.name) l.name = clean(b.name, 60); await store.set(l.id, l);
    return out(200, { ok: true });
  }
  // Diagnostic sans secret : quel stockage est utilisé, quelles variables sont présentes (noms seulement).
  if (method === 'GET' && p === '/health') {
    let storeOk = null;
    try { await store.kset('health:ping', { t: Date.now() }); storeOk = !!(await store.kget('health:ping')); } catch (e) { storeOk = false; console.error('health store', String(e && e.message || e).slice(0, 200)); }
    return out(200, { store: store.remote ? 'upstash' : 'fichier temporaire', storeOk, ai: genai.enabled(), whop: !!E.WHOP_API_KEY, webhook: !!E.WHOP_WEBHOOK_SECRET, company: !!E.WHOP_COMPANY_ID, product: !!E.WHOP_PRODUCT_ID });
  }
  if (method === 'GET' && p === '/plans') return out(200, { discount: PLANS.discount, trialDays: PLANS.trialDays, remaining: PLANS.offerMs, plans: PLANS.list, local: true });
  if (method === 'GET' && p === '/offer') {
    const l = await store.get(q.get('id'));
    if (!l || !okTok(l.token, q.get("token"))) return out(403, { error: 'invalid' });
    if (!l.offerStart) { l.offerStart = Date.now(); await store.set(l.id, l); }
    return out(200, { discount: PLANS.discount, trialDays: PLANS.trialDays, remaining: remaining(l), plans: PLANS.list });
  }
  if (method === 'POST' && p === '/checkout') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || !okTok(l.token, b.token)) return out(403, { error: 'invalid' });
    if (await limited('checkout:' + l.id, 15, 3600)) return out(429, { error: 'too_many' });
    const plan = PLANS.list.find(x => x.id === b.plan) || PLANS.list.find(x => x.featured);
    const yearly = b.cycle === 'year', full = yearly ? plan.annual : plan.price;
    const disc = !yearly && l.offerStart && remaining(l) > 0, first = round2(full * (disc ? 1 - PLANS.discount : 1));
    l.plan = plan.id; l.cycle = yearly ? 'year' : 'month'; l.planFirst = first; await store.set(l.id, l);
    const B = base(headers), ret = `${B}/merci.html?id=${l.id}&token=${l.token}`;
    if (!E.WHOP_API_KEY) return DEV ? out(200, { url: ret + '&dev=1' }) : out(500, { error: 'whop not configured' });
    // API Whop actuelle (version datée 2026-11-07) : variante créée à la volée dans le produit Bloxia.
    // Whop : sans essai, 1er débit = initial_price + renewal_price ; avec essai, seulement initial_price.
    // Mensuel avec offre : « essai » de 30 jours facturé au prix remisé, puis prix normal chaque mois.
    // Prix TTC (taxe incluse), comme affichés sur le site.
    // Annuel : payé aujourd'hui (remise -40 % déjà dans plan.annual), couvert par la garantie 14 jours (pas d'essai).
    // Mensuel avec offre : « essai » payant de 30 jours au prix remisé, puis prix normal.
    const pricing = yearly
      ? { initial_price: full, renewal_price: full }
      : disc ? { initial_price: first, renewal_price: full, trial_period_days: 30 } : { initial_price: 0, renewal_price: full };
    const variant = {
      account_id: E.WHOP_COMPANY_ID, ...(E.WHOP_PRODUCT_ID ? { product_id: E.WHOP_PRODUCT_ID } : {}),
      title: `Bloxia ${plan.name} · ${yearly ? 'annuel' : 'mensuel'}`, currency: E.WHOP_CURRENCY || 'eur',
      billing_type: 'renewal', billing_period: yearly ? 365 : 30, ...pricing, override_tax_type: 'inclusive',
      visibility: 'hidden', release_method: 'buy_now', unlimited_stock: true
    };
    const r = await fetch('https://api.whop.com/api/v1/checkout_configurations', {
      method: 'POST', headers: { Authorization: `Bearer ${E.WHOP_API_KEY}`, 'Content-Type': 'application/json', 'Api-Version-Date': '2026-11-07' },
      body: JSON.stringify({ account_id: E.WHOP_COMPANY_ID, mode: 'payment', variant, metadata: { leadId: l.id, plan: plan.id, cycle: l.cycle }, redirect_url: ret })
    });
    const j = await r.json().catch(() => ({})); if (!r.ok) { console.error('whop checkout', r.status, JSON.stringify(j).slice(0, 800)); return out(502, { error: 'whop', status: r.status, detail: (j.error && (j.error.message || j.error)) || j.message || '' }); }
    return out(200, { id: j.id, url: j.purchase_url || `https://whop.com/checkout/${j.id}` });
  }
  if (method === 'POST' && p === '/webhook/whop') {
    if (!verifySig(raw, headers)) return out(400, { error: 'bad signature' });
    // Anti-rejeu : un même webhook-id n'est traité qu'une fois (idempotence).
    const wid = headers['webhook-id']; if (wid && await limited('wh:' + wid, 1, 3600)) return out(200, { ok: true, dup: true });
    const ev = parse(raw), l = await store.get(ev?.data?.metadata?.leadId || ev?.data?.membership?.metadata?.leadId);
    const t = ev?.type || ev?.action || '', d = ev?.data || {}; if (!l) console.log('whop webhook sans lead', t, d.id);
    const st = d.status || '';
    // charged = un débit réel a eu lieu (distinct de paid, qui couvre aussi l'essai annuel à 0 €).
    if (l && t === 'payment.succeeded') { l.paid = true; l.charged = true; l.paidAt = l.paidAt || Date.now(); await store.set(l.id, l); if (l.ref) await creditSale(l, d); }
    // Remboursement : on retire la commission correspondante (clawback).
    else if (l && l.ref && /^refund\.(created|succeeded)/.test(t)) { await clawback(l, d); }
    // Accès ouvert : abonnement actif ou en essai (l'essai annuel ne déclenche aucun paiement le 1er jour).
    else if (l && (t === 'membership.activated' || (t === 'membership.updated' && /^(active|trialing)$/.test(st)))) {
      l.paid = true; l.paidAt = l.paidAt || Date.now(); if (st === 'active') l.charged = true; if (/^mem_/.test(d.id || '')) l.membership = d.id; await store.set(l.id, l);
    }
    // Accès fermé : abonnement résilié ou expiré (après remboursement, Whop passe l'abonnement en canceled).
    if (l && t === 'membership.updated' && /^(canceled|expired)$/.test(st)) { l.paid = false; l.endedAt = Date.now(); await store.set(l.id, l); }
    return out(200, { ok: true });
  }
  if (method === 'GET' && p === '/status') {
    const l = await store.get(q.get('id'));
    return out(200, { paid: !!(l && okTok(l.token, q.get('token')) && l.paid) });
  }
  if (method === 'POST' && p === '/dev-pay' && DEV) {
    const b = parse(raw), l = await store.get(b.id);
    if (l && okTok(l.token, b.token)) { l.paid = true; await store.set(l.id, l); return out(200, { ok: true }); }
    return out(403, {});
  }
  if (method === 'GET' && p === '/pack') {
    const l = await store.get(q.get('id'));
    if (!l || !okTok(l.token, q.get("token")) || !l.paid) return out(402, { error: 'unpaid' });
    return out(200, pack(l));
  }
  // ===== Plugin Roblox Studio =====
  // Code d'appairage court (lié au compte, 6 h) montré dans l'espace et collé dans le plugin.
  if (method === 'GET' && p === '/plugin/code') {
    const l = await store.get(q.get('id'));
    if (!l || !okTok(l.token, q.get('token')) || !l.paid) return out(402, { error: 'unpaid' });
    let code = l.pluginCode, pc = code && await store.kget('plug:' + code);
    if (!code || !pc || pc.exp < Date.now()) { code = crypto.randomBytes(4).toString('hex').toUpperCase(); l.pluginCode = code; await store.set(l.id, l); }
    await store.kset('plug:' + code, { lead: l.id, exp: Date.now() + 6 * 3600e3 });
    return out(200, { code });
  }
  // Le plugin récupère le pack via le code (sans exposer le token permanent).
  if (method === 'GET' && p === '/plugin/pack') {
    if (await limited('plug:' + ip, 60, 3600)) return out(429, { error: 'too_many' });
    const code = String(q.get('code') || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 8);
    const pc = code && await store.kget('plug:' + code);
    if (!pc || pc.exp < Date.now()) return out(403, { error: 'bad_code' });
    const l = await store.get(pc.lead); if (!l || !l.paid) return out(402, { error: 'unpaid' });
    const pk = pack(l);
    // Charge utile allégée pour le plugin : scripts à poser + prompts pour l'Assistant.
    return out(200, { titre: pk.titre, genre: pk.genre, theme: pk.theme, scripts: pk.scripts.map(s => ({ nom: s.nom, type: s.type, ou: s.ou, code: s.code })), prompts: pk.prompts.map(p => ({ titre: p.titre, texte: p.texte })) });
  }
  // Progression de l'espace client, sauvegardée sur le compte (suit le client sur tous ses appareils).
  if (method === 'POST' && p === '/progress') {
    const b = parse(raw), l = await store.get(b.id);
    if (!l || !okTok(l.token, b.token) || !l.paid) return out(403, { error: 'invalid' });
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
    if (!l || !okTok(l.token, q.get("token"))) return out(403, { error: 'invalid' });
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
    if (!l || !okTok(l.token, b.token) || !l.paid) return out(402, { error: 'unpaid' });
    if (await limited('gen:' + l.id, 12, 3600)) return out(429, { error: 'too_many' });
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
