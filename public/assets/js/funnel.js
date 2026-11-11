/* Funnel Bloxia : partie en 14 écrans, guide avec voix, HUD, minimap, mondes 3D. */
(function () {
  const E = window.BloxiaEngine, BX = window.BX, $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], ic = BX.icon, esc = BX.esc, root = document.documentElement;
  const GUIDES = [
    { id: 'pixel', name: 'Pixel', role: 'Le bâtisseur', quote: '« Un bloc à la fois, un monde entier. »', c: '#4da3ff', c2: '#16346e', genre: 'obby', theme: 'island' },
    { id: 'nova', name: 'Nova', role: 'La scripteuse', quote: '« Le code, c\'est de la magie qui s\'apprend. »', c: '#c084fc', c2: '#3b1c78', genre: 'tycoon', theme: 'space' },
    { id: 'rex', name: 'Rex', role: 'Le marchand', quote: '« Un bon jeu, ça se vend. »', c: '#ffc53d', c2: '#6b3d0a', genre: 'rp', theme: 'city' }
  ];
  const GENRES = [['obby', 'Obby', 'Saute, évite, finis le parcours', 'flag'], ['tycoon', 'Tycoon', 'Construis ton empire', 'factory'], ['simulator', 'Simulator', 'Collecte, améliore, recommence', 'pickaxe'], ['horror', 'Horreur', 'Survis jusqu\'au matin', 'ghost'], ['td', 'Tower defense', 'Défends contre les vagues', 'tower'], ['rp', 'Roleplay', 'Vis la ville en vrai', 'house']];
  const THEMES = [['lava', 'Lave, feu et roche'], ['snow', 'Glace et neige'], ['city', 'Néons et gratte-ciels'], ['space', 'Planètes et cristaux'], ['island', 'Plages et palmiers'], ['jungle', 'Temples et lianes'], ['candy', 'Bonbons et sucre'], ['grass', 'Prairies et collines']];
  const SUGG = ['Un obby dans un volcan où la lave monte toutes les 30 secondes', 'Un tycoon de pizzeria sur une île tropicale', 'Une survie zombie dans une école abandonnée la nuit', 'Un simulator de minage de cristaux sur Mars'];
  const ITEMS = { 4: ['map', 'Plan de la map'], 5: ['palette', 'Palette du monde'], 6: ['target', 'Objectif'], 8: ['medal', 'Badge game design'], 9: ['terminal', 'Prompt maître'], 10: ['key', 'Ton compte Bloxia'], 12: ['code', 'Scripts Luau'] };
  const GEN = 11, RES = 12, LAST = 13;
  const KEY = 'bloxia.funnel';
  const S = { i: 0, a: {}, blocs: 0, items: [], snd: true };
  try { S.snd = localStorage.getItem('bloxia.snd') !== '0'; } catch {}
  const prof = BX.get();
  const G = () => GUIDES.find(g => g.id === S.a.guide) || GUIDES[0];
  const an = () => { const g = GENRES.find(x => x[0] === S.a.genre) ? S.a.genre : 'obby', t = S.a.theme || 'grass'; const a = { genre: g, theme: t, title: E.THEMES[t].en + ' ' + E.GENRES[g].word }; return a; };
  const phrase = () => S.a.phrase || '';

  // ---------- sons, voix ----------
  let actx; const tone = (f, d = .12, type = 'square', v = .05) => { if (!S.snd) return; try { actx = actx || new AudioContext(); const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d); o.stop(actx.currentTime + d); } catch {} };
  const sfx = { pick: () => { tone(520, .08); setTimeout(() => tone(780, .1), 70); }, unlock: () => { [660, 880, 1100].forEach((f, i) => setTimeout(() => tone(f, .14, 'triangle'), i * 90)); }, lvl: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .16, 'square'), i * 100)); } };
  const wave = on => $('#fx-wave').classList.toggle('on', on);
  function speak(t) {
    if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); if (!S.snd) return;
    const u = new SpeechSynthesisUtterance(t.replace(/[«»]/g, '')); u.lang = 'fr-FR'; u.rate = 1.05; const id = G().id; u.pitch = id === 'nova' ? 1.25 : id === 'rex' ? .8 : 1;
    const v = speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang)); if (v) u.voice = v; u.onstart = () => wave(true); u.onend = u.onerror = () => wave(false); speechSynthesis.speak(u);
  }
  let tw = 0;
  function guideSay(t) {
    const box = $('.fx-say'); box.classList.remove('done'); const p = $('#fx-text'); p.textContent = ''; clearInterval(tw); let k = 0;
    wave(true); tw = setInterval(() => { p.textContent = t.slice(0, ++k); if (k >= t.length) { clearInterval(tw); box.classList.add('done'); if (!S.snd || !('speechSynthesis' in window)) wave(false); } }, 22); speak(t);
  }
  const toast = (t, info) => { const e = $('#fx-toast'); e.className = 'fx-toast show' + (info ? ' info' : ''); e.innerHTML = t; clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 2400); };

  // Pop-up de connexion affichée PENDANT la génération. Bouton Google en avant + e-mail en secours.
  // Résout quand le compte est prêt (S.a._id posé). Déjà connecté -> résout tout de suite.
  let GCFG = null; // { googleClientId } mis en cache
  function authPopup() {
    if (S.a._id) return Promise.resolve();
    return new Promise(resolve => {
      const done = r => { S.a._id = r.id; S.a._t = r.token; if (r.name && !S.a.name) S.a.name = r.name; if (r.existing && r.answers) for (const [k, v] of Object.entries(r.answers)) if (S.a[k] == null) S.a[k] = v;
        try { localStorage.setItem('bloxia.session', JSON.stringify({ id: r.id, token: r.token })); } catch {} gain(60, 10); sync(); sfx.unlock();
        wrap.classList.add('out'); setTimeout(() => wrap.remove(), 260); resolve(); };
      const wrap = document.createElement('div'); wrap.className = 'fx-pop-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
      wrap.innerHTML = `<div class="fx-pop">
        <div class="fx-pop-top"><span class="fx-pop-ic">${GL('lock', 'xl')}</span><h2>On sauvegarde ta map</h2><p>Crée ton compte pour débloquer ta map. <b>2 min, pas plus.</b></p></div>
        <div class="fx-gbtn" id="gbtn"><button type="button" class="gbig" id="gfallback"><span class="gg">${googleG()}</span>Continuer avec Google</button></div>
        <div class="fx-or"><span>ou avec ton e-mail</span></div>
        <form class="fx-form" id="acc" novalidate>
          <div class="fx-inp">${ic('mail')}<input id="em" type="email" inputmode="email" autocomplete="email" placeholder="toi@mail.com" value="${esc(S.a.email || '')}"></div>
          <div class="fx-inp">${ic('lock')}<input id="pw" type="password" autocomplete="new-password" placeholder="Ton mot de passe"><button type="button" class="fx-eye" id="eye" aria-label="Afficher">${ic('eye')}</button></div>
          <p class="fx-err" id="err" role="alert"></p>
          <button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Je débloque ma map</span>${ic('arrow-right')}</button>
        </form>
        <p class="fx-foot"><span id="swt">Déjà un compte ?</span> <button type="button" class="fx-link" id="sw">Se connecter</button></p>
        <p class="fx-foot fx-safe">${ic('shield')}Tes infos restent privées. Zéro spam.</p></div>`;
      document.body.appendChild(wrap); requestAnimationFrame(() => wrap.classList.add('on'));
      // e-mail / mot de passe
      let mode = 'signup'; const em = wrap.querySelector('#em'), pw = wrap.querySelector('#pw'), err = wrap.querySelector('#err'), ok = wrap.querySelector('#ok');
      const chk = () => { ok.disabled = !/^\S+@\S+\.\S+$/.test(em.value.trim()) || !pw.value; err.textContent = ''; }; em.oninput = chk; pw.oninput = chk; chk();
      wrap.querySelector('#eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
      wrap.querySelector('#sw').onclick = () => { mode = mode === 'login' ? 'signup' : 'login'; wrap.querySelector('#ok .lbl').textContent = mode === 'login' ? 'Je me connecte' : 'Je débloque ma map'; wrap.querySelector('#swt').textContent = mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'; wrap.querySelector('#sw').textContent = mode === 'login' ? 'Créer un compte' : 'Se connecter'; err.textContent = ''; };
      wrap.querySelector('#acc').onsubmit = async e => { e.preventDefault(); if (ok.disabled) return; ok.disabled = true;
        try { const res = await fetch('/api/' + mode, { method: 'POST', body: JSON.stringify({ email: em.value.trim(), password: pw.value, name: S.a.name, answers: S.a, ref: BX.ref() }) }); const r = await res.json();
          if (res.status === 401) { err.textContent = r.error === 'exists' ? 'Ce compte existe déjà. Vérifie ton mot de passe ou connecte-toi.' : 'E-mail ou mot de passe incorrect.'; if (r.error === 'exists') wrap.querySelector('#sw').click(); ok.disabled = false; return; }
          if (res.status === 429) { err.textContent = 'Trop d\'essais, réessaie dans quelques minutes.'; ok.disabled = false; return; }
          if (!res.ok) throw 0; S.a.email = em.value.trim(); done(r);
        } catch { err.textContent = 'Connexion impossible. Réessaie.'; ok.disabled = false; } };
      // Google
      const gcb = async credential => { try { const res = await fetch('/api/google', { method: 'POST', body: JSON.stringify({ credential, answers: S.a, ref: BX.ref() }) }); const r = await res.json(); if (!res.ok) throw 0; done(r); } catch { err.textContent = 'Connexion Google impossible. Essaie l\'e-mail.'; } };
      const fb = wrap.querySelector('#gfallback');
      const ready = cfg => {
        if (cfg && cfg.googleClientId && window.google && google.accounts && google.accounts.id) {
          google.accounts.id.initialize({ client_id: cfg.googleClientId, callback: res => gcb(res.credential) });
          const host = wrap.querySelector('#gbtn'); host.innerHTML = '<div id="gsi"></div>';
          google.accounts.id.renderButton(wrap.querySelector('#gsi'), { type: 'standard', theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', logo_alignment: 'left', width: 320 });
        } else { fb.onclick = () => { err.textContent = 'La connexion Google arrive bientôt. Utilise ton e-mail pour l\'instant.'; em.focus(); }; }
      };
      const boot = cfg => { GCFG = cfg; if (cfg && cfg.googleClientId) loadGsi(() => ready(cfg)); else ready(cfg); };
      if (GCFG) boot(GCFG); else fetch('/api/pubcfg').then(r => r.json()).then(boot).catch(() => boot({}));
      setTimeout(() => (em.value ? pw : em).focus(), 350);
    });
  }
  function loadGsi(cb) { if (window.google && google.accounts && google.accounts.id) return cb(); let s = document.getElementById('gsi-src'); if (s) { s.addEventListener('load', cb); return; } s = document.createElement('script'); s.id = 'gsi-src'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.onload = cb; s.onerror = () => cb(); document.head.appendChild(s); }
  function googleG() { return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"/></svg>'; }

  // ---------- Analyse d'idée (score de potentiel, calcul instantané, estimation) ----------
  function scoreIdea() {
    const a = an(), g = a.genre, p = (phrase() || '').toLowerCase(), words = p.split(/\s+/).filter(Boolean);
    const VIR = { obby: 76, tycoon: 86, simulator: 84, horror: 81, td: 75, rp: 72 }, MON = { obby: 68, tycoon: 90, simulator: 86, horror: 74, td: 73, rp: 80 }, EAS = { obby: 90, tycoon: 76, simulator: 82, horror: 78, td: 74, rp: 70 };
    const hash = [...p].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7), jit = n => (hash >> n) % 5 - 2;
    const mech = /(boss|niveau|vague|manche|équipe|team|collect|améli|upgrade|course|chrono|surviv|craft|pet|échap|escape|pvp|duel|défi|secret|combo|classement|rareté|rare)/.test(p);
    let viral = (VIR[g] || 76) + (p.length >= 45 ? 6 : p.length >= 25 ? 3 : -3) + (mech ? 5 : 0) + jit(1);
    let money = (MON[g] || 78) + (mech ? 3 : 0) + jit(2);
    let ease = (EAS[g] || 80) + (words.length <= 16 ? 4 : -2) + jit(3);
    const cl = n => Math.max(58, Math.min(96, Math.round(n)));
    viral = cl(viral); money = cl(money); ease = cl(ease);
    const overall = Math.max(64, Math.min(95, Math.round(viral * .45 + money * .3 + ease * .25)));
    const GN = E.GENRES[g].label, strengths = [], tips = [];
    strengths.push(`Le genre « ${GN} » tourne très bien sur Roblox en ce moment.`);
    if (money >= 84) strengths.push('Fort potentiel de monétisation : facile d\'y placer une boutique et des Game Pass.');
    if (ease >= 84) strengths.push('Prise en main rapide : un joueur comprend le but en quelques secondes.');
    if (mech) strengths.push('Ta phrase contient une mécanique claire : c\'est ce qui fait revenir les joueurs.');
    if (p.length >= 45) strengths.push('Idée détaillée : la génération aura de la matière pour te surprendre.');
    if (!mech) tips.push('Ajoute une mécanique qui accroche : un boss, des manches, une course contre la montre ou un objet rare.');
    if (p.length < 25) tips.push('Précise un détail unique (un lieu, un twist, un objectif) pour sortir du lot.');
    if (money < 82) tips.push('Pense à un objet à vendre dès le départ (skin, pet, pass VIP) pour monétiser plus vite.');
    tips.push('Prévois une mise à jour par semaine : c\'est ce qui fait grimper un jeu Roblox.');
    return { overall, viral, money, ease, strengths: strengths.slice(0, 3), tips: tips.slice(0, 2), verdict: overall >= 85 ? 'Très prometteur' : overall >= 75 ? 'Solide' : 'Bon potentiel' };
  }
  function analyzeIdea() {
    return new Promise(resolve => {
      const r = scoreIdea(), ph = phrase().trim();
      const wrap = document.createElement('div'); wrap.className = 'fx-pop-wrap';
      const bar = (lbl, v, c) => `<div class="fx-anb"><span>${lbl}</span><i><b style="--w:${v}%;--c:${c}"></b></i><em data-v="${v}">0</em></div>`;
      wrap.innerHTML = `<div class="fx-pop fx-ana">
        <div class="fx-anh"><span class="fx-kick">${ic('chart')}Analyse de ton idée</span><p class="fx-anq">« ${esc(ph.slice(0, 110))} »</p></div>
        <div class="fx-anscore"><svg viewBox="0 0 120 120" class="fx-ring"><circle class="t" cx="60" cy="60" r="52"/><circle class="v" cx="60" cy="60" r="52" id="anring"/></svg><div class="fx-ancen"><b id="ansc">0</b><small>/ 100</small></div></div>
        <p class="fx-anverd"><b>${r.verdict}.</b> Estimation automatique, pas une garantie.</p>
        <div class="fx-anbars">${bar('Potentiel viral', r.viral, '#ff6fa8')}${bar('Monétisation', r.money, '#ffc53d')}${bar('Prise en main', r.ease, '#2bd68f')}</div>
        <div class="fx-ancols">
          <div><h4>${ic('check-circle')}Points forts</h4><ul>${r.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
          <div><h4>${ic('bulb')}Pour aller plus loin</h4><ul>${r.tips.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        </div>
        <button class="btn btn-gold btn-block" id="ango"><span class="lbl">Lancer la génération</span>${ic('arrow-right')}</button>
      </div>`;
      document.body.appendChild(wrap); requestAnimationFrame(() => wrap.classList.add('on'));
      // animations : anneau + score + barres
      const circ = 2 * Math.PI * 52, ring = wrap.querySelector('#anring'); ring.style.strokeDasharray = circ; ring.style.strokeDashoffset = circ;
      const t0 = performance.now(), D = 1100, sc = wrap.querySelector('#ansc'), bars = [...wrap.querySelectorAll('.fx-anb em')];
      const tick = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
        sc.textContent = Math.round(r.overall * e); ring.style.strokeDashoffset = circ * (1 - r.overall / 100 * e);
        bars.forEach(b => b.textContent = Math.round(+b.dataset.v * e)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); sfx.pick && sfx.pick();
      wrap.querySelector('#ango').onclick = () => { sfx.unlock && sfx.unlock(); wrap.classList.add('out'); setTimeout(() => wrap.remove(), 240); resolve(); };
    });
  }

  // ---------- mondes 3D ----------
  let extra = [];
  const theme = a => { const t = E.THEMES[a.theme]; root.style.setProperty('--sky1', t.sky[0]); root.style.setProperty('--sky2', t.sky[1]); root.style.setProperty('--glow', t.glow); };
  const bg = new E.World($('#fx-bg'), { autoRotate: true, speed: .4, scale: 1.15, offsetY: .12 }), mini = new E.World($('#fx-mini'), { autoRotate: true, scale: 1.2, offsetY: .04 });
  function worlds(animate, ms) {
    const a = an(); theme(a); const g = E.generate(a, phrase()); const g2 = E.generate(a, phrase());
    bg.set(g.blocks, a.theme, animate ? { duration: ms || 1600 } : { animate: false }); mini.set(g2.blocks, a.theme, animate ? { duration: ms || 1600 } : { animate: false });
    if (!animate) { const p = Math.max(.2, Math.min(1, S.i / GEN)); bg.snapReveal(p); mini.snapReveal(p); } return g.blocks.length;
  }
  const grow = () => { const p = Math.max(.2, Math.min(1, S.i / GEN)); bg.reveal(p); mini.reveal(p); };
  function thumb(cv, genre, th, ang, hoverSpin) {
    const w = new E.World(cv, { autoRotate: true, scale: 1.45, offsetY: .08, speed: 1.4 }); const a = { genre, theme: th };
    w.set(E.generate(a, genre + th).blocks, th, { animate: false }); w.still(ang || .7); extra.push(w);
    if (hoverSpin) { const c = cv.closest('.fx-card'); if (c) { c.addEventListener('pointerenter', () => { w.paused = false; }); c.addEventListener('pointerleave', () => { w.paused = true; }); } } return w;
  }

  // ---------- HUD ----------
  let shown = 0;
  function setBlocs(n) { const el = $('#fx-blocs span'); const from = shown; shown = n; const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (n - from) * p); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
  function gain(n, itemKey) {
    const l0 = 1 + Math.floor(S.blocs / 200); S.blocs += n; setBlocs(S.blocs); if (n) floater(n); const l1 = 1 + Math.floor(S.blocs / 200);
    if (l1 > l0) { $('#fx-lvl').textContent = l1; const L = $('#fx-lvl'); L.classList.remove('up'); void L.offsetWidth; L.classList.add('up'); setTimeout(() => toast(ic('star') + 'Niveau ' + l1 + ' !'), 500); sfx.lvl(); }
    const it = ITEMS[itemKey]; if (it && !S.items.includes(itemKey)) { S.items.push(itemKey); const b = $('#fx-bagn'); b.hidden = false; b.textContent = S.items.length; setTimeout(() => { toast(GL(it[0], 'tg') + '<span><small>Objet débloqué</small>' + it[1] + '</span>'); sfx.unlock(); }, 350); } else sfx.pick();
    drawer();
  }
  function floater(n) { const r = $('#fx-blocs').getBoundingClientRect(), e = document.createElement('span'); e.className = 'fx-float'; e.textContent = '+' + n; e.style.left = r.left + r.width / 2 + 'px'; e.style.top = r.bottom + 'px'; document.body.appendChild(e); setTimeout(() => e.remove(), 1100); }
  function burst(x, y, cols) { cols = cols || ['#ffc53d', '#5b9bff', '#2bd68f', '#ff6fa8', '#ffffff']; for (let k = 0; k < 16; k++) { const e = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90; e.className = 'fx-bit'; e.style.cssText = `left:${x}px;top:${y}px;background:${cols[k % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;--r:${Math.random() * 360}deg;--s:${.6 + Math.random() * .8}`; document.body.appendChild(e); setTimeout(() => e.remove(), 900); } }
  function drawer() { $('#fx-items').innerHTML = S.items.length ? S.items.map(k => `<div class="fx-li"><span class="fx-gt">${GL(ITEMS[k][0])}</span><div><b>${ITEMS[k][1]}</b><small>Débloqué</small></div></div>`).join('') : '<p class="fx-empty">Rien pour l\'instant. Réponds aux questions pour débloquer des objets.</p>'; }
  function hud() {
    const on = S.i >= 1; $('#fx-hud').hidden = !on; $('#fx-guide').hidden = !on || S.i === RES; $('#fx-minibox').hidden = !on || S.i === GEN || S.i === LAST; $('#fx-stage').className = 'fx-stage' + (S.i === 0 ? ' s0' : '');
    $('#fx-pbar').style.width = Math.min(100, S.i / LAST * 100) + '%'; $('#fx-back').style.visibility = backOf(S.i) >= 0 ? 'visible' : 'hidden';
    const n = Math.round(S.i / LAST * 5); $('#fx-stars').innerHTML = [0, 1, 2, 3, 4].map(k => ic('star', k < n ? 'on' : '')).join('');
    const g = G(); root.style.setProperty('--gc', g.c); $('#fx-av').innerHTML = AV.svg(g.id); $('#fx-gname').textContent = g.name;
  }
  $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off');
  $('#fx-snd').onclick = () => { S.snd = !S.snd; try { localStorage.setItem('bloxia.snd', S.snd ? '1' : '0'); } catch {} $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off'); if (!S.snd) { speechSynthesis && speechSynthesis.cancel(); wave(false); } else sfx.pick(); };
  $('#fx-bag').onclick = () => $('#fx-drawer').classList.toggle('open'); $('#fx-dclose').onclick = () => $('#fx-drawer').classList.remove('open');
  // Cible du retour : paywall -> résultat, résultat -> écran idée (pour changer et relancer),
  // questions -> étape précédente. Pas de retour pendant la génération ni avant l'étape 1.
  function backOf(i) { if (i === LAST) return RES; if (i === RES) return 9; if (i === GEN || i === 10 || i === 0) return -1; return i - 1; }
  $('#fx-back').onclick = () => { const t = backOf(S.i); if (t >= 0) { sfx.pick && sfx.pick(); go(t); } };

  // ---------- micro (dictée vocale) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function mic(wrap, input) {
    const b = wrap.querySelector('.fx-mic'); if (!SR) { b.hidden = true; return; } let rec, on = false;
    b.onclick = () => { if (on) { rec && rec.stop(); return; } if ('speechSynthesis' in window) speechSynthesis.cancel(); wave(false);
      rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = true; rec.continuous = false; const base = input.value.trim() ? input.value.trim() + ' ' : '';
      rec.onstart = () => { on = true; b.classList.add('rec'); wrap.classList.add('recording'); }; rec.onend = () => { on = false; b.classList.remove('rec'); wrap.classList.remove('recording'); };
      rec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; input.value = (base + t).slice(0, input.maxLength > 0 ? input.maxLength : 180); input.dispatchEvent(new Event('input')); };
      rec.onerror = e => { if (/not-allowed|service-not-allowed/.test(e.error)) toast(ic('mic-off') + 'Autorise le micro dans ton navigateur', true); };
      try { rec.start(); } catch {} };
  }
  const field = (id, tag, ph, val, max) => `<div class="fx-field ${tag === 'input' ? 'single' : ''}">${tag === 'input' ? `<input class="fx-in" id="${id}" maxlength="${max}" placeholder="${ph}" value="${esc(val || '')}" autocomplete="off">` : `<textarea class="fx-in" id="${id}" maxlength="${max}" placeholder="${ph}">${esc(val || '')}</textarea>`}<button type="button" class="fx-mic" aria-label="Parler">${ic('mic')}</button></div><div class="fx-rec">${ic('mic')}J'écoute… parle maintenant</div>`;

  // ---------- cartes ----------
  const card = (o) => `<button class="fx-card ${o.cls || ''}" data-v="${esc(o.v)}" ${o.g ? `style="--c1:${E.THEMES[o.t || 'grass'].sky[0]};--c2:${E.THEMES[o.t || 'grass'].sky[1]}"` : `style="--c1:${o.c1 || '#1d2a52'};--c2:#0a0d18;--cc:${o.cc || 'rgba(255,197,61,.18)'}"`}>${o.g ? `<canvas data-g="${o.g}" data-t="${o.t}"></canvas><span class="fx-ci">${ic(o.icon)}</span>` : `<span class="fx-glyph">${GL(o.gl || 'cube')}</span>`}${o.tag ? `<span class="fx-tag">${o.tag}</span>` : ''}<span class="fx-ct"><b>${esc(o.title)}</b><small>${esc(o.sub || '')}</small></span></button>`;
  function cards(stage, key, itemKey, gainN, after) {
    $$('canvas[data-g]', stage).forEach(c => thumb(c, c.dataset.g, c.dataset.t, .7, true));
    const list = $$('.fx-card', stage); let locked = false;
    const pick = b => { if (locked) return; locked = true; list.forEach(x => x.classList.toggle('dim', x !== b)); b.classList.add('sel'); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); S.a[key] = b.dataset.v; after && after(b.dataset.v); gain(gainN || 50, itemKey); setTimeout(() => go(S.i + 1), 520); };
    list.forEach((b, k) => { b.style.setProperty('--d', k * 55 + 'ms'); if (k < 9) b.insertAdjacentHTML('beforeend', `<kbd class="fx-kbd">${k + 1}</kbd>`); b.onclick = () => pick(b); });
    keyH = e => { const k = +e.key; if (k >= 1 && k <= list.length) pick(list[k - 1]); };
  }
  let keyH = null; document.addEventListener('keydown', e => { if (keyH && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) keyH(e); });
  const title = (a, b, c) => `<h1 class="fx-title">${a} <b>${b}</b> ${c || ''}</h1>`;
  const hl = line => line.replace(/(--.*$)|("[^"]*")|\b(local|function|end|if|then|else|elseif|for|while|repeat|until|in|do|return|and|or|not|nil|true|false|break)\b|\b(\d+)\b|([<>&])/g, (m, c, s, k, n) => c ? `<span class="c">${esc(c)}</span>` : s ? `<span class="s">${esc(s)}</span>` : k ? `<span class="k">${k}</span>` : n ? `<span class="n">${n}</span>` : esc(m));

  // ---------- écrans ----------
  const STEPS = [
    { // 0 : choix du guide
      say: null, html: () => `<div class="fx-kick">${ic('gamepad')}Nouvelle partie</div>${title('choisis', 'ton guide')}
        <div class="fx-pcard" id="pc"><canvas></canvas><div id="pav"></div><div class="fx-pinfo"><h2 id="pn"></h2><span class="fx-role" id="pr"></span><span class="fx-quote" id="pq"></span></div></div>
        <div class="fx-picks">${GUIDES.map(g => `<button class="fx-pick" data-id="${g.id}"><span class="fx-av" style="--gc:${g.c}">${AV.svg(g.id)}</span>${g.name}</button>`).join('')}</div>
        <button class="btn btn-gold btn-block" id="go0"><span class="lbl"></span>${ic('arrow-right')}</button><p class="fx-foot">3 minutes · gratuit</p>`,
      after: st => {
        let w; const show = id => { S.a.guide = id; const g = G(); st.querySelector('#pc').style.cssText = `--gc:${g.c};--gc2:${g.c2}`; st.querySelector('#pav').innerHTML = AV.svg(g.id); st.querySelector('#pn').textContent = g.name; st.querySelector('#pr').textContent = g.role; st.querySelector('#pq').textContent = g.quote; st.querySelector('#go0 .lbl').textContent = 'Je pars avec ' + g.name;
          $$('.fx-pick', st).forEach(b => { b.classList.toggle('sel', b.dataset.id === id); b.style.setProperty('--gc', GUIDES.find(x => x.id === b.dataset.id).c); }); root.style.setProperty('--gc', g.c);
          if (w) { w.destroy(); extra = extra.filter(x => x !== w); } w = thumb(st.querySelector('#pc canvas'), g.genre, g.theme, .9, false); w.paused = false; sfx.pick(); };
        $$('.fx-pick', st).forEach(b => b.onclick = () => show(b.dataset.id)); show(S.a.guide || 'pixel');
        st.querySelector('#go0').onclick = () => { gain(0); S.snd && tone(660, .1); trend(); };
        // Écran « tendance » : chiffres officiels de Roblox, illustrations maison, aucune promesse de gains.
        function trend() {
          const sec = st; sec.classList.add('out');
          setTimeout(() => {
            sec.classList.remove('out');
            sec.innerHTML = `<div class="fx-kick">${ic('chart')}Tout le monde en parle</div>${title('le business', 'tendance', 'du moment.')}
              <div class="tr-stack">
                <figure class="tr-card tr-a"><div class="tr-chrome gpt"><span class="tr-pill">ChatGPT</span><span>« Quel est le meilleur business à lancer en 2026 ? »</span></div><img src="/assets/img/trend/chatgpt.jpg" alt="Réponse de ChatGPT : le meilleur business à lancer en 2026, les maps Roblox" loading="eager" class="tr-img top"></figure>
                <figure class="tr-card tr-b"><div class="tr-chrome red"><span class="tr-pill">${ic('play')}YouTube</span><span>Aywen · Build Your Gym</span></div><img src="/assets/img/trend/youtube-aywen.jpg" alt="Miniature YouTube d'Aywen sur son jeu Roblox Build Your Gym" loading="eager" class="tr-img"></figure>
                <div class="tr-card tr-c"><div class="tr-chrome"><i></i><i></i><i></i><span>Roblox · résultats officiels 2025</span></div><div class="tr-body"><span class="tr-gl">${GL('coin')}</span><div><b class="tr-big" id="trn">0</b><span>versés aux créateurs Roblox entre janvier et septembre 2025, déjà plus que sur toute l'année 2024.</span><small>Source : Roblox, résultats du 3e trimestre 2025</small></div></div></div>
              </div>
              <p class="tr-lead">TikTok, YouTube, Roblox : <b>c'est le moment de t'y mettre.</b></p>
              <p class="tr-note">Rien n'est garanti : la plupart des jeux ne rapportent rien au début. Ceux qui marchent ont une bonne boutique, une belle vitrine et des mises à jour régulières. C'est exactement ce que tu vas recevoir.</p>
              <button class="btn btn-gold btn-block" id="go1"><span class="lbl">Je continue</span>${ic('arrow-right')}</button>`;
            BX.hydrate(sec);
            const el = sec.querySelector('#trn'), t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3); el.textContent = (e * 1).toFixed(2).replace('.', ',') + ' milliard $'; if (p < 1 && document.body.contains(el)) requestAnimationFrame(f); else el.textContent = '1 milliard $'; }; setTimeout(() => requestAnimationFrame(f), 350);
            sec.querySelector('#go1').onclick = () => { sfx.pick(); go(1); };
          }, 170);
        }
      } },
    { say: () => 'On commence simple : c\'est quoi ton blaze de créateur ?', html: () => `${title('ton', 'blaze', '?')}${field('v', 'input', 'Ton blaze', S.a.name, 24)}<p class="fx-help">Pas d'idée ? Touche un blaze :</p><div class="fx-chips">${['BlockMaster', 'NightBuilder', 'PixelKing', 'Le Boss'].map(n => `<button class="fx-chip">${n}</button>`).join('')}</div><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">C'est mon blaze</span></button>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'), chk = () => ok.disabled = i.value.trim().length < 2; i.oninput = chk; chk(); mic(st.querySelector('.fx-field'), i); $$('.fx-chip', st).forEach(c => c.onclick = () => { i.value = c.textContent; chk(); sfx.pick(); }); const done = () => { if (ok.disabled) return; S.a.name = i.value.trim(); gain(50); go(2); }; ok.onclick = done; i.onkeydown = e => { if (e.key === 'Enter') done(); }; i.focus(); } },
    { say: () => `On fait connaissance, ${S.a.name}. Tu as quel âge ?`, html: () => `${title('ton', 'âge', '?')}<div class="fx-grid">${[['cube', 'Moins de 13 ans', 'Je découvre', '#1d3f8f'], ['gamepad', '13 à 17 ans', 'Gamer confirmé', '#4b2a8f'], ['laptop', '18 à 24 ans', 'Prêt à créer', '#0e5a7a'], ['crown', '25 ans et plus', 'Je vise loin', '#7a4f12']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'age', null, 40) },
    { say: () => 'Tu connais déjà Roblox Studio ?', html: () => `${title('ton', 'niveau', '?')}<div class="fx-grid one">${[['sprout', 'Jamais ouvert', 'Je pars de zéro, et c\'est très bien', '#14532d'], ['hammer', 'Je bidouille', 'Je sais poser quelques blocs', '#4b2a8f'], ['code', 'Je script déjà', 'Le Luau n\'a pas de secret pour moi', '#0f3b5a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'xp', null, 40) },
    { say: () => 'Dans quel genre de jeu tu te vois ?', html: () => `${title('ton', 'style', '?')}<div class="fx-grid">${GENRES.map(([k, n, s, i]) => card({ v: k, icon: i, title: n, sub: s, g: k, t: ({ obby: 'grass', tycoon: 'island', simulator: 'space', horror: 'horror', td: 'snow', rp: 'city' })[k] })).join('')}</div>`, after: st => cards(st, 'genre', 4, 60, v => { S.a.type = GENRES.find(g => g[0] === v)[1]; worlds(true, 1200); }) },
    { say: () => 'Et il se passe dans quel monde ?', html: () => `${title('ton', 'monde', '?')}<div class="fx-grid">${THEMES.map(([k, s]) => card({ v: k, icon: E.THEMES[k].icon, title: E.THEMES[k].fr, sub: s, g: S.a.genre || 'obby', t: k })).join('')}</div>`, after: st => cards(st, 'theme', 5, 60, () => worlds(true, 1400)) },
    { say: () => 'Imagine : ton jeu est publié. Qu\'est-ce que tu veux en tirer ?', html: () => `${title('ton', 'rêve', '?')}<div class="fx-grid">${[['flag', 'Publier mon premier jeu', 'Le voir en ligne', '#14532d'], ['coin', 'Gagner mes premiers Robux', 'Une première vente', '#7a4f12'], ['trophy', 'Un jeu qui cartonne', 'Des milliers de joueurs', '#4b2a8f'], ['diamond', 'En faire mon métier', 'Créer chaque semaine', '#0e5a7a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'goal', 6, 60) },
    { say: () => 'Tu peux y consacrer combien de temps par semaine ?', html: () => `${title('ton', 'temps', '?')}<div class="fx-grid one">${[['moon', '1 à 3 heures', 'Je m\'y mets le week-end', '#3b1f7a'], ['calendar', '4 à 8 heures', 'Un rythme régulier', '#7a1f2a'], ['bolt', '10 heures et plus', 'Je m\'y consacre à fond', '#7a4f12']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'time', null, 40) },
    { say: () => 'Question de game design : qu\'est-ce qui fait qu\'un joueur revient ?', html: () => `${title('ton', 'flair', '?')}<div class="fx-grid">${[['chart', 'La progression', 'Niveaux et déblocages', '#1d3f8f'], ['gift', 'Les récompenses', 'Cadeaux du jour', '#7a1f3a'], ['friends', 'Les amis', 'Jouer en équipe', '#4b2a8f'], ['rocket', 'Tout ça à la fois', 'Le bon mélange', '#0e5a7a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`,
      after: st => cards(st, 'quiz', 8, 70, v => toast(ic(v === 'Tout ça à la fois' ? 'check-circle' : 'bulb') + (v === 'Tout ça à la fois' ? 'Bien vu : un bon jeu mélange les trois.' : 'Pas faux, mais les meilleurs jeux mélangent les trois.'), true)) },
    { say: () => 'Dis-moi ton idée en une phrase. Tape-la ou dis-la à voix haute.', html: () => `${title('ton', 'idée', 'en une phrase')}${field('v', 'textarea', 'Ex : un tycoon de glace avec des pingouins', S.a.phrase || prof.idea || '', 180)}<p class="fx-help">Pas d'idée ? Touche-en une :</p><div class="fx-chips" style="grid-template-columns:1fr">${SUGG.map(s => `<button class="fx-chip sm">${ic('wand')}${s}</button>`).join('')}</div><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Je génère mon monde</span>${ic('bolt')}</button>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'); let t = 0; const chk = () => { ok.disabled = i.value.trim().length < 6; clearTimeout(t); t = setTimeout(() => { S.a.phrase = i.value.trim(); if (S.a.phrase.length >= 6) worlds(true, 1000); }, 450); }; i.oninput = chk; ok.disabled = i.value.trim().length < 6; mic(st.querySelector('.fx-field'), i);
        $$('.fx-chip', st).forEach(c => c.onclick = () => { i.value = c.textContent; chk(); sfx.pick(); });
        ok.onclick = () => { if (ok.disabled) return; S.a.phrase = i.value.trim(); gain(80, 9); if (S.a._id) sync(); analyzeIdea().then(() => go(GEN)); }; i.focus(); } },
    { say: () => '', html: () => '', after: () => go(GEN) }, // écran compte retiré : le login se fait en pop-up pendant la génération
    { say: () => 'Je lance la construction. Regarde bien.', html: () => `<div class="fx-kick">${ic('hammer')}Génération en direct</div>${title('je construis', 'ton monde')}
      <div class="fx-gen scanning" id="gx"><div class="mas-walk" aria-hidden="true"><img class="mas-img" src="/assets/img/mascot/marche.png" width="200" height="200" alt="" decoding="async"></div><div class="fx-rays"></div><div class="fx-gfloor"></div><canvas id="gc"></canvas><div class="fx-speed"></div><div class="fx-ring" id="grg"></div><div class="fx-cd" id="gcd"></div><div class="fx-pban" id="gpb"><small></small><b></b></div><div class="fx-scan"></div><div class="fx-vgn"></div>
        <div class="fx-phase"><b id="gpn">1/5</b><span id="gpt">Initialisation</span></div>
        <div class="fx-gstats"><span>${ic('cube')}<b id="gs1">0</b> blocs</span><span>${ic('flag')}<b id="gs2">0</b> objets</span><span>${ic('code')}<b id="gs3">0</b> lignes</span></div>
        <div class="fx-term" id="gterm"><div class="fx-termh"><i></i><i></i><i></i><span>GameManager.server.lua</span></div><pre id="gtx"></pre></div>
        <div class="fx-labels" id="glab"></div><div class="fx-flash" id="gfl"></div>
        <div class="fx-stamp" id="gst"><small>Map prête</small><b></b></div></div>
      <div class="fx-bigbar"><i id="gb"></i></div>
      <div class="fx-check">${['Terrain posé', 'Décors et objets', 'Économie du jeu', 'Scripts Luau', 'Finitions et optimisation mobile'].map(t => `<div>${ic('check-circle')}${t}</div>`).join('')}</div>
      <button class="fx-skip" id="gskip" hidden>Passer l'animation ${ic('arrow-right')}</button>`,
      after: st => {
        const a = an(), pk = E.makePack(a, phrase()), blocks = E.generate(a, phrase()).blocks, gx = st.querySelector('#gx');
        const w = new E.World(st.querySelector('#gc'), { autoRotate: true, speed: .5, scale: 2.7, offsetY: .04, ghost: true, dust: true }); extra.push(w);
        w.set(blocks, a.theme, { animate: false }); w.snapReveal(0);
        const alive = () => S.i === GEN && document.body.contains(gx), sleep = ms => new Promise(r => setTimeout(r, ms));
        const ease = t => 1 - Math.pow(1 - t, 3), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const tween = (to, ms, f = ease) => new Promise(res => { const o = w.o, from = {}; for (const k in to) from[k] = o[k]; const t0 = performance.now(); const step = t => { if (!alive()) return res(); const p = Math.min(1, (t - t0) / ms), e = f(p); for (const k in to) o[k] = from[k] + (to[k] - from[k]) * e; p < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
        const rows = $$('.fx-check div', st), T0 = performance.now(), TOTAL = 16500, glowN = Math.max(6, Math.round(blocks.filter(b => b.z >= 1).length / 4));
        let lines = 0, skipped = false;
        setTimeout(() => { const sk = st.querySelector('#gskip'); if (!sk || !alive()) return; sk.hidden = false; sk.onclick = () => { if (skipped || !alive() || !S.a._id) return; skipped = true; clearInterval(tick); if ('speechSynthesis' in window) speechSynthesis.cancel(); gain(100, 12); go(RES); }; }, 7000);
        const banner = (n, t) => { const pb = st.querySelector('#gpb'); pb.querySelector('small').textContent = 'Phase ' + n + ' sur 5'; pb.querySelector('b').textContent = t; pb.classList.remove('on'); void pb.offsetWidth; pb.classList.add('on'); gx.classList.remove('jolt'); void gx.offsetWidth; gx.classList.add('jolt'); };
        const phase = (n, t) => { banner(n, t); st.querySelector('#gpn').textContent = n + '/5'; const pt = st.querySelector('#gpt'); pt.textContent = t; pt.classList.remove('swap'); void pt.offsetWidth; pt.classList.add('swap'); rows.forEach((r, k) => r.classList.toggle('on', k < n - 1)); tone(300 + n * 90, .25, 'triangle', .04); };
        const label = (txt, icn) => { const box = st.querySelector('#glab'); const e = document.createElement('span'); e.className = 'fx-lbl'; e.innerHTML = ic(icn) + txt; e.style.left = (14 + Math.random() * 62) + '%'; e.style.top = (16 + Math.random() * 50) + '%'; box.appendChild(e); setTimeout(() => e.classList.add('out'), 1900); setTimeout(() => e.remove(), 2400); sfx.pick(); };
        const tick = setInterval(() => { if (!alive()) return clearInterval(tick); const p = w.prog; st.querySelector('#gs1').textContent = Math.round(blocks.length * p); st.querySelector('#gs2').textContent = Math.round(glowN * Math.max(0, (p - .45) / .55)); st.querySelector('#gs3').textContent = lines; st.querySelector('#gb').style.width = Math.min(100, (performance.now() - T0) / TOTAL * 100) + '%'; if (w.prog < w.target) tone(140 + Math.random() * 160, .025, 'square', .015); }, 110);
        const typeCode = async () => { const pre = st.querySelector('#gtx'), src = pk.script.concat(['', '-- Boutique', 'local MarketplaceService = game:GetService("MarketplaceService")']); for (const l of src) { if (!alive()) return; const ln = document.createElement('div'); pre.appendChild(ln); for (let k = 0; k <= l.length; k += 3) { ln.textContent = l.slice(0, k); await sleep(11); } ln.innerHTML = hl(l) || '&nbsp;'; lines++; pre.scrollTop = pre.scrollHeight; } };
        (async () => {
          // 0. compte à rebours
          guideSay('Accroche-toi, on lance la construction !'); const cd = st.querySelector('#gcd');
          for (const k of ['3', '2', '1']) { if (!alive()) return; cd.textContent = k; cd.classList.remove('on'); void cd.offsetWidth; cd.classList.add('on'); tone(k === '1' ? 880 : 520, .18, 'square', .06); w.o.scale += .15; await sleep(720); }
          cd.textContent = 'GO'; cd.classList.remove('on'); void cd.offsetWidth; cd.classList.add('on', 'go'); sfx.unlock(); await sleep(500); if (!alive()) return;
          // 1. initialisation : plan holographique, caméra collée au sol
          phase(1, 'Initialisation'); guideSay('Je scanne le terrain et je trace le plan de ta map.');
          await tween({ scale: 1.9, speed: 1.4 }, 2200, io); if (!alive()) return;
          // 2. terrain : les blocs montent couche par couche, dézoom en tournant
          phase(2, 'Terrain'); gx.classList.remove('scanning'); guideSay('Je pose le terrain, couche par couche.'); w.revealTo(.5, 3.6);
          label('Zone de spawn', 'flag'); tween({ scale: 1.12, offsetY: .12, speed: 3.2 }, 3600, io); await sleep(1300); label('Zone 1', 'map'); await sleep(1300); label('Relief', 'cube'); await sleep(1000); if (!alive()) return;
          // Pendant que la map se construit : pop-up de connexion (sauf si déjà connecté).
          if (!S.a._id) { await authPopup(); if (!alive()) return; }
          // 3. décors : zoom sur un coin, objets qui tombent
          phase(3, 'Décors et objets'); guideSay('J\'ajoute les décors, les objets et les points de sauvegarde.'); w.revealTo(.84, 3.2);
          await tween({ scale: 1.75, offsetX: -.16, offsetY: .22, speed: .35 }, 1500); label('Checkpoint', 'check-circle'); await sleep(900); label('Décor', 'image'); await tween({ scale: 1.25, offsetX: .12, offsetY: .16, speed: .8 }, 1400); label('Obstacle', 'zap'); if (!alive()) return;
          // 4. économie + scripts : terminal qui s'écrit, scan
          phase(4, 'Économie et scripts'); gx.classList.add('scanning', 'coding'); guideSay('J\'écris les scripts et je prépare ta boutique.'); w.revealTo(1, 2.8);
          tween({ scale: 1.05, offsetX: -.12, offsetY: .1, speed: 1.2 }, 2800, io); label('Boutique · 4 articles', 'store'); const tc = typeCode(); await sleep(1400); label('Gamepass', 'coins'); await sleep(1400); await tc; if (!alive()) return;
          // 5. final : dézoom, vrille, flash, titre
          phase(5, 'Finitions'); gx.classList.remove('scanning', 'coding'); w.o.ghost = false; guideSay('Dernières finitions… et voilà !');
          gx.classList.add('warp'); await tween({ scale: 1.45, offsetX: 0, offsetY: .08, speed: 7 }, 900, t => t * t); await tween({ scale: .98, speed: .5 }, 1300); gx.classList.remove('warp'); if (!alive()) return;
          st.querySelector('#grg').classList.add('on');
          rows.forEach(r => r.classList.add('on')); st.querySelector('#gb').style.width = '100%';
          gx.classList.add('shake'); st.querySelector('#gfl').classList.add('on'); const stp = st.querySelector('#gst'); stp.querySelector('b').textContent = a.title; stp.classList.add('on');
          const r = gx.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); setTimeout(() => burst(r.left + r.width * .3, r.top + r.height * .4), 180); setTimeout(() => burst(r.left + r.width * .7, r.top + r.height * .45), 320); sfx.lvl();
          guideSay(`C'est prêt, ${S.a.name || 'créateur'} ! Voici ${a.title}.`);
          await sleep(2600); if (!alive()) return; clearInterval(tick); gain(100, 12); go(RES);
        })();
      } },
    { say: () => `${S.a.name}, voilà ta map. Et regarde tout le code qui l'accompagne.`, html: () => { const a = an(), th = E.THEMES[a.theme], ge = E.GENRES[a.genre];
        return `<div class="fx-res"><canvas id="rc"></canvas><span class="fx-hint">${ic('move')}Glisse pour tourner la map</span></div>${title(esc(a.title.split(' ')[0]), esc(a.title.split(' ').slice(1).join(' ')))}<div class="mas-res" aria-hidden="true"><img class="mas-img" src="/assets/img/mascot/joie.png" width="200" height="200" alt="" decoding="async"></div>
        ${(S.a.phrase || '').trim() ? `<p class="fx-idea">${ic('pen')}<span>D'après ton idée : « ${esc(S.a.phrase.trim().slice(0, 90))} »</span></p>` : ''}
        <div class="fx-rtags"><span class="fx-rtag">${ic(ge.icon)}${E.GENRES[a.genre].label}</span><span class="fx-rtag">${ic(th.icon)}${th.fr}</span><span class="fx-rtag">${ic('check-circle')}Syntaxe vérifiée</span></div>
        <div class="ide-stats" id="istats">${[['code', 'lignes de code', 'il'], ['file', 'fichiers prêts', 'if'], ['terminal', 'prompts Studio', 'ip'], ['zap', 'fonctions', 'ifn']].map(([i, l, id]) => `<div><span>${ic(i)}</span><b id="${id}">0</b><small>${l}</small></div>`).join('')}</div>
        <div class="ide" id="ide"><div class="ide-bar"><i></i><i></i><i></i><span>Bloxia Studio · ${esc(a.title.toLowerCase().replace(/\s+/g, '-'))}.rbxl</span><em id="ilive"><span class="ide-dot"></span>Généré pour toi</em></div>
          <div class="ide-body"><aside class="ide-tree" id="itree"><div class="ide-ph">Chargement…</div></aside>
            <div class="ide-main"><div class="ide-tabs" id="itabs"></div><div class="ide-editor"><div class="ide-code" id="icode"></div><div class="ide-map" id="imap"></div></div></div>
            <aside class="ide-side" id="iside"></aside></div>
          <div class="ide-status" id="istatus"></div></div>
        <button class="btn btn-gold btn-block" id="ok"><span class="lbl">Je débloque tout le code</span>${ic('lock')}</button>`; },
      after: st => {
        const a = an(), w = new E.World(st.querySelector('#rc'), { autoRotate: true, interactive: true, scale: 1.1 }); extra.push(w); w.set(E.generate(a, phrase()).blocks, a.theme, { duration: 1800 });
        st.querySelector('#ok').onclick = () => { gain(50); go(LAST); };
        const alive = () => S.i === RES && document.body.contains(st);
        const count = (el, to) => { const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString('fr-FR'); if (p < 1 && alive()) requestAnimationFrame(f); }; requestAnimationFrame(f); };
        const TYPE_ICON = { Script: 'is', LocalScript: 'il', ModuleScript: 'im' };
        const fileIcon = t => `<svg class="ide-fi ${TYPE_ICON[t] || 'is'}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5h6.500L13 5v9.500H3z"/><path d="M9.500 1.5V5H13"/>${t === 'ModuleScript' ? '<path d="M5.500 9h5M5.500 11.500h3.500"/>' : t === 'LocalScript' ? '<path d="M6 8.500l-1.500 1.500L6 11.500M10 8.500l1.500 1.500L10 11.500"/>' : '<path d="M6.500 8.500l3 1.500-3 1.500z"/>'}</svg>`;
        const fold = () => `<svg class="ide-fold" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.500h4l1.500 1.500H14v7.500H2z"/></svg>`;
        let P = null, cur = 0, typing = 0;
        const fallbackHead = '-- Aperçu indisponible pour le moment.\n-- Ton pack complet t\'attend après le paiement.';
        function tree() {
          const groups = {}; P.files.forEach((f, i) => { (groups[f.ou] = groups[f.ou] || []).push([f, i]); });
          st.querySelector('#itree').innerHTML = `<div class="ide-th">Explorer</div>` + Object.entries(groups).map(([g, fs]) => `<div class="ide-grp">${fold()}<span>${esc(g.split(' > ').pop())}</span></div>${fs.map(([f, i]) => `<button class="ide-file ${i === cur ? 'on' : ''}" data-f="${i}">${fileIcon(f.type)}<span>${esc(f.nom)}</span><em>${f.lines}</em></button>`).join('')}`).join('')
            + `<div class="ide-grp">${fold()}<span>Sur mesure</span></div><div class="ide-file locked">${ic('lock')}<span>Mécanique spéciale</span><em>après paiement</em></div>`;
          $$('.ide-file[data-f]', st).forEach(b => b.onclick = () => openFile(+b.dataset.f));
        }
        function tabs() { st.querySelector('#itabs').innerHTML = P.files.map((f, i) => `<button class="ide-tab ${i === cur ? 'on' : ''}" data-t="${i}">${fileIcon(f.type)}${esc(f.nom)}<span>.lua</span></button>`).join(''); $$('.ide-tab', st).forEach(b => b.onclick = () => openFile(+b.dataset.t)); const on = st.querySelector('.ide-tab.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
        function side(f) {
          st.querySelector('#iside').innerHTML = `<div class="ide-th">Analyse</div><div class="ide-card"><small>Rôle</small><p>${esc(f.role)}</p></div>
            <div class="ide-card"><small>Emplacement</small><p class="mono">${esc(f.ou)} › ${esc(f.nom)}</p></div>
            <div class="ide-card"><small>Fonctions (${f.functions.length})</small>${f.functions.length ? `<ul>${f.functions.map(n => `<li>${ic('zap')}<span>${esc(n)}</span></li>`).join('')}</ul>` : '<p>Réglages et données</p>'}</div>
            <div class="ide-card ok"><small>Contrôles</small><ul><li>${ic('check-circle')}Syntaxe valide</li><li>${ic('check-circle')}Commenté en français</li>${/DataStore|UpdateAsync/.test(f.head) || f.nom === 'DataManager' ? `<li>${ic('check-circle')}Sauvegarde avec réessais</li>` : ''}${f.nom === 'ShopServer' ? `<li>${ic('check-circle')}Achats accordés une seule fois</li>` : ''}${f.type === 'LocalScript' ? `<li>${ic('check-circle')}Adapté au mobile</li>` : ''}</ul></div>`;
        }
        function minimap(f) { const shown = f.head.split('\n').length; st.querySelector('#imap').innerHTML = f.widths.map((wd, i) => `<i style="width:${Math.max(4, wd / 80 * 100)}%" class="${i < shown ? 'v' : ''}"></i>`).join('') + '<span class="ide-view"></span>'; }
        function status(f) { st.querySelector('#istatus').innerHTML = `<span>${ic('check-circle')}0 erreur</span><span>Luau</span><span>${f.type}</span><span>${f.lines} lignes</span><span class="r">${P.files.length} fichiers · ${P.totalLines.toLocaleString('fr-FR')} lignes au total</span>`; }
        function openFile(i) {
          cur = i; const f = P.files[i]; tree(); tabs(); side(f); minimap(f); status(f); BX.hydrate(st);
          const box = st.querySelector('#icode'), lines = (f.head || fallbackHead).split('\n'), left = Math.max(0, f.lines - lines.length);
          box.innerHTML = ''; cancelAnimationFrame(typing); let n = 0;
          const add = () => { const chunk = Math.max(1, Math.round(lines.length / 22)); for (let k = 0; k < chunk && n < lines.length; k++, n++) box.insertAdjacentHTML('beforeend', `<div class="ln"><span>${n + 1}</span><code>${hl(lines[n]) || '&nbsp;'}</code></div>`);
            if (n < lines.length && alive()) typing = requestAnimationFrame(add);
            else if (left > 0) box.insertAdjacentHTML('beforeend', `<div class="ide-more"><div class="ide-ghost">${Array.from({ length: 6 }, (_, k) => `<div class="ln"><span>${n + k + 1}</span><code><i style="width:${30 + ((k * 37) % 55)}%"></i></code></div>`).join('')}</div><div class="ide-lock">${ic('lock')}<b>Encore ${left.toLocaleString('fr-FR')} lignes dans ce fichier</b><span>Débloque ton pack pour copier ou télécharger le script complet.</span></div></div>`); };
          add();
        }
        fetch(`/api/preview?id=${encodeURIComponent(S.a._id || '')}&token=${encodeURIComponent(S.a._t || '')}`).then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => {
          if (!alive()) return; P = d;
          count(st.querySelector('#il'), d.totalLines); count(st.querySelector('#if'), d.files.length); count(st.querySelector('#ip'), d.prompts.length); count(st.querySelector('#ifn'), d.functions);
          const core = d.files.findIndex(f => /Core$/.test(f.nom)); openFile(core >= 0 ? core : 0);
        }).catch(() => { if (!alive()) return; st.querySelector('#istats').hidden = true; st.querySelector('#itree').innerHTML = '<div class="ide-ph">Aperçu indisponible. Ton pack complet reste prêt.</div>'; st.querySelector('#icode').innerHTML = `<div class="ln"><span>1</span><code>${esc(fallbackHead)}</code></div>`; });
      } },
    { say: () => 'Choisis ta formule. L\'annuel est à \u221240 %, et tu es remboursé sous 14 jours si ça ne te va pas.',
      html: () => `<div class="fx-offer" id="ofb"><span class="fx-ofl"><span class="fx-ofg">${PA.ticket()}</span><span><small>Offre de bienvenue</small><b>−30 % sur ton 1er mois</b></span></span><span class="fx-oft"><small id="ofs">Expire dans</small><b id="oft">10:00</b></span><i class="fx-ofbar" id="ofbar"></i></div>
        <div class="pr-head">${title('débloque', esc(an().title))}<p class="fx-help">Ta map est sauvegardée. Choisis la formule qui colle à ton objectif.</p></div>
        <div class="pr-cycle" role="radiogroup" aria-label="Période de facturation"><i class="pr-thumb"></i>
          <button type="button" role="radio" data-cycle="month">Mensuel</button>
          <button type="button" role="radio" data-cycle="year">Annuel <em>−40 %</em></button></div>
        <p class="pr-trial" id="prtrial">${PA.fi('shield')}<span><b>\u221240 % sur l'annuel.</b> Satisfait ou remboursé sous 14 jours.</span></p>
        <div class="fx-plans" id="plans"><p class="fx-help">Chargement des formules…</p></div>
        <div class="pr-trust"><span>${PA.fi('shield')}Paiement sécurisé par Whop</span><span>${PA.fi('cancel')}Résiliable en un clic</span><span>${PA.fi('card')}Aucun débit pendant l'essai</span></div>
        <div class="pr-sec"><h2 class="pr-h2">Compare les formules</h2><div class="pr-table" id="prtable"></div></div>
        <div class="pr-sec"><h2 class="pr-h2">Questions sur le paiement</h2><div class="pr-faq">
          <details><summary>Et si ça ne me convient pas ?<span>${ic('chevron-down')}</span></summary><p>Tu as 14 jours pour tester ton pack. Si la map ou les scripts ne marchent pas, un message suffit : on te rembourse intégralement, sans discuter.</p></details>
          <details><summary>Je peux annuler quand je veux ?<span>${ic('chevron-down')}</span></summary><p>Oui, depuis ton compte Whop, en un clic. Tu gardes l'accès jusqu'à la fin de la période déjà payée.</p></details>
          <details><summary>Je peux changer de formule ?<span>${ic('chevron-down')}</span></summary><p>Oui, à tout moment. Le changement prend effet à la prochaine période.</p></details>
          <details><summary>J'ai moins de 18 ans, je peux m'abonner ?<span>${ic('chevron-down')}</span></summary><p>Oui, avec un parent : c'est lui qui fait le paiement, ou qui te donne son accord.</p></details>
        </div></div>
        <section class="pr-g2" aria-label="Garantie satisfait ou remboursé"><div class="pr-g2l"><img class="mas-g2" src="/assets/img/mascot/pointe.png" width="200" height="200" alt="" decoding="async"><span class="pr-g2seal">${PA.seal(BLOXIA_CONFIG.guaranteeDays)}</span><span class="pr-g2pct"><b>100 %</b><small>remboursé</small></span></div>
          <div class="pr-g2r"><span class="fx-kick" style="justify-content:flex-start">${ic('shield')}Garantie ${BLOXIA_CONFIG.guaranteeDays} jours</span><h2 class="pr-g2t">Ça ne marche pas ? <b>On te rembourse.</b></h2>
          <p class="pr-g2p">Tu as ${BLOXIA_CONFIG.guaranteeDays} jours pour tester ton pack. Zéro risque pour toi.</p>
          <ul class="pr-g2list" style="--pc:#2bd68f"><li>${PA.fi('yes')}<span><b>Ta map ne s'importe pas</b> dans Roblox Studio : remboursé.</span></li><li>${PA.fi('yes')}<span><b>Un script ne fonctionne pas</b> : on le corrige avec toi, ou remboursé.</span></li><li>${PA.fi('yes')}<span><b>Un simple message suffit</b>, remboursement intégral.</span></li></ul></div></section>
        <div class="pr-end" id="prend"><div class="pr-endh"><span class="fx-kick">${ic('rocket')}Dernière ligne droite</span><h2 class="pr-h2">Prêt à lancer <b>${esc(an().title)}</b> ?</h2><p class="fx-help" id="prendsub"></p></div><div class="pr-mini" id="prmini"></div><p class="pr-endg" style="--pc:#2bd68f">${PA.fi('shield')}<span><b>Remboursé sous ${BLOXIA_CONFIG.guaranteeDays} jours</b> si la map ou les scripts ne marchent pas.</span></p></div>`,
      after: st => {
        if (!S.a._id) { toast('Crée ton compte pour récupérer ton pack', true); setTimeout(() => go(10), 600); return; } sync();
        const eur = (n, z) => (z && n === 0 ? '0' : n.toFixed(2).replace('.', ',')) + ' €', r2 = n => Math.round(n * 100) / 100;
        const COL = { starter: '#5b9bff', essentiel: '#ffc53d', business: '#b388ff' };
        let O = null, endAt = 0, iv = 0, expired = false, cycle = 'year';
        try { cycle = localStorage.getItem('bloxia.cycle') || 'year'; } catch {}
        const calc = p => { const yr = cycle === 'year', d = expired || yr ? 0 : O.discount, full = yr ? p.annual : p.price, first = r2(full * (1 - d)), days = yr ? 365 : 30;
          return { yr, full, first, perDay: r2(first / days), strike: yr ? r2(p.price / 30) : (d ? r2(p.price / 30) : 0), save: r2(p.price * 12 - first) }; };
        const card = (p, k) => { const c = calc(p);
          const bill = c.yr ? `<p class="pr-bill"><b class="pr-now">${eur(c.full)}</b> aujourd'hui, puis chaque année. <span class="pr-guar">Remboursé sous 14 jours.</span></p>`
                             : `<p class="pr-bill">${expired ? `${eur(c.full)} par mois` : `${eur(c.first)} le 1er mois, puis ${eur(c.full)} par mois`}</p>`;
          return `<article class="fx-plan pr-card ${p.featured ? 'feat' : ''}" data-id="${p.id}" style="--pc:${COL[p.id]};--d:${k * 90}ms"><span class="pr-glare"></span>
            ${p.featured ? `<span class="fx-rib">${ic('star')}Recommandé</span>` : ''}
            <header class="pr-top"><span class="pr-emb">${PA.emblem(p.id)}</span><div><span class="pr-tag">${esc(p.tag)}</span><h3>${p.name}</h3></div></header>
            <p class="pr-purpose">${esc(p.purpose)}</p>
            <div class="pr-spec"><small>Sa spécialité</small><b>${esc(p.specialty)}</b></div>
            <div class="pr-price">${c.strike ? `<s>${eur(c.strike)}</s>` : ''}<b data-v="${c.perDay}">${eur(c.perDay)}</b><span>/ jour</span></div>
            ${bill}${c.yr ? `<p class="pr-save">${PA.fi('yes')}Tu économises ${eur(c.save)} par an</p>` : ''}
            <button class="btn ${p.featured ? 'btn-gold' : 'pr-btn'} btn-block" data-plan="${p.id}"><span class="lbl">${esc(p.cta)}</span>${ic('arrow-right')}</button>
            <p class="pr-micro">${c.yr ? 'Satisfait ou remboursé sous 14 jours' : 'Sans engagement, tu résilies en un clic'}</p>
            <ul class="pr-feats">${p.plus ? `<li class="pr-plus">${PA.fi('plus')}<span>${esc(p.plus)}</span></li>` : ''}${p.features.map(([i, t]) => `<li>${PA.fi(i)}<span>${esc(t)}</span></li>`).join('')}</ul></article>`; };
        const table = () => { const rows = [['Jeux générés par mois', ['1', '5', 'Illimité']], ['Prompts Roblox Studio et scripts Luau', [1, 1, 1]], ['Boutique avec prix conseillés', [1, 1, 1]], ['Plan de lancement', [1, 1, 1]], ['Idées de vidéos TikTok', [0, 1, 1]], ['Packs mis à jour chaque semaine', [0, 1, 1]], ['Places pour ton équipe', ['1', '1', '3']], ['Coaching en visio', [0, 0, 'Mensuel']], ['Support', ['Standard', 'Prioritaire', 'Dédié 24 h']]];
          const cell = (v, id) => `<td style="--pc:${COL[id]}">${v === 1 ? PA.fi('yes') : v === 0 ? PA.fi('no') : `<b>${v}</b>`}</td>`;
          st.querySelector('#prtable').innerHTML = `<table><thead><tr><th></th>${O.plans.map(p => `<th class="${p.featured ? 'feat' : ''}" style="--pc:${COL[p.id]}"><span class="pr-temb">${PA.emblem(p.id)}</span>${p.name}</th>`).join('')}</tr></thead><tbody>${rows.map(([l, v]) => `<tr><th>${l}</th>${v.map((x, i) => cell(x, O.plans[i].id)).join('')}</tr>`).join('')}</tbody></table>`; };
        const tilt = el => { el.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`; el.style.setProperty('--gx', (x + .5) * 100 + '%'); el.style.setProperty('--gy', (y + .5) * 100 + '%'); }); el.addEventListener('pointerleave', () => { el.style.transform = ''; }); };
        const roll = el => { const to = +el.dataset.v, t0 = performance.now(), from = to * 1.6; const f = t => { const p = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - p, 3); el.textContent = eur(r2(from + (to - from) * e)); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
        const draw = (animate) => {
          st.querySelector('.pr-cycle').dataset.on = cycle; $$('.pr-cycle button', st).forEach(b => b.setAttribute('aria-checked', b.dataset.cycle === cycle)); st.querySelector('#prtrial').classList.toggle('on', cycle === 'year');
          // L'offre −30 % ne vaut que pour le mensuel : on masque la bannière minuteur en annuel (évite 2 promos concurrentes).
          const ofb = st.querySelector('#ofb'); if (ofb) ofb.style.display = cycle === 'year' ? 'none' : '';
          st.querySelector('#plans').innerHTML = O.plans.map(card).join('');
          st.querySelector('#prendsub').textContent = cycle === 'year' ? '\u221240 % en passant à l\'année. Satisfait ou remboursé sous 14 jours.' : 'Sans engagement, résiliable en un clic.';
          st.querySelector('#prmini').innerHTML = O.plans.map(p => { const c = calc(p); return `<div class="pr-mc ${p.featured ? 'feat' : ''}" style="--pc:${COL[p.id]}"><span class="pr-mce">${PA.emblem(p.id)}</span><div class="pr-mct"><b>${p.name}</b><span>${c.strike ? `<s>${eur(c.strike)}</s>` : ''}<strong>${eur(c.perDay)}</strong> / jour</span><small>${c.yr ? eur(c.full) + ' / an' : (expired ? eur(c.full) + ' / mois' : eur(c.first) + ' le 1er mois')}</small></div><button class="btn ${p.featured ? 'btn-gold' : 'pr-btn'}" data-plan="${p.id}"><span class="lbl">Je choisis</span>${ic('arrow-right')}</button></div>`; }).join('');
          BX.hydrate(st);
          $$('.pr-card', st).forEach(tilt); if (animate) $$('.pr-price b', st).forEach(roll);
          $$('[data-plan]', st).forEach(btn => btn.onclick = async () => { const r0 = btn.getBoundingClientRect(); burst(r0.left + r0.width / 2, r0.top + r0.height / 2); $$('[data-plan]', st).forEach(x => x.disabled = true); BX.set({ done: true });
            try { const r = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ id: S.a._id, token: S.a._t, plan: btn.dataset.plan, cycle }) }).then(r => r.json()); if (r.url) location.href = r.url; else throw r; }
            catch (e) { $$('[data-plan]', st).forEach(x => x.disabled = false); BX.set({ done: false }); const d = e && (e.detail || e.error) ? ` (${e.status || ''} ${String(e.detail || e.error).slice(0, 120)})` : ''; toast('Paiement indisponible, réessaie' + d, true); } });
        };
        $$('.pr-cycle button', st).forEach(b => b.onclick = () => { if (cycle === b.dataset.cycle) return; cycle = b.dataset.cycle; try { localStorage.setItem('bloxia.cycle', cycle); } catch {} sfx.pick(); draw(true); });
        const timer = () => { const left = Math.max(0, endAt - Date.now()), m = Math.floor(left / 60000), sc = Math.floor(left / 1000) % 60, el = st.querySelector('#oft'); if (!el) return clearInterval(iv);
          el.textContent = String(m).padStart(2, '0') + ':' + String(sc).padStart(2, '0'); st.querySelector('#ofbar').style.width = (left / 600000 * 100) + '%'; st.querySelector('#ofb').classList.toggle('hot', left < 60000 && left > 0);
          if (left <= 0 && !expired) { expired = true; clearInterval(iv); const ob = st.querySelector('#ofb'); ob.classList.add('expired'); ob.querySelector('.fx-ofl b').textContent = 'Offre de bienvenue expirée'; st.querySelector('#ofs').textContent = 'Terminée'; draw(false); } };
        // Minuteur : celui du serveur (lié au compte) ; à défaut, départ gardé sur l'appareil.
        const localRemaining = ms => { let t0 = 0; try { t0 = +localStorage.getItem('bloxia.offerStart') || 0; if (!t0) { t0 = Date.now(); localStorage.setItem('bloxia.offerStart', t0); } } catch { t0 = Date.now(); } return Math.max(0, t0 + ms - Date.now()); };
        const startWith = o => { O = o; const rem = o.local ? localRemaining(o.remaining) : o.remaining; endAt = Date.now() + rem; expired = rem <= 0; draw(true); table(); timer(); if (!expired) iv = setInterval(timer, 250); else timer(); };
        fetch(`/api/offer?id=${encodeURIComponent(S.a._id)}&token=${encodeURIComponent(S.a._t)}`).then(r => { if (!r.ok) throw 0; return r.json(); }).then(startWith)
          .catch(() => fetch('/api/plans').then(r => r.json()).then(startWith).catch(() => { st.querySelector('#plans').innerHTML = '<p class="fx-err">Impossible de charger les formules. Recharge la page.</p>'; }));
      } }
  ];

  // ---------- navigation, sauvegarde ----------
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ i: S.i, a: S.a, blocs: S.blocs, items: S.items })); } catch {} const a = an(); BX.set({ name: S.a.name, step: S.i + 1, idea: S.a.phrase || prof.idea, title: S.i >= GEN ? a.title : undefined, genre: a.genre, theme: a.theme }); }
  function sync() { if (!S.a._id) return; fetch('/api/lead/update', { method: 'POST', body: JSON.stringify({ id: S.a._id, token: S.a._t, name: S.a.name, answers: Object.assign({}, S.a, { theme: S.a.theme, themeFr: E.THEMES[S.a.theme || 'grass'].fr, type: S.a.type }) }) }).catch(() => {}); }
  function go(n) { keyH = null; const cur = $('#fx-stage .fx-step'); const run = () => { S.i = Math.max(0, Math.min(STEPS.length - 1, n)); render(); grow(); window.scrollTo({ top: 0 }); }; if (cur) { cur.classList.add('out'); setTimeout(run, 170); } else run(); }
  function render() {
    extra.forEach(w => w.destroy()); extra = []; const st = STEPS[S.i], stage = $('#fx-stage'); stage.innerHTML = `<section class="fx-step">${st.html()}</section>`; BX.hydrate(stage);
    hud(); const say = st.say ? st.say() : ''; if (st.say) guideSay(say); else { clearInterval(tw); wave(false); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
    st.after && st.after(stage.firstChild); save();
  }
  // reprise
  try { const sv = JSON.parse(localStorage.getItem(KEY)); if (sv && sv.i > 0 && sv.i < 14) { S.a = sv.a || {}; S.blocs = sv.blocs || 0; S.items = sv.items || []; S.i = sv.i >= GEN ? (sv.i === LAST ? LAST : RES) : sv.i; if (S.i >= GEN && !S.a._id) S.i = 10; } } catch {}
  if (!S.a.phrase && prof.idea) S.a.phrase = prof.idea;
  shown = S.blocs; $('#fx-blocs span').textContent = S.blocs; $('#fx-lvl').textContent = 1 + Math.floor(S.blocs / 200); if (S.items.length) { $('#fx-bagn').hidden = false; $('#fx-bagn').textContent = S.items.length; } drawer();
  $('#fx-text').textContent = '';
  worlds(false); paintStart();
  function paintStart() { BX.hydrate(document); render(); grow(); }
})();
/* cubes flottants + parallaxe */
(function () {
  const box = document.getElementById('fx-cubes'); if (!box || !window.GL) return;
  const spots = [[6, 18, 64], [88, 14, 48], [12, 70, 44], [82, 62, 72], [48, 8, 30], [30, 88, 36], [94, 86, 34], [3, 44, 28], [68, 36, 26], [22, 34, 22]];
  box.innerHTML = spots.map(([x, y, s], k) => `<span class="${s < 32 ? 'far' : ''}" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;--t:${10 + k * 1.7}s;animation-delay:-${k * 1.3}s">${GL('cube')}</span>`).join('');
  addEventListener('pointermove', e => { box.style.setProperty('--px', (e.clientX / innerWidth - .5) * -24 + 'px'); box.style.setProperty('--py', (e.clientY / innerHeight - .5) * -18 + 'px'); }, { passive: true });
})();
