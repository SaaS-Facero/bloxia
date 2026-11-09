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
    const on = S.i >= 1; $('#fx-hud').hidden = !on; $('#fx-guide').hidden = !on; $('#fx-minibox').hidden = !on || S.i === GEN; $('#fx-stage').className = 'fx-stage' + (S.i === 0 ? ' s0' : '');
    $('#fx-pbar').style.width = Math.min(100, S.i / LAST * 100) + '%'; $('#fx-back').style.visibility = (S.i > 1 && S.i < GEN) ? 'visible' : 'hidden';
    const n = Math.round(S.i / LAST * 5); $('#fx-stars').innerHTML = [0, 1, 2, 3, 4].map(k => ic('star', k < n ? 'on' : '')).join('');
    const g = G(); root.style.setProperty('--gc', g.c); $('#fx-av').innerHTML = AV.svg(g.id); $('#fx-gname').textContent = g.name;
  }
  $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off');
  $('#fx-snd').onclick = () => { S.snd = !S.snd; try { localStorage.setItem('bloxia.snd', S.snd ? '1' : '0'); } catch {} $('#fx-snd').innerHTML = ic(S.snd ? 'volume' : 'volume-off'); if (!S.snd) { speechSynthesis && speechSynthesis.cancel(); wave(false); } else sfx.pick(); };
  $('#fx-bag').onclick = () => $('#fx-drawer').classList.toggle('open'); $('#fx-dclose').onclick = () => $('#fx-drawer').classList.remove('open');
  $('#fx-back').onclick = () => { if (S.i > 1 && S.i < GEN) go(S.i - 1); };

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
    { say: () => `On fait connaissance, ${S.a.name}. Tu as quel âge ?`, html: () => `${title('ton', 'âge', '?')}<div class="fx-grid">${[['cube', 'Moins de 13 ans', 'Je découvre', '#1d3f8f'], ['gamepad', '13 à 17 ans', 'Gamer confirmé', '#4b2a8f'], ['laptop', '18 à 24 ans', 'Prêt à créer', '#0e5a7a'], ['crown', '25 ans et plus', 'Je vise loin', '#7a4f12']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'age', null, 40) },
    { say: () => 'Tu connais déjà Roblox Studio ?', html: () => `${title('ton', 'niveau', '?')}<div class="fx-grid one">${[['sprout', 'Jamais ouvert', 'Je pars de zéro, et c\'est très bien', '#14532d'], ['hammer', 'Je bidouille', 'Je sais poser quelques blocs', '#4b2a8f'], ['code', 'Je script déjà', 'Le Luau n\'a pas de secret pour moi', '#0f3b5a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'xp', null, 40) },
    { say: () => 'Dans quel genre de jeu tu te vois ?', html: () => `${title('ton', 'style', '?')}<div class="fx-grid">${GENRES.map(([k, n, s, i]) => card({ v: k, icon: i, title: n, sub: s, g: k, t: ({ obby: 'grass', tycoon: 'island', simulator: 'space', horror: 'horror', td: 'snow', rp: 'city' })[k] })).join('')}</div>`, after: st => cards(st, 'genre', 4, 60, v => { S.a.type = GENRES.find(g => g[0] === v)[1]; worlds(true, 1200); }) },
    { say: () => 'Et il se passe dans quel monde ?', html: () => `${title('ton', 'monde', '?')}<div class="fx-grid">${THEMES.map(([k, s]) => card({ v: k, icon: E.THEMES[k].icon, title: E.THEMES[k].fr, sub: s, g: S.a.genre || 'obby', t: k })).join('')}</div>`, after: st => cards(st, 'theme', 5, 60, () => worlds(true, 1400)) },
    { say: () => 'Imagine : ton jeu est publié. Qu\'est-ce que tu veux en tirer ?', html: () => `${title('ton', 'rêve', '?')}<div class="fx-grid">${[['flag', 'Publier mon premier jeu', 'Le voir en ligne', '#14532d'], ['coin', 'Gagner mes premiers Robux', 'Une première vente', '#7a4f12'], ['trophy', 'Un jeu qui cartonne', 'Des milliers de joueurs', '#4b2a8f'], ['diamond', 'En faire mon métier', 'Créer chaque semaine', '#0e5a7a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`, after: st => cards(st, 'goal', 6, 60) },
    { say: () => 'Tu peux y consacrer combien de temps par semaine ?', html: () => `${title('ton', 'temps', '?')}<div class="fx-grid one">${[['moon', '1 à 3 heures', 'Je m\'y mets le week-end', '#3b1f7a'], ['calendar', '4 à 8 heures', 'Un rythme régulier', '#7a1f2a'], ['bolt', '10 heures et plus', 'Je m\'y consacre à fond', '#7a4f12']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's big' })).join('')}</div>`, after: st => cards(st, 'time', null, 40) },
    { say: () => 'Question de game design : qu\'est-ce qui fait qu\'un joueur revient ?', html: () => `${title('ton', 'flair', '?')}<div class="fx-grid">${[['chart', 'La progression', 'Niveaux et déblocages', '#1d3f8f'], ['gift', 'Les récompenses', 'Cadeaux du jour', '#7a1f3a'], ['friends', 'Les amis', 'Jouer en équipe', '#4b2a8f'], ['rocket', 'Tout ça à la fois', 'Le bon mélange', '#0e5a7a']].map(([g, t, s, c]) => card({ v: t, gl: g, title: t, sub: s, c1: c, cls: 's' })).join('')}</div>`,
      after: st => cards(st, 'quiz', 8, 70, v => toast(ic(v === 'Tout ça à la fois' ? 'check-circle' : 'bulb') + (v === 'Tout ça à la fois' ? 'Bien vu : un bon jeu mélange les trois.' : 'Pas faux, mais les meilleurs jeux mélangent les trois.'), true)) },
    { say: () => 'Dis-moi ton idée en une phrase. Tape-la ou dis-la à voix haute.', html: () => `${title('ton', 'idée', 'en une phrase')}${field('v', 'textarea', 'Ex : un tycoon de glace avec des pingouins', S.a.phrase || prof.idea || '', 180)}<p class="fx-help">Pas d'idée ? Touche-en une :</p><div class="fx-chips" style="grid-template-columns:1fr">${SUGG.map(s => `<button class="fx-chip sm">${ic('wand')}${s}</button>`).join('')}</div><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Générer mon monde</span>${ic('bolt')}</button>`,
      after: st => { const i = st.querySelector('#v'), ok = st.querySelector('#ok'); let t = 0; const chk = () => { ok.disabled = i.value.trim().length < 6; clearTimeout(t); t = setTimeout(() => { S.a.phrase = i.value.trim(); if (S.a.phrase.length >= 6) worlds(true, 1000); }, 450); }; i.oninput = chk; ok.disabled = i.value.trim().length < 6; mic(st.querySelector('.fx-field'), i);
        $$('.fx-chip', st).forEach(c => c.onclick = () => { i.value = c.textContent; chk(); sfx.pick(); });
        ok.onclick = () => { if (ok.disabled) return; S.a.phrase = i.value.trim(); gain(80, 9); if (S.a._id) { sync(); go(GEN); } else go(10); }; i.focus(); } },
    { say: () => `Ta map est prête à naître, ${S.a.name}. Pour la sauvegarder et me souvenir de toi, j'ai juste besoin de ton e-mail et d'un mot de passe.`, html: () => S.a._id ? `<div class="fx-acc">${GL('key', 'xl')}</div>${title('compte', 'créé')}<p class="fx-help">Connecté avec ${esc(S.a.email || '')}.</p><button class="btn btn-gold btn-block" id="ok"><span class="lbl">Continuer</span>${ic('arrow-right')}</button>` :
      `<div class="fx-acc">${GL('lock', 'xl')}</div>${title('on sauvegarde ta', 'map')}<p class="fx-help" id="sub">Pour se souvenir de toi, on a besoin de :</p>
      <form class="fx-form" id="acc" novalidate><label class="fx-lab" for="em">E-mail</label><div class="fx-inp">${ic('mail')}<input id="em" type="email" inputmode="email" autocomplete="email" placeholder="toi@mail.com" value="${esc(S.a.email || '')}"></div>
      <label class="fx-lab" for="pw">Mot de passe</label><div class="fx-inp">${ic('lock')}<input id="pw" type="password" autocomplete="new-password" placeholder="Ton mot de passe"><button type="button" class="fx-eye" id="eye" aria-label="Afficher le mot de passe">${ic('eye')}</button></div>
      <p class="fx-err" id="err" role="alert"></p><button class="btn btn-gold btn-block" id="ok" disabled><span class="lbl">Sauvegarder et générer</span>${ic('arrow-right')}</button></form>
      <p class="fx-foot"><span id="swt">Déjà un compte ?</span> <button type="button" class="fx-link" id="sw">Se connecter</button></p><p class="fx-foot fx-safe">${ic('shield')}Tes infos restent privées. Zéro spam.</p>`,
      after: st => {
        const ok = st.querySelector('#ok'); if (S.a._id) { ok.onclick = () => { sync(); go(GEN); }; return; }
        let mode = 'signup'; const em = st.querySelector('#em'), pw = st.querySelector('#pw'), err = st.querySelector('#err');
        const chk = () => { ok.disabled = !/^\S+@\S+\.\S+$/.test(em.value.trim()) || !pw.value; err.textContent = ''; }; em.oninput = chk; pw.oninput = chk; chk();
        st.querySelector('#eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
        const setMode = m => { mode = m; st.querySelector('.fx-title').innerHTML = m === 'login' ? 'content de te <b>revoir</b>' : 'on sauvegarde ta <b>map</b>'; st.querySelector('#sub').textContent = m === 'login' ? 'Connecte-toi pour sauvegarder ta map :' : 'Pour se souvenir de toi, on a besoin de :'; st.querySelector('#ok .lbl').textContent = m === 'login' ? 'Me connecter et générer' : 'Sauvegarder et générer'; st.querySelector('#swt').textContent = m === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'; st.querySelector('#sw').textContent = m === 'login' ? 'Créer un compte' : 'Se connecter'; pw.autocomplete = m === 'login' ? 'current-password' : 'new-password'; err.textContent = ''; };
        st.querySelector('#sw').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
        st.querySelector('#acc').onsubmit = async e => { e.preventDefault(); if (ok.disabled) return; ok.disabled = true;
          try { const res = await fetch('/api/' + mode, { method: 'POST', body: JSON.stringify({ email: em.value.trim(), password: pw.value, name: S.a.name, answers: S.a }) }); const r = await res.json();
            if (res.status === 401) { err.textContent = r.error === 'exists' ? 'Un compte existe déjà avec cet e-mail. Vérifie ton mot de passe ou connecte-toi.' : 'E-mail ou mot de passe incorrect.'; if (r.error === 'exists') setMode('login'); ok.disabled = false; return; }
            if (!res.ok) throw 0; S.a._id = r.id; S.a._t = r.token; S.a.email = em.value.trim(); if (r.existing && r.answers) for (const [k, v] of Object.entries(r.answers)) if (S.a[k] == null) S.a[k] = v;
            try { localStorage.setItem('bloxia.session', JSON.stringify({ id: r.id, token: r.token })); } catch {}
            gain(60, 10); sync(); go(GEN);
          } catch { err.textContent = 'Connexion impossible. Réessaie dans un instant.'; ok.disabled = false; } };
        em.value ? pw.focus() : em.focus();
      } },
    { say: () => 'Je lance la construction. Regarde bien.', html: () => `<div class="fx-kick">${ic('hammer')}Génération en direct</div>${title('je construis', 'ton monde')}
      <div class="fx-gen scanning" id="gx"><div class="fx-gfloor"></div><canvas id="gc"></canvas><div class="fx-scan"></div><div class="fx-vgn"></div>
        <div class="fx-phase"><b id="gpn">1/5</b><span id="gpt">Initialisation</span></div>
        <div class="fx-gstats"><span>${ic('cube')}<b id="gs1">0</b> blocs</span><span>${ic('flag')}<b id="gs2">0</b> objets</span><span>${ic('code')}<b id="gs3">0</b> lignes</span></div>
        <div class="fx-term" id="gterm"><div class="fx-termh"><i></i><i></i><i></i><span>GameManager.server.lua</span></div><pre id="gtx"></pre></div>
        <div class="fx-labels" id="glab"></div><div class="fx-flash" id="gfl"></div>
        <div class="fx-stamp" id="gst"><small>Map prête</small><b></b></div></div>
      <div class="fx-bigbar"><i id="gb"></i></div>
      <div class="fx-check">${['Terrain posé', 'Décors et objets', 'Économie du jeu', 'Scripts Luau', 'Finitions et optimisation mobile'].map(t => `<div>${ic('check-circle')}${t}</div>`).join('')}</div>`,
      after: st => {
        const a = an(), pk = E.makePack(a, phrase()), blocks = E.generate(a, phrase()).blocks, gx = st.querySelector('#gx');
        const w = new E.World(st.querySelector('#gc'), { autoRotate: true, speed: .5, scale: 2.7, offsetY: .04, ghost: true }); extra.push(w);
        w.set(blocks, a.theme, { animate: false }); w.snapReveal(0);
        const alive = () => S.i === GEN && document.body.contains(gx), sleep = ms => new Promise(r => setTimeout(r, ms));
        const ease = t => 1 - Math.pow(1 - t, 3), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const tween = (to, ms, f = ease) => new Promise(res => { const o = w.o, from = {}; for (const k in to) from[k] = o[k]; const t0 = performance.now(); const step = t => { if (!alive()) return res(); const p = Math.min(1, (t - t0) / ms), e = f(p); for (const k in to) o[k] = from[k] + (to[k] - from[k]) * e; p < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
        const rows = $$('.fx-check div', st), T0 = performance.now(), TOTAL = 16500, glowN = Math.max(6, Math.round(blocks.filter(b => b.z >= 1).length / 4));
        let lines = 0;
        const phase = (n, t) => { st.querySelector('#gpn').textContent = n + '/5'; const pt = st.querySelector('#gpt'); pt.textContent = t; pt.classList.remove('swap'); void pt.offsetWidth; pt.classList.add('swap'); rows.forEach((r, k) => r.classList.toggle('on', k < n - 1)); tone(300 + n * 90, .25, 'triangle', .04); };
        const label = (txt, icn) => { const box = st.querySelector('#glab'); const e = document.createElement('span'); e.className = 'fx-lbl'; e.innerHTML = ic(icn) + txt; e.style.left = (14 + Math.random() * 62) + '%'; e.style.top = (16 + Math.random() * 50) + '%'; box.appendChild(e); setTimeout(() => e.classList.add('out'), 1900); setTimeout(() => e.remove(), 2400); sfx.pick(); };
        const tick = setInterval(() => { if (!alive()) return clearInterval(tick); const p = w.prog; st.querySelector('#gs1').textContent = Math.round(blocks.length * p); st.querySelector('#gs2').textContent = Math.round(glowN * Math.max(0, (p - .45) / .55)); st.querySelector('#gs3').textContent = lines; st.querySelector('#gb').style.width = Math.min(100, (performance.now() - T0) / TOTAL * 100) + '%'; if (w.prog < w.target) tone(140 + Math.random() * 160, .025, 'square', .015); }, 110);
        const typeCode = async () => { const pre = st.querySelector('#gtx'), src = pk.script.concat(['', '-- Boutique', 'local MarketplaceService = game:GetService("MarketplaceService")']); for (const l of src) { if (!alive()) return; const ln = document.createElement('div'); pre.appendChild(ln); for (let k = 0; k <= l.length; k += 3) { ln.textContent = l.slice(0, k); await sleep(11); } ln.innerHTML = hl(l) || '&nbsp;'; lines++; pre.scrollTop = pre.scrollHeight; } };
        (async () => {
          // 1. initialisation : plan holographique, caméra collée au sol
          phase(1, 'Initialisation'); guideSay('Je scanne le terrain et je trace le plan de ta map.');
          await tween({ scale: 1.9, speed: 1.4 }, 2200, io); if (!alive()) return;
          // 2. terrain : les blocs montent couche par couche, dézoom en tournant
          phase(2, 'Terrain'); gx.classList.remove('scanning'); guideSay('Je pose le terrain, couche par couche.'); w.revealTo(.5, 3.6);
          label('Zone de spawn', 'flag'); tween({ scale: 1.12, offsetY: .12, speed: 3.2 }, 3600, io); await sleep(1300); label('Zone 1', 'map'); await sleep(1300); label('Relief', 'cube'); await sleep(1000); if (!alive()) return;
          // 3. décors : zoom sur un coin, objets qui tombent
          phase(3, 'Décors et objets'); guideSay('J\'ajoute les décors, les objets et les points de sauvegarde.'); w.revealTo(.84, 3.2);
          await tween({ scale: 1.75, offsetX: -.16, offsetY: .22, speed: .35 }, 1500); label('Checkpoint', 'check-circle'); await sleep(900); label('Décor', 'image'); await tween({ scale: 1.25, offsetX: .12, offsetY: .16, speed: .8 }, 1400); label('Obstacle', 'zap'); if (!alive()) return;
          // 4. économie + scripts : terminal qui s'écrit, scan
          phase(4, 'Économie et scripts'); gx.classList.add('scanning', 'coding'); guideSay('J\'écris les scripts et je prépare ta boutique.'); w.revealTo(1, 2.8);
          tween({ scale: 1.05, offsetX: -.12, offsetY: .1, speed: 1.2 }, 2800, io); label('Boutique · 4 articles', 'store'); const tc = typeCode(); await sleep(1400); label('Gamepass', 'coins'); await sleep(1400); await tc; if (!alive()) return;
          // 5. final : dézoom, vrille, flash, titre
          phase(5, 'Finitions'); gx.classList.remove('scanning', 'coding'); w.o.ghost = false; guideSay('Dernières finitions… et voilà !');
          await tween({ scale: 1.45, offsetX: 0, offsetY: .08, speed: 7 }, 900, t => t * t); await tween({ scale: .98, speed: .5 }, 1300); if (!alive()) return;
          rows.forEach(r => r.classList.add('on')); st.querySelector('#gb').style.width = '100%';
          gx.classList.add('shake'); st.querySelector('#gfl').classList.add('on'); const stp = st.querySelector('#gst'); stp.querySelector('b').textContent = a.title; stp.classList.add('on');
          const r = gx.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); setTimeout(() => burst(r.left + r.width * .3, r.top + r.height * .4), 180); setTimeout(() => burst(r.left + r.width * .7, r.top + r.height * .45), 320); sfx.lvl();
          guideSay(`C'est prêt, ${S.a.name || 'créateur'} ! Voici ${a.title}.`);
          await sleep(2600); if (!alive()) return; clearInterval(tick); gain(100, 12); go(RES);
        })();
      } },
    { say: () => `${S.a.name}, voilà ta map. Et regarde ce que tu reçois avec.`, html: () => { const a = an(), p = E.makePack(a, phrase()), th = E.THEMES[a.theme], ge = E.GENRES[a.genre];
        return `<div class="fx-res"><canvas id="rc"></canvas><span class="fx-hint">${ic('move')}Glisse pour tourner la map</span></div>${title(esc(a.title.split(' ')[0]), esc(a.title.split(' ').slice(1).join(' ')))}
        <div class="fx-rtags"><span class="fx-rtag">${ic(ge.icon)}${E.GENRES[a.genre].label}</span><span class="fx-rtag">${ic(th.icon)}${th.fr}</span><span class="fx-rtag">${ic('unlock')}2 éléments débloqués sur 5</span></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('terminal')}${p.prompts[0].title}<span>DÉBLOQUÉ</span></div><div class="fx-pkb"><div class="code" style="white-space:pre-wrap">${esc(p.prompts[0].text)}</div><button class="fx-copy" id="cp">${ic('copy')}<span>Copier le prompt</span></button></div></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('code')}${p.scriptName}<span class="lk">${ic('lock')}</span></div><div class="fx-pkb"><div class="code">${p.script.map(hl).join('\n')}</div><div class="fx-lw"><div class="code blur" style="margin-top:6px">${esc(p.fake)}</div><div class="fx-lockov">${ic('lock')}Le script complet est dans ton pack</div></div></div></div>
        <div class="fx-pk"><div class="fx-pkh">${ic('coins')}Boutique<span class="lk">${ic('lock')}</span></div><div class="fx-pkb"><div class="fx-shop">${p.shop.map((s, i) => `<div class="fx-it"><div><b>${esc(s.name)}</b><small>${s.type}</small></div>${i ? '<span class="fx-price blur">R$ 000</span>' : `<span class="fx-price">${s.price}</span>`}</div>`).join('')}</div></div></div>
        <button class="btn btn-gold btn-block" id="ok"><span class="lbl">Débloquer mon pack</span>${ic('lock')}</button>`; },
      after: st => { const a = an(), w = new E.World(st.querySelector('#rc'), { autoRotate: true, interactive: true, scale: 1.1 }); extra.push(w); w.set(E.generate(a, phrase()).blocks, a.theme, { duration: 1800 }); const p = E.makePack(a, phrase());
        st.querySelector('#cp').onclick = e => { navigator.clipboard && navigator.clipboard.writeText(p.prompts[0].text).catch(() => {}); e.currentTarget.querySelector('span').textContent = 'Copié'; sfx.pick(); }; st.querySelector('#ok').onclick = () => { gain(50); go(LAST); }; } },
    { say: () => 'Dernière étape : récupère ton pack complet.', html: () => { const a = an(); return `<div class="fx-kick">${ic('gift')}Ton pack est prêt</div>${title(esc(a.title.split(' ')[0]), esc(a.title.split(' ').slice(1).join(' ')))}
        <div class="fx-list">${[['terminal', '4 prompts Roblox Studio', 'Ta map se construit, étape par étape'], ['code', '3 scripts Luau', 'Gameplay, sauvegarde, boutique'], ['coin', '4 achats à vendre', 'Quoi vendre et à quel prix'], ['image', 'Brief icône et miniatures', 'Des visuels qui font cliquer'], ['video', '3 vidéos TikTok', 'Pour tes premiers joueurs'], ['calendar', 'Plan de la semaine 2', 'Pour que tes joueurs reviennent']].map(([i, t, s], k) => `<div class="fx-li" style="--d:${k * 60}ms"><span class="fx-gt">${GL(i)}</span><div><b>${t}</b><small>${s}</small></div></div>`).join('')}</div>
        <button class="btn btn-gold btn-block" id="pay"><span class="lbl">Construire ${esc(a.title)}</span>${ic('arrow-right')}</button><div class="fx-gar">${ic('shield')}Remboursé sous ${BLOXIA_CONFIG.guaranteeDays} jours si la map ou les scripts ne marchent pas</div><p class="fx-foot">Paiement sécurisé par Whop</p>`; },
      after: st => { if (!S.a._id) { toast('Crée ton compte pour récupérer ton pack', true); setTimeout(() => go(10), 600); return; } sync(); st.querySelector('#pay').onclick = async e => { const b = e.currentTarget; b.disabled = true; BX.set({ done: true }); try { const r = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ id: S.a._id, token: S.a._t }) }).then(r => r.json()); if (r.url) location.href = r.url; else throw 0; } catch { b.disabled = false; BX.set({ done: false }); toast('Paiement indisponible, réessaie', true); } }; } }
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
  try { const sv = JSON.parse(localStorage.getItem(KEY)); if (sv && sv.i > 0 && sv.i < 14) { S.a = sv.a || {}; S.blocs = sv.blocs || 0; S.items = sv.items || []; S.i = sv.i >= GEN ? RES : sv.i; if (S.i >= GEN && !S.a._id) S.i = 10; } } catch {}
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
