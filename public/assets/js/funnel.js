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
  const ITEMS = { 4: ['map', 'Plan de la map'], 5: ['sun', 'Palette du monde'], 6: ['target', 'Objectif'], 8: ['medal', 'Badge game design'], 9: ['terminal', 'Prompt maître'], 11: ['code', 'Scripts Luau'], 12: ['key', 'Accès à ton espace'] };
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

  // ---------- mondes 3D ----------
  let extra = [];
  const theme = a => { const t = E.THEMES[a.theme]; root.style.setProperty('--sky1', t.sky[0]); root.style.setProperty('--sky2', t.sky[1]); root.style.setProperty('--glow', t.glow); };
  const bg = new E.World($('#fx-bg'), { autoRotate: true, speed: .4, scale: 1.15, offsetY: .12 }), mini = new E.World($('#fx-mini'), { autoRotate: true, scale: 1.2, offsetY: .04 });
  function worlds(animate, ms) {
    const a = an(); theme(a); const g = E.generate(a, phrase()); const g2 = E.generate(a, phrase());
    bg.set(g.blocks, a.theme, animate ? { duration: ms || 1600 } : { animate: false }); mini.set(g2.blocks, a.theme, animate ? { duration: ms || 1600 } : { animate: false });
    if (!animate) { const p = Math.max(.2, Math.min(1, S.i / 10)); bg.snapReveal(p); mini.snapReveal(p); } return g.blocks.length;
  }
  const grow = () => { const p = Math.max(.2, Math.min(1, S.i / 10)); bg.reveal(p); mini.reveal(p); };
  function thumb(cv, genre, th, ang, hoverSpin) {
    const w = new E.World(cv, { autoRotate: true, scale: 1.45, offsetY: .08, speed: 1.4 }); const a = { genre, theme: th };
    w.set(E.generate(a, genre + th).blocks, th, { animate: false }); w.still(ang || .7); extra.push(w);
    if (hoverSpin) { const c = cv.closest('.fx-card'); if (c) { c.addEventListener('pointerenter', () => { w.paused = false; }); c.addEventListener('pointerleave', () => { w.paused = true; }); } } return w;
  }

  // ---------- HUD ----------
  let shown = 0;
  function setBlocs(n) { const el = $('#fx-blocs span'); const from = shown; shown = n; const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 600); el.textContent = Math.round(from + (n - from) * p); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
  function gain(n, itemKey) {
    const l0 = 1 + Math.floor(S.blocs / 200); S.blocs += n; setBlocs(S.blocs); const l1 = 1 + Math.floor(S.blocs / 200);
    if (l1 > l0) { $('#fx-lvl').textContent = l1; const L = $('#fx-lvl'); L.classList.remove('up'); void L.offsetWidth; L.classList.add('up'); setTimeout(() => toast(ic('star') + 'Niveau ' + l1 + ' !'), 500); sfx.lvl(); }
    const it = ITEMS[itemKey]; if (it && !S.items.includes(itemKey)) { S.items.push(itemKey); const b = $('#fx-bagn'); b.hidden = false; b.textContent = S.items.length; setTimeout(() => { toast(ic(it[0]) + 'Objet débloqué : ' + it[1]); sfx.unlock(); }, 350); } else sfx.pick();
    drawer();
  }
  function drawer() { $('#fx-items').innerHTML = S.items.length ? S.items.map(k => `<div class="fx-li"><span class="fx-ci">${ic(ITEMS[k][0])}</span><div><b>${ITEMS[k][1]}</b><small>Débloqué</small></div></div>`).join('') : '<p class="fx-empty">Rien pour l\'instant. Réponds aux questions pour débloquer des objets.</p>'; }
  function hud() {
    const on = S.i >= 1; $('#fx-hud').hidden = !on; $('#fx-guide').hidden = !on; $('#fx-minibox').hidden = !on; $('#fx-stage').className = 'fx-stage' + (S.i === 0 ? ' s0' : '');
    $('#fx-pbar').style.width = Math.min(100, S.i / 13 * 100) + '%'; $('#fx-back').style.visibility = (S.i > 1 && S.i < 10) ? 'visible' : 'hidden';
    const n = Math.round(S.i / 13 * 5); $('#fx-stars').innerHTML = [0, 1, 2, 3, 4].map(k => ic('star', k < n ? 'on' : '')).join('');
    const g = G(); root.style.setProperty('--gc', g.c); $('#fx-av').innerHTML = AV.svg(g.id); $('#fx-gname').textContent = g.name;
  }
  $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off');
  $('#fx-snd').onclick = () => { S.snd = !S.snd; try { localStorage.setItem('bloxia.snd', S.snd ? '1' : '0'); } catch {} $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off'); if (!S.snd) { speechSynthesis && speechSynthesis.cancel(); wave(false); } else sfx.pick(); };
  $('#fx-bag').onclick = () => $('#fx-drawer').classList.toggle('open'); $('#fx-dclose').onclick = () => $('#fx-drawer').classList.remove('open');
  $('#fx-back').onclick = () => { if (S.i > 1 && S.i < 10) go(S.i - 1); };

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
  const card = (o) => `<button class="fx-card ${o.cls || ''}" data-v="${esc(o.v)}" ${o.g ? `style="--c1:${E.THEMES[o.t || 'grass'].sky[0]};--c2:${E.THEMES[o.t || 'grass'].sky[1]}"` : `style="--c1:${o.c1 || '#1d2a52'};--c2:#0a0d18;--cc:${o.cc || 'rgba(255,197,61,.18)'}"`}>${o.g ? `<canvas data-g="${o.g}" data-t="${o.t}"></canvas>` : `<span class="fx-bigi">${ic(o.icon)}</span>`}<span class="fx-ci">${ic(o.icon)}</span>${o.tag ? `<span class="fx-tag">${o.tag}</span>` : ''}<span class="fx-ct"><b>${esc(o.title)}</b><small>${esc(o.sub || '')}</small></span></button>`;
  function cards(stage, key, itemKey, gainN, after) {
    $$('canvas[data-g]', stage).forEach(c => thumb(c, c.dataset.g, c.dataset.t, .7, true));
    $$('.fx-card', stage).forEach(b => b.onclick = () => { $$('.fx-card', stage).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); S.a[key] = b.dataset.v; after && after(b.dataset.v); gain(gainN || 50, itemKey); setTimeout(() => go(S.i + 1), 420); });
  }
  const title = (a, b, c) => `<h1 class="fx-title">${a} <b>${b}</b> ${c || ''}</h1>`;
  const hl = line => line.replace(/(--.*$)|("[^"]*")|\b(local|function|end|if|then|for|do|return)\b|\b(\d+)\b|([<>&])/g, (m, c, s, k, n) => c ? `<span class="c">${esc(c)}</span>` : s ? `<span class="s">${esc(s)}</span>` : k ? `<span class="k">${k}</span>` : n ? `<span class="n">${n}</span>` : esc(m));

  // ---------- écrans ----------
  const STEPS = [
    { // 0 : choix du guide
      say: null, html: () => `<div class="fx-kick">${ic('gamepad')}Nouvelle partie</div>${title('choisis', 'ton guide')}
        <div class="fx-pcard" id="pc"><canvas></canvas><div id="pav"></div><div class="fx-pinfo"><h2 id="pn"></h2><span class="fx-role" id="pr"></span><span class="fx-quote" id="pq"></span></div></div>
        <div class="fx-picks">${GUIDES.map(g => `<button class="fx-pick" data-id="${g.id}"><span class="fx-av" style="--gc:${g.c}">${AV.svg(g.id)}</span>${g.name}</button>`).join('')}</div>
        <button class="btn btn-gold btn-block" id="go0"><span class="lbl"></span>${ic('arrow-right')}</button><p class="fx-foot">3 minutes · gratuit</p>`,
      after: st => {
        let w; const show = id => { S.a.guide = id; const g = G(); st.querySelector('#pc').style.cssText = `--gc:${g.c};--gc2:${g.c2}`; st.querySelector('#pav').innerHTML = AV.svg(g.id); st.querySelector('#pn').textContent = g.name; st.querySelector('#pr').textContent = g.role; st.querySelector('#pq').textContent = g.quote; st.querySelector('#go0 .lbl').textContent = 'Partir avec ' + g.name;
          $$('.fx-pick', st).forEach(b => { b.classList.toggle('sel', b.dataset.id === id); b.style.setProperty('--gc', GUIDES.find(x => x.id === b.dataset.id).c); }); root.style.setProperty('--gc', g.c);
          if (w) { w.destroy(); extra = extra.filter(x => x !== w); } w = thumb(st.querySelector('#pc canvas'), g.genre, g.theme, .9, false); w.paused = false; sfx.pick(); };
        $$('.fx-pick', st).forEach(b => b.onclick = () => show(b.dataset.id)); show(S.a.guide || 'pixel');
        st.querySelector('#go0').onclick = () => { gain(0); S.snd && tone(660, .1); go(1); };
      } },
    { say: () => 'On commence simple : c\'est quoi ton blaze de créateur ?', html: () => `${title('ton', 'blaze', '?')}${field('v', 'input', 'Ton blaze', S.a.name, 24)}<p class="fx-help">Pas d'idée ? Touche un blaze :</p><div class="fx-chips">${['BlockMaster', 'NightBuilder', 'PixelKing', 'Le Boss'].map(n => `<button class="fx-chip">${n}</button>`).join('')}</div><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Valider</span></button>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'), chk = () => ok.disabled = i.value.trim().length < 2; i.oninput = chk; chk(); mic(st.querySelector('.fx-field'), i); $$('.fx-chip', st).forEach(c => c.onclick = () => { i.value = c.textContent; chk(); sfx.pick(); }); const done = () => { if (ok.disabled) return; S.a.name = i.value.trim(); gain(50); go(2); }; ok.onclick = done; i.onkeydown = e => { if (e.key === 'Enter') done(); }; i.focus(); } },
    { say: () => `Enchanté ${S.a.name}. Tu as quel âge ?`, html: () => `${title('ton', 'âge', '?')}<div class="fx-grid">${[['user', 'Moins de 13 ans', '#2a3f8f'], ['gamepad', '13 à 17 ans', '#5b2a8f'], ['laptop', '18 à 24 ans', '#8f2a5b'], ['crown', '25 ans et plus', '#8f6a2a']].map(([i, t, c]) => card({ v: t, icon: i, title: t, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'age', null, 40) },
    { say: () => 'Tu connais déjà Roblox Studio ?', html: () => `${title('ton', 'niveau', '?')}<div class="fx-grid one">${[['cube', 'Jamais ouvert', 'Je pars de zéro, et c\'est très bien', '#1d4a8f'], ['hammer', 'Je bidouille', 'Je sais poser quelques blocs', '#5b2a8f'], ['code', 'Je script déjà', 'Le Luau n\'a pas de secret pour moi', '#8f2a3a']].map(([i, t, s, c]) => card({ v: t, icon: i, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'xp', null, 40) },
    { say: () => 'Dans quel genre de jeu tu te vois ?', html: () => `${title('ton', 'style', '?')}<div class="fx-grid">${GENRES.map(([k, n, s, i]) => card({ v: k, icon: i, title: n, sub: s, g: k, t: ({ obby: 'grass', tycoon: 'island', simulator: 'space', horror: 'horror', td: 'snow', rp: 'city' })[k] })).join('')}</div>`, after: st => cards(st, 'genre', 4, 60, v => { S.a.type = GENRES.find(g => g[0] === v)[1]; worlds(true, 1200); }) },
    { say: () => 'Et il se passe dans quel monde ?', html: () => `${title('ton', 'monde', '?')}<div class="fx-grid">${THEMES.map(([k, s]) => card({ v: k, icon: E.THEMES[k].icon, title: E.THEMES[k].fr, sub: s, g: S.a.genre || 'obby', t: k })).join('')}</div>`, after: st => cards(st, 'theme', 5, 60, () => worlds(true, 1400)) },
    { say: () => 'Imagine : ton jeu est publié. Qu\'est-ce que tu veux en tirer ?', html: () => `${title('ton', 'rêve', '?')}<div class="fx-grid">${[['flag', 'Publier mon premier jeu', 'Le voir en ligne', '#1d4a8f'], ['coins', 'Gagner mes premiers Robux', 'Une première vente', '#8f6a2a'], ['trophy', 'Un jeu qui cartonne', 'Des milliers de joueurs', '#5b2a8f'], ['crown', 'En faire mon métier', 'Créer chaque semaine', '#8f2a5b']].map(([i, t, s, c]) => card({ v: t, icon: i, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'goal', 6, 60) },
    { say: () => 'Tu peux y consacrer combien de temps par semaine ?', html: () => `${title('ton', 'temps', '?')}<div class="fx-grid one">${[['clock', '1 à 3 heures', 'Je m\'y mets le week-end', '#1d4a8f'], ['clock', '4 à 8 heures', 'Un rythme régulier', '#5b2a8f'], ['clock', '10 heures et plus', 'Je m\'y consacre à fond', '#8f2a3a']].map(([i, t, s, c]) => card({ v: t, icon: i, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'time', null, 40) },
    { say: () => 'Question de game design : qu\'est-ce qui fait qu\'un joueur revient ?', html: () => `${title('ton', 'flair', '?')}<div class="fx-grid">${[['chart', 'La progression', 'Niveaux et déblocages', '#1d4a8f'], ['gift', 'Les récompenses', 'Cadeaux du jour', '#8f6a2a'], ['users', 'Les amis', 'Jouer en équipe', '#5b2a8f'], ['zap', 'Tout ça à la fois', 'Le bon mélange', '#8f2a5b']].map(([i, t, s, c]) => card({ v: t, icon: i, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`,
      after: st => cards(st, 'quiz', 8, 70, v => toast(ic(v === 'Tout ça à la fois' ? 'check-circle' : 'bulb') + (v === 'Tout ça à la fois' ? 'Bien vu : un bon jeu mélange les trois.' : 'Pas faux, mais les meilleurs jeux mélangent les trois.'), true)) },
    { say: () => 'Dis-moi ton idée en une phrase. Tape-la ou dis-la à voix haute.', html: () => `${title('ton', 'idée', 'en une phrase')}${field('v', 'textarea', 'Ex : un tycoon de glace avec des pingouins', S.a.phrase || prof.idea || '', 180)}<p class="fx-help">Pas d'idée ? Touche-en une :</p><div class="fx-chips" style="grid-template-columns:1fr">${SUGG.map(s => `<button class="fx-chip sm">${ic('wand')}${s}</button>`).join('')}</div><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Générer mon monde</span>${ic('bolt')}</button>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'); let t = 0; const chk = () => { ok.disabled = i.value.trim().length < 6; clearTimeout(t); t = setTimeout(() => { S.a.phrase = i.value.trim(); if (S.a.phrase.length >= 6) worlds(true, 1000); }, 450); }; i.oninput = chk; ok.disabled = i.value.trim().length < 6; mic(st.querySelector('.fx-field'), i);
        $$('.fx-chip', st).forEach(c => c.onclick = () => { i.value = c.textContent; chk(); sfx.pick(); });
        ok.onclick = () => { if (ok.disabled) return; S.a.phrase = i.value.trim(); gain(80, 9); go(10); }; i.focus(); } },
    { say: () => 'Je construis ton monde… ne bouge pas.', html: () => `<div class="fx-kick">${ic('hammer')}Génération</div>${title('je construis', 'ton monde')}<div class="fx-gen"><canvas id="gc"></canvas></div><div class="fx-bigbar"><i id="gb"></i></div><div class="fx-count" id="gn">0 blocs posés</div>
      <div class="fx-check">${['Terrain posé', 'Décors et objets', 'Économie du jeu', 'Scripts Luau', 'Boutique et prix'].map(t => `<div>${ic('check-circle')}${t}</div>`).join('')}</div>`,
      after: st => { const a = an(), w = new E.World(st.querySelector('#gc'), { autoRotate: true, speed: 1.2, scale: 1.05 }); extra.push(w); const blocks = E.generate(a, phrase()).blocks; let done = false;
        w.set(blocks, a.theme, { duration: 6500, done: () => { if (!done) { done = true; clearInterval(iv); gain(100, 11); setTimeout(() => go(11), 400); } } });
        const rows = $$('.fx-check div', st), iv = setInterval(() => { const p = Math.min(1, w.prog); st.querySelector('#gb').style.width = p * 100 + '%'; st.querySelector('#gn').textContent = Math.round(blocks.length * p) + ' blocs posés'; rows.forEach((r, k) => r.classList.toggle('on', p >= (k + 1) / 5 - .03)); }, 120); } },
    { say: () => `${S.a.name}, voilà ta map. Et regarde ce que tu reçois avec.`, html: () => { const a = an(), p = E.makePack(a, phrase()), th = E.THEMES[a.theme], ge = E.GENRES[a.genre];
        return `<div class="fx-res"><canvas id="rc"></canvas><span class="fx-hint">${ic('move')}Glisse pour tourner la map</span></div>${title(esc(a.title.split(' ')[0]), esc(a.title.split(' ').slice(1).join(' ')))}
        <div class="fx-rtags"><span class="fx-rtag">${ic(ge.icon)}${E.GENRES[a.genre].label}</span><span class="fx-rtag">${ic(th.icon)}${th.fr}</span><span class="fx-rtag">${ic('unlock')}2 éléments débloqués sur 5</span></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('terminal')}${p.prompts[0].title}<span>DÉBLOQUÉ</span></div><div class="fx-pkb"><div class="code" style="white-space:pre-wrap">${esc(p.prompts[0].text)}</div><button class="fx-copy" id="cp">${ic('copy')}<span>Copier le prompt</span></button></div></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('code')}${p.scriptName}<span class="lk">${ic('lock')}</span></div><div class="fx-pkb"><div class="code">${p.script.map(hl).join('\n')}</div><div class="fx-lw"><div class="code blur" style="margin-top:6px">${esc(p.fake)}</div><div class="fx-lockov">${ic('lock')}Le script complet est dans ton pack</div></div></div></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('coins')}Boutique<span class="lk">${ic('lock')}</span></div><div class="fx-pkb"><div class="fx-shop">${p.shop.map((s, i) => `<div class="fx-it"><div><b>${esc(s.name)}</b><small>${s.type}</small></div>${i ? '<span class="fx-price blur">R$ 000</span>' : `<span class="fx-price">${s.price}</span>`}</div>`).join('')}</div></div></div>
        <button class="btn btn-gold btn-block" id="ok"><span class="lbl">Débloquer mon pack</span>${ic('lock')}</button>`; },
      after: st => { const a = an(), w = new E.World(st.querySelector('#rc'), { autoRotate: true, interactive: true, scale: 1.1 }); extra.push(w); w.set(E.generate(a, phrase()).blocks, a.theme, { duration: 1800 }); const p = E.makePack(a, phrase());
        st.querySelector('#cp').onclick = e => { navigator.clipboard && navigator.clipboard.writeText(p.prompts[0].text).catch(() => {}); e.currentTarget.querySelector('span').textContent = 'Copié'; sfx.pick(); }; st.querySelector('#ok').onclick = () => { gain(50); go(12); }; } },
    { say: () => 'Laisse-moi ton e-mail : tu retrouveras ton pack dans ton espace.', html: () => `${title('ton', 'e-mail', '?')}${field('v', 'input', 'toi@mail.com', S.a.email, 120).replace('class="fx-mic"', 'class="fx-mic" hidden')}<button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Continuer</span>${ic('arrow-right')}</button><p class="fx-foot">${ic('shield')} Pas de spam. Tu peux te désinscrire à tout moment.</p>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'); i.type = 'email'; const chk = () => ok.disabled = !/^\S+@\S+\.\S+$/.test(i.value.trim()); i.oninput = chk; chk();
        const done = async () => { if (ok.disabled) return; ok.disabled = true; S.a.email = i.value.trim(); try { const r = await fetch('/api/lead', { method: 'POST', body: JSON.stringify({ name: S.a.name, email: S.a.email, answers: Object.assign({}, S.a, { theme: E.THEMES[S.a.theme || 'grass'].fr, genreKey: S.a.genre }) }) }).then(r => r.json()); S.a._id = r.id; S.a._t = r.token; gain(60, 12); go(13); } catch { toast('Erreur réseau, réessaie', true); ok.disabled = false; } };
        ok.onclick = done; i.onkeydown = e => { if (e.key === 'Enter') done(); }; i.focus(); } },
    { say: () => 'Dernière étape : récupère ton pack complet.', html: () => { const a = an(); return `<div class="fx-kick">${ic('gift')}Ton pack est prêt</div>${title(esc(a.title.split(' ')[0]), esc(a.title.split(' ').slice(1).join(' ')))}
        <div class="fx-list">${[['terminal', '4 prompts Roblox Studio', 'Ta map se construit, étape par étape'], ['code', '3 scripts Luau', 'Gameplay, sauvegarde, boutique'], ['coins', '4 achats à vendre', 'Quoi vendre et à quel prix'], ['image', 'Brief icône et miniatures', 'Des visuels qui font cliquer'], ['video', '3 vidéos TikTok', 'Pour tes premiers joueurs'], ['calendar', 'Plan de la semaine 2', 'Pour que tes joueurs reviennent']].map(([i, t, s]) => `<div class="fx-li"><span class="fx-ci">${ic(i)}</span><div><b>${t}</b><small>${s}</small></div></div>`).join('')}</div>
        <button class="btn btn-gold btn-block" id="pay"><span class="lbl">Construire ${esc(a.title)}</span>${ic('arrow-right')}</button><div class="fx-gar">${ic('shield')}Remboursé sous ${BLOXIA_CONFIG.guaranteeDays} jours si la map ou les scripts ne marchent pas</div><p class="fx-foot">Paiement sécurisé par Whop</p>`; },
      after: st => { st.querySelector('#pay').onclick = async e => { const b = e.currentTarget; b.disabled = true; BX.set({ done: true }); try { const r = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ id: S.a._id, token: S.a._t }) }).then(r => r.json()); if (r.url) location.href = r.url; else throw 0; } catch { b.disabled = false; BX.set({ done: false }); toast('Paiement indisponible, réessaie', true); } }; } }
  ];

  // ---------- navigation, sauvegarde ----------
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ i: S.i, a: S.a, blocs: S.blocs, items: S.items })); } catch {} const a = an(); BX.set({ name: S.a.name, step: S.i + 1, idea: S.a.phrase || prof.idea, title: S.i >= 10 ? a.title : undefined, genre: a.genre, theme: a.theme }); }
  function go(n) { S.i = Math.max(0, Math.min(STEPS.length - 1, n)); render(); grow(); window.scrollTo({ top: 0 }); }
  function render() {
    extra.forEach(w => w.destroy()); extra = []; const st = STEPS[S.i], stage = $('#fx-stage'); stage.innerHTML = `<section class="fx-step">${st.html()}</section>`; BX.hydrate(stage);
    hud(); const say = st.say ? st.say() : ''; if (st.say) guideSay(say); else { clearInterval(tw); wave(false); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
    st.after && st.after(stage.firstChild); save();
  }
  // reprise
  try { const sv = JSON.parse(localStorage.getItem(KEY)); if (sv && sv.i > 0 && sv.i < 14) { S.a = sv.a || {}; S.blocs = sv.blocs || 0; S.items = sv.items || []; S.i = sv.i >= 10 ? 11 : sv.i; } } catch {}
  if (!S.a.phrase && prof.idea) S.a.phrase = prof.idea;
  shown = S.blocs; $('#fx-blocs span').textContent = S.blocs; $('#fx-lvl').textContent = 1 + Math.floor(S.blocs / 200); if (S.items.length) { $('#fx-bagn').hidden = false; $('#fx-bagn').textContent = S.items.length; } drawer();
  $('#fx-text').textContent = '';
  worlds(false); paintStart();
  function paintStart() { BX.hydrate(document); render(); grow(); }
})();
