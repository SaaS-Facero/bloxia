/* Utilitaires communs : stockage, icônes, profil, bas de page, fonds photo, apparitions. */
(function () {
  const C = window.BLOXIA_CONFIG, KEY = 'bloxia.profile';
  const BX = window.BX = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(p) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(BX.get(), p))); } catch {} },
    icon: (n, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="/assets/icons.svg#${n}"></use></svg>`,
    hydrate(root = document) { root.querySelectorAll('i[data-i]').forEach(e => { const t = document.createElement('span'); t.innerHTML = BX.icon(e.dataset.i, e.className); const s = t.firstChild; e.replaceWith(s); }); },
    esc: s => String(s).replace(/[&<>"'/]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#47;' }[c]))
  };
  const LOGO = id => `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fa6ff"/><stop offset="1" stop-color="#9b6bff"/></linearGradient></defs><path d="M16 3l11 6.3-11 6.3L5 9.3z" fill="#dfe5ff"/><path d="M5 9.3l11 6.3v12.6L5 21.9z" fill="url(#${id})"/><path d="M27 9.3l-11 6.3v12.6l11-6.3z" fill="#3b2a8f"/></svg>`;
  BX.logo = LOGO;
  BX.renderFooter = function () {
    const el = document.querySelector('[data-site-footer]'); if (!el) return;
    const soc = [['discord', 'Discord'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']].filter(([k]) => C.socials[k])
      .map(([k, n]) => `<a class="soc" href="${BX.esc(C.socials[k])}" target="_blank" rel="noopener" aria-label="${n}">${BX.icon(k)}</a>`).join('');
    el.className = 'site-footer';
    el.innerHTML = `<div class="wrap"><div class="f-grid">
      <div class="f-brand"><a class="logo" href="/">${LOGO('lgf')}<span>Bloxia</span></a>
        <p>Une question sur ton jeu, ton pack ou ton paiement ? L'équipe te répond, en français.</p>
        <a class="f-mail" href="mailto:${C.supportEmail}">${BX.icon('mail')}${C.supportEmail}</a>${soc ? `<div class="socs">${soc}</div>` : ''}</div>
      <div><h4 class="mono">Produit</h4><a href="/#comment">Comment ça marche</a><a href="/#offre">Le pack</a><a href="/funnel.html">Créer mon jeu</a><a href="/#faq">Questions fréquentes</a></div>
      <div><h4 class="mono">Bloxia</h4><a href="/espace.html">Mon espace</a><a href="mailto:${C.supportEmail}">Nous contacter</a><a href="/legal/remboursement.html">Garantie ${C.guaranteeDays} jours</a></div>
      <div><h4 class="mono">Légal</h4><a href="/legal/cgv.html">Conditions générales de vente</a><a href="/legal/mentions.html">Mentions légales</a><a href="/legal/confidentialite.html">Politique de confidentialité</a><a href="/legal/remboursement.html">Politique de remboursement</a><a href="/legal/cookies.html">Cookies</a></div></div>
      <div class="f-giant" aria-hidden="true">Bloxia</div>
      <div class="f-copy"><p>©${new Date().getFullYear()} Bloxia</p><p class="f-legal">Bloxia n'est pas affilié à Roblox Corporation. Roblox, Roblox Studio et Robux sont des marques de Roblox Corporation. Aucun revenu n'est garanti.</p></div></div>`;
  };
  // Fonds photo : fondu toutes les 7 s + zoom lent ; images lues dans /bg.json (public/assets/img/bg/).
  BX.backdrops = async function () {
    const els = [...document.querySelectorAll('[data-backdrop]')]; if (!els.length) return;
    let list = C.backdrops.slice(); if (!list.length) { try { list = await (await fetch('/bg.json')).json(); } catch {} }
    if (!list.length) return;
    els.forEach(el => {
      const start = (+el.dataset.backdrop || 0) % list.length; let k = start, layers = [];
      const add = (u, i) => { const d = document.createElement('div'); d.className = 'bd-layer'; d.style.backgroundImage = `url('${u}')`; el.appendChild(d); layers[i] = d; };
      add(list[start], 0); layers[0].classList.add('on');
      const rest = () => { list.forEach((u, i) => { if (i !== start) add(u, i); }); };
      setTimeout(rest, 1500);
      if (list.length > 1) setInterval(() => { const ls = [...el.children]; if (ls.length < 2) return; const cur = ls.findIndex(l => l.classList.contains('on')); ls[cur].classList.remove('on'); const nx = ls[(cur + 1) % ls.length]; nx.classList.remove('on'); void nx.offsetWidth; nx.classList.add('on'); }, 7000);
    });
  };
  BX.reveal = function () {
    const els = document.querySelectorAll('.reveal'); if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach(e => io.observe(e));
  };
  BX.glow = function () { document.querySelectorAll('.card').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); })); };
  document.addEventListener('DOMContentLoaded', () => { BX.hydrate(); BX.renderFooter(); BX.reveal(); BX.glow(); BX.backdrops(); });
})();
