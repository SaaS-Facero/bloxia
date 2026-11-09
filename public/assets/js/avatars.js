/* Guides Bloxia : personnages originaux en SVG (bustes de blocs). */
(function () {
  const face = (skin, shade) => `<rect x="42" y="58" width="16" height="16" fill="${shade}"/><rect x="26" y="14" width="48" height="50" rx="12" fill="${skin}"/><rect x="22" y="36" width="6" height="12" rx="3" fill="${shade}"/><rect x="72" y="36" width="6" height="12" rx="3" fill="${shade}"/>`;
  const eyes = `<rect x="39" y="38" width="6" height="9" rx="2.500" fill="#1b1b24"/><rect x="55" y="38" width="6" height="9" rx="2.500" fill="#1b1b24"/><rect x="40.500" y="39.500" width="2" height="2.500" rx="1" fill="#fff"/><rect x="56.500" y="39.500" width="2" height="2.500" rx="1" fill="#fff"/>`;
  const smile = `<path d="M42 54q8 7 16 0" stroke="#1b1b24" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="34" cy="51" r="3.500" fill="#ff7a7a" opacity=".35"/><circle cx="66" cy="51" r="3.500" fill="#ff7a7a" opacity=".35"/>`;
  const body = c => `<path d="M10 100V88a16 14 0 0 1 16-14h48a16 14 0 0 1 16 14v12z" fill="${c}"/>`;
  const G = {
    pixel: () => body('#1d4ed8') + `<path d="M42 78l8 8 8-8" fill="none" stroke="#93c5fd" stroke-width="3" stroke-linecap="round"/>` + face('#f1c27d', '#d9a55c') + eyes + smile +
      `<path d="M24 32a26 22 0 0 1 52 0v5H24z" fill="#2563eb"/><rect x="18" y="31" width="42" height="8" rx="3.500" fill="#1d4ed8"/><path d="M50 14l5 3-5 3-5-3z" fill="#fbbf24"/>`,
    nova: () => `<rect x="20" y="8" width="60" height="44" rx="16" fill="#6d28d9"/><circle cx="50" cy="8" r="9" fill="#7c3aed"/>` + body('#4c1d95') + face('#c68642', '#a96d30') + eyes + smile +
      `<path d="M26 36V28a24 20 0 0 1 48 0v8q-10-12-24-8q-14-4-24 8z" fill="#8b5cf6"/><path d="M23 42a27 30 0 0 1 54 0" stroke="#fbbf24" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="15" y="38" width="11" height="20" rx="5" fill="#fbbf24"/><rect x="74" y="38" width="11" height="20" rx="5" fill="#fbbf24"/>`,
    rex: () => body('#92400e') + `<path d="M36 76q14 14 28 0" stroke="#ffc53d" stroke-width="3.500" fill="none" stroke-linecap="round"/><circle cx="50" cy="90" r="4" fill="#ffc53d"/>` + face('#e0ac69', '#c4904f') +
      `<path d="M26 32a24 22 0 0 1 48 0v4H26z" fill="#1f1b16"/><rect x="32" y="36" width="16" height="11" rx="3.500" fill="#0b0b10" stroke="#ffc53d" stroke-width="2"/><rect x="52" y="36" width="16" height="11" rx="3.500" fill="#0b0b10" stroke="#ffc53d" stroke-width="2"/><rect x="47" y="39" width="6" height="2.500" fill="#ffc53d"/>` +
      `<path d="M43 55q7 6 14 0" stroke="#1b1b24" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 58h12v6q-6 4-12 0z" fill="#1f1b16"/>`
  };
  window.AV = { svg: (id, cls = '') => `<svg class="av ${cls}" viewBox="0 0 100 100" aria-hidden="true">${(G[id] || G.pixel)()}</svg>` };
})();
