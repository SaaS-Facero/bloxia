/* Dessins de la page pricing, faits à la main : emblèmes des formules, icônes de fonctionnalités, ticket, sceau. */
(function () {
  let n = 0;
  const uid = () => 'pa' + (++n);
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

  // ---------- emblèmes (64 x 64) ----------
  const EMB = {
    starter() {
      const a = uid(), b = uid(), c = uid();
      return `<defs>${lg(a, '#9fd0ff', '#2b62e0')}${lg(b, '#1c3f99', '#0b1a45')}${lg(c, '#ffffff', '#cfe3ff')}</defs>
        <path d="M32 2.5l26 15v29L32 61.5 6 46.5v-29z" fill="url(#${b})"/>
        <path d="M32 7l22 12.7v24.6L32 57 10 44.300V19.700z" fill="url(#${a})"/>
        <path d="M32 7l22 12.7L32 32 10 19.7z" fill="#fff" opacity=".2"/>
        <path d="M32 7l22 12.7v24.6L32 57 10 44.3V19.7z" fill="none" stroke="#d8ebff" stroke-opacity=".7" stroke-width="1.2"/>
        <path d="M32 19.5l10.500 6-10.500 6-10.500-6z" fill="url(#${c})"/><path d="M21.5 25.5l10.5 6v12.2l-10.5-6z" fill="#9cc8ff"/><path d="M42.5 25.5l-10.5 6v12.2l10.5-6z" fill="#4f84ea"/>
        <path d="M32 19.5l10.5 6-10.5 6-10.5-6z" fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".9"/>
        <circle cx="32" cy="25.500" r="1.600" fill="#2b62e0"/><path d="M24 29.5l3 1.7v4.500l-3-1.700z" fill="#fff" opacity=".35"/>`;
    },
    essentiel() {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return `<defs>${lg(a, '#fff1b3', '#f39c0b')}${lg(b, '#8a5a00', '#3d2400')}${lg(c, '#fffaf0', '#ffd98a')}${lg(d, '#ffb347', '#c2410c')}</defs>
        <path d="M32 2l25 8.500v18.500c0 15.500-10.500 26.500-25 33C17.500 55.500 7 44.500 7 29V10.500z" fill="url(#${b})"/>
        <path d="M32 6.500l20.500 7v15.500c0 12.800-8.600 22-20.500 27.500C20.100 51 11.500 41.800 11.500 29V13.500z" fill="url(#${a})"/>
        <path d="M32 6.500v50c-11.900-5.500-20.500-14.700-20.500-27.500V13.500z" fill="#fff" opacity=".16"/>
        <path d="M32 6.5l20.5 7v15.5c0 12.8-8.6 22-20.5 27.5C20.1 51 11.5 41.8 11.5 29V13.5z" fill="none" stroke="#fff6d6" stroke-opacity=".75" stroke-width="1.2"/>
        ${[[26.5, 31.5], [37.5, 31.5], [32, 22.5]].map(([x, y]) => { const k = 6; return `<path d="M${x} ${y}l${k} ${k * .58}-${k} ${k * .58}-${k}-${k * .58}z" fill="#fffaf0"/><path d="M${x - k} ${y + k * .58}l${k} ${k * .58}v${k * 1.2}l-${k}-${k * .58}z" fill="#fb923c"/><path d="M${x + k} ${y + k * .58}l-${k} ${k * .58}v${k * 1.2}l${k}-${k * .58}z" fill="#9a3412"/><path d="M${x} ${y}l${k} ${k * .58}-${k} ${k * .58}-${k}-${k * .58}z" fill="none" stroke="#fff" stroke-width=".7" stroke-opacity=".8"/>`; }).join('')}
        <path d="M16 40c1.500 4 4 7 7.500 9M48 40c-1.500 4-4 7-7.500 9" stroke="#7a4a00" stroke-width="1.800" fill="none" stroke-linecap="round"/>
        <ellipse cx="17.500" cy="42" rx="1.600" ry="3" transform="rotate(-30 17.5 42)" fill="#7a4a00"/><ellipse cx="20.500" cy="46.500" rx="1.600" ry="3" transform="rotate(-50 20.5 46.5)" fill="#7a4a00"/>
        <ellipse cx="46.500" cy="42" rx="1.600" ry="3" transform="rotate(30 46.5 42)" fill="#7a4a00"/><ellipse cx="43.500" cy="46.500" rx="1.600" ry="3" transform="rotate(50 43.5 46.5)" fill="#7a4a00"/>
        <path d="M32 11l2.200 3.200L32 17.400l-2.200-3.200z" fill="#fff"/>`;
    },
    business() {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return `<defs>${lg(a, '#d9c8ff', '#6d3fe0')}${lg(b, '#3b1d8f', '#150a3a')}${lg(c, '#ffffff', '#e4d8ff')}${lg(d, '#ffe58f', '#f59e0b')}</defs>
        <path d="M21 2.500h22L61.500 21v22L43 61.500H21L2.500 43V21z" fill="url(#${b})"/>
        <path d="M22.500 7h19L57 22.500v19L41.500 57h-19L7 41.500v-19z" fill="url(#${a})"/>
        <path d="M22.500 7h19L57 22.500H7z" fill="#fff" opacity=".18"/>
        <path d="M22.5 7h19L57 22.5v19L41.5 57h-19L7 41.5v-19z" fill="none" stroke="#efe7ff" stroke-opacity=".7" stroke-width="1.2"/>
        <path d="M19 47V32h7v15M28 47V24h8v23M38 47V29h7v18" fill="url(#${c})"/>
        <path d="M19 32h7M28 24h8M38 29h7" stroke="#b89cff" stroke-width="1"/>
        ${[[21, 35], [21, 39], [30, 27], [33, 27], [30, 31], [33, 31], [30, 35], [33, 35], [40, 32], [40, 36], [43, 32]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.800" height="2.200" rx=".4" fill="#6d3fe0"/>`).join('')}
        <path d="M15 47h34" stroke="#2a1470" stroke-width="2" stroke-linecap="round"/>
        <path d="M24 17l3 3.500 5-6 5 6 3-3.500-1.500 6h-13z" fill="url(#${d})" stroke="#7a4a00" stroke-width=".8" stroke-linejoin="round"/>
        <circle cx="32" cy="14" r="1.300" fill="#fff6c9"/>`;
    }
  };

  // ---------- icônes de fonctionnalités (24 x 24, trait + accent couleur de la formule) ----------
  const A = 'var(--pc)';
  const FI = {
    games: `<rect x="7.500" y="3" width="13" height="13" rx="2.500" fill="${A}" fill-opacity=".2" stroke="none"/><rect x="7.500" y="3" width="13" height="13" rx="2.500"/><path d="M4.500 7.500V18a2 2 0 002 2H17"/><path d="M11.500 9.500h5M14 7v5" stroke="${A}"/>`,
    prompt: `<rect x="3" y="4" width="18" height="16" rx="3" fill="${A}" fill-opacity=".2" stroke="none"/><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 10l3 2-3 2"/><path d="M12.500 15H17" stroke="${A}"/>`,
    script: `<path d="M8 6.500L3 12l5 5.500M16 6.500l5 5.500-5 5.500"/><path d="M13.700 4.500l-3.400 15" stroke="${A}"/>`,
    shop: `<path d="M4.500 10.500V19a1 1 0 001 1h13a1 1 0 001-1v-8.500z" fill="${A}" fill-opacity=".2" stroke="none"/><path d="M3 10.500L4.600 5h14.800L21 10.500zM4.500 10.500V19a1 1 0 001 1h13a1 1 0 001-1v-8.500"/><path d="M10 20v-4.500h4V20" stroke="${A}"/>`,
    launch: `<path d="M12 2.800c3.500 2 5.100 5.600 4.400 10l-2.400 3.200h-4l-2.400-3.200C6.900 8.400 8.500 4.800 12 2.800z" fill="${A}" fill-opacity=".2" stroke="none"/><path d="M12 2.800c3.500 2 5.100 5.600 4.400 10l-2.400 3.200h-4l-2.400-3.200C6.900 8.400 8.500 4.800 12 2.800z"/><circle cx="12" cy="9.500" r="1.700"/><path d="M10.300 19.200l1.700 2.300 1.700-2.300" stroke="${A}"/><path d="M7.700 13.300L5 15.500l.6 2.500 2.900-1.200M16.300 13.300l2.700 2.200-.6 2.500-2.900-1.200"/>`,
    refresh: `<path d="M19.500 10.500A7.800 7.800 0 005.800 7M4.500 13.500A7.800 7.800 0 0018.200 17"/><path d="M5.500 3v4.300h4.300M18.500 21v-4.300h-4.300"/><circle cx="12" cy="12" r="2.200" fill="${A}" stroke="none"/>`,
    video: `<rect x="3" y="6" width="13" height="12" rx="2.500" fill="${A}" fill-opacity=".2" stroke="none"/><rect x="3" y="6" width="13" height="12" rx="2.500"/><path d="M16 10.200l5-3v9.600l-5-3"/><path d="M8 9.800l3.600 2.200L8 14.200z" fill="${A}" stroke="${A}"/>`,
    chart: `<path d="M3.500 20h17"/><rect x="5" y="13" width="3.200" height="5" rx="1"/><rect x="10.400" y="9.500" width="3.200" height="8.500" rx="1" fill="${A}" fill-opacity=".3"/><rect x="15.800" y="6" width="3.200" height="12" rx="1"/><path d="M5 9.500l5-4 4 2 5-4" stroke="${A}"/><path d="M16.500 3.500H19V6" stroke="${A}"/>`,
    support: `<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="13" width="4.200" height="6.500" rx="1.600" fill="${A}" fill-opacity=".25"/><rect x="16.800" y="13" width="4.200" height="6.500" rx="1.600" fill="${A}" fill-opacity=".25"/><path d="M19 19.500c0 1.400-2 2.300-4.800 2.300"/><circle cx="13.600" cy="21.800" r=".9" fill="${A}" stroke="none"/>`,
    infinite: `<path d="M7.500 8.300a3.700 3.700 0 100 7.400c2.700 0 6.300-7.400 9-7.400a3.700 3.700 0 110 7.400c-2.700 0-6.300-7.400-9-7.400z"/><circle cx="12" cy="12" r="1.500" fill="${A}" stroke="none"/>`,
    team: `<circle cx="9" cy="8" r="3.300" fill="${A}" fill-opacity=".25"/><path d="M3 19.500c.6-3.200 3-5 6-5s5.400 1.800 6 5"/><path d="M15.500 5a3.200 3.200 0 010 6.300M17.500 14.800c2 .7 3.200 2.300 3.500 4.700" stroke="${A}"/>`,
    target: `<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4.300" fill="${A}" fill-opacity=".25"/><circle cx="11" cy="13" r="1.300" fill="${A}" stroke="none"/><path d="M11 13l8.500-8.500M16.500 4.500h3v3" stroke="${A}"/>`,
    bolt: `<path d="M13.500 2.500L5 13.500h6L10 21.500l9-11.500h-6z" fill="${A}" fill-opacity=".25"/>`,
    shield: `<path d="M12 3l7.500 2.800v5.700c0 4.800-3.200 8-7.500 9.500-4.300-1.500-7.500-4.700-7.500-9.500V5.800z" fill="${A}" fill-opacity=".2"/><path d="M8.800 12l2.300 2.300 4.300-4.600" stroke="${A}"/>`,
    plus: `<rect x="3" y="3" width="18" height="18" rx="5" fill="${A}" fill-opacity=".14" stroke="none"/><path d="M12 8v8M8 12h8" stroke="${A}"/>`,
    yes: `<circle cx="12" cy="12" r="9" fill="${A}" fill-opacity=".18" stroke="none"/><path d="M7.800 12.300l2.900 2.900 5.500-6" stroke="${A}" stroke-width="2.200"/>`,
    no: `<path d="M8 12h8" stroke-opacity=".35"/>`,
    clock: `<circle cx="12" cy="12" r="8.500" fill="${A}" fill-opacity=".18"/><path d="M12 7.500V12l3 2"/>`,
    card: `<rect x="2.500" y="5.500" width="19" height="13" rx="2.500" fill="${A}" fill-opacity=".18"/><path d="M2.500 9.500h19M6 15h4"/>`,
    cancel: `<circle cx="12" cy="12" r="8.500"/><path d="M9 9l6 6M15 9l-6 6" stroke="${A}"/>`
  };

  window.PA = {
    emblem: id => `<svg class="pa-emb" viewBox="0 0 64 64" aria-hidden="true">${(EMB[id] || EMB.starter)()}</svg>`,
    fi: name => `<svg class="pa-fi" viewBox="0 0 24 24" aria-hidden="true">${FI[name] || FI.yes}</svg>`,
    ticket: () => { const a = uid(), b = uid(); return `<svg class="pa-ticket" viewBox="0 0 64 64" aria-hidden="true"><defs>${lg(a, '#ffffff', '#ffd5e0')}${lg(b, '#ff2d55', '#c2003a')}</defs>
      <g transform="rotate(-14 32 32)"><path d="M8 18h48v8a6 6 0 000 12v8H8v-8a6 6 0 000-12z" fill="url(#${a})"/><path d="M8 18h48v4H8z" fill="#fff" opacity=".6"/>
      <path d="M42 20v24" stroke="#ff2d55" stroke-width="1.600" stroke-dasharray="2.500 2.500"/>
      <circle cx="22" cy="27" r="3.600" fill="none" stroke="url(#${b})" stroke-width="2.600"/><circle cx="31" cy="37" r="3.600" fill="none" stroke="url(#${b})" stroke-width="2.600"/><path d="M33 24l-13 16" stroke="url(#${b})" stroke-width="2.800" stroke-linecap="round"/>
      <path d="M48 27v10" stroke="#c2003a" stroke-width="2.400" stroke-linecap="round"/></g></svg>`; },
    seal: days => { const a = uid(), b = uid(); const teeth = Array.from({ length: 24 }, (_, i) => { const t = i / 24 * Math.PI * 2, r = i % 2 ? 29 : 31.500; return `${(32 + Math.cos(t) * r).toFixed(2)},${(32 + Math.sin(t) * r).toFixed(2)}`; }).join(' ');
      return `<svg class="pa-seal" viewBox="0 0 64 64" aria-hidden="true"><defs>${lg(a, '#5ff0b0', '#0f9d63')}${lg(b, '#0b3d2a', '#062419')}</defs><polygon points="${teeth}" fill="url(#${a})"/><circle cx="32" cy="32" r="24" fill="url(#${b})"/><circle cx="32" cy="32" r="21" fill="none" stroke="#5ff0b0" stroke-width="1" stroke-dasharray="1.500 2.500"/>
      <path d="M32 15l9 3.300v6.700c0 5.700-3.800 9.500-9 11.300-5.200-1.800-9-5.600-9-11.300v-6.700z" fill="#5ff0b0" fill-opacity=".18" stroke="#5ff0b0" stroke-width="1.600"/><path d="M28 25l3 3 5.500-6" stroke="#5ff0b0" stroke-width="2.200" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="32" y="47.500" text-anchor="middle" font-family="Bricolage Grotesque, Inter, sans-serif" font-weight="800" font-size="9" fill="#eafff5">${days} JOURS</text></svg>`; }
  };
})();
