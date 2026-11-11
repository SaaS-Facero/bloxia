(function () {
  const $ = s => document.querySelector(s);
  const eur = n => (+n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const K = 'bloxia.admin'; let token = null;
  try { token = sessionStorage.getItem(K); } catch {}

  function loginView(msg) {
    $('#app').innerHTML = `<div style="max-width:380px;margin:40px auto">
      <h1 style="font:800 26px var(--display,sans-serif);margin-bottom:6px">Admin Bloxia</h1>
      <p style="color:var(--ink-2);margin-bottom:18px">Connecte-toi pour gérer l'affiliation.</p>
      <div class="pa-inp" style="margin-bottom:10px"><input id="em" type="email" placeholder="E-mail" autocomplete="username"></div>
      <div class="pa-inp" style="margin-bottom:10px"><input id="pw" type="password" placeholder="Mot de passe" autocomplete="current-password"></div>
      <p id="err" style="color:#ff6b6b;font-size:14px;min-height:18px">${msg || ''}</p>
      <button class="btn btn-gold btn-block" id="go">Se connecter</button></div>`;
    const go = async () => {
      const r = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: $('#em').value.trim(), password: $('#pw').value }) });
      if (!r.ok) { $('#err').textContent = r.status === 429 ? 'Trop d\'essais, réessaie plus tard.' : 'E-mail ou mot de passe incorrect.'; return; }
      const d = await r.json(); token = d.token; try { sessionStorage.setItem(K, token); } catch {} dashboard();
    };
    $('#go').onclick = go; $('#pw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  async function dashboard() {
    const res = await fetch('/api/aff/admin?secret=' + encodeURIComponent(token));
    if (!res.ok) { try { sessionStorage.removeItem(K); } catch {} return loginView('Session expirée, reconnecte-toi.'); }
    const d = await res.json();
    const totPending = d.affiliates.reduce((s, a) => s + a.pending, 0), totEarned = d.affiliates.reduce((s, a) => s + a.earned, 0), totSales = d.affiliates.reduce((s, a) => s + a.sales, 0);
    const rows = d.affiliates.map(a => `<tr><td><b>${BX.esc(a.name)}</b><br><small style="color:var(--muted)">${BX.esc(a.email)} · ${a.code}</small></td>
      <td>${a.clicks}</td><td>${a.signups}</td><td>${a.sales}</td><td>${eur(a.earned)}</td><td><b>${eur(a.pending)}</b></td><td>${eur(a.paid)}</td>
      <td>${a.payout ? BX.esc(a.payout) : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${a.pending > 0 ? `<button class="btn btn-gold btn-sm" data-pay="${a.code}">Marquer payé</button>` : ''}</td></tr>`).join('');
    $('#app').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:18px">
        <h1 style="font:800 28px var(--display,sans-serif)">Admin · Affiliation</h1>
        <button class="btn btn-ghost btn-sm" id="out">Déconnexion</button></div>
      <div class="pa-tiles" style="margin-bottom:22px">
        <div class="pa-tile"><span class="pa-tic"></span><b>${d.affiliates.length}</b><small>Partenaires</small></div>
        <div class="pa-tile"><span class="pa-tic"></span><b>${totSales}</b><small>Ventes générées</small></div>
        <div class="pa-tile gold"><span class="pa-tic"></span><b>${eur(totEarned)}</b><small>Commissions totales</small></div>
        <div class="pa-tile"><span class="pa-tic"></span><b>${eur(totPending)}</b><small>À payer</small></div></div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="text-align:left;color:var(--ink-2);font:700 12px var(--mono,monospace)">
      <th style="padding:8px">Partenaire</th><th>Clics</th><th>Insc.</th><th>Ventes</th><th>Gains</th><th>À payer</th><th>Payé</th><th>Paiement</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="9" style="padding:16px;color:var(--muted)">Aucun partenaire pour le moment.</td></tr>'}</tbody></table></div>`;
    $('#out').onclick = () => { token = null; try { sessionStorage.removeItem(K); } catch {} loginView(); };
    $('#app').querySelectorAll('[data-pay]').forEach(b => b.onclick = async () => {
      if (!confirm('Confirmer le paiement de ' + b.dataset.pay + ' ?')) return;
      const r = await fetch('/api/aff/payout', { method: 'POST', body: JSON.stringify({ secret: token, code: b.dataset.pay }) });
      if (r.ok) dashboard(); else alert('Erreur');
    });
  }

  if (token) dashboard(); else loginView();
})();
