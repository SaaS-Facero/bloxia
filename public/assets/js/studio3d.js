/* Studio 3D : scène de jeu originale (Three.js) pilotée par un chat. Les prompts font apparaître
   arbres, montagnes, eau, maisons… en direct. Démo marketing. Assets procéduraux originaux. */
(function () {
  if (!window.THREE) { var w = document.getElementById('s3-wait'); if (w) w.textContent = 'Chargement du moteur 3D…'; return; }
  var T = window.THREE;
  var host = document.getElementById('s3-canvas'); if (!host) return;

  // ---------- rendu ----------
  var renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding;
  host.appendChild(renderer.domElement);

  var scene = new T.Scene();
  scene.background = new T.Color('#9fd3ff');
  scene.fog = new T.Fog('#9fd3ff', 42, 95);

  var camera = new T.PerspectiveCamera(50, 1, 0.1, 300);

  // lumières
  var hemi = new T.HemisphereLight('#dff1ff', '#5a7a4a', 0.9); scene.add(hemi);
  var sun = new T.DirectionalLight('#fff6e0', 1.25); sun.position.set(28, 44, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 140;
  var sc = 48; sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc; sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc; sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ---------- terrain ----------
  var SIZE = 60, SEG = 60;
  function terrainH(x, z) { return Math.sin(x * 0.12) * 1.5 + Math.cos(z * 0.11) * 1.5 + Math.sin((x + z) * 0.07) * 1.1; }
  var geo = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), z = pos.getZ(i); pos.setY(i, terrainH(x, z)); }
  geo.computeVertexNormals();
  var grassMat = new T.MeshStandardMaterial({ color: '#63c24f', flatShading: true, roughness: 1 });
  var ground = new T.Mesh(geo, grassMat); ground.receiveShadow = true; scene.add(ground);

  // eau (désactivée au départ, activée par "lac")
  var waterMat = new T.MeshStandardMaterial({ color: '#2f9fe0', transparent: true, opacity: 0.8, roughness: 0.2, metalness: 0.3 });
  var water = new T.Mesh(new T.CircleGeometry(7, 40), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = -0.4; water.visible = false; scene.add(water);

  var group = new T.Group(); scene.add(group); // tout ce qu'on ajoute

  // ---------- personnage original (blocs) ----------
  function makeChar() {
    var g = new T.Group();
    var skin = new T.MeshStandardMaterial({ color: '#f1c088', flatShading: true });
    var shirt = new T.MeshStandardMaterial({ color: '#4f6bed', flatShading: true });
    var pants = new T.MeshStandardMaterial({ color: '#2a2f45', flatShading: true });
    function box(w, h, d, m, y, x) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x || 0, y, 0); b.castShadow = true; g.add(b); return b; }
    box(1.1, 1.1, 0.7, shirt, 1.5);            // torse
    box(0.8, 0.8, 0.8, skin, 2.5);             // tête
    box(0.32, 1.0, 0.32, skin, 1.5, 0.75);     // bras
    box(0.32, 1.0, 0.32, skin, 1.5, -0.75);
    box(0.42, 1.0, 0.42, pants, 0.5, 0.28);    // jambes
    box(0.42, 1.0, 0.42, pants, 0.5, -0.28);
    var eyeMat = new T.MeshStandardMaterial({ color: '#1a1a22' });
    [0.18, -0.18].forEach(function (ex) { var e = new T.Mesh(new T.BoxGeometry(0.12, 0.14, 0.06), eyeMat); e.position.set(ex, 2.55, 0.42); g.add(e); });
    return g;
  }
  var hero = makeChar(); hero.position.set(0, terrainH(0, 0), 0); scene.add(hero);

  // ---------- fabrique d'éléments ----------
  var spawned = [];
  function pop(obj) { // animation d'apparition
    obj.scale.set(0.01, 0.01, 0.01); var t0 = performance.now();
    obj.userData.anim = function (t) { var k = Math.min(1, (t - t0) / 420), e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1, s = e * (k < .7 ? 1 : 1) ; obj.scale.setScalar(k < 1 ? e * (k < .8 ? 1.12 : 1) : 1); if (k >= 1) { obj.scale.setScalar(1); obj.userData.anim = null; } };
    spawned.push(obj); group.add(obj);
  }
  function freePos(min, max) { var r = (max || 24), a = Math.random() * Math.PI * 2, d = (min || 5) + Math.random() * (r - (min || 5)); return [Math.cos(a) * d, Math.sin(a) * d]; }
  function tree() { var p = freePos(4, 25), x = p[0], z = p[1], g = new T.Group();
    var trunk = new T.Mesh(new T.CylinderGeometry(0.28, 0.38, 1.6, 6), new T.MeshStandardMaterial({ color: '#7a4a24', flatShading: true })); trunk.position.y = 0.8; trunk.castShadow = true; g.add(trunk);
    var leafMat = new T.MeshStandardMaterial({ color: ['#2e9e46', '#38b155', '#249a52'][Math.floor(Math.random() * 3)], flatShading: true });
    var c1 = new T.Mesh(new T.ConeGeometry(1.5, 2.2, 7), leafMat); c1.position.y = 2.3; c1.castShadow = true; g.add(c1);
    var c2 = new T.Mesh(new T.ConeGeometry(1.1, 1.8, 7), leafMat); c2.position.y = 3.3; c2.castShadow = true; g.add(c2);
    g.position.set(x, terrainH(x, z), z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function rock() { var p = freePos(4, 26), x = p[0], z = p[1];
    var m = new T.Mesh(new T.DodecahedronGeometry(0.7 + Math.random() * 0.6, 0), new T.MeshStandardMaterial({ color: '#8b9099', flatShading: true }));
    m.position.set(x, terrainH(x, z) + 0.3, z); m.rotation.set(Math.random(), Math.random(), Math.random()); m.castShadow = true; pop(m); }
  function mountain() { var p = freePos(10, 26), x = p[0], z = p[1], g = new T.Group();
    var h = 7 + Math.random() * 5, m = new T.Mesh(new T.ConeGeometry(5, h, 6), new T.MeshStandardMaterial({ color: '#7d8691', flatShading: true })); m.position.y = h / 2; m.castShadow = true; g.add(m);
    var cap = new T.Mesh(new T.ConeGeometry(2.1, h * 0.32, 6), new T.MeshStandardMaterial({ color: '#f2f6ff', flatShading: true })); cap.position.y = h - h * 0.16; g.add(cap);
    g.position.set(x, terrainH(x, z), z); pop(g); }
  function lake() { water.visible = true; var p = freePos(0, 10); water.position.set(p[0], -0.35, p[1]); if (water.userData.pulse == null) water.userData.pulse = 1; }
  function house() { var p = freePos(5, 22), x = p[0], z = p[1], g = new T.Group();
    var body = new T.Mesh(new T.BoxGeometry(3, 2.2, 3), new T.MeshStandardMaterial({ color: '#e7cda1', flatShading: true })); body.position.y = 1.1; body.castShadow = true; g.add(body);
    var roof = new T.Mesh(new T.ConeGeometry(2.6, 1.6, 4), new T.MeshStandardMaterial({ color: '#b84a3e', flatShading: true })); roof.position.y = 3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    var door = new T.Mesh(new T.BoxGeometry(0.7, 1.2, 0.1), new T.MeshStandardMaterial({ color: '#5a3a22' })); door.position.set(0, 0.6, 1.55); g.add(door);
    g.position.set(x, terrainH(x, z), z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function flower(n) { for (var i = 0; i < (n || 8); i++) { var p = freePos(3, 24), x = p[0], z = p[1], g = new T.Group();
    var stem = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.6, 4), new T.MeshStandardMaterial({ color: '#2e9e46' })); stem.position.y = 0.3; g.add(stem);
    var col = ['#ff5f8f', '#ffd23d', '#8f6bff', '#ff7a3d'][Math.floor(Math.random() * 4)];
    var top = new T.Mesh(new T.IcosahedronGeometry(0.22, 0), new T.MeshStandardMaterial({ color: col, flatShading: true, emissive: col, emissiveIntensity: 0.2 })); top.position.y = 0.65; g.add(top);
    g.position.set(x, terrainH(x, z), z); pop(g); } }
  function crystal(n) { for (var i = 0; i < (n || 5); i++) { var p = freePos(4, 24), x = p[0], z = p[1];
    var col = '#7bc8ff', m = new T.Mesh(new T.OctahedronGeometry(0.8, 0), new T.MeshStandardMaterial({ color: col, flatShading: true, emissive: col, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 }));
    m.position.set(x, terrainH(x, z) + 0.8, z); m.castShadow = true; m.userData.spin = 1; pop(m); } }
  function campfire() { var p = freePos(3, 10), x = p[0], z = p[1], g = new T.Group();
    for (var k = 0; k < 4; k++) { var log = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1.1, 5), new T.MeshStandardMaterial({ color: '#6b4a2b' })); log.rotation.z = Math.PI / 2; log.rotation.y = k * Math.PI / 4; log.position.y = 0.2; g.add(log); }
    var fire = new T.Mesh(new T.ConeGeometry(0.4, 1, 6), new T.MeshStandardMaterial({ color: '#ff7a1f', emissive: '#ff5a1f', emissiveIntensity: 1, flatShading: true })); fire.position.y = 0.8; g.add(fire);
    var pl = new T.PointLight('#ff7a1f', 1.2, 10); pl.position.y = 1; g.add(pl);
    g.position.set(x, terrainH(x, z), z); pop(g); }

  function setMood(name) {
    var M = { neige: ['#dff0ff', '#eaf4ff', '#cfe6ff'], nuit: ['#13204a', '#2a3360', '#101830'], volcan: ['#3a0f0a', '#5a241a', '#2a0a06'], jour: ['#9fd3ff', '#63c24f', '#9fd3ff'], coucher: ['#ffb27a', '#7a9e5a', '#ffb27a'] };
    var c = M[name] || M.jour; scene.background = new T.Color(c[0]); scene.fog.color = new T.Color(c[2]); grassMat.color = new T.Color(c[1]);
    if (name === 'nuit') { sun.intensity = 0.35; hemi.intensity = 0.4; } else if (name === 'volcan') { sun.intensity = 0.8; grassMat.color = new T.Color('#4a2a24'); } else { sun.intensity = 1.25; hemi.intensity = 0.9; }
  }

  // ---------- compréhension du prompt ----------
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function num(q, d) { var m = q.match(/\d+/); return m ? Math.min(15, +m[0]) : d; }
  var RULES = [
    [/(foret|arbre|tree|forest|sapin|bois)/, function (q) { var n = num(q, 5); for (var i = 0; i < n; i++) tree(); return n + ' arbres plantés 🌲'; }],
    [/(montagne|mountain|colline|cliff)/, function () { mountain(); return 'une montagne dressée ⛰️'; }],
    [/(eau|lac|riviere|water|lake|etang|ocean)/, function () { lake(); return 'un lac ajouté 💧'; }],
    [/(roche|rocher|pierre|rock|stone)/, function (q) { var n = num(q, 4); for (var i = 0; i < n; i++) rock(); return n + ' rochers posés 🪨'; }],
    [/(maison|house|cabane|batiment|building)/, function (q) { var n = num(q, 1); for (var i = 0; i < n; i++) house(); return n + (n > 1 ? ' maisons' : ' maison') + ' construite 🏠'; }],
    [/(village|ville|city|town)/, function () { for (var i = 0; i < 3; i++) house(); for (var j = 0; j < 3; j++) tree(); return 'un petit village 🏘️'; }],
    [/(fleur|flower|jardin|garden)/, function (q) { flower(num(q, 8)); return 'des fleurs semées 🌸'; }],
    [/(cristal|crystal|gemme|diamant|gem)/, function (q) { crystal(num(q, 5)); return 'des cristaux 💎'; }],
    [/(feu|campfire|camp|bonfire|flamme)/, function () { campfire(); return 'un feu de camp 🔥'; }],
    [/(neige|snow|hiver|winter)/, function () { setMood('neige'); return 'il neige ❄️'; }],
    [/(nuit|night|sombre|dark)/, function () { setMood('nuit'); return 'la nuit tombe 🌙'; }],
    [/(volcan|lava|lave|volcano)/, function () { setMood('volcan'); mountain(); return 'un décor volcanique 🌋'; }],
    [/(coucher|sunset|crepuscule|golden)/, function () { setMood('coucher'); return 'un coucher de soleil 🌅'; }],
    [/(jour|day|soleil|reset mood)/, function () { setMood('jour'); return 'il fait jour ☀️'; }],
    [/(vide|reset|efface|clear|nettoie|recommence)/, function () { reset(); return 'map réinitialisée ♻️'; }]
  ];
  function handle(q) { var n = norm(q), out = [], hit = false; for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(n)) { hit = true; out.push(RULES[i][1](n)); } if (!hit) { for (var k = 0; k < 3; k++) tree(); out.push('quelques arbres pour commencer 🌳'); } return out.join(', puis '); }
  function reset() { spawned.forEach(function (o) { group.remove(o); }); spawned = []; water.visible = false; setMood('jour'); }

  // ---------- caméra : orbite + drag ----------
  var camA = 0.7, camTarget = 0.7, camR = 34, camH = 18, auto = true, dragging = false, px = 0;
  var cvEl = renderer.domElement;
  cvEl.style.touchAction = 'pan-y';
  cvEl.addEventListener('pointerdown', function (e) { dragging = true; auto = false; px = e.clientX; cvEl.setPointerCapture(e.pointerId); });
  cvEl.addEventListener('pointermove', function (e) { if (!dragging) return; camTarget += (e.clientX - px) * 0.008; px = e.clientX; });
  cvEl.addEventListener('pointerup', function () { dragging = false; setTimeout(function () { auto = true; }, 3000); });

  function resize() { var w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host); resize();

  var clock = new T.Clock();
  function loop() { requestAnimationFrame(loop); var t = performance.now(), dt = clock.getDelta();
    if (auto) camTarget += dt * 0.12; camA += (camTarget - camA) * 0.06;
    camera.position.set(Math.cos(camA) * camR, camH, Math.sin(camA) * camR); camera.lookAt(0, 3, 0);
    hero.position.y = terrainH(0, 0) + Math.sin(t * 0.002) * 0.12; hero.rotation.y = -camA + Math.PI;
    for (var i = 0; i < spawned.length; i++) { var o = spawned[i]; if (o.userData.anim) o.userData.anim(t); if (o.userData.spin) o.rotation.y += dt * 1.2; }
    if (water.visible) water.position.y = -0.35 + Math.sin(t * 0.002) * 0.06;
    renderer.render(scene, camera);
  }
  loop();

  // ---------- chat ----------
  var log = document.getElementById('s3-log'), inp = document.getElementById('s3-input'), form = document.getElementById('s3-form');
  function bubble(who, text, typing) { var d = document.createElement('div'); d.className = 's3-msg ' + who; d.innerHTML = typing ? '<span class="s3-typing"><i></i><i></i><i></i></span>' : esc(text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]; }); }
  var busy = false;
  function send(q) { if (busy || !q.trim()) return; busy = true; bubble('user', q); inp.value = '';
    var ty = bubble('ai', '', true);
    setTimeout(function () { var r = handle(q); ty.innerHTML = esc('J\'ajoute ' + r); busy = false; }, 620 + Math.random() * 500);
  }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); send(inp.value); });
  document.querySelectorAll('.s3-chip').forEach(function (c) { c.addEventListener('click', function () { send(c.dataset.q || c.textContent); }); });
  var rb = document.getElementById('s3-reset'); if (rb) rb.addEventListener('click', function () { reset(); bubble('ai', 'Map réinitialisée. Dis-moi ce que tu veux construire 🌱'); });

  // message d'accueil
  bubble('ai', 'Salut ! Décris ce que tu veux sur ta map et je le construis. Essaie « ajoute une forêt » ou « une montagne ».');
  var w2 = document.getElementById('s3-wait'); if (w2) w2.remove();
})();
