/* Studio interactif : une map Roblox-like où les prompts font apparaître des éléments en direct.
   Démo marketing jouable. Le moteur voxel est partagé avec le reste du site (BloxiaEngine). */
(function () {
  var E = window.BloxiaEngine; if (!E) return;
  var $ = function (s) { return document.querySelector(s); };
  var N = 14, THEMES = E.THEMES;
  var cv = $('#smap'); if (!cv) return;
  var world = new E.World(cv, { interactive: true, autoRotate: true, speed: .4, scale: 1.08, offsetY: .08, dust: true });
  var theme = 'grass';
  var heights = [], base = [], added = [], count = 0, busy = false;
  var model = 'flash';
  var MODELS = { flash: { name: 'Bloxia Flash', delay: 450, tag: 'rapide' }, pro: { name: 'Bloxia Pro', delay: 950, tag: 'détaillé' }, max: { name: 'Bloxia Max', delay: 1500, tag: 'maximum' } };

  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function key(x, y, z) { return x + ',' + y + ',' + z; }

  // ----- terrain de base : collines douces -----
  function buildBase() {
    base = []; heights = [];
    var th = THEMES[theme];
    for (var x = 0; x < N; x++) { heights[x] = []; for (var y = 0; y < N; y++) {
      var d = Math.hypot(x - 6.5, y - 6.5) / 7;
      var h = Math.max(1, Math.round(2 + Math.sin(x * .7) * .9 + Math.cos(y * .6) * .9 - d * 1.6));
      heights[x][y] = h;
      for (var z = 0; z < h; z++) base.push({ x: x, y: y, z: z, c: z === h - 1 ? th.ground : (z === 0 ? th.rock : th.trunk), type: undefined });
    } }
  }
  function topFree() { // cellule de terrain libre (sans élément posé au-dessus)
    for (var tries = 0; tries < 40; tries++) { var x = rnd(1, N - 2), y = rnd(1, N - 2); if (!occupied(x, y)) return [x, y]; }
    return [rnd(1, N - 2), rnd(1, N - 2)];
  }
  function occupied(x, y) { return added.some(function (b) { return b.x === x && b.y === y && b.z >= heights[x][y]; }); }

  // ----- générateurs d'éléments -----
  function addTrees(n) { n = n || rnd(4, 6); var th = THEMES[theme], leaf = theme === 'snow' ? '#eaf4ff' : theme === 'island' ? '#3fbf6a' : theme === 'jungle' ? '#2a7a35' : '#2f9a45';
    for (var i = 0; i < n; i++) { var p = topFree(), x = p[0], y = p[1], h = heights[x][y];
      added.push({ x: x, y: y, z: h, c: th.trunk }, { x: x, y: y, z: h + 1, c: th.trunk }, { x: x, y: y, z: h + 2, c: leaf }, { x: x, y: y, z: h + 3, c: leaf, type: 'glow' }); } return n + ' arbres'; }
  function addMountain() { var cx = rnd(3, N - 4), cy = rnd(3, N - 4), H = rnd(5, 8), th = THEMES[theme];
    for (var r = 0; r <= 3; r++) { var zTop = Math.round(H * (1 - r / 3.5)); for (var dx = -r; dx <= r; dx++) for (var dy = -r; dy <= r; dy++) { if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; var x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x > N - 2 || y > N - 2) continue; for (var z = heights[x] ? heights[x][y] : 1; z < heights[x][y] + zTop; z++) added.push({ x: x, y: y, z: z, c: z >= heights[x][y] + zTop - 1 && theme !== 'snow' ? '#eef3fb' : th.rock }); if (heights[x]) heights[x][y] += zTop; } } return 'une montagne'; }
  function addWater() { var cx = rnd(3, N - 4), cy = rnd(3, N - 4), R = rnd(2, 3), th = THEMES[theme];
    for (var dx = -R; dx <= R; dx++) for (var dy = -R; dy <= R; dy++) { var x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x > N - 2 || y > N - 2 || Math.hypot(dx, dy) > R) continue;
      base = base.filter(function (b) { return !(b.x === x && b.y === y && b.z >= 1); }); heights[x][y] = 1; added.push({ x: x, y: y, z: 0, c: th.liquid, type: 'liq' }); } return 'un lac'; }
  function addRocks(n) { n = n || rnd(3, 5); var th = THEMES[theme]; for (var i = 0; i < n; i++) { var p = topFree(), x = p[0], y = p[1], h = heights[x][y]; added.push({ x: x, y: y, z: h, c: th.rock }, { x: x, y: y, z: h + 1, c: '#9aa0ab' }); } return n + ' rochers'; }
  function addHouses(n) { n = n || rnd(1, 2); for (var i = 0; i < n; i++) { var cx = rnd(2, N - 4), cy = rnd(2, N - 4), h0 = heights[cx] ? heights[cx][cy] : 1, wall = '#e6c9a0', roof = '#c0453e';
    for (var dx = 0; dx < 3; dx++) for (var dy = 0; dy < 3; dy++) for (var z = 0; z < 3; z++) { var x = cx + dx, y = cy + dy; if (x > N - 2 || y > N - 2) continue; var edge = dx === 0 || dy === 0 || dx === 2 || dy === 2; if (edge || z === 0) added.push({ x: x, y: y, z: h0 + z, c: wall }); }
    for (var dx2 = 0; dx2 < 3; dx2++) for (var dy2 = 0; dy2 < 3; dy2++) { var x2 = cx + dx2, y2 = cy + dy2; if (x2 > N - 2 || y2 > N - 2) continue; added.push({ x: x2, y: y2, z: h0 + 3, c: roof }); } } return n > 1 ? n + ' maisons' : 'une maison'; }
  function addCastle() { var cx = 5, cy = 5, th = THEMES[theme]; for (var dx = 0; dx < 4; dx++) for (var dy = 0; dy < 4; dy++) for (var z = 0; z < 4; z++) { var edge = dx === 0 || dy === 0 || dx === 3 || dy === 3; if (edge) added.push({ x: cx + dx, y: cy + dy, z: (heights[cx][cy]) + z, c: '#9aa0ab' }); }
    [[0, 0], [3, 0], [0, 3], [3, 3]].forEach(function (c) { added.push({ x: cx + c[0], y: cy + c[1], z: heights[cx][cy] + 4, c: '#7f858f' }, { x: cx + c[0], y: cy + c[1], z: heights[cx][cy] + 5, c: th.glow, type: 'glow' }); }); return 'un château'; }
  function addFlowers(n) { n = n || rnd(5, 8); var pal = ['#ff6fa8', '#ffd23d', '#8f6bff', '#5be3ff', '#ff7a3d']; for (var i = 0; i < n; i++) { var p = topFree(), x = p[0], y = p[1]; added.push({ x: x, y: y, z: heights[x][y], c: pal[rnd(0, pal.length - 1)], type: 'glow' }); } return 'des fleurs'; }
  function addCrystals(n) { n = n || rnd(4, 6); var th = THEMES[theme]; for (var i = 0; i < n; i++) { var p = topFree(), x = p[0], y = p[1], h = heights[x][y]; added.push({ x: x, y: y, z: h, c: th.glow, type: 'glow' }, { x: x, y: y, z: h + 1, c: th.deco, type: 'glow' }); } return 'des cristaux'; }
  function addCampfire() { var p = topFree(), x = p[0], y = p[1], h = heights[x][y]; added.push({ x: x, y: y, z: h, c: '#6b4a2b' }, { x: x, y: y, z: h + 1, c: '#ff5a1f', type: 'glow' }, { x: x, y: y, z: h + 2, c: '#ffd23d', type: 'glow' }); return 'un feu de camp'; }
  function setTheme(t) { theme = t; buildBase(); return THEMES[t].fr.toLowerCase(); }

  // ----- compréhension du prompt -----
  var RULES = [
    [/(foret|arbre|tree|forest|bois|sapin)/, function (q) { var m = (q.match(/\d+/) || [])[0]; return addTrees(m ? Math.min(12, +m) : 0); }],
    [/(montagne|mountain|colline|falaise|cliff)/, addMountain],
    [/(eau|lac|riviere|ocean|mer|water|lake|river|etang)/, addWater],
    [/(roche|rocher|pierre|rock|stone|caillou)/, function (q) { var m = (q.match(/\d+/) || [])[0]; return addRocks(m ? Math.min(12, +m) : 0); }],
    [/(maison|house|batiment|building|cabane|hut)/, function (q) { var m = (q.match(/\d+/) || [])[0]; return addHouses(m ? Math.min(6, +m) : 0); }],
    [/(ville|village|city|town)/, function () { addHouses(3); addTrees(3); return 'un village'; }],
    [/(chateau|castle|fort|tour|tower)/, addCastle],
    [/(fleur|flower|jardin|garden)/, addFlowers],
    [/(cristal|crystal|gemme|diamant|gem)/, addCrystals],
    [/(feu|campfire|camp|flamme|bonfire)/, addCampfire],
    [/(neige|snow|hiver|winter|glace|frozen)/, function () { return 'thème ' + setTheme('snow'); }],
    [/(lave|lava|volcan|volcano)/, function () { var t = setTheme('lava'); addWater(); return 'thème ' + t; }],
    [/(espace|space|lune|mars|cosmic|galaxie)/, function () { return 'thème ' + setTheme('space'); }],
    [/(jungle|foret tropicale|tropical)/, function () { var t = setTheme('jungle'); addTrees(6); return 'une ' + t; }],
    [/(bonbon|candy|sucre|sweet)/, function () { return 'thème ' + setTheme('candy'); }],
    [/(ile|island|plage|beach|tropic)/, function () { var t = setTheme('island'); addWater(); addTrees(4); return 'une ' + t; }],
    [/(ville neon|neon|cyber|futur)/, function () { var t = setTheme('city'); addHouses(2); return 'une ville ' + t; }],
    [/(hante|horreur|horror|spooky|manoir|zombie)/, function () { var t = setTheme('horror'); addTrees(4); return 'un décor ' + t; }],
    [/(vide|reset|efface|clear|recommence|nettoie)/, function () { reset(); return 'map réinitialisée'; }]
  ];

  function handle(q) {
    var n = norm(q), msgs = [], matched = false;
    for (var i = 0; i < RULES.length; i++) { if (RULES[i][0].test(n)) { matched = true; var r = RULES[i][1](n); if (r) msgs.push(r); } }
    if (!matched) { msgs.push(addTrees(3)); msgs.push('quelques éléments'); }
    return msgs;
  }

  function rebuild(anim) {
    var all = base.concat(added);
    world.set(all, theme, { duration: anim ? 700 : 1, animate: anim !== false });
    $('#s-count').textContent = added.length;
    $('#s-theme').textContent = THEMES[theme].fr;
  }
  function reset() { count = 0; added = []; theme = 'grass'; buildBase(); $('#s-log').innerHTML = ''; }

  // ----- UI -----
  function overlay(on, label) { var o = $('#s-gen'); if (!o) return; o.classList.toggle('on', on); if (label) o.querySelector('b').textContent = label; }
  function toast(t) { var e = $('#s-toast'); if (!e) return; e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2200); }
  function logItem(t) { var l = $('#s-log'); if (!l) return; var d = document.createElement('div'); d.className = 's-li'; d.innerHTML = '<span class="s-dot"></span>' + t; l.insertBefore(d, l.firstChild); while (l.children.length > 6) l.removeChild(l.lastChild); }

  function submit(q) {
    if (busy || !q.trim()) return; busy = true;
    var M = MODELS[model];
    overlay(true, M.name + ' construit…');
    setTimeout(function () {
      var msgs = handle(q);
      rebuild(true);
      overlay(false);
      count++;
      var added2 = msgs.join(', ');
      toast('Ajouté : ' + added2);
      logItem(added2.charAt(0).toUpperCase() + added2.slice(1));
      busy = false;
      $('#s-input').value = '';
    }, M.delay);
  }

  // init
  buildBase(); rebuild(false);
  var form = $('#s-form'); if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submit($('#s-input').value); });
  document.querySelectorAll('.s-chip').forEach(function (c) { c.addEventListener('click', function () { $('#s-input').value = c.dataset.q || c.textContent; submit($('#s-input').value); }); });
  document.querySelectorAll('.s-model').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('.s-model').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); model = b.dataset.m; }); });
  var rb = $('#s-reset'); if (rb) rb.addEventListener('click', function () { reset(); rebuild(true); toast('Map réinitialisée'); });
})();
