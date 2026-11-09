/* Bloxia : analyse de la phrase, générateurs de map, rendu voxel isométrique, aperçu du pack. */
(function () {
  const N = 14;
  const THEMES = {
    lava:   { fr: 'Volcan',  en: 'Volcano', icon: 'flame',     ground: '#3a2a2e', rock: '#5a3a38', liquid: '#ff5a1f', deco: '#ffb347', trunk: '#2a1a1a', sky: ['#3a0f0a', '#0a0305'], glow: '#ff6a3d', lava: true },
    snow:   { fr: 'Glace',   en: 'Frozen',  icon: 'snowflake', ground: '#dfeaf7', rock: '#a9c3de', liquid: '#6fb7ff', deco: '#ffffff', trunk: '#7a8aa0', sky: ['#14305a', '#050a14'], glow: '#7fc4ff' },
    city:   { fr: 'Ville',   en: 'Neon',    icon: 'building',  ground: '#3b4256', rock: '#262b3a', liquid: '#2a3350', deco: '#ffd166', trunk: '#262b3a', sky: ['#1b1550', '#070712'], glow: '#8f6bff' },
    space:  { fr: 'Espace',  en: 'Cosmic',  icon: 'planet',    ground: '#6b6f85', rock: '#454a63', liquid: '#7a5cff', deco: '#9be7ff', trunk: '#454a63', sky: ['#1a1246', '#03030a'], glow: '#9b7bff' },
    horror: { fr: 'Horreur', en: 'Haunted', icon: 'ghost',     ground: '#34402f', rock: '#222a22', liquid: '#3a5a3a', deco: '#c7d0a0', trunk: '#3a3a33', sky: ['#142018', '#030504'], glow: '#7bd88a' },
    island: { fr: 'Île',     en: 'Island',  icon: 'palm',      ground: '#f0d9a0', rock: '#c9a96b', liquid: '#2fb4d9', deco: '#3fbf6a', trunk: '#8a5a2b', sky: ['#0e6a9a', '#08243a'], glow: '#47d1ff' },
    jungle: { fr: 'Jungle',  en: 'Jungle',  icon: 'tree',      ground: '#3f8f4a', rock: '#2a6a35', liquid: '#2a8aa8', deco: '#ffcf4a', trunk: '#6b4a2b', sky: ['#0f4a2a', '#04120a'], glow: '#47e08a' },
    candy:  { fr: 'Bonbons', en: 'Candy',   icon: 'candy',     ground: '#ff9ccf', rock: '#e870b0', liquid: '#b78cff', deco: '#fff1a8', trunk: '#ffffff', sky: ['#6a1f5e', '#14061a'], glow: '#ff7ad1' },
    grass:  { fr: 'Prairie', en: 'Meadow',  icon: 'sprout',    ground: '#5fbf5a', rock: '#8a8f99', liquid: '#3c8cff', deco: '#ffe066', trunk: '#6b4a2b', sky: ['#122c55', '#060a14'], glow: '#5b8cff' }
  };
  const GENRES = {
    obby:      { fr: 'obby',          label: 'Obby',          icon: 'flag',    en: 'obby',          word: 'Rush' },
    tycoon:    { fr: 'tycoon',        label: 'Tycoon',        icon: 'factory', en: 'tycoon',        word: 'Factory' },
    simulator: { fr: 'simulator',     label: 'Simulator',     icon: 'pickaxe', en: 'simulator',     word: 'Simulator' },
    horror:    { fr: "jeu d'horreur", label: 'Horreur',       icon: 'ghost',   en: 'survival horror', word: 'Survival' },
    td:        { fr: 'tower defense', label: 'Tower Defense', icon: 'tower',   en: 'tower defense', word: 'Defense' },
    rp:        { fr: 'roleplay',      label: 'Roleplay',      icon: 'house',   en: 'roleplay',      word: 'Life' }
  };
  const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const GR = [['td', /tower defense|defense|vagues/], ['obby', /obby|parcours|plateforme|saut/], ['tycoon', /tycoon|usine|pizzeria|restaurant|empire|magnat|business/],
    ['simulator', /simulator|simulateur|minage|mine|pets?\b|collect|ferme|farm|peche/], ['horror', /horreur|zombie|survie|hante|fantome|monstre|abandonn/], ['rp', /roleplay|\brp\b|ville|ecole|hopital|famille|vie\b/]];
  const TR = [['space', /espace|mars|galax|planete|lune|spatial|etoile|cosmos/], ['lava', /volcan|lave|feu\b|enfer|magma/], ['snow', /glace|neige|hiver|gele|froid|polaire/],
    ['candy', /bonbon|sucre|gateau|candy/], ['horror', /horreur|zombie|hante|nuit|cimetiere|abandonn|fantome/], ['island', /\bile\b|plage|tropical|pirate|ocean|\bmer\b/],
    ['jungle', /jungle|foret|temple|dinosaure|nature/], ['city', /ville|gratte|urbain|neon|cyber|\brue\b/]];
  function analyze(text) {
    const t = norm(text); let genre = 'obby', theme = 'grass';
    for (const [k, re] of GR) if (re.test(t)) { genre = k; break; }
    for (const [k, re] of TR) if (re.test(t)) { theme = k; break; }
    return { genre, theme, title: THEMES[theme].en + ' ' + GENRES[genre].word };
  }
  const hash = s => { let h = 2166136261; for (const c of s || 'x') { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function vnoise(seed) { const r = rng(seed), g = []; for (let i = 0; i < 20 * 20; i++) g.push(r());
    const sm = t => t * t * (3 - 2 * t);
    return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = sm(x - xi), fy = sm(y - yi), v = (a, b) => g[((yi + b) % 20) * 20 + (xi + a) % 20];
      return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy; }; }
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixc = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

  // ---------- générateurs (déterministes) ----------
  function generate(an, text) {
    const th = THEMES[an.theme], seed = hash(norm(text) + an.genre + an.theme), R = rng(seed), noise = vnoise(seed);
    const B = []; const map = new Map();
    const put = (x, y, z, c, type) => { if (x < 0 || y < 0 || x >= N || y >= N || z < 0) return; const k = x + ',' + y + ',' + z; if (map.has(k)) { map.get(k).c = c; map.get(k).type = type; return; } const b = { x, y, z, c, type }; map.set(k, b); B.push(b); };
    const col = (x, y, h, top, under) => { for (let z = 0; z < h; z++) put(x, y, z, z === h - 1 ? top : under); };
    const liq = th.lava ? 'glow' : 'liq';
    const prop = (x, y, h, h0) => { // arbre / cristal / pierre selon thème
      if (an.theme === 'space' || an.theme === 'candy') { for (let i = 0; i < 2; i++) put(x, y, h0 + i, th.deco, 'glow'); return; }
      if (an.theme === 'horror') { for (let i = 0; i < 2; i++) put(x, y, h0 + i, '#5a5f5a'); return; }
      if (an.theme === 'city') return;
      const leaf = an.theme === 'snow' ? '#eaf4ff' : an.theme === 'lava' ? '#3a2a2e' : an.theme === 'island' ? '#3fbf6a' : '#2f9a45';
      put(x, y, h0, th.trunk); put(x, y, h0 + 1, th.trunk); put(x, y, h0 + 2, leaf);
    };
    if (an.genre === 'obby') {
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) put(x, y, 0, th.liquid, liq);
      const pts = []; let x = 1, y = 1, dir = 1;
      for (let row = 0; row < 5; row++) { for (let i = 0; i < 4; i++) { pts.push([x, y]); x += 3 * dir; } x -= 3 * dir; dir = -dir; y += 3; }
      const pal = [th.glow, th.deco, '#ff7ab2', '#5be3ff', '#b78cff'];
      pts.forEach(([px, py], i) => {
        const z = 1 + Math.floor(i / 4), cp = i % 6 === 5 && i < pts.length - 1, last = i === pts.length - 1;
        const c = last ? '#ffc53d' : cp ? '#2bd68f' : pal[i % pal.length];
        for (let dx = 0; dx < (last ? 3 : 2); dx++) for (let dy = 0; dy < (last ? 3 : 2); dy++) put(px + dx, py + dy, z, c, cp || last ? 'glow' : undefined);
        for (let k = 1; k < z; k++) put(px, py, k, th.rock);
        if (last) { put(px + 1, py + 1, z + 1, '#fff3c4', 'glow'); put(px + 1, py + 1, z + 2, '#ffc53d', 'glow'); }
      });
    } else if (an.genre === 'tycoon') {
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) put(x, y, 0, (x === 0 || y === 0 || x === N - 1 || y === N - 1) ? th.rock : th.ground);
      for (let x = 1; x < 11; x++) { put(x, 7, 1, '#2b2f3c'); put(x, 8, 1, x % 2 ? th.glow : '#2b2f3c', x % 2 ? 'glow' : undefined); }
      [2, 5, 8].forEach(x => { for (let z = 1; z < 4; z++) put(x, 5, z, th.deco); put(x, 6, 1, th.deco); put(x, 6, 2, '#1a1d28'); });
      for (let x = 9; x < 13; x++) for (let y = 1; y < 5; y++) for (let z = 1; z < 4; z++) if (x === 9 || x === 12 || y === 1 || y === 4 || z === 3) put(x, y, z, z === 3 ? th.glow : th.rock);
      for (let i = 0; i < 7; i++) put(1 + Math.floor(R() * 11), 10 + Math.floor(R() * 3), 1, '#ffc53d', 'glow');
    } else if (an.genre === 'rp') {
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) put(x, y, 0, (x % 4 === 3 || y % 4 === 3) ? '#262b3a' : th.ground);
      const pal = [th.glow, '#ff7ab2', '#5be3ff', th.deco, '#ffffff'];
      for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) { const x0 = bx * 4, y0 = by * 4, h = 2 + Math.floor(R() * 6), c = mixc(th.rock, pal[Math.floor(R() * pal.length)], .35);
        for (let x = x0; x < x0 + 3 && x < N; x++) for (let y = y0; y < y0 + 3 && y < N; y++) for (let z = 1; z <= h; z++) put(x, y, z, z === h ? mixc(c, '#ffffff', .25) : c, z % 2 === 0 && R() > .6 ? 'glow' : undefined); }
    } else {
      const td = an.genre === 'td', amp = td ? 1.4 : 5.5;
      const pathY = x => Math.round(N / 2 + Math.sin(x * .6) * 3.5);
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
        const d = Math.hypot(x - N / 2 + .5, y - N / 2 + .5) / (N / 2), n = noise(x * .35 + 2, y * .35 + 2);
        let h = Math.max(1, Math.round(1 + n * amp - Math.max(0, d - .55) * (td ? 1 : 5)));
        if (td && Math.abs(y - pathY(x)) <= 1) { col(x, y, 1, '#d8b779', th.rock); continue; }
        if (h <= 1 && !td) { put(x, y, 0, th.liquid, liq); continue; }
        col(x, y, h, h >= 5 && an.theme !== 'snow' ? th.rock : th.ground, th.rock);
        if (R() > (td ? .93 : .88) && h > 1) prop(x, y, h, h);
      }
      if (td) [[3, 4], [6, 10], [9, 4], [11, 10]].forEach(([x, y]) => { put(x, y, 1, th.glow, 'glow'); put(x, y, 2, th.glow, 'glow'); });
    }
    return { blocks: B, theme: an.theme };
  }

  // ---------- rendu ----------
  class World {
    constructor(cv, o = {}) {
      this.cv = cv; this.x = cv.getContext('2d'); this.o = Object.assign({ autoRotate: true, interactive: false, offsetX: 0, offsetY: 0, scale: 1, speed: 1 }, o);
      this.blocks = []; this.theme = THEMES.grass; this.ang = .6; this.vel = 0; this.dragging = false; this.last = 0; this.idle = 0;
      this.prog = 0; this.target = 0; this.rate = .5; this.visible = true; this.doneCb = null; this.t = performance.now();
      this.ro = new ResizeObserver(() => { this.fit(); if (this.paused) this.frame(performance.now()); }); this.ro.observe(cv); this.fit();
      if ('IntersectionObserver' in window) { this.io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; }); this.io.observe(cv); }
      document.addEventListener('visibilitychange', () => { this.hidden = document.hidden; });
      if (this.o.interactive) this.bind();
      const loop = t => { if (this.dead) return; requestAnimationFrame(loop); if (this.visible && !this.hidden && !this.paused) this.frame(t); }; requestAnimationFrame(loop);
    }
    fit() { const d = Math.min(devicePixelRatio || 1, 2); this.cv.width = Math.max(2, this.cv.clientWidth * d); this.cv.height = Math.max(2, this.cv.clientHeight * d); this.d = d; }
    bind() {
      const c = this.cv; let px = 0;
      c.style.touchAction = 'pan-y'; c.style.cursor = 'grab';
      c.addEventListener('pointerdown', e => { this.dragging = true; px = e.clientX; this.vel = 0; c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; });
      c.addEventListener('pointermove', e => { if (!this.dragging) return; const dx = e.clientX - px; px = e.clientX; this.ang += dx * .008; this.vel = dx * .008; this.idle = 0; });
      const up = () => { this.dragging = false; this.idle = performance.now(); c.style.cursor = 'grab'; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
    still(ang) { if (ang != null) this.ang = ang; this.snapReveal(1); this.paused = false; this.frame(performance.now()); this.paused = true; }
    destroy() { this.dead = true; this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); }
    configure(o) { Object.assign(this.o, o); }
    spin(on) { this.o.autoRotate = on; }
    set(blocks, theme, opt = {}) {
      this.theme = THEMES[theme] || this.theme;
      const sorted = blocks.slice().sort((a, b) => a.z - b.z || (a.x + a.y) - (b.x + b.y) || a.x - b.x || a.y - b.y);
      this.blocks = sorted; this.map = new Map(sorted.map(b => [b.x + ',' + b.y + ',' + b.z, b]));
      const n = sorted.length; sorted.forEach((b, i) => { b.r = i / n; b.rgb = rgb(b.c); b.t0 = -1; b.ph = Math.random() * 6.28; });
      this.surface = sorted.filter(b => [[0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]].some(([dx, dy, dz]) => !this.map.has((b.x + dx) + ',' + (b.y + dy) + ',' + (b.z + dz))));
      this.doneCb = opt.done || null; this.doneFired = false;
      if (opt.animate === false) this.snapReveal(1); else { this.prog = 0; this.target = 1; this.rate = 1 / ((opt.duration || 2200) / 1000); }
    }
    reveal(p) { if (p < this.prog) this.prog = p; this.target = p; this.rate = .6; }
    snapReveal(p) { this.prog = this.target = p; for (const b of this.blocks) b.t0 = b.r <= p ? -1e9 : -1; }
    frame(t) {
      const dt = Math.min(.05, (t - this.t) / 1000); this.t = t; const x = this.x, W = this.cv.width, H = this.cv.height, d = this.d;
      // progression de construction
      if (this.prog < this.target) this.prog = Math.min(this.target, this.prog + this.rate * dt);
      else if (this.prog > this.target) { this.prog = this.target; }
      for (const b of this.blocks) { if (b.r <= this.prog) { if (b.t0 === -1) b.t0 = t; } else if (b.t0 !== -1 && this.target < 1) b.t0 = -1; }
      if (!this.doneFired && this.prog >= 1 && this.doneCb) { this.doneFired = true; setTimeout(() => this.doneCb && this.doneCb(), 500); }
      // rotation
      if (!this.dragging) { this.vel *= .94; this.ang += this.vel; if (this.o.autoRotate && (!this.idle || t - this.idle > 2200)) this.ang += dt * .22 * this.o.speed; }
      x.clearRect(0, 0, W, H);
      const u = Math.min(W / (N * 1.08), H / (N * .5 + 5.2)) * this.o.scale, tw = u, th = u / 2, bh = th * .8;
      const cx = W / 2 + this.o.offsetX * W, cy = H / 2 + this.o.offsetY * H + 2 * bh, ca = Math.cos(this.ang), sa = Math.sin(this.ang);
      const P = (rx, ry, z) => [cx + (rx - ry) * tw / 2, cy + (rx + ry) * th / 2 - z * bh];
      const g = x.createRadialGradient(cx, cy + th, 0, cx, cy + th, tw * N * .5); g.addColorStop(0, this.theme.glow + '55'); g.addColorStop(1, this.theme.glow + '00');
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy + th, tw * N * .55, th * N * .5, 0, 0, 7); x.fill();
      const tt = t / 1000, items = [];
      for (const b of this.surface) { if (b.t0 === -1) continue; const a = Math.min(1, (t - b.t0) / 520); if (a <= 0) continue;
        const ox = b.x - N / 2 + .5, oy = b.y - N / 2 + .5, rx = ox * ca - oy * sa, ry = ox * sa + oy * ca; items.push([rx + ry + b.z, b, rx, ry, a]); }
      items.sort((p, q) => p[0] - q[0]);
      x.lineJoin = 'round'; x.lineWidth = Math.max(1, d * .6); x.strokeStyle = 'rgba(0,0,0,.2)';
      const off = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], nrm = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [, b, rx, ry, a] of items) {
        const fall = (1 - a) * (1 - a) * 9, z0 = b.z + fall; let f = 1;
        if (b.type === 'liq') f = .9 + Math.sin(tt * 1.6 + b.x * .8 + b.y * .6) * .1; else if (b.type === 'glow') f = 1.02 + Math.sin(tt * 2.2 + b.ph) * .1;
        const fill = k => `rgb(${Math.min(255, b.rgb[0] * f * k) | 0},${Math.min(255, b.rgb[1] * f * k) | 0},${Math.min(255, b.rgb[2] * f * k) | 0})`;
        x.globalAlpha = a;
        const C = off.map(([dx, dy]) => [rx + dx * ca - dy * sa, ry + dx * sa + dy * ca]);
        for (let i = 0; i < 4; i++) { const [nx, ny] = nrm[i]; if (this.map.has((b.x + nx) + ',' + (b.y + ny) + ',' + b.z)) continue;
          const nxr = nx * ca - ny * sa, nyr = nx * sa + ny * ca; if (nxr + nyr <= .001) continue;
          const A = C[i], Bc = C[(i + 1) % 4], p = [P(A[0], A[1], z0 + 1), P(Bc[0], Bc[1], z0 + 1), P(Bc[0], Bc[1], z0), P(A[0], A[1], z0)];
          x.fillStyle = fill(.7 + .13 * (nxr - nyr)); x.beginPath(); x.moveTo(...p[0]); x.lineTo(...p[1]); x.lineTo(...p[2]); x.lineTo(...p[3]); x.closePath(); x.fill(); x.stroke(); }
        if (!this.map.has(b.x + ',' + b.y + ',' + (b.z + 1))) { const p = C.map(c => P(c[0], c[1], z0 + 1));
          x.fillStyle = fill(1); x.beginPath(); x.moveTo(...p[0]); for (let i = 1; i < 4; i++) x.lineTo(...p[i]); x.closePath(); x.fill(); x.stroke(); }
      }
      x.globalAlpha = 1;
    }
  }

  // ---------- aperçu du pack ----------
  function makePack(an, idea) {
    const th = THEMES[an.theme], ge = GENRES[an.genre], q = (idea || '').replace(/"/g, "'").slice(0, 180) || 'a Roblox game';
    const shops = {
      obby: [['Double saut', 'Gamepass', 'R$ 249'], ['Passer un niveau', 'Dev product', 'R$ 25'], ['Traînée néon', 'Gamepass', 'R$ 149'], ['Checkpoint bonus', 'Dev product', 'R$ 15']],
      tycoon: [['Revenus x2', 'Gamepass', 'R$ 399'], ['Dropper doré', 'Dev product', 'R$ 49'], ['Collecteur auto', 'Gamepass', 'R$ 199'], ['Pack de départ', 'Dev product', 'R$ 29']],
      simulator: [['Gains x2', 'Gamepass', 'R$ 349'], ['Sac agrandi', 'Gamepass', 'R$ 199'], ['Boost 15 min', 'Dev product', 'R$ 39'], ['Compagnon rare', 'Dev product', 'R$ 99']],
      horror: [['Lampe renforcée', 'Gamepass', 'R$ 199'], ['Seconde vie', 'Dev product', 'R$ 29'], ['Zone VIP', 'Gamepass', 'R$ 299'], ['Pack de soins', 'Dev product', 'R$ 19']],
      td: [['Tour spéciale', 'Gamepass', 'R$ 299'], ['Vitesse x2', 'Gamepass', 'R$ 149'], ['Pièces bonus', 'Dev product', 'R$ 49'], ['Réparation', 'Dev product', 'R$ 19']],
      rp: [['Maison premium', 'Gamepass', 'R$ 399'], ['Voiture de sport', 'Gamepass', 'R$ 249'], ['Tenue rare', 'Dev product', 'R$ 59'], ['Métier VIP', 'Gamepass', 'R$ 199']]
    }[an.genre];
    const first = `You are my Roblox Studio assistant. I am building a ${ge.en} set in a ${th.en.toLowerCase()} world.\nGame idea: "${q}".\n\nStep 1. Build the base map on a 14 x 14 stud grid with Parts only (no meshes), mobile-friendly:\n- Use these colors: ground ${th.ground}, rock ${th.rock}, accent ${th.glow}.\n- Name every Part clearly and group them in Models inside Workspace.Map.\n- Add a SpawnLocation at the start. Keep the total under 800 Parts.\nWhen done, list what you created and wait for step 2.`;
    return {
      title: an.title, scriptName: 'GameManager.server.lua',
      prompts: [{ title: 'Construire la map de base', text: first }, { title: 'Ajouter le gameplay' }, { title: 'Ambiance, sons et éclairage' }, { title: 'Optimiser pour mobile' }],
      script: ['-- GameManager : points de sauvegarde et argent', 'local Players = game:GetService("Players")', 'local DataStore = game:GetService("DataStoreService"):GetDataStore("v1")', '', 'Players.PlayerAdded:Connect(function(player)', '  local stats = Instance.new("Folder", player)', '  stats.Name = "leaderstats"', '  local cash = Instance.new("IntValue", stats)'],
      shop: shops.map(([name, type, price]) => ({ name, type, price })),
      launch: ['Icône et miniatures', 'Titre et description', '3 vidéos TikTok / Shorts', 'Semaine 2 : garder tes joueurs'],
      fake: 'local reward = math.floor(base * multiplier) + bonus\nif player:GetAttribute("VIP") then reward *= 2 end\nDataStore:UpdateAsync(player.UserId, function(old) return (old or 0) + reward end)\nTween(ui.Cash, {Size = UDim2.fromScale(1.1, 1.1)}, 0.2)\nwarn("Sauvegarde terminée pour " .. player.Name)'
    };
  }
  window.BloxiaEngine = { World, analyze, generate, makePack, THEMES, GENRES, norm };
})();
