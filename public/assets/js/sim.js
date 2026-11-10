/* Téléphone simulateur : estimation de revenus Roblox réglée par le visiteur.
   Hypothèses affichées : 1 % des visiteurs achètent un Game Pass, le créateur touche 70 % du prix,
   DevEx standard 0,0038 $ par Robux gagné (taux Roblox depuis le 5 sept. 2025). Rien n'est garanti. */
(function () {
  const root = document.getElementById('sim'); if (!root) return;
  const CONV = 0.01, SHARE = 0.7, DEVEX = 0.0038, EUR = 0.87;
  const sec = document.getElementById('simulateur') || document, $ = s => sec.querySelector(s);
  const vis = $('#sim-v'), pri = $('#sim-p');
  const PASSES = ['VIP', 'Double argent', 'Vitesse x2', 'Pet légendaire', 'Auto-collecte', 'Skin doré', 'Zone secrète', 'Pack de départ'];
  const fmt = (n, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const VSTEPS = [20, 50, 100, 200, 300, 500, 800, 1000, 2000, 3000, 5000, 8000, 10000, 20000, 50000];
  const PSTEPS = [25, 49, 75, 99, 149, 199, 299, 399, 499];
  const st = { shown: { year: 0, day: 0, rob: 0 } };

  function calc() {
    const v = VSTEPS[+vis.value], p = PSTEPS[+pri.value];
    const robDay = v * CONV * p * SHARE, usdDay = robDay * DEVEX, eurDay = usdDay * EUR;
    return { v, p, robDay, robMonth: robDay * 30, eurDay, eurMonth: eurDay * 30, eurYear: eurDay * 365 };
  }
  // compteurs animés
  function tween(el, key, to, dec, suf) {
    const from = st.shown[key], t0 = performance.now(), D = 700; cancelAnimationFrame(el._r);
    const f = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3), x = from + (to - from) * e; st.shown[key] = x; el.textContent = fmt(x, dec) + suf; if (k < 1) el._r = requestAnimationFrame(f); };
    el._r = requestAnimationFrame(f);
  }
  function render() {
    const c = calc();
    $('#sim-vo').textContent = fmt(c.v); $('#sim-po').textContent = fmt(c.p) + ' R$';
    tween($('#sim-year'), 'year', c.eurYear, 0, ' €');
    tween($('#sim-day'), 'day', c.eurDay, c.eurDay < 10 ? 2 : 0, ' €');
    tween($('#sim-rob'), 'rob', c.robMonth, 0, ' R$');
    $('#sim-month').textContent = fmt(c.eurMonth, c.eurMonth < 100 ? 2 : 0) + ' €';
    $('#sim-buy').textContent = fmt(Math.max(1, Math.round(c.v * CONV))) + ' achat' + (c.v * CONV >= 1.5 ? 's' : '') + ' / jour';
    $('#sim-dx').textContent = c.robMonth >= 30000 ? 'Retrait DevEx possible chaque mois' : 'DevEx dès 30 000 R$ cumulés';
    for (const s of sec.querySelectorAll('.sim-v')) s.style.setProperty('--fill', (+s.value / (+s.max)) * 100 + '%');
  }

  // ventes simulées qui tombent dans la liste et dans la notification
  const list = $('#sim-list'), note = $('#sim-note');
  function sale(first) {
    const c = calc(), name = PASSES[Math.floor(Math.random() * PASSES.length)], gain = Math.round(c.p * SHARE);
    const li = document.createElement('li'); li.className = 'sim-row new';
    li.innerHTML = `<span class="sim-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z" fill="#fff"/><path d="M12 7.2l4.2 2.4v4.8L12 16.8l-4.2-2.4V9.6z" fill="#0b0d18"/></svg></span><span class="sim-nm"><b>Game Pass</b><small>${name}</small></span><span class="sim-am">+ ${fmt(gain)} R$</span>`;
    list.prepend(li); requestAnimationFrame(() => requestAnimationFrame(() => li.classList.remove('new')));
    [...list.children].forEach((e, k) => e.classList.toggle('hi', k === 0)); while (list.children.length > 6) list.lastElementChild.remove();
    if (!first) { note.querySelector('b').textContent = 'Game Pass « ' + name + ' »'; note.querySelector('.sim-na').textContent = '+ ' + fmt(gain) + ' R$'; note.classList.remove('drop'); void note.offsetWidth; note.classList.add('drop'); }
  }
  for (let k = 0; k < 6; k++) sale(true);

  let timer = 0, on = false;
  const loop = () => { sale(false); const c = calc(); timer = setTimeout(loop, Math.max(1400, Math.min(4200, 260000 / Math.max(1, c.v)))); };
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !on) { on = true; st.shown = { year: 0, day: 0, rob: 0 }; render(); timer = setTimeout(loop, 1200); } else if (!e.isIntersecting && on) { on = false; clearTimeout(timer); } }), { threshold: .25 }).observe(root);

  vis.oninput = pri.oninput = render;
  // inclinaison légère du téléphone à la souris
  const ph = $('.sim-phone');
  if (matchMedia('(hover:hover)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    root.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; ph.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`; });
    root.addEventListener('pointerleave', () => ph.style.transform = '');
  }
  render();
})();
