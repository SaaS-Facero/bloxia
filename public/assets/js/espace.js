/* Espace client Bloxia : parcours guidé, progression sauvegardée, copie, téléchargements, visite guidée. */
(function () {
  const $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], ic = BX.icon, esc = BX.esc;
  const app = $('#app'), K = 'bloxia.session';
  let ses = null; try { ses = JSON.parse(localStorage.getItem(K)); } catch {}
  const q = new URLSearchParams(location.search);
  if (q.get('id') && q.get('token')) { ses = { id: q.get('id'), token: q.get('token') }; try { localStorage.setItem(K, JSON.stringify(ses)); } catch {} history.replaceState(null, '', '/espace.html'); }
  const toast = t => { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 1800); };
  const copy = (txt, msg) => { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(msg || 'Copié'), () => toast('Copie impossible, sélectionne le texte')); };
  $('#out').onclick = () => { try { localStorage.removeItem(K); localStorage.removeItem('bloxia.profile'); Object.keys(localStorage).filter(x => x.startsWith('bloxia.espace.')).forEach(x => localStorage.removeItem(x)); } catch {} location.href = '/espace.html'; };

  // ---------- connexion ----------
  function login(msg) {
    $('#out').hidden = true; $('#tourbtn').hidden = true; $('#game').hidden = true; $('#prog').hidden = true;
    app.innerHTML = `<form class="auth" id="f" novalidate><h1>Mon espace</h1><p>${msg || 'Connecte-toi pour retrouver ton pack.'}</p>
      <label for="em">E-mail</label><input id="em" type="email" autocomplete="email" placeholder="toi@mail.com">
      <label for="pw">Mot de passe</label><input id="pw" type="password" autocomplete="current-password">
      <p class="err" id="err" role="alert"></p><button class="primary" id="ok">Je me connecte</button>
      <p class="note">Pas encore de compte ? <a href="/funnel.html">Je crée mon jeu</a></p></form>`;
    $('#f').onsubmit = async e => { e.preventDefault(); $('#err').textContent = ''; $('#ok').disabled = true;
      try { const r = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email: $('#em').value.trim(), password: $('#pw').value }) }); const j = await r.json();
        if (!r.ok) { $('#err').textContent = 'E-mail ou mot de passe incorrect.'; $('#ok').disabled = false; return; }
        ses = { id: j.id, token: j.token }; try { localStorage.setItem(K, JSON.stringify(ses)); } catch {} load(); }
      catch { $('#err').textContent = 'Connexion impossible. Réessaie.'; $('#ok').disabled = false; } };
    $('#em').focus();
  }

  // ---------- progression ----------
  let D = null, done = new Set();
  const PK = () => 'bloxia.progress.' + ses.id;
  const loadProg = () => { let local = []; try { local = JSON.parse(localStorage.getItem(PK())) || []; } catch {} done = new Set([...((D.progress && D.progress.done) || []), ...local]); };
  let syncT = 0;
  const pushProg = () => fetch('/api/progress', { method: 'POST', body: JSON.stringify({ id: ses.id, token: ses.token, done: [...done] }) }).then(r => r.json()).then(j => { if (j && j.start && D.progress) D.progress.start = D.progress.start || j.start; }).catch(() => {});
  const saveProg = () => { try { localStorage.setItem(PK(), JSON.stringify([...done])); } catch {} clearTimeout(syncT); syncT = setTimeout(pushProg, 800); };
  const SECTIONS = [
    ['start', 'Démarrer', 'rocket', () => D.start.map((_, i) => 'st' + i)],
    ['studio', 'Roblox Studio', 'gamepad', () => []],
    ['prompts', 'Prompts Studio', 'terminal', () => D.prompts.map(p => p.id)],
    ['scripts', 'Scripts Luau', 'code', () => D.scripts.map(s => s.id)],
    ['shop', 'Boutique', 'store', () => D.shop.map(s => 'sh' + s.key)],
    ['visuals', 'Visuels', 'image', () => ['vicon', 'vt0', 'vt1', 'vt2']],
    ['listing', 'Fiche du jeu', 'file', () => D.checklist.map((_, i) => 'ck' + i)],
    ['videos', 'Vidéos TikTok', 'video', () => D.tiktok.map((_, i) => 'tk' + i)],
    ['plan', 'Programme', 'calendar', () => D.plan.flatMap(d => d.etapes.map((_, i) => stepId(d.j, i)))]
  ];
  const allIds = () => SECTIONS.flatMap(s => s[3]());
  function refreshProgress() {
    const ids = allIds(), n = ids.filter(i => done.has(i)).length;
    $('#pbar').style.width = (n / ids.length * 100) + '%'; $('#ptxt').textContent = `${n} sur ${ids.length} étapes`;
    SECTIONS.forEach(([k, , , f]) => { const ids2 = f(), c = ids2.filter(i => done.has(i)).length, em = $(`.nav [data-s="${k}"] em`); if (em) { if (!ids2.length) { em.textContent = ''; return; } em.textContent = `${c}/${ids2.length}`; em.classList.toggle('done', c === ids2.length); } });
  }
  const checkBtn = (id, label = 'Fait') => `<button class="check ${done.has(id) ? 'on' : ''}" data-done="${id}">${ic('check')}<span>${done.has(id) ? 'Fait' : label}</span></button>`;
  function bindChecks(root) {
    $$('[data-done]', root).forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.done; done.has(id) ? done.delete(id) : done.add(id); saveProg();
      const on = done.has(id); b.classList.toggle('on', on); const sp = b.querySelector('span'); if (sp) sp.textContent = on ? 'Fait' : (b.dataset.label || 'Fait');
      const card = b.closest('.card'); if (card) card.classList.toggle('done', on); refreshProgress(); if (on) { markActivity(); saveProg(); sfx.check(); toast('Étape validée'); } });
  }

  // ---------- sections ----------
  const card = (id, n, title, sub, body, open) => `<div class="card ${done.has(id) ? 'done' : ''} ${open ? 'open' : ''}" data-card="${id}"><div class="ch"><span class="num">${n}</span><div class="ct"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>${checkBtn(id)}<button class="toggle" aria-label="Afficher">${ic('chevron-down')}</button></div><div class="cb">${body}</div></div>`;
  const R = {
    studio: () => `<div class="sh"><div><h1>Roblox Studio</h1><p>Installe tous tes scripts d'un coup, directement dans ton jeu.</p></div></div>
      <div class="card open stu"><div class="ch"><div class="ct"><b>Le plugin Bloxia</b><span>Zéro copier-coller</span></div></div><div class="cb">
        <p class="stu-p">Notre plugin Roblox Studio récupère ton pack et <b>pose tous les scripts au bon endroit</b> dans ton jeu, automatiquement. Tu gardes la main : tu peux tout relire et modifier.</p>
        <div class="stu-code"><span class="stu-cl">${ic('key')}Ton code d'appairage</span><code id="plugcode">…</code><button class="btn acc" id="cpcode">${ic('copy')}Copier</button></div>
        <ol class="stu-steps">
          <li><b>Installe le plugin</b> dans Roblox Studio <a href="/plugin/" target="_blank" rel="noopener">(guide d'installation)</a>.</li>
          <li><b>Ouvre Bloxia</b> depuis la barre d'outils de Studio.</li>
          <li><b>Colle ton code</b> ci-dessus et clique « Installer ». Tes scripts apparaissent dans ton jeu.</li>
        </ol>
        <a class="btn btn-sm" href="/plugin/" target="_blank" rel="noopener">${ic('download')}Installer le plugin</a>
      </div></div>`,
    start: () => `<div class="sh"><div><h1>Démarrer</h1><p>Prépare Roblox Studio. Compte 15 minutes.</p></div></div>
      ${D.start.map((s, i) => card('st' + i, i + 1, esc(s.t), '', `<p>${esc(s.d)}</p>`, i === 0)).join('')}`,
    prompts: () => `<div class="sh"><div><h1>Prompts Studio</h1><p>Colle-les dans l'Assistant de Roblox Studio, dans l'ordre.</p></div></div>
      <div class="hint">${ic('bulb')}<span>Un prompt à la fois. Attends que l'Assistant ait fini, vérifie avec la liste, puis coche « Fait ».</span></div>
      ${D.prompts.map((p, i) => card(p.id, i + 1, esc(p.titre), esc(p.but), `<div class="code" data-tour="prompt">${esc(p.texte)}</div><div class="row"><button class="btn acc" data-copy="p${i}">${ic('copy')}Copier le prompt</button></div><ul class="ver">${p.verif.map(v => `<li>${ic('check-circle')}${esc(v)}</li>`).join('')}</ul>`, i === 0)).join('')}`,
    scripts: () => `<div class="sh"><div><h1>Scripts Luau</h1><p>Crée chaque script au bon endroit, puis colle le code.</p></div><button class="btn acc" id="zip" data-tour="zip">${ic('download')}Tout télécharger</button></div>
      <div class="hint">${ic('bulb')}<span>Dans l'Explorer : clic droit sur le dossier indiqué, « Insert Object », choisis le type (Script, LocalScript ou ModuleScript), renomme-le exactement, puis colle le code.</span></div>
      ${D.scripts.map((s, i) => card(s.id, i + 1, esc(s.nom) + (s.special ? ' <span class="tag gold">Sur mesure</span>' : ''), esc(s.role), `${s.special ? specialBlock(s) : ''}<div class="meta"><span class="tag acc">${s.type}</span><span class="tag"><span class="path">${esc(s.ou)}</span></span></div><div class="code lua">${esc(s.code)}</div><div class="row"><button class="btn acc" data-copy="s${i}">${ic('copy')}Copier</button><button class="btn" data-dl="${i}">${ic('download')}${esc(s.nom)}.lua</button></div>`, i === 0)).join('')}`,
    shop: () => `<div class="sh"><div><h1>Boutique</h1><p>4 achats à créer, avec les prix conseillés.</p></div></div>
      <div class="card" data-tour="shop"><table><thead><tr><th>Achat</th><th>Type</th><th>Prix</th><th>Quand le proposer</th><th></th></tr></thead><tbody>${D.shop.map(s => `<tr><td><b>${esc(s.name)}</b><br><span class="note" style="margin:0">${esc(s.effect)}</span></td><td>${s.type}</td><td class="price">R$ ${s.price}</td><td>${esc(s.when)}</td><td>${checkBtn('sh' + s.key, 'Créé')}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><div class="ch"><div class="ct"><b>Comment les créer</b></div></div><ol class="steps">${D.shopSteps.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol></div>`,
    visuals: () => `<div class="sh"><div><h1>Visuels</h1><p>L'icône et les miniatures font cliquer. Les prompts marchent avec tout générateur d'images.</p></div></div>
      <div class="card"><div class="ch"><div class="ct"><b>Formats</b></div></div><ul class="ver" style="padding:0 14px 14px;margin:0">${D.visuals.specs.map(v => `<li>${ic('image')}${esc(v)}</li>`).join('')}</ul></div>
      ${card('vicon', 1, 'Icône du jeu', esc(D.visuals.icon.brief), `<div class="code">${esc(D.visuals.icon.prompt)}</div><div class="row"><button class="btn acc" data-copy="vicon">${ic('copy')}Copier le prompt image</button></div>`, true)}
      ${D.visuals.thumbs.map((t, i) => card('vt' + i, i + 2, 'Miniature ' + (i + 1), esc(t.brief), `<div class="code">${esc(t.prompt)}</div><div class="row"><button class="btn acc" data-copy="vt${i}">${ic('copy')}Copier le prompt image</button></div>`)).join('')}`,
    listing: () => `<div class="sh"><div><h1>Fiche du jeu</h1><p>Titre, description et réglages avant de publier.</p></div></div>
      <div class="card"><div class="ch"><div class="ct"><b>Titre</b><span>Choisis-en un</span></div></div><div class="cb" style="display:flex;flex-direction:column;gap:6px">${D.listing.titles.map((t, i) => `<div class="row" style="margin:0;align-items:center"><span class="tag" style="height:30px;font-size:13px">${esc(t)}</span><button class="btn" data-copy="ti${i}">${ic('copy')}Copier</button></div>`).join('')}</div></div>
      <div class="card open"><div class="ch"><div class="ct"><b>Description</b></div><button class="btn" data-copy="desc">${ic('copy')}Copier</button><button class="toggle" aria-label="Afficher">${ic('chevron-down')}</button></div><div class="cb"><div class="code">${esc(D.listing.description)}</div></div></div>
      <div class="card"><div class="ch"><div class="ct"><b>Avant de publier</b><span>Coche chaque point</span></div></div><div class="cb days" style="grid-template-columns:1fr">${D.checklist.map((c, i) => dayBtn('ck' + i, '', c)).join('')}</div></div>
      <div class="card"><div class="ch"><div class="ct"><b>Réglages</b></div></div><ol class="steps">${D.listing.settings.map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol></div>`,
    videos: () => `<div class="sh"><div><h1>Vidéos TikTok</h1><p>3 vidéos courtes pour tes premiers joueurs.</p></div></div>
      ${D.tiktok.map((v, i) => card('tk' + i, i + 1, esc(v.titre), 'Accroche : ' + esc(v.hook), `<ul class="ver">${v.plans.map(p => `<li>${ic('video')}${esc(p)}</li>`).join('')}</ul><div class="code" style="margin-top:10px">${esc(v.legende + '\n' + v.tags)}</div><div class="row"><button class="btn" data-copy="tk${i}">${ic('copy')}Copier la légende</button></div>`, i === 0)).join('')}`,
    plan: () => planHTML()
  };
  function specialBlock(s) {
    return `<ol class="steps" style="padding:0 0 10px">${(s.installation || []).map(t => `<li><span>${esc(t)}</span></li>`).join('')}</ol>
      ${(s.options || []).length ? `<div class="opts"><b>Options de personnalisation</b><span>Modifie-les en haut du script, dans le bloc CONFIG.</span><table><thead><tr><th>Réglage</th><th>Par défaut</th><th>Effet</th></tr></thead><tbody>${s.options.map(o => `<tr><td class="path">${esc(o.cle)}</td><td class="path">${esc(o.defaut)}</td><td>${esc(o.effet)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  }
  function customBanner() {
    const c = D.custom || {};
    if (c.status === 'running' || genState === 'running') return `<div class="gen">${'<span class="spin"></span>'}<div><b>Ton sur-mesure se prépare</b><span>Nos prompts détaillés et ta mécanique spéciale sont en cours d'écriture pour « ${esc(D.idee)} ». Ça prend quelques minutes : commence par « Démarrer » en attendant.</span></div></div>`;
    if (c.status === 'ready' && current === 'prompts' && c.resume) return `<div class="gen ok">${ic('check-circle')}<div><b>Prompts écrits sur mesure pour ton idée</b><span>${esc(c.resume)}</span></div></div>`;
    if (c.status === 'failed' && current === 'prompts') return `<div class="gen warn">${ic('bulb')}<div><b>Le sur-mesure n'a pas pu être généré</b><span>Tu as nos prompts standards, qui marchent aussi. Écris-nous si tu veux qu'on relance.</span></div></div>`;
    return '';
  }
  function dayBtn(id, label, text) { return `<button class="day ${done.has(id) ? 'on' : ''}" data-day="${id}"><span class="box">${ic('check')}</span><div>${label ? `<b>${esc(label)}</b>` : ''}<span>${esc(text)}</span></div></button>`; }
  const COPY = () => { const m = {}; D.plan.forEach(d => { if (d.prompt) m['dp' + d.j] = d.prompt; }); D.prompts.forEach((p, i) => m['p' + i] = p.texte); D.scripts.forEach((s, i) => m['s' + i] = s.code); m.vicon = D.visuals.icon.prompt; D.visuals.thumbs.forEach((t, i) => m['vt' + i] = t.prompt); D.listing.titles.forEach((t, i) => m['ti' + i] = t); m.desc = D.listing.description; D.tiktok.forEach((v, i) => m['tk' + i] = v.legende + '\n' + v.tags); return m; };

  // ---------- sons (discrets, désactivables) ----------
  let actx = null, soundOn = true; try { soundOn = localStorage.getItem('bloxia.espace.snd') !== '0'; } catch {}
  function tone(f, d, type, v, delay) { try { actx = actx || new AudioContext(); const t = actx.currentTime + (delay || 0), o = actx.createOscillator(), g = actx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || .06, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); } catch {} }
  const sfx = {
    tap: () => soundOn && (tone(660, .09, 'sine', .05), tone(880, .12, 'sine', .04, .06)),
    back: () => soundOn && tone(520, .1, 'sine', .04),
    check: () => soundOn && (tone(740, .1, 'triangle', .06), tone(1110, .16, 'triangle', .05, .07)),
    win: () => soundOn && [523, 659, 784, 1046].forEach((f, i) => tone(f, .22, 'triangle', .06, i * .09)),
    unlock: () => soundOn && (tone(440, .12, 'sine', .05), tone(660, .12, 'sine', .05, .08), tone(990, .2, 'sine', .05, .16))
  };
  function soundBtn() { const b = $('#sndbtn'); if (!b) return; b.innerHTML = ic(soundOn ? 'volume' : 'volume-off'); b.onclick = () => { soundOn = !soundOn; try { localStorage.setItem('bloxia.espace.snd', soundOn ? '1' : '0'); } catch {} soundBtn(); sfx.tap(); }; }

  // ---------- programme 14 jours ----------
  const DAY = 86400000;
  const dateKey = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const midnight = t => { const x = new Date(t); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const planStart = () => (D.progress && D.progress.start) || Date.now();
  const todayN = () => Math.min(14, Math.floor((midnight(Date.now()) - midnight(planStart())) / DAY) + 1);
  const stepId = (n, i) => `d${n}-${i}`;
  const dayDone = d => d.etapes.every((_, i) => done.has(stepId(d.j, i)));
  const dayCount = d => d.etapes.filter((_, i) => done.has(stepId(d.j, i))).length;
  function streak() {
    let n = 0, t = midnight(Date.now());
    if (!done.has('a:' + dateKey(t))) t -= DAY;
    while (done.has('a:' + dateKey(t))) { n++; t -= DAY; }
    return n;
  }
  function markActivity() { done.add('a:' + dateKey(Date.now())); }
  let planDay = null;
  function nextUnlockText() {
    const n = todayN(); if (n >= 14) return '';
    const ms = midnight(Date.now()) + DAY - Date.now(), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60;
    return `Jour ${n + 1} dans ${h} h ${String(m).padStart(2, '0')}`;
  }
  function ring(p) { const r = 26, c = 2 * Math.PI * r; return `<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${r}" fill="none" stroke="#eceef2" stroke-width="6"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 32 32)"/></svg>`; }
  function badges() {
    const st = streak(), pub = D.plan[6] && dayDone(D.plan[6]), all = D.plan.every(dayDone);
    const B = [['flame', '3 jours de suite', st >= 3], ['rocket', 'Jeu publié', pub], ['calendar', '7 jours de suite', st >= 7], ['trophy', 'Programme terminé', all]];
    return `<div class="badges">${B.map(([i, t, ok]) => `<span class="badge ${ok ? 'on' : ''}">${ic(ok ? i : 'lock')}${t}</span>`).join('')}</div>`;
  }
  function retention() {
    const n = todayN(), doneSteps = D.plan.reduce((a, d) => a + dayCount(d), 0), pub = D.plan[6] && dayDone(D.plan[6]);
    if (!pub && n <= 7) return `<b>Ton jeu sera en ligne le jour 7.</b> Plus que ${Math.max(0, 7 - n)} jour${7 - n > 1 ? 's' : ''} : tu as déjà validé ${doneSteps} étape${doneSteps > 1 ? 's' : ''}, ne t'arrête pas en si bon chemin.`;
    if (pub && n < 14) return `<b>Ton jeu est en ligne.</b> Les jeux qui grandissent sont ceux qui sont mis à jour chaque semaine : chaque jour du programme te rapproche de ta première mise à jour.`;
    if (n >= 14 && D.plan.every(dayDone)) return `<b>Bravo, programme terminé.</b> La suite : une mise à jour par semaine, ou un nouveau jeu à générer avec ton abonnement.`;
    return `<b>Chaque jour compte.</b> 30 à 60 minutes par jour suffisent pour faire avancer ${esc(D.titre)}.`;
  }
  function planHTML() {
    const n = todayN(), st = streak(), total = D.plan.reduce((a, d) => a + d.etapes.length, 0), ok = D.plan.reduce((a, d) => a + dayCount(d), 0);
    if (planDay == null || planDay > n) planDay = Math.min(n, (D.plan.find(d => d.j <= n && !dayDone(d)) || D.plan[n - 1]).j);
    const d = D.plan[planDay - 1], cnt = dayCount(d), complete = dayDone(d), next = D.plan[planDay];
    return `<div class="sh"><div><h1>Programme 14 jours</h1><p>Un jour, une page. Un nouveau jour se débloque chaque matin.</p></div><button class="btn" id="ics">${ic('calendar')}Ajouter les rappels à mon agenda</button></div>
      <div class="phead" data-tour="phead"><div class="pring">${ring(ok / total)}<div><b>Jour ${n}</b><span>sur 14</span></div></div>
        <div class="pinfo"><div class="pstat"><span class="flame ${st ? 'on' : ''}">${ic('flame')}</span><div><b>${st} jour${st > 1 ? 's' : ''}</b><span>de suite</span></div></div>
        <div class="pstat"><span>${ic('check-circle')}</span><div><b>${ok}/${total}</b><span>étapes validées</span></div></div>
        ${n < 14 ? `<div class="pstat"><span>${ic('clock')}</span><div><b id="cdown">${nextUnlockText()}</b><span>prochain déblocage</span></div></div>` : ''}</div></div>
      <p class="pmsg">${retention()}</p>${badges()}
      <div class="strip" data-tour="strip">${D.plan.map(x => { const lock = x.j > n, dn = dayDone(x); return `<button class="dtile ${x.j === planDay ? 'sel' : ''} ${dn ? 'done' : ''} ${lock ? 'lock' : ''} ${x.j === n ? 'today' : ''}" data-pd="${x.j}" ${lock ? 'aria-disabled="true"' : ''}><small>Jour</small><b>${x.j}</b><span>${lock ? ic('lock') : dn ? ic('check') : x.j === n ? 'Auj.' : `${dayCount(x)}/${x.etapes.length}`}</span></button>`; }).join('')}</div>
      <article class="dpage ${complete ? 'complete' : ''}" data-tour="dpage"><header><span class="dnum">Jour ${d.j}</span><h2>${esc(d.titre)}</h2><div class="dmeta"><span class="tag">${ic('clock')}${esc(d.duree)}</span><span class="tag acc">${cnt}/${d.etapes.length} étapes</span></div></header>
        <p class="dobj">${esc(d.objectif)}</p><p class="dwhy">${esc(d.pourquoi)}</p>
        <div class="dsteps">${d.etapes.map((e, i) => { const id = stepId(d.j, i); return `<button class="dstep ${done.has(id) ? 'on' : ''}" data-step="${id}"><span class="box">${ic('check')}</span><span>${esc(e)}</span></button>`; }).join('')}</div>
        ${d.prompt ? `<div class="dprompt"><div class="dph"><b>${ic('terminal')}Le prompt du jour</b><button class="btn acc" data-copy="dp${d.j}">${ic('copy')}Copier</button></div><div class="code">${esc(d.prompt)}</div></div>` : ''}
        <div class="dtip">${ic('bulb')}<div><b>L'astuce du jour</b><span>${esc(d.astuce)}</span></div></div>
        <details class="dhelp"><summary>${ic('shield')}Si tu bloques<span>${ic('chevron-down')}</span></summary><ul>${d.blocage.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="note" style="margin-top:8px">Toujours bloqué ? Écris-nous à ${esc(BLOXIA_CONFIG.supportEmail)}, on te répond en français.</p></details>
        <div class="dwin ${complete ? 'show' : ''}">${ic('trophy')}<div><b>Jour ${d.j} terminé</b><span>${esc(d.victoire)}</span></div></div>
        <div class="dnext">${next ? `<div class="dnl">${next.j > n ? ic('lock') : ic('arrow-right')}<div><small>${next.j > n ? 'Se débloque demain' : 'Jour suivant'}</small><b>Jour ${next.j} · ${esc(next.titre)}</b><span>${esc(d.demain)}</span></div></div>${next.j <= n ? `<button class="btn acc" data-pd="${next.j}">Je passe au jour ${next.j}${ic('arrow-right')}</button>` : ''}` : `<div class="dnl">${ic('rocket')}<div><small>Et après ?</small><b>Ton rythme de créateur</b><span>${esc(d.demain)}</span></div></div>`}</div>
      </article><p class="note">${esc(D.devex)}</p>`;
  }
  function bindPlan(main) {
    $$('[data-pd]', main).forEach(b => b.onclick = () => { const j = +b.dataset.pd; if (j > todayN()) { toast('Ce jour se débloque plus tard. Reviens demain !'); sfx.back(); return; } planDay = j; sfx.tap(); show('plan'); });
    $$('[data-step]', main).forEach(b => b.onclick = () => {
      const id = b.dataset.step, d = D.plan[planDay - 1], wasDone = dayDone(d);
      done.has(id) ? done.delete(id) : (done.add(id), markActivity()); b.classList.toggle('on', done.has(id)); saveProg(); refreshProgress();
      if (!wasDone && dayDone(d)) { sfx.win(); burst(b); masPop(); show('plan'); toast(`Jour ${d.j} terminé`); } else if (done.has(id)) { sfx.check(); show('plan'); } else show('plan');
    });
    const ics = $('#ics', main); if (ics) ics.onclick = () => { download('bloxia-programme-14-jours.ics', calendar()); sfx.tap(); };
    clearInterval(bindPlan.t); bindPlan.t = setInterval(() => { const c = $('#cdown'); if (!c) return clearInterval(bindPlan.t); c.textContent = nextUnlockText(); if (todayN() !== +($('.dtile.today b') || {}).textContent) { sfx.unlock(); show('plan'); } }, 30000);
  }
  function masPop() { const m = $('#maspop'); m.classList.remove('on'); void m.offsetWidth; m.classList.add('on'); clearTimeout(masPop.t); masPop.t = setTimeout(() => m.classList.remove('on'), 2600); }
  function burst(el) { const r = el.getBoundingClientRect(), cols = ['#4f6bed', '#16a34a', '#f59e0b', '#ec4899']; for (let k = 0; k < 18; k++) { const e = document.createElement('i'), a = Math.random() * Math.PI * 2, dd = 40 + Math.random() * 80; e.className = 'bit'; e.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${cols[k % 4]};--dx:${Math.cos(a) * dd}px;--dy:${Math.sin(a) * dd - 30}px`; document.body.appendChild(e); setTimeout(() => e.remove(), 900); } }
  function calendar() {
    const pad = x => String(x).padStart(2, '0'), start = midnight(planStart()), url = location.origin + '/espace.html', L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bloxia//Programme 14 jours//FR', 'CALSCALE:GREGORIAN'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    D.plan.forEach(d => { const t = new Date(start + (d.j - 1) * DAY); t.setHours(18, 0, 0, 0); const s = `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}T180000`;
      L.push('BEGIN:VEVENT', `UID:bloxia-${ses.id}-j${d.j}@getbloxia.com`, `DTSTAMP:${stamp}`, `DTSTART:${s}`, 'DURATION:PT45M', `SUMMARY:Bloxia · Jour ${d.j} : ${d.titre}`, `DESCRIPTION:${(d.objectif + ' ' + url).replace(/[,;]/g, ' ')}`, `URL:${url}`, 'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', `DESCRIPTION:Jour ${d.j} de ton programme Bloxia`, 'END:VALARM', 'END:VEVENT'); });
    L.push('END:VCALENDAR'); return new Blob([L.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  }

  let current = 'start';
  function show(k) {
    current = k; $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.s === k));
    const main = $('#main'); main.innerHTML = `${customBanner()}<section class="sec on" data-sec="${k}">${R[k]()}</section>`; BX.hydrate(main);
    const C = COPY(); $$('[data-copy]', main).forEach(b => b.onclick = e => { e.stopPropagation(); copy(C[b.dataset.copy]); });
    $$('[data-dl]', main).forEach(b => b.onclick = e => { e.stopPropagation(); const s = D.scripts[+b.dataset.dl]; download(s.nom + '.lua', s.code); });
    $$('.card .ch', main).forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));
    $$('[data-day]', main).forEach(b => b.onclick = () => { const id = b.dataset.day; done.has(id) ? done.delete(id) : done.add(id); saveProg(); b.classList.toggle('on', done.has(id)); refreshProgress(); });
    const z = $('#zip'); if (z) z.onclick = () => download(`${D.titre.replace(/\s+/g, '-')}-scripts.zip`, zip(D));
    if (k === 'studio') {
      const cc = $('#plugcode');
      fetch(`/api/plugin/code?id=${encodeURIComponent(ses.id)}&token=${encodeURIComponent(ses.token)}`).then(r => r.json())
        .then(d => { if (cc) cc.textContent = d.code || 'indisponible'; }).catch(() => { if (cc) cc.textContent = 'indisponible'; });
      const cp = $('#cpcode'); if (cp) cp.onclick = () => { const v = cc && cc.textContent; if (v && v !== '…') copy(v); };
    }
    bindChecks(main); if (k === 'plan') bindPlan(main); window.scrollTo({ top: 0 });
    try { sessionStorage.setItem('bloxia.sec', k); } catch {}
  }

  // ---------- téléchargements ----------
  function download(name, data) { const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/plain;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Téléchargement lancé'); }
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
  function zip(d) {
    const enc = new TextEncoder(), files = d.scripts.map(s => [`Scripts/${s.nom}.lua`, s.code]);
    files.push(['LISEZMOI.txt', `${d.titre}\n\nOù placer chaque script dans Roblox Studio :\n` + d.scripts.map(s => `- ${s.nom} (${s.type}) : ${s.ou}`).join('\n') + '\n\nPrompts, dans l\'ordre :\n\n' + d.prompts.map((p, i) => `${i + 1}. ${p.titre}\n${p.texte}`).join('\n\n')]);
    const parts = [], central = []; let off = 0;
    const u16 = n => [n & 255, (n >> 8) & 255], u32 = n => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    for (const [name, text] of files) {
      const nb = enc.encode(name), db = enc.encode(text), crc = CRC(db);
      const head = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0)]);
      parts.push(head, nb, db);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(db.length), ...u32(db.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += head.length + nb.length + db.length;
    }
    const csize = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  }

  // ---------- visite guidée ----------
  const TOUR = [
    { sel: null, t: 'Bienvenue dans ton espace', p: 'Tout ce qu\'il faut pour publier ton jeu est ici, étape par étape. On fait le tour en une minute.' },
    { sel: '.nav', t: 'Le menu', p: 'Huit sections, dans l\'ordre où tu vas les faire. Le compteur à droite montre ce qui est terminé.' },
    { sel: '#ptxt', t: 'Ta progression', p: 'Chaque étape cochée fait avancer cette barre. Elle est sauvegardée : tu reprends où tu t\'es arrêté.' },
    { sel: '[data-card="st0"]', sec: 'start', t: 'Démarrer', p: 'Commence ici : installer Roblox Studio et préparer ton jeu. Clique sur une étape pour l\'ouvrir.' },
    { sel: '[data-card="st0"] .check', sec: 'start', t: 'Coche « Fait »', p: 'Quand une étape est terminée, coche-la. Le compteur et la barre se mettent à jour tout seuls.' },
    { sel: '[data-copy="p0"]', sec: 'prompts', t: 'Les prompts', p: 'Copie le prompt, colle-le dans l\'Assistant de Roblox Studio, puis vérifie le résultat avec la liste en dessous.' },
    { sel: '.meta', sec: 'scripts', t: 'Où mettre chaque script', p: 'Le type et l\'emplacement exact sont indiqués ici. Respecte bien le nom du script.' },
    { sel: '#zip', sec: 'scripts', t: 'Tout télécharger', p: 'Récupère tous les scripts d\'un coup, avec un fichier qui explique où placer chacun.' },
    { sel: '[data-tour="shop"]', sec: 'shop', t: 'Ta boutique', p: 'Les 4 achats à créer sur Roblox, leur prix conseillé et le bon moment pour les proposer.' },
    { sel: '[data-tour="phead"]', sec: 'plan', t: 'Ton programme 14 jours', p: 'Un nouveau jour se débloque chaque matin. Ici, tu vois ton jour, ta série de jours d\'affilée et le prochain déblocage.' },
    { sel: '[data-tour="strip"]', sec: 'plan', t: 'Un jour, une page', p: 'Chaque jour a sa page : objectif, étapes à cocher, astuce et aide si tu bloques. Reviens chaque jour pour garder ta série.' },
    { sel: '#tourbtn', t: 'Revoir ce guide', p: 'Tu peux relancer ce guide à tout moment avec ce bouton. Bonne création !' }
  ];
  let ti = 0, zoomed = null, before = 'start';
  function placeTip(rect) {
    const tip = $('#tip'), w = tip.offsetWidth, h = tip.offsetHeight, m = 14, vw = innerWidth, vh = innerHeight;
    if (!rect) { tip.style.left = (vw - w) / 2 + 'px'; tip.style.top = Math.max(20, vh * .46 - h / 2) + 'px'; return; }
    let top = rect.bottom + m; if (top + h > vh - 10) top = rect.top - h - m; if (top < 10) top = Math.min(vh - h - 10, rect.bottom + m);
    let left = rect.left + rect.width / 2 - w / 2; left = Math.max(10, Math.min(vw - w - 10, left));
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function step(i) {
    ti = Math.max(0, Math.min(TOUR.length - 1, i)); const s = TOUR[ti];
    if (zoomed) { zoomed.classList.remove('zoom'); zoomed = null; }
    if (s.sec && s.sec !== current) show(s.sec);
    const hole = $('#hole'), tip = $('#tip');
    const poses = ['joie', 'pointe', 'reflechit', 'pointe', 'marche']; $('#tmas').src = '/assets/img/mascot/' + (ti === TOUR.length - 1 ? 'joie' : ti ? poses[ti % poses.length] : 'joie') + '.png';
    $('#tstep').textContent = `Étape ${ti + 1} sur ${TOUR.length}`; $('#ttitle').textContent = s.t; $('#ttext').textContent = s.p;
    $('#tdots').innerHTML = TOUR.map((_, k) => `<i class="${k === ti ? 'on' : ''}"></i>`).join('');
    $('#tprev').style.visibility = ti ? 'visible' : 'hidden'; $('#tnext').textContent = ti === TOUR.length - 1 ? 'Terminer' : 'Suivant';
    tip.classList.remove('swap'); void tip.offsetWidth; tip.classList.add('swap');
    const el = s.sel && document.querySelector(s.sel);
    if (!el) { hole.className = 'hole center'; placeTip(null); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), pad = 8;
      hole.className = 'hole pulse'; Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
      if (!el.closest('.top') && el.offsetWidth < innerWidth * .9) { el.classList.add('zoom'); zoomed = el; }
      placeTip(r);
    }, 320);
  }
  function tour() { before = current; $('#tour').hidden = false; step(0); document.addEventListener('keydown', keys); }
  function endTour() { $('#tour').hidden = true; if (zoomed) zoomed.classList.remove('zoom'); zoomed = null; try { localStorage.setItem('bloxia.tour', '1'); } catch {} document.removeEventListener('keydown', keys); show(before === 'start' ? 'start' : before); }
  function keys(e) { if (e.key === 'Escape') endTour(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') { sfx.back(); step(ti - 1); } }
  function next() { if (ti === TOUR.length - 1) { sfx.win(); endTour(); } else { sfx.tap(); step(ti + 1); } }
  $('#tnext').onclick = next; $('#tprev').onclick = () => { sfx.back(); step(ti - 1); }; $('#tskip').onclick = () => { sfx.back(); endTour(); }; $('#tourbtn').onclick = tour;
  addEventListener('resize', () => { if (!$('#tour').hidden) step(ti); });

  // ---------- chargement ----------
  async function load() {
    if (!ses) return login();
    $('#out').hidden = false; app.innerHTML = '<p class="note" style="grid-column:1/-1">Chargement de ton pack…</p>';
    let r; try { r = await fetch(`/api/pack?id=${encodeURIComponent(ses.id)}&token=${encodeURIComponent(ses.token)}`); } catch { app.innerHTML = '<p class="err" style="grid-column:1/-1">Connexion impossible.</p>'; return; }
    if (r.status === 402) { app.innerHTML = `<div class="auth"><h1>Ton pack t'attend</h1><p>Ton compte est prêt, mais ton pack n'est pas encore débloqué.</p><a class="primary" style="justify-content:center;height:42px;text-decoration:none;display:flex" href="/funnel.html">Je débloque mon pack</a></div>`; return; }
    if (!r.ok) return login('Ta session a expiré. Reconnecte-toi.');
    D = await r.json(); D.progress = D.progress || { done: [], start: null }; loadProg(); soundBtn(); $('#sndbtn').hidden = false; if (!D.progress.start) pushProg();
    $('#game').hidden = false; $('#gname').textContent = D.titre; $('#gmeta').textContent = `${D.genre} · ${D.theme}`; $('#prog').hidden = false; $('#tourbtn').hidden = false;
    app.innerHTML = `<nav class="nav" aria-label="Sections">${SECTIONS.map(([k, n, i]) => `<button data-s="${k}">${ic(i)}<span>${n}</span><em></em></button>`).join('')}</nav><main class="main" id="main"></main>`;
    BX.hydrate(document); $$('.nav button').forEach(b => b.onclick = () => show(b.dataset.s));
    let start = 'start'; try { start = sessionStorage.getItem('bloxia.sec') || 'start'; } catch {}
    show(R[start] ? start : 'start'); refreshProgress();
    startGeneration();
    let seen = false; try { seen = localStorage.getItem('bloxia.tour') === '1'; } catch {}
    if (!seen) setTimeout(tour, 500);
  }
  // ---------- sur-mesure (génération longue, côté serveur) ----------
  let genState = null, pollT = 0;
  async function refreshPack() {
    const r = await fetch(`/api/pack?id=${encodeURIComponent(ses.id)}&token=${encodeURIComponent(ses.token)}`); if (!r.ok) return;
    const nd = await r.json(); const was = D.custom && D.custom.status; D = nd;
    if (D.custom.status !== 'running' && genState !== 'running') { clearInterval(pollT); if (was !== D.custom.status && D.custom.status === 'ready') toast('Ton sur-mesure est prêt'); show(current); refreshProgress(); }
  }
  function startGeneration() {
    const st = D.custom && D.custom.status;
    if (st === 'ready' || st === 'failed' || st === 'disabled') return;
    genState = 'running'; if (st !== 'running') show(current);
    fetch('/api/generate', { method: 'POST', body: JSON.stringify({ id: ses.id, token: ses.token }) }).then(r => r.json()).then(j => { genState = j.status; refreshPack(); }).catch(() => { genState = null; });
    clearInterval(pollT); pollT = setInterval(refreshPack, 15000);
  }
  load();
})();
