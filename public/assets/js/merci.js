// Page de confirmation : on lit id+token, on nettoie l'URL (le token ne doit pas rester dans l'historique),
// puis on sonde /api/status jusqu'au déblocage.
(function () {
  const q = new URLSearchParams(location.search), id = q.get('id'), token = q.get('token'), dev = q.get('dev'), $ = s => document.querySelector(s);
  $('#g').innerHTML = GL('chest');
  try { if (id && token) localStorage.setItem('bloxia.session', JSON.stringify({ id, token })); } catch {}
  // Retire id/token/dev de la barre d'adresse (anti-fuite de token via historique/partage).
  try { history.replaceState(null, '', '/merci.html'); } catch {}
  (async () => {
    if (dev) await fetch('/api/dev-pay', { method: 'POST', body: JSON.stringify({ id, token }) }).catch(() => {});
    for (let n = 0; n < 40; n++) {
      const r = await fetch(`/api/status?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`).then(r => r.json()).catch(() => ({}));
      if (r.paid) { $('#g').innerHTML = GL('trophy'); $('#t').innerHTML = 'pack <b>débloqué</b>'; $('#s').textContent = 'Merci ! Tout est prêt dans ton espace.'; $('#sp').remove(); $('#go').style.display = ''; BX.set({ done: true }); return; }
      await new Promise(r => setTimeout(r, 2000));
    }
    $('#t').innerHTML = 'encore <b>un instant</b>'; $('#s').textContent = 'La confirmation tarde. Recharge la page dans une minute, ou ouvre ton espace.'; $('#sp').remove(); $('#go').style.display = '';
  })();
})();
