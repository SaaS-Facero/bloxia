/* Comportement de la landing page. */
(function () {
  const E = window.BloxiaEngine, BX = window.BX, C = window.BLOXIA_CONFIG, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement, mq = matchMedia('(max-width:900px)');
  const SUGG = [['flame', 'Obby dans un volcan', 'Un obby dans un volcan où la lave monte toutes les 30 secondes'], ['store', 'Tycoon de pizzeria', 'Un tycoon de pizzeria sur une île tropicale'],
    ['ghost', 'Survie zombie', 'Une survie zombie dans une école abandonnée la nuit'], ['planet', 'Minage sur Mars', 'Un simulator de minage de cristaux sur Mars']];
  const IDEAS = SUGG.map(s => s[2]).concat(['Un tower defense dans un château de glace', 'Un roleplay dans une ville néon la nuit']);
  const prof = BX.get();
  const S = { idea: '', an: E.analyze(''), generated: false, blocks: 0 };
  if (prof.generated && prof.idea) { S.idea = prof.idea; S.an = E.analyze(prof.idea); S.generated = true; }

  const hero = $('#hero-input'), final = $('#final-input');
  const mkWorld = (id, o) => { const cv = $(id), w = new E.World(cv, o); return w; };
  const W1 = mkWorld('#world', { autoRotate: true, interactive: true }), W2 = mkWorld('#world2', { autoRotate: true }), W3 = mkWorld('#world3', { autoRotate: true, speed: .6 }), W4 = mkWorld('#world4', { autoRotate: true, interactive: true });
  const cfg1 = () => W1.configure(mq.matches ? { offsetX: 0, offsetY: 0, scale: 1 } : { offsetX: .3, offsetY: .08, scale: .42 }); cfg1(); mq.addEventListener('change', cfg1);
  const build = (w, an, idea, opt) => { const g = E.generate(an, idea); w.set(g.blocks, an.theme, opt); return g.blocks.length; };
  const theme = an => { const t = E.THEMES[an.theme]; root.style.setProperty('--sky1', t.sky[0]); root.style.setProperty('--sky2', t.sky[1]); root.style.setProperty('--glow', t.glow); const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t.sky[1]; };
  const ic = BX.icon, esc = BX.esc;

  // ---------- CTA personnalisés ----------
  const setLbl = (el, text) => { const l = el.querySelector('.lbl'); if (!l || l.textContent === text) return; l.textContent = text; l.classList.remove('swap'); void l.offsetWidth; l.classList.add('swap'); };
  const resume = () => (prof.step > 1 && !prof.done);
  let typing = false;
  function updateCtas() {
    const title = S.generated ? S.an.title : null, name = prof.name || '';
    const L = {
      nav: resume() ? `Je reprends, ${name}` : title ? `Je récupère ${title}` : 'Je crée mon jeu',
      pack: title ? `Je récupère le pack de ${title}` : 'Je récupère mon pack',
      how: title ? `Je construis ${title} pour de vrai` : 'Je crée mon jeu',
      offer: title ? `Je continue avec ${title}` : 'Je génère mon jeu gratuitement',
      final: title ? `Je publie ${title}` : 'Je crée mon jeu',
      sticky: resume() ? `Je reprends, ${name}` : title ? `Je continue ${title}` : 'Je crée mon jeu gratuitement',
      resume: 'Je reprends'
    };
    const v = hero.value.trim(), a = E.analyze(v);
    L.hero = (S.generated && v === S.idea) ? `Je continue avec ${S.an.title}` : v.length >= 6 ? `Je construis mon ${E.GENRES[a.genre].fr} · ${E.THEMES[a.theme].fr}` : 'Je génère ma map';
    $$('[data-cta]').forEach(el => L[el.dataset.cta] && setLbl(el, L[el.dataset.cta]));
  }
  // ---------- panneaux (pack, histoire, titres) ----------
  const hl = line => line.replace(/(--.*$)|("[^"]*")|\b(local|function|end|if|then|for|do|return|and|or|not)\b|\b(\d+(?:\.\d+)?)\b|([<>&])/g, (m, c, s, k, n, amp) => c ? `<span class="c">${esc(c)}</span>` : s ? `<span class="s">${esc(s)}</span>` : k ? `<span class="k">${k}</span>` : n ? `<span class="n">${n}</span>` : esc(m));
  const TABS = [['map', 'Ta map'], ['terminal', 'Prompts Studio'], ['code', 'Scripts Luau', 1], ['coins', 'Monétisation', 1], ['rocket', 'Lancement', 1]];
  let tabSel = 0;
  function renderPack() {
    const idea = S.idea, an = S.an, p = E.makePack(an, idea), th = E.THEMES[an.theme], ge = E.GENRES[an.genre], title = S.generated ? an.title : null, shown = an.title;
    const lock = (txt, btn = 'Je récupère mon pack') => `<div class="over"><span>${txt}</span><a class="btn btn-sm" href="funnel.html" data-cta="pack"><span class="lbl">${btn}</span><i data-i="arrow-right"></i></a></div>`;
    const P = [
      `<span class="mono">Ton jeu</span><div class="big-title">${esc(shown)}</div>${idea ? `<p class="sub">« ${esc(idea)} »</p>` : ''}
       <div class="tiles"><div class="tile"><span class="mono">Type</span><b>${ic(ge.icon)}${ge.label}</b></div><div class="tile"><span class="mono">Thème</span><b>${ic(th.icon)}${th.fr}</b></div><div class="tile"><span class="mono">Blocs</span><b>${S.blocks || '…'}</b></div><div class="tile"><span class="mono">À vendre</span><b>${p.shop.length} articles</b></div></div>
       <div class="checks"><div>${ic('check-circle')}Map générée et optimisée mobile</div><div>${ic('check-circle')}Prompt maître prêt à coller</div><div class="off">${ic('lock')}Scripts, boutique et lancement dans ton pack</div></div>`,
      `<button class="copy" type="button" id="copy">${ic('copy')}<span>Copier</span></button><h3>${p.prompts[0].title}</h3><p class="sub">Prompt 1 sur 4, à coller dans l'Assistant Roblox Studio.</p><div class="code" style="white-space:pre-wrap">${esc(p.prompts[0].text)}</div>
       <div class="lockwrap"><div class="blur code" aria-hidden="true">${p.fake.split('\n').slice(0, 4).join('\n')}</div>${lock('3 prompts de plus, dans le bon ordre')}</div>`,
      `<span class="mono">${p.scriptName}</span><div class="code" style="margin-top:10px">${p.script.map(hl).join('\n')}</div><div class="lockwrap"><div class="blur code" aria-hidden="true">${esc(p.fake)}</div>${lock('Le script complet et 2 autres scripts')}</div>`,
      `<h3>Boutique de ${esc(shown)}</h3><p class="sub">4 achats à créer dans le Creator Hub.</p><div class="shop">${p.shop.map((s, i) => `<div class="item"><div><b>${esc(s.name)}</b><small>${s.type}</small></div>${i ? `<span class="price blur">R$ 000</span>` : `<span class="price">${s.price}</span>`}</div>`).join('')}</div><div class="checks" style="margin-top:16px"><div class="off">${ic('lock')}Prix conseillés et où placer chaque achat</div></div>`,
      `<h3>Lancement de ${esc(shown)}</h3><p class="sub">Ce que tu publies, et quand.</p><div class="checks">${p.launch.map((l, i) => i ? `<div class="off">${ic('lock')}<span class="blur">${l}</span></div>` : `<div>${ic('check-circle')}${l}</div>`).join('')}</div><div class="checks" style="margin-top:16px"><div class="off">${ic('lock')}Ton plan de lancement complet</div></div>`
    ];
    $('#tabs').innerHTML = TABS.map((t, i) => `<button class="tab" role="tab" id="tab-${i}" aria-selected="${i === tabSel}" aria-controls="panel-${i}" tabindex="${i === tabSel ? 0 : -1}">${ic(t[0])}${t[1]}${t[2] ? ic('lock', 'lk') : ''}</button>`).join('');
    $('#panels').innerHTML = P.map((h, i) => `<div class="panel" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" ${i === tabSel ? '' : 'hidden'}>${h}</div>`).join('');
    BX.hydrate($('#studio'));
    $$('#tabs .tab').forEach((b, i) => { b.onclick = () => selTab(i); b.onkeydown = e => { const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); selTab((i + k + 5) % 5, true); } }; });
    const cp = $('#copy'); if (cp) cp.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(p.prompts[0].text).catch(() => {}); cp.querySelector('span').textContent = 'Copié'; setTimeout(() => cp.querySelector('span').textContent = 'Copier', 1800); };
    $('#studio-file').textContent = `bloxia · ${shown.toLowerCase().replace(/\s+/g, '-')}.rbxl`;
    // titres, offre, histoire
    $('#pack-name').textContent = title || 'la publier'; $('#offer-name').textContent = title || 'ton jeu'; $('#offer-title').textContent = shown;
    const oi = $('#offer-idea'); oi.textContent = idea ? `« ${idea} »` : ''; oi.style.display = idea ? '' : 'none';
    const nm = prof.name ? esc(prof.name) + ', ' : '';
    $('#final-h').innerHTML = title ? `${nm}<span class="grad">${esc(title)}</span><br>n'attend plus que toi.` : `Tout le monde a une idée de jeu Roblox.<br><span class="grad">Toi, tu vas la publier.</span>`;
    $('#ov-genre').innerHTML = ic(ge.icon) + ge.label; $('#ov-theme').innerHTML = ic(th.icon) + th.fr; $('#ov-script').textContent = p.scriptName;
    $('#ov-code').innerHTML = p.script.slice(0, 5).map(hl).join('\n');
    $('#ov-shop').innerHTML = p.shop.slice(0, 3).map((s, i) => `<span>${esc(s.name)} ${i ? ic('lock') : `<b style="color:var(--gold)">${s.price}</b>`}</span>`).join('');
    $('#hud-genre').innerHTML = ic(ge.icon) + ge.label; $('#hud-theme').innerHTML = ic(th.icon) + th.fr;
    const hd = $('#hud-genre'); void hd;
  }
  function selTab(i, focus) { tabSel = i; $$('#tabs .tab').forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; if (k === i && focus) b.focus(); }); $$('#panels .panel').forEach((p, k) => p.hidden = k !== i); }

  // ---------- génération ----------
  let tw = 0;
  function countTo(n, ms) { cancelAnimationFrame(tw); const t0 = performance.now(), el = $('#hud-blocks'), bar = $('#hud-bar'), ov = $('#ov-blocks'); const f = t => { const p = Math.min(1, (t - t0) / ms), v = Math.round(n * p); el.textContent = v; bar.style.width = p * 100 + '%'; if (ov) ov.textContent = v; if (p < 1) tw = requestAnimationFrame(f); }; tw = requestAnimationFrame(f); }
  function rebuildAll(ms, animate = true) {
    theme(S.an); S.blocks = build(W1, S.an, S.idea, animate ? { duration: ms } : { animate: false });
    build(W2, S.an, S.idea, { animate: false }); build(W3, S.an, S.idea, { animate: false }); build(W4, S.an, S.idea, { animate: false });
    W2.snapReveal(curStep === 1 ? .06 : 1);
    if (animate) countTo(S.blocks, ms); else { $('#hud-blocks').textContent = S.blocks; $('#hud-bar').style.width = '100%'; }
    renderPack(); updateCtas();
  }
  let notifT = 0;
  function generate() {
    const v = hero.value.trim(); if (!v) { hero.focus(); return; }
    if (S.generated && v === S.idea) { BX.set({ idea: S.idea }); location.href = 'funnel.html'; return; }
    S.idea = v; S.an = E.analyze(v); S.generated = true;
    BX.set({ idea: v, generated: true, title: S.an.title, genre: S.an.genre, theme: S.an.theme });
    rebuildAll(2800);
    $('#notif-t').textContent = `${S.an.title} est prête`; $('#notif').classList.add('show'); clearTimeout(notifT); notifT = setTimeout(() => $('#notif').classList.remove('show'), 4200);
    final.value = v; hero.blur();
  }
  $('#hero-form').addEventListener('submit', e => { e.preventDefault(); generate(); });
  $('#final-form').addEventListener('submit', e => { e.preventDefault(); const v = final.value.trim() || hero.value.trim(); if (v) BX.set({ idea: v }); location.href = 'funnel.html'; });
  [hero, final].forEach(t => t.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); t.form.requestSubmit(); } }));
  $$('a[data-cta]').forEach(a => a.addEventListener('click', () => BX.set({ idea: S.idea || hero.value.trim() || final.value.trim() })));

  // détection en direct pendant la frappe
  let dT = 0, cur = { genre: S.an.genre, theme: S.an.theme };
  hero.addEventListener('input', () => {
    updateCtas(); clearTimeout(dT);
    const v = hero.value.trim(), tg = $('#tag-genre'), tt = $('#tag-theme');
    if (v.length < 6) { tg.classList.remove('show'); tt.classList.remove('show'); return; }
    dT = setTimeout(() => {
      const a = E.analyze(v), ge = E.GENRES[a.genre], th = E.THEMES[a.theme];
      tg.innerHTML = ic(ge.icon) + ge.label; tt.innerHTML = ic(th.icon) + th.fr; tg.classList.add('show'); tt.classList.add('show');
      if (a.genre !== cur.genre || a.theme !== cur.theme) { cur = { genre: a.genre, theme: a.theme }; const keep = S.generated; S.an = a; S.idea = v; S.generated = keep && false; theme(a); S.blocks = build(W1, a, v, { duration: 1400 }); countTo(S.blocks, 1400); build(W2, a, v, { animate: false }); build(W3, a, v, { animate: false }); build(W4, a, v, { animate: false }); W2.snapReveal(curStep === 1 ? .06 : 1); renderPack(); updateCtas(); }
    }, 420);
  });
  // placeholder qui s'écrit tout seul
  (function () { let i = 0, k = 0, del = false, wait = 0; const step = () => { const run = !hero.value && document.activeElement !== hero; if (run) { if (wait) { wait = 0; return setTimeout(step, 1900); } const s = IDEAS[i]; k += del ? -1 : 1; hero.placeholder = s.slice(0, k); if (!del && k >= s.length) { del = true; wait = 1; } else if (del && k <= 0) { del = false; i = (i + 1) % IDEAS.length; } return setTimeout(step, del ? 16 : 40); } setTimeout(step, 400); }; step(); })();
  // suggestions
  $('#sugg').insertAdjacentHTML('beforeend', SUGG.map((s, i) => `<button type="button" class="chip" data-s="${i}">${ic(s[0])}${s[1]}</button>`).join(''));
  $$('.chip').forEach(c => c.onclick = () => { hero.value = SUGG[+c.dataset.s][2]; generate(); });

  // ---------- bandeaux, jeux lancés ----------
  const GEN = [['flag', 'Obby'], ['factory', 'Tycoon'], ['pickaxe', 'Simulator'], ['ghost', 'Horreur'], ['tower', 'Tower Defense'], ['house', 'Roleplay'], ['car', 'Course'], ['paw', 'Pets'], ['swords', 'Combat'], ['puzzle', 'Escape room'], ['fish', 'Pêche'], ['store', 'Restaurant']];
  const row = l => { const h = l.concat(l).map(([i, n]) => `<span class="pill">${ic(i)}${n}</span>`).join(''); return `<div class="marq-in">${h}</div><div class="marq-in" aria-hidden="true">${h}</div>`; };
  $('#marqs').innerHTML = `<div class="marq">${row(GEN.slice(0, 6))}</div><div class="marq rev">${row(GEN.slice(6))}</div>`;
  if (C.launchedGames.filter(g => g.title && g.thumb && g.url).length >= 4) { $('#launched').classList.add('show'); $('#band').style.display = 'none'; $('#lgrid').innerHTML = C.launchedGames.slice(0, 4).map(g => `<a class="lg" href="${esc(g.url)}" target="_blank" rel="noopener" style="background-image:url('${esc(g.thumb)}')"><span>${esc(g.title)}<small>par ${esc(g.creator || '')}</small></span></a>`).join(''); }
  $$('[data-days]').forEach(e => e.textContent = C.guaranteeDays);

  // ---------- histoire au scroll ----------
  let curStep = 1, typeT = 0;
  function typeIdea() { clearInterval(typeT); const s = S.idea || SUGG[0][2], el = $('#typed'); let k = 0; el.textContent = ''; typeT = setInterval(() => { el.textContent = s.slice(0, ++k); if (k >= s.length) clearInterval(typeT); }, 30); }
  function setStep(n) {
    if (n === curStep && n !== 1) return; const prev = curStep; curStep = n;
    $$('.step').forEach(s => s.classList.toggle('on', +s.dataset.step === n)); $$('.ov').forEach(o => o.classList.toggle('on', +o.dataset.ov === n));
    if (n === 1) { W2.reveal(.06); if (prev !== 1) typeIdea(); } else { W2.reveal(1); if (n === 2) { const b = S.blocks, el = $('#ov-blocks'), t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(b * p); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); } }
  }
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' }); $$('.step').forEach(s => io.observe(s)); }
  typeIdea();

  // ---------- nav, CTA collant, bandeau de retour ----------
  const nav = $('#nav'), sticky = $('#sticky'), fin = $('#final'), form = $('#hero-form');
  const onScroll = () => { nav.classList.toggle('scrolled', scrollY > 10); const out = form.getBoundingClientRect().bottom < 0, near = fin.getBoundingClientRect().top < innerHeight * .85; sticky.classList.toggle('show', out && !near); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (resume()) { $('#welcome').classList.add('show'); $('#w-name').textContent = prof.name; $('#w-title').textContent = prof.title || 'ton jeu'; }

  // ---------- démarrage ----------
  if (S.generated) { hero.value = S.idea; final.value = S.idea; }
  cur = { genre: S.an.genre, theme: S.an.theme };
  rebuildAll(2400, !S.generated);
  if (S.generated) W1.snapReveal(1);
})();
