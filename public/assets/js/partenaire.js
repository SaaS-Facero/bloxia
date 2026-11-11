/* Espace partenaire : page de recrutement + inscription/connexion + dashboard d'affiliation. */
(function () {
  const $ = s => document.querySelector(s), app = document.getElementById('app');
  const ic = (n, c) => (window.BX && BX.icon ? BX.icon(n, c) : '');
  const GL = (n, c) => (window.GL ? window.GL(n, c) : '');
  const esc = s => (window.BX ? BX.esc(s) : String(s));
  const eur = n => (+n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const SITE = location.origin;
  const K = 'bloxia.aff';
  let ses = null; try { ses = JSON.parse(localStorage.getItem(K) || 'null'); } catch {}
  const save = s => { try { localStorage.setItem(K, JSON.stringify(s)); } catch {} };
  const toast = t => { const e = $('#toast'); if (!e) return; e.textContent = t; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2200); };

  // ---- vente du programme (chiffres de simulation, honnêtes) ----
  const RATE = 30; // affiché ; le serveur fait foi
  function landing() {
    document.body.classList.remove('dash');
    app.innerHTML = `
    <section class="pa-hero">
      <span class="pa-kick">${ic('users')}Programme partenaire</span>
      <h1>Parle de Bloxia.<br><span class="grad">Touche ${RATE} % sur chaque vente.</span></h1>
      <p class="pa-lead">Tu crées du contenu Roblox ? Recommande Bloxia à ta communauté et gagne <b>${RATE} % de commission récurrente</b> sur chaque personne qui s'abonne grâce à toi. Chaque mois, tant qu'elle reste.</p>
      <div class="pa-cta"><button class="btn btn-gold" id="goapply"><span class="lbl">Devenir partenaire</span>${ic('arrow-right')}</button><button class="btn btn-ghost" id="golog">J'ai déjà un compte</button></div>
      <div class="pa-trust"><span>${ic('check-circle')}Gratuit, sans engagement</span><span>${ic('check-circle')}Suivi en temps réel</span><span>${ic('check-circle')}Paiement mensuel</span></div>
    </section>

    <section class="pa-steps">
      <h2>Comment ça marche</h2>
      <div class="pa-grid3">
        <div class="pa-step"><span class="pa-n">1</span><h3>Tu t'inscris</h3><p>Tu reçois ton lien de suivi unique et l'accès à ton dashboard, en 30 secondes.</p></div>
        <div class="pa-step"><span class="pa-n">2</span><h3>Tu partages</h3><p>Dans tes vidéos TikTok, Insta, ta bio, ta description. On te donne un kit média prêt à l'emploi.</p></div>
        <div class="pa-step"><span class="pa-n">3</span><h3>Tu encaisses</h3><p>Chaque abonné qui vient de ton lien te rapporte ${RATE} %, chaque mois, tant qu'il reste abonné.</p></div>
      </div>
    </section>

    <section class="pa-why">
      <div class="pa-whytxt"><h2>Pourquoi rejoindre Bloxia</h2>
        <ul>
          <li>${ic('rotate')}<span><b>Commission récurrente.</b> Tu gagnes sur chaque paiement de ton filleul, pas juste le premier.</span></li>
          <li>${ic('chart')}<span><b>Dashboard en temps réel.</b> Clics, inscriptions, ventes, gains : tout est suivi, rien n'est caché.</span></li>
          <li>${ic('image')}<span><b>Kit média fourni.</b> Slides, logos, accroches testées : tu n'as plus qu'à poster.</span></li>
          <li>${ic('banknote')}<span><b>Paiement mensuel.</b> Dès ${20} € de gains, tu es payé sur ton moyen au choix.</span></li>
        </ul>
      </div>
      <div class="pa-sim">
        <span class="pa-simk">${ic('chart')}Simulation</span>
        <p>Si <b>20 personnes</b> s'abonnent à l'Essentiel (16,90 €/mois) grâce à toi :</p>
        <div class="pa-simbig">${eur(20 * 16.90 * 0.30)}<span>/ mois récurrents</span></div>
        <p class="pa-simnote">Simulation, rien n'est garanti. Ça dépend de ton audience et de ton contenu. Mais c'est récurrent : ça se cumule mois après mois.</p>
      </div>
    </section>

    <section class="pa-faq">
      <h2>Questions fréquentes</h2>
      <details><summary>C'est quoi exactement la commission ?${ic('chevron-down')}</summary><p>${RATE} % du montant payé par chaque personne qui s'abonne via ton lien, sur chaque paiement (premier + renouvellements), tant qu'elle reste abonnée.</p></details>
      <details><summary>Comment je suis payé ?${ic('chevron-down')}</summary><p>Dès ${20} € de gains cumulés, tu es payé une fois par mois (PayPal, virement…). Tu indiques ton moyen de paiement à l'inscription.</p></details>
      <details><summary>Combien de temps dure le suivi d'un filleul ?${ic('chevron-down')}</summary><p>Ton lien pose un cookie de 30 jours. Si la personne s'abonne dans ce délai, elle t'est attribuée.</p></details>
      <details><summary>Et si un filleul se fait rembourser ?${ic('chevron-down')}</summary><p>La commission correspondante est retirée de tes gains en attente. C'est normal et transparent.</p></details>
    </section>

    <section class="pa-final">
      <h2>Prêt à en vivre ?</h2>
      <button class="btn btn-gold" id="goapply2"><span class="lbl">Je deviens partenaire</span>${ic('arrow-right')}</button>
    </section>`;
    BX.hydrate && BX.hydrate(app);
    const go = () => authView('apply');
    $('#goapply').onclick = go; $('#goapply2').onclick = go; $('#golog').onclick = () => authView('login');
  }

  // ---- inscription / connexion ----
  function authView(mode) {
    document.body.classList.remove('dash');
    const apply = mode === 'apply';
    app.innerHTML = `<section class="pa-auth"><div class="pa-card">
      <a class="pa-back" id="back">${ic('arrow-left')}Retour</a>
      <span class="pa-ic">${GL(apply ? 'crown' : 'key', 'xl')}</span>
      <h1>${apply ? 'Deviens partenaire' : 'Connexion partenaire'}</h1>
      <p class="pa-sub">${apply ? 'Crée ton compte partenaire et récupère ton lien de suivi.' : 'Accède à ton dashboard.'}</p>
      <form id="f" novalidate>
        ${apply ? `<label class="pa-lab" for="name">Ton nom / pseudo</label><div class="pa-inp">${ic('user')}<input id="name" autocomplete="name" placeholder="Ex : Aywen"></div>` : ''}
        <label class="pa-lab" for="em">E-mail</label><div class="pa-inp">${ic('mail')}<input id="em" type="email" inputmode="email" autocomplete="email" placeholder="toi@mail.com"></div>
        <label class="pa-lab" for="pw">Mot de passe</label><div class="pa-inp">${ic('lock')}<input id="pw" type="password" autocomplete="${apply ? 'new-password' : 'current-password'}" placeholder="Ton mot de passe"></div>
        ${apply ? `<label class="pa-lab" for="po">Moyen de paiement (facultatif)</label><div class="pa-inp">${ic('banknote')}<input id="po" placeholder="Ex : PayPal : toi@mail.com"></div>` : ''}
        <p class="pa-err" id="err" role="alert"></p>
        <button class="btn btn-gold btn-block" id="ok"><span class="lbl">${apply ? 'Créer mon compte partenaire' : 'Je me connecte'}</span>${ic('arrow-right')}</button>
      </form>
      <p class="pa-switch">${apply ? 'Déjà partenaire ?' : 'Pas encore de compte ?'} <button class="pa-link" id="sw">${apply ? 'Se connecter' : 'Devenir partenaire'}</button></p>
    </div></section>`;
    BX.hydrate && BX.hydrate(app);
    $('#back').onclick = landing; $('#sw').onclick = () => authView(apply ? 'login' : 'apply');
    const err = $('#err'), ok = $('#ok');
    $('#f').onsubmit = async e => { e.preventDefault(); ok.disabled = true; err.textContent = '';
      const body = { email: ($('#em').value || '').trim(), password: $('#pw').value };
      if (apply) { body.name = ($('#name').value || '').trim(); body.payout = ($('#po') && $('#po').value || '').trim(); }
      try {
        const res = await fetch('/api/aff/' + (apply ? 'apply' : 'login'), { method: 'POST', body: JSON.stringify(body) });
        const r = await res.json();
        if (res.status === 409) { err.textContent = 'Un compte existe déjà avec cet e-mail. Connecte-toi.'; ok.disabled = false; return; }
        if (res.status === 401) { err.textContent = 'E-mail ou mot de passe incorrect.'; ok.disabled = false; return; }
        if (res.status === 429) { err.textContent = 'Trop d\'essais, réessaie dans quelques minutes.'; ok.disabled = false; return; }
        if (!res.ok) throw 0;
        ses = { code: r.code, token: r.token }; save(ses); dashboard();
      } catch { err.textContent = 'Une erreur est survenue. Réessaie.'; ok.disabled = false; }
    };
    const f = apply ? $('#name') : $('#em'); f && f.focus();
  }

  // ---- dashboard ----
  async function dashboard() {
    document.body.classList.add('dash');
    app.innerHTML = `<div class="pa-load">${GL('cube', 'xl')}<p>Chargement de ton dashboard…</p></div>`;
    let d; try { const res = await fetch(`/api/aff/me?code=${encodeURIComponent(ses.code)}&token=${encodeURIComponent(ses.token)}`); if (!res.ok) throw 0; d = await res.json(); }
    catch { ses = null; try { localStorage.removeItem(K); } catch {} return authView('login'); }
    const link = `${SITE}/?ref=${d.code}`;
    const tiles = [
      ['chart', 'Clics', d.clicks, ''], ['users', 'Inscriptions', d.signups, ''], ['cart', 'Ventes', d.sales, ''],
      ['coins', 'Gains totaux', eur(d.earned), 'gold'], ['clock', 'En attente', eur(d.pending), ''], ['check-circle', 'Déjà payé', eur(d.paid), 'green'],
    ];
    const toPay = d.pending >= d.min;
    app.innerHTML = `
    <section class="pa-dash">
      <header class="pa-dh"><div><span class="mono">Partenaire</span><h1>Salut ${esc(d.name)} 👋</h1></div>
        <button class="btn btn-ghost btn-sm" id="out">Déconnexion</button></header>

      <div class="pa-linkbox">
        <div><span class="pa-ll">${ic('cursor')}Ton lien de suivi</span><code id="lnk">${esc(link)}</code></div>
        <div class="pa-linkbtns"><button class="btn btn-gold btn-sm" id="copy">${ic('copy')}Copier</button>
          <button class="btn btn-light btn-sm" id="share">${ic('rocket')}Partager</button></div>
      </div>

      <div class="pa-tiles">${tiles.map(([i, l, v, c]) => `<div class="pa-tile ${c}"><span class="pa-tic">${ic(i)}</span><b>${v}</b><small>${l}</small></div>`).join('')}</div>

      <div class="pa-row">
        <div class="pa-panel">
          <h2>Ta commission</h2>
          <div class="pa-rate"><b>${Math.round(d.rate * 100)} %</b><span>sur chaque paiement de tes filleuls, à vie</span></div>
          <p class="pa-pay ${toPay ? 'ok' : ''}">${toPay ? `${ic('check-circle')}Tu as atteint le seuil de ${eur(d.min)} : tu seras payé au prochain versement mensuel.` : `${ic('bulb')}Paiement dès ${eur(d.min)} de gains en attente. Encore ${eur(Math.max(0, d.min - d.pending))}.`}</p>
          <p class="pa-payinfo">Moyen de paiement : <b>${d.payout ? esc(d.payout) : 'non renseigné'}</b> · <button class="pa-link" id="editpay">modifier</button></p>
        </div>
        <div class="pa-panel">
          <h2>Kit média</h2>
          <p class="pa-kmsub">Tout ce qu'il faut pour poster. Remplace le lien par le tien.</p>
          <div class="pa-kit">
            <a class="pa-kititem" href="/assets/img/mascot/joie.png" download>${ic('image')}<span>Mascotte Bloxy (PNG)</span>${ic('download')}</a>
            <button class="pa-kititem" id="hooks">${ic('pen')}<span>Accroches prêtes à poster</span>${ic('chevron-down')}</button>
            <a class="pa-kititem" href="/blog/" >${ic('file')}<span>Articles à relayer</span>${ic('arrow-right')}</a>
          </div>
          <div class="pa-hooks" id="hooksbox" hidden></div>
        </div>
      </div>

      <div class="pa-panel">
        <h2>Historique</h2>
        <div class="pa-log" id="log"></div>
      </div>
    </section>`;
    BX.hydrate && BX.hydrate(app);
    $('#out').onclick = () => { ses = null; try { localStorage.removeItem(K); } catch {} landing(); };
    const copy = txt => { navigator.clipboard ? navigator.clipboard.writeText(txt).then(() => toast('Copié !')).catch(() => toast('Copie impossible')) : toast('Copie impossible'); };
    $('#copy').onclick = () => copy(link);
    $('#share').onclick = () => { if (navigator.share) navigator.share({ title: 'Bloxia', url: link }).catch(() => {}); else copy(link); };
    $('#editpay').onclick = async () => { const v = window.prompt ? null : null; toast('Modifie ton paiement en nous écrivant pour l\'instant.'); };
    // accroches
    const HOOKS = [
      'Roblox a versé 1 milliard $ à ses créateurs en 2025. Et aujourd\'hui tu lances ton jeu sans coder → ' + link,
      'POV : t\'as une idée de jeu Roblox mais zéro compétence en code. Tu la tapes en une phrase, t\'as la map + les scripts → ' + link,
      '20 secondes pour générer une map Roblox complète. Zéro code → ' + link,
      'J\'ai testé le truc dont parlent tous les petits créateurs Roblox. Franchement j\'étais pas prêt → ' + link,
    ];
    $('#hooks').onclick = () => { const box = $('#hooksbox'); box.hidden = !box.hidden; if (!box.dataset.f) { box.dataset.f = 1; box.innerHTML = HOOKS.map(h => `<div class="pa-hook"><span>${esc(h)}</span><button class="pa-hcopy" data-h="${esc(h)}">${ic('copy')}</button></div>`).join(''); box.querySelectorAll('.pa-hcopy').forEach(btn => btn.onclick = () => copy(btn.dataset.h)); } };
    // historique
    const log = $('#log');
    if (!d.log || !d.log.length) log.innerHTML = '<p class="pa-empty">Pas encore d\'activité. Partage ton lien pour démarrer !</p>';
    else log.innerHTML = d.log.map(e => {
      const date = new Date(e.t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (e.payout) return `<div class="pa-le"><span class="pa-lic pay">${ic('banknote')}</span><div><b>Paiement reçu</b><small>${date}</small></div><span class="pa-la">−${eur(e.amt)}</span></div>`;
      if (e.refund) return `<div class="pa-le"><span class="pa-lic ref">${ic('x')}</span><div><b>Remboursement filleul</b><small>${date}</small></div><span class="pa-la neg">${eur(e.commission)}</span></div>`;
      return `<div class="pa-le"><span class="pa-lic">${ic('coins')}</span><div><b>Vente${e.plan ? ' · ' + esc(e.plan) : ''}</b><small>${date} · panier ${eur(e.amt)}</small></div><span class="pa-la pos">+${eur(e.commission)}</span></div>`;
    }).join('');
  }

  // nav "Connexion partenaire"
  const navlog = document.getElementById('navlog');
  if (navlog) navlog.onclick = () => (ses ? dashboard() : authView('login'));

  // démarrage
  if (ses && ses.code && ses.token) dashboard(); else landing();
})();
