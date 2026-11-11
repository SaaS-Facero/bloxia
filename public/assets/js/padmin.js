(function () {
  const $ = s => document.querySelector(s);
  const eur = n => (+n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  let secret = '';
  async function load() {
    secret = $('#secret').value.trim(); if (!secret) return;
    const res = await fetch('/api/aff/admin?secret=' + encodeURIComponent(secret));
    if (!res.ok) { $('#out').innerHTML = '<p style="color:#ff6b6b">Secret incorrect.</p>'; return; }
    const d = await res.json();
    const rows = d.affiliates.map(a => `<tr><td><b>${BX.esc(a.name)}</b><br><small style="color:var(--muted)">${BX.esc(a.email)} · ${a.code}</small></td>
      <td>${a.clicks}</td><td>${a.signups}</td><td>${a.sales}</td><td>${eur(a.earned)}</td><td><b>${eur(a.pending)}</b></td><td>${eur(a.paid)}</td>
      <td>${a.payout ? BX.esc(a.payout) : '<span style="color:var(--muted)">—</span>'}</td>
      <td>${a.pending > 0 ? `<button class="btn btn-gold btn-sm" data-pay="${a.code}">Marquer payé</button>` : ''}</td></tr>`).join('');
    $('#out').innerHTML = `<p style="margin-bottom:12px;color:var(--ink-2)">Taux : ${Math.round(d.rate*100)} % · Seuil : ${eur(d.min)} · ${d.affiliates.length} partenaire(s)</p>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="text-align:left;color:var(--ink-2);font:700 12px var(--mono,monospace)">
      <th style="padding:8px">Partenaire</th><th>Clics</th><th>Insc.</th><th>Ventes</th><th>Gains</th><th>En attente</th><th>Payé</th><th>Paiement</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="9" style="padding:16px;color:var(--muted)">Aucun partenaire.</td></tr>'}</tbody></table></div>`;
    $('#out').querySelectorAll('[data-pay]').forEach(b => b.onclick = async () => {
      if (!confirm('Confirmer le paiement de ' + b.dataset.pay + ' ?')) return;
      const r = await fetch('/api/aff/payout', { method: 'POST', body: JSON.stringify({ secret, code: b.dataset.pay }) });
      if (r.ok) load(); else alert('Erreur');
    });
  }
  $('#load').onclick = load; $('#secret').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
})();
