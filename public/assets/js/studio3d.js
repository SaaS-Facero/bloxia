/* Studio 3D Bloxia : scène de jeu originale (Three.js) pilotée par un chat + mode jouable
   (vue première personne, courir, sauter). Les prompts font apparaître des éléments en direct.
   Démo marketing. Tous les assets sont procéduraux et originaux (aucun asset tiers). */
(function () {
  if (!window.THREE) return;
  var T = window.THREE, host = document.getElementById('s3-canvas'); if (!host) return;
  var $ = function (s) { return document.getElementById(s); };

  // ---------- rendu ----------
  var renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; host.appendChild(renderer.domElement);
  var cv = renderer.domElement; cv.style.touchAction = 'none';

  var scene = new T.Scene(); scene.background = new T.Color('#9fd3ff'); scene.fog = new T.Fog('#9fd3ff', 55, 130);
  var camera = new T.PerspectiveCamera(60, 1, 0.1, 400);

  var hemi = new T.HemisphereLight('#dff1ff', '#5a7a4a', 0.95); scene.add(hemi);
  var sun = new T.DirectionalLight('#fff6e0', 1.2); sun.position.set(34, 52, 24); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
  var s = 60; sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s; sun.shadow.bias = -0.0004; scene.add(sun);

  // ---------- terrain ----------
  var SIZE = 90, SEG = 72, HALF = SIZE / 2 - 3;
  function terrainH(x, z) { return Math.sin(x * 0.09) * 1.8 + Math.cos(z * 0.08) * 1.8 + Math.sin((x + z) * 0.05) * 1.2; }
  var geo = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  var gp = geo.attributes.position; for (var i = 0; i < gp.count; i++) gp.setY(i, terrainH(gp.getX(i), gp.getZ(i)));
  geo.computeVertexNormals();
  var grassMat = new T.MeshStandardMaterial({ color: '#63c24f', flatShading: true, roughness: 1 });
  var ground = new T.Mesh(geo, grassMat); ground.receiveShadow = true; scene.add(ground);
  var waterMat = new T.MeshStandardMaterial({ color: '#2f9fe0', transparent: true, opacity: 0.82, roughness: 0.15, metalness: 0.35 });
  var water = new T.Mesh(new T.CircleGeometry(8, 44), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = -0.4; water.visible = false; scene.add(water);
  var group = new T.Group(); scene.add(group);

  // ---------- personnage original + skins (tous originaux, aucun perso sous licence) ----------
  var SKINS = {
    defaut:     { label: 'Défaut',     skin: '#f1c088', shirt: '#4f6bed', pants: '#2a2f45', hair: '#2a1a0e' },
    ninja:      { label: 'Ninja',      skin: '#f1c088', shirt: '#e8732a', pants: '#243b55', hair: '#15151c', acc: 'bandeau', eyes: '#1a1a22' },
    robot:      { label: 'Robot',      skin: '#b9c2cc', shirt: '#6b7682', pants: '#3a434d', metal: 1, acc: 'antenne', eyes: '#35e0ff' },
    astronaute: { label: 'Astronaute', skin: '#eef2f7', shirt: '#eef2f7', pants: '#d7dde6', acc: 'casque', eyes: '#1a1a22' },
    chevalier:  { label: 'Chevalier',  skin: '#c6ccd6', shirt: '#9aa3af', pants: '#6b7280', metal: 1, acc: 'casque', eyes: '#1a1a22' },
    zombie:     { label: 'Zombie',     skin: '#7bb86b', shirt: '#46593a', pants: '#2e2a22', hair: '#2a3320', eyes: '#ffe14d' },
    roi:        { label: 'Roi',        skin: '#f1c088', shirt: '#b4263b', pants: '#3a2150', hair: '#caa23a', acc: 'couronne' }
  };
  function makeChar(cfg) {
    cfg = cfg || SKINS.defaut; var g = new T.Group();
    var mm = function (c, m) { return new T.MeshStandardMaterial({ color: c, flatShading: true, metalness: m ? 0.8 : 0, roughness: m ? 0.35 : 0.85 }); };
    var skinM = mm(cfg.skin, cfg.metal), shirtM = mm(cfg.shirt, cfg.metal), pantsM = mm(cfg.pants, cfg.metal);
    function box(w, h, d, m, y, x, z) { var b = new T.Mesh(new T.BoxGeometry(w, h, d), m); b.position.set(x || 0, y, z || 0); b.castShadow = true; g.add(b); return b; }
    box(1.1, 1.1, 0.7, shirtM, 1.5); var head = box(0.85, 0.85, 0.85, skinM, 2.52);
    var armL = box(0.3, 1.0, 0.3, (cfg.metal ? shirtM : skinM), 1.5, 0.75), armR = box(0.3, 1.0, 0.3, (cfg.metal ? shirtM : skinM), 1.5, -0.75);
    var legL = box(0.42, 1.0, 0.42, pantsM, 0.5, 0.28), legR = box(0.42, 1.0, 0.42, pantsM, 0.5, -0.28);
    var eyeM = new T.MeshStandardMaterial({ color: cfg.eyes || '#1a1a22', emissive: (cfg.eyes && cfg.eyes !== '#1a1a22') ? cfg.eyes : '#000', emissiveIntensity: 0.6 });
    [0.2, -0.2].forEach(function (ex) { var e = new T.Mesh(new T.BoxGeometry(0.13, 0.15, 0.06), eyeM); e.position.set(ex, 2.56, 0.43); g.add(e); });
    if (cfg.hair) box(0.92, 0.26, 0.92, mm(cfg.hair), 2.95);
    if (cfg.acc === 'bandeau') { box(0.92, 0.2, 0.92, mm('#1a1a22'), 2.78); var plate = new T.Mesh(new T.BoxGeometry(0.34, 0.16, 0.05), mm('#c7cdd6', 1)); plate.position.set(0, 2.78, 0.46); g.add(plate); }
    if (cfg.acc === 'antenne') { var ant = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 6), mm('#3a434d')); ant.position.set(0, 3.15, 0); g.add(ant); var bulb = new T.Mesh(new T.SphereGeometry(0.1, 8, 8), new T.MeshStandardMaterial({ color: '#ff4d6d', emissive: '#ff4d6d', emissiveIntensity: 1 })); bulb.position.set(0, 3.4, 0); g.add(bulb); }
    if (cfg.acc === 'casque') { var helm = new T.Mesh(new T.BoxGeometry(0.98, 0.5, 0.98), mm(cfg.metal ? '#aeb6c2' : '#eef2f7', cfg.metal)); helm.position.y = 2.95; helm.castShadow = true; g.add(helm); var visor = new T.Mesh(new T.BoxGeometry(0.7, 0.3, 0.1), new T.MeshStandardMaterial({ color: '#7fd4ff', transparent: true, opacity: 0.6, metalness: 0.5, roughness: 0.1 })); visor.position.set(0, 2.55, 0.45); g.add(visor); }
    if (cfg.acc === 'couronne') { for (var c = 0; c < 6; c++) { var spike = new T.Mesh(new T.ConeGeometry(0.08, 0.3, 4), mm('#ffd23d', 1)); var a = c / 6 * 6.283; spike.position.set(Math.cos(a) * 0.4, 3.1, Math.sin(a) * 0.4); g.add(spike); } var band = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 0.18, 8), mm('#ffd23d', 1)); band.position.y = 2.95; g.add(band); }
    g.userData.limbs = { armL: armL, armR: armR, legL: legL, legR: legR }; return g;
  }
  var curSkin = 'defaut', hero = makeChar(SKINS.defaut); scene.add(hero);
  function applySkin(name) { if (!SKINS[name]) return; var vis = hero.visible; scene.remove(hero); hero = makeChar(SKINS[name]); hero.visible = vis; scene.add(hero); curSkin = name; document.querySelectorAll('.s3-skin').forEach(function (b) { b.classList.toggle('on', b.dataset.skin === name); }); }
  var PH = 3; // hauteur yeux approx
  var player = { x: 0, z: 0, y: terrainH(0, 0), vy: 0, yaw: 0, pitch: 0, onGround: true };

  // ---------- fabrique d'éléments (tous originaux) ----------
  var spawned = [], MAXOBJ = 240;
  function pop(o) { o.scale.set(0.01, 0.01, 0.01); var t0 = performance.now(); o.userData.anim = function (t) { var k = Math.min(1, (t - t0) / 430); o.scale.setScalar(k < 1 ? (k < .8 ? k * 1.12 : 1 - (1 - k) * 0.6) : 1); if (k >= 1) { o.scale.setScalar(1); o.userData.anim = null; } }; spawned.push(o); group.add(o); if (spawned.length > MAXOBJ) { var old = spawned.shift(); group.remove(old); } }
  function fp(min, max) { var r = max || HALF, a = Math.random() * 6.283, d = (min || 4) + Math.random() * (r - (min || 4)); return [Math.cos(a) * d, Math.sin(a) * d]; }
  function mat(c, o) { return new T.MeshStandardMaterial(Object.assign({ color: c, flatShading: true }, o || {})); }
  function at(g, x, z, yoff) { g.position.set(x, terrainH(x, z) + (yoff || 0), z); }

  function tree() { var p = fp(4), x = p[0], z = p[1], g = new T.Group(); var trunk = new T.Mesh(new T.CylinderGeometry(0.28, 0.4, 1.7, 6), mat('#7a4a24')); trunk.position.y = 0.85; trunk.castShadow = true; g.add(trunk); var lm = mat(['#2e9e46', '#38b155', '#249a52'][Math.floor(Math.random() * 3)]); var c1 = new T.Mesh(new T.ConeGeometry(1.6, 2.3, 7), lm); c1.position.y = 2.4; c1.castShadow = true; g.add(c1); var c2 = new T.Mesh(new T.ConeGeometry(1.1, 1.8, 7), lm); c2.position.y = 3.4; c2.castShadow = true; g.add(c2); at(g, x, z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function palm() { var p = fp(4), x = p[0], z = p[1], g = new T.Group(); var tr = new T.Mesh(new T.CylinderGeometry(0.2, 0.3, 3.4, 6), mat('#9a7a3a')); tr.position.y = 1.7; tr.rotation.z = 0.12; tr.castShadow = true; g.add(tr); for (var k = 0; k < 6; k++) { var leaf = new T.Mesh(new T.ConeGeometry(0.3, 2.4, 4), mat('#2fae5a')); leaf.position.y = 3.3; leaf.rotation.set(1.2, k * 1.05, 0); g.add(leaf); } at(g, x, z); pop(g); }
  function rock() { var p = fp(4), x = p[0], z = p[1]; var m = new T.Mesh(new T.DodecahedronGeometry(0.7 + Math.random() * 0.7, 0), mat('#8b9099')); at(m, x, z, 0.3); m.rotation.set(Math.random(), Math.random(), Math.random()); m.castShadow = true; pop(m); }
  function mountain() { var p = fp(14), x = p[0], z = p[1], g = new T.Group(); var h = 9 + Math.random() * 6; var m = new T.Mesh(new T.ConeGeometry(6, h, 6), mat('#7d8691')); m.position.y = h / 2; m.castShadow = true; g.add(m); var cap = new T.Mesh(new T.ConeGeometry(2.4, h * 0.3, 6), mat('#f2f6ff')); cap.position.y = h - h * 0.15; g.add(cap); at(g, x, z); pop(g); }
  function lake() { water.visible = true; var p = fp(0, 12); water.position.set(p[0], -0.35, p[1]); }
  function house() { var p = fp(5), x = p[0], z = p[1], g = new T.Group(); var body = new T.Mesh(new T.BoxGeometry(3, 2.2, 3), mat('#e7cda1')); body.position.y = 1.1; body.castShadow = true; g.add(body); var roof = new T.Mesh(new T.ConeGeometry(2.6, 1.6, 4), mat('#b84a3e')); roof.position.y = 3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof); var door = new T.Mesh(new T.BoxGeometry(0.7, 1.2, 0.1), mat('#5a3a22')); door.position.set(0, 0.6, 1.55); g.add(door); at(g, x, z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function building() { var p = fp(6), x = p[0], z = p[1], g = new T.Group(); var fl = 4 + Math.floor(Math.random() * 6), w = 3 + Math.random() * 2, hgt = fl * 1.6; var body = new T.Mesh(new T.BoxGeometry(w, hgt, w), mat('#8a93a8')); body.position.y = hgt / 2; body.castShadow = true; g.add(body); var winMat = mat('#cfe6ff', { emissive: '#bfe0ff', emissiveIntensity: 0.35 }); for (var f = 0; f < fl; f++) for (var c = -1; c <= 1; c++) { var win = new T.Mesh(new T.BoxGeometry(0.6, 0.8, 0.05), winMat); win.position.set(c * (w / 3), 1 + f * 1.6, w / 2 + 0.02); g.add(win); var win2 = win.clone(); win2.position.z = -w / 2 - 0.02; g.add(win2); } at(g, x, z); pop(g); }
  function car() { var p = fp(5), x = p[0], z = p[1], g = new T.Group(); var col = ['#e23b3b', '#3b7de2', '#ffce3b', '#2bd68f', '#ffffff', '#2a2f45'][Math.floor(Math.random() * 6)]; var body = new T.Mesh(new T.BoxGeometry(3.4, 0.8, 1.6), mat(col)); body.position.y = 0.8; body.castShadow = true; g.add(body); var cab = new T.Mesh(new T.BoxGeometry(1.8, 0.8, 1.5), mat(col)); cab.position.set(-0.2, 1.5, 0); g.add(cab); var glass = mat('#9fd3ff', { opacity: 0.7, transparent: true }); var win = new T.Mesh(new T.BoxGeometry(1.7, 0.6, 1.52), glass); win.position.set(-0.2, 1.55, 0); g.add(win); var wm = mat('#15151a'); [[1.1, 0.8], [1.1, -0.8], [-1.1, 0.8], [-1.1, -0.8]].forEach(function (w) { var wh = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.3, 10), wm); wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.45, w[1]); wh.castShadow = true; g.add(wh); }); var lm = mat('#fff3b0', { emissive: '#fff3b0', emissiveIntensity: 0.6 }); [0.6, -0.6].forEach(function (y) { var l = new T.Mesh(new T.BoxGeometry(0.1, 0.25, 0.25), lm); l.position.set(1.7, 0.85, y); g.add(l); }); at(g, x, z, 0); g.rotation.y = Math.random() * 6.28; pop(g); }
  function road() { var p = fp(0, 16), x = p[0], z = p[1], g = new T.Group(); var asph = new T.Mesh(new T.BoxGeometry(7, 0.25, 28), mat('#2b2f38')); asph.position.y = 0.12; asph.receiveShadow = true; g.add(asph); [-3.2, 3.2].forEach(function (sx) { var side = new T.Mesh(new T.BoxGeometry(0.8, 0.35, 28), mat('#aeb4bd')); side.position.set(sx, 0.17, 0); side.receiveShadow = true; g.add(side); }); var dm = mat('#ffd23d'); for (var k = -6; k <= 6; k++) { var dash = new T.Mesh(new T.BoxGeometry(0.22, 0.02, 1.3), dm); dash.position.set(0, 0.26, k * 2.1); g.add(dash); } g.position.set(x, terrainH(x, z), z); g.rotation.y = Math.random() * 3.14; pop(g); }
  function wall() { var p = fp(5), x = p[0], z = p[1], g = new T.Group(); var body = new T.Mesh(new T.BoxGeometry(8, 2.4, 0.7), mat('#9aa0ab')); body.position.y = 1.2; body.castShadow = true; body.receiveShadow = true; g.add(body); for (var k = -3; k <= 3; k++) { var cren = new T.Mesh(new T.BoxGeometry(0.8, 0.6, 0.7), mat('#8a9099')); cren.position.set(k * 1.1, 2.6, 0); g.add(cren); } var line = mat('#7c828c'); for (var r2 = 0; r2 < 3; r2++) { var seam = new T.Mesh(new T.BoxGeometry(8.02, 0.06, 0.72), line); seam.position.y = 0.6 + r2 * 0.6; g.add(seam); } at(g, x, z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function bridge() { lake(); var g = new T.Group(); var deck = new T.Mesh(new T.BoxGeometry(14, 0.4, 3), mat('#8a5a2b')); deck.position.y = 0.5; deck.castShadow = true; g.add(deck); [-6, 6].forEach(function (dx) { [1.2, -1.2].forEach(function (dz) { var post = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 1.6, 6), mat('#6b4a2b')); post.position.set(dx, -0.1, dz); g.add(post); }); }); g.position.set(water.position.x, 0.2, water.position.z); pop(g); }
  function streetlamp() { var p = fp(4), x = p[0], z = p[1], g = new T.Group(); var pole = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 4.4, 8), mat('#3a3f4a')); pole.position.y = 2.2; pole.castShadow = true; g.add(pole); var head = new T.Mesh(new T.SphereGeometry(0.4, 10, 10), mat('#fff3b0', { emissive: '#ffe680', emissiveIntensity: 1 })); head.position.y = 4.4; g.add(head); var pl = new T.PointLight('#ffe39a', 0.9, 14); pl.position.y = 4.4; g.add(pl); at(g, x, z); pop(g); }
  function fence() { var p = fp(5), x = p[0], z = p[1], g = new T.Group(), dir = Math.random() * 6.28; for (var k = -3; k <= 3; k++) { var post = new T.Mesh(new T.BoxGeometry(0.2, 1.2, 0.2), mat('#b58a52')); post.position.set(k * 1.1, 0.6, 0); g.add(post); } var rail = new T.Mesh(new T.BoxGeometry(7, 0.15, 0.15), mat('#c99a62')); rail.position.y = 0.9; g.add(rail); g.rotation.y = dir; at(g, x, z); pop(g); }
  function bench() { var p = fp(4), x = p[0], z = p[1], g = new T.Group(); var seat = new T.Mesh(new T.BoxGeometry(2, 0.2, 0.7), mat('#8a5a2b')); seat.position.y = 0.6; g.add(seat); var back = new T.Mesh(new T.BoxGeometry(2, 0.7, 0.15), mat('#8a5a2b')); back.position.set(0, 1, -0.28); g.add(back); [-0.8, 0.8].forEach(function (lx) { var leg = new T.Mesh(new T.BoxGeometry(0.15, 0.6, 0.6), mat('#5a3a22')); leg.position.set(lx, 0.3, 0); g.add(leg); }); at(g, x, z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function dog() { var p = fp(4), x = p[0], z = p[1], g = new T.Group(); var c = mat('#b5793f'); var body = new T.Mesh(new T.BoxGeometry(1.1, 0.6, 0.5), c); body.position.y = 0.6; body.castShadow = true; g.add(body); var head = new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), c); head.position.set(0.7, 0.8, 0); g.add(head); [[0.4, 0.2], [0.4, -0.2], [-0.4, 0.2], [-0.4, -0.2]].forEach(function (l) { var leg = new T.Mesh(new T.BoxGeometry(0.18, 0.5, 0.18), c); leg.position.set(l[0], 0.25, l[1]); g.add(leg); }); var tail = new T.Mesh(new T.BoxGeometry(0.4, 0.14, 0.14), c); tail.position.set(-0.7, 0.8, 0); tail.rotation.z = 0.6; g.add(tail); at(g, x, z); g.rotation.y = Math.random() * 6.28; pop(g); }
  function boat() { lake(); var g = new T.Group(); var hull = new T.Mesh(new T.BoxGeometry(3, 0.6, 1.3), mat('#8a5a2b')); hull.position.y = 0.3; g.add(hull); var mastp = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.4, 6), mat('#6b4a2b')); mastp.position.y = 1.5; g.add(mastp); var sail = new T.Mesh(new T.PlaneGeometry(1.6, 1.8), mat('#ffffff', { side: T.DoubleSide })); sail.position.set(0, 1.6, 0); sail.rotation.y = Math.PI / 2; g.add(sail); g.position.set(water.position.x, -0.1, water.position.z); pop(g); }
  function flowers(n) { for (var i = 0; i < (n || 10); i++) { var p = fp(3), x = p[0], z = p[1], g = new T.Group(); var st = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.6, 4), mat('#2e9e46')); st.position.y = 0.3; g.add(st); var col = ['#ff5f8f', '#ffd23d', '#8f6bff', '#ff7a3d'][Math.floor(Math.random() * 4)]; var top = new T.Mesh(new T.IcosahedronGeometry(0.22, 0), mat(col, { emissive: col, emissiveIntensity: 0.2 })); top.position.y = 0.65; g.add(top); at(g, x, z); pop(g); } }
  function crystals(n) { for (var i = 0; i < (n || 6); i++) { var p = fp(4), x = p[0], z = p[1], col = '#7bc8ff'; var m = new T.Mesh(new T.OctahedronGeometry(0.85, 0), mat(col, { emissive: col, emissiveIntensity: 0.5, transparent: true, opacity: 0.9 })); at(m, x, z, 0.85); m.castShadow = true; m.userData.spin = 1; pop(m); } }
  function campfire() { var p = fp(3), x = p[0], z = p[1], g = new T.Group(); for (var k = 0; k < 4; k++) { var log = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 1.1, 5), mat('#6b4a2b')); log.rotation.z = Math.PI / 2; log.rotation.y = k * Math.PI / 4; log.position.y = 0.2; g.add(log); } var fire = new T.Mesh(new T.ConeGeometry(0.4, 1, 6), mat('#ff7a1f', { emissive: '#ff5a1f', emissiveIntensity: 1 })); fire.position.y = 0.8; g.add(fire); var pl = new T.PointLight('#ff7a1f', 1.3, 12); pl.position.y = 1; g.add(pl); at(g, x, z); pop(g); }
  function clouds(n) { for (var i = 0; i < (n || 4); i++) { var g = new T.Group(); for (var k = 0; k < 5; k++) { var puff = new T.Mesh(new T.SphereGeometry(1.4 + Math.random(), 8, 8), mat('#ffffff', { roughness: 1 })); puff.position.set((Math.random() - .5) * 4, Math.random(), (Math.random() - .5) * 2); g.add(puff); } var p = fp(6, HALF); g.position.set(p[0], 22 + Math.random() * 6, p[1]); g.userData.drift = 0.3 + Math.random() * 0.4; pop(g); } }
  function castle() { var g = new T.Group(); for (var dx = -2; dx <= 2; dx++) for (var dz = -2; dz <= 2; dz++) { if (Math.abs(dx) !== 2 && Math.abs(dz) !== 2) continue; var w = new T.Mesh(new T.BoxGeometry(2, 3, 2), mat('#9aa0ab')); w.position.set(dx * 2, 1.5, dz * 2); w.castShadow = true; g.add(w); } [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(function (c) { var tow = new T.Mesh(new T.CylinderGeometry(1.4, 1.4, 6, 8), mat('#8a9099')); tow.position.set(c[0] * 2, 3, c[1] * 2); tow.castShadow = true; g.add(tow); var roof = new T.Mesh(new T.ConeGeometry(1.7, 2, 8), mat('#4f6bed')); roof.position.set(c[0] * 2, 7, c[1] * 2); g.add(roof); }); at(g, 0, 0); pop(g); }
  function coast() { grassMat.color = new T.Color('#d8b36a'); lake(); water.geometry.dispose(); water.geometry = new T.CircleGeometry(16, 48); water.position.set(14, -0.35, 0); for (var i = 0; i < 4; i++) palm(); }

  function mood(name) {
    var M = { neige: ['#dff0ff', '#eaf4ff', '#cfe6ff'], nuit: ['#101a3a', '#223058', '#0c1430'], volcan: ['#3a0f0a', '#5a241a', '#2a0a06'], jour: ['#9fd3ff', '#63c24f', '#9fd3ff'], coucher: ['#ff9d5c', '#7a9e5a', '#ffb27a'], jungle: ['#8fd36a', '#2f7a3a', '#bfe8a0'] };
    var c = M[name] || M.jour; scene.background = new T.Color(c[0]); scene.fog.color = new T.Color(c[2]); grassMat.color = new T.Color(c[1]);
    if (name === 'nuit') { sun.intensity = 0.3; hemi.intensity = 0.4; } else if (name === 'volcan') { sun.intensity = 0.8; } else if (name === 'coucher') { sun.intensity = 1; sun.color = new T.Color('#ffd0a0'); } else { sun.intensity = 1.2; hemi.intensity = 0.95; sun.color = new T.Color('#fff6e0'); }
  }

  // ---------- compréhension du prompt ----------
  function norm(x) { return (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function num(q, d) { var m = q.match(/\d+/); return m ? Math.min(20, +m[0]) : d; }
  function many(fn, n) { for (var i = 0; i < n; i++) fn(); }
  var BRANDED = /(naruto|goku|dragon ?ball|sonic|mario|luigi|spider|batman|superman|pikachu|pokemon|sasuke|anime|one ?piece|luffy|minecraft|steve|fortnite|aizen)/;
  var RULES = [
    [/\b(skin|skins|perso|personnage|avatar|tenue|costume|habille)\b/, function (q) {
      var map = { ninja: 'ninja', robot: 'robot', astronaute: 'astronaute', astronaut: 'astronaute', spationaute: 'astronaute', zombie: 'zombie', chevalier: 'chevalier', knight: 'chevalier', armure: 'chevalier', roi: 'roi', king: 'roi', couronne: 'roi', defaut: 'defaut', default: 'defaut', base: 'defaut' };
      for (var k in map) if (q.indexOf(k) >= 0) { applySkin(map[k]); return 'ton skin : ' + SKINS[map[k]].label + ' 🎭'; }
      if (BRANDED.test(q)) { applySkin('ninja'); return 'un skin ninja orange original — je ne peux pas copier un perso sous licence 🥷'; }
      return 'choisis ton skin en bas (ninja, robot, astronaute, chevalier, zombie, roi) 🎭';
    }],
    [/(foret|arbre|tree|forest|sapin|bois)/, function (q) { var n = num(q, 5); many(tree, n); return n + ' arbres 🌲'; }],
    [/(palmier|palm|cocotier)/, function (q) { var n = num(q, 3); many(palm, n); return n + ' palmiers 🌴'; }],
    [/(montagne|mountain|colline|cliff)/, function (q) { var n = num(q, 1); many(mountain, n); return (n > 1 ? n + ' montagnes' : 'une montagne') + ' ⛰️'; }],
    [/\b(eau|lac|lacs|riviere|water|lake|etang)\b/, function () { lake(); return 'un lac 💧'; }],
    [/(cote|plage|beach|coast|mer|ocean|bord de mer)/, function () { coast(); return 'une côte 🏖️'; }],
    [/(roche|rocher|pierre|rock|stone)/, function (q) { var n = num(q, 4); many(rock, n); return n + ' rochers 🪨'; }],
    [/(immeuble|tour|building|gratte|skyscraper|tower)/, function (q) { var n = num(q, 1); many(building, n); return (n > 1 ? n + ' immeubles' : 'un immeuble') + ' 🏢'; }],
    [/(maison|house|cabane)/, function (q) { var n = num(q, 1); many(house, n); return (n > 1 ? n + ' maisons' : 'une maison') + ' 🏠'; }],
    [/\b(voiture|voitures|car|cars|auto|vehicule|bagnole)\b/, function (q) { var n = num(q, 1); many(car, n); return (n > 1 ? n + ' voitures' : 'une voiture') + ' 🚗'; }],
    [/(route|road|rue|street)/, function () { road(); return 'une route 🛣️'; }],
    [/(pont|bridge)/, function () { bridge(); return 'un pont 🌉'; }],
    [/(lampadaire|lampe|streetlamp|lamp|reverbere)/, function (q) { var n = num(q, 2); many(streetlamp, n); return n + ' lampadaires 💡'; }],
    [/\b(mur|murs|wall|walls|muraille|rempart)\b/, function (q) { var n = num(q, 1); many(wall, n); return (n > 1 ? n + ' murs' : 'un mur') + ' 🧱'; }],
    [/(cloture|barriere|fence|palissade)/, function () { fence(); return 'une clôture 🚧'; }],
    [/(banc|bench)/, function () { bench(); return 'un banc 🪑'; }],
    [/\b(chien|chiens|dog|dogs|animal|animaux|chat|chats|cat|cats)\b/, function (q) { var n = num(q, 1); many(dog, n); return (n > 1 ? n + ' animaux' : 'un animal') + ' 🐕'; }],
    [/(bateau|boat|barque|voilier)/, function () { boat(); return 'un bateau ⛵'; }],
    [/(village|ville|city|town)/, function () { many(building, 2); many(house, 2); road(); return 'une petite ville 🏘️'; }],
    [/(chateau|castle|fort)/, function () { castle(); return 'un château 🏰'; }],
    [/(fleur|flower|jardin|garden)/, function (q) { flowers(num(q, 10)); return 'des fleurs 🌸'; }],
    [/(cristal|crystal|gemme|diamant|gem)/, function (q) { crystals(num(q, 6)); return 'des cristaux 💎'; }],
    [/\b(feu|campfire|camp|bonfire|flamme)\b/, function () { campfire(); return 'un feu de camp 🔥'; }],
    [/(nuage|cloud|ciel)/, function (q) { clouds(num(q, 4)); return 'des nuages ☁️'; }],
    [/(neige|snow|hiver|winter)/, function () { mood('neige'); return 'il neige ❄️'; }],
    [/(nuit|night|sombre|dark)/, function () { mood('nuit'); return 'la nuit tombe 🌙'; }],
    [/(volcan|lava|lave|volcano)/, function () { mood('volcan'); mountain(); return 'un décor volcanique 🌋'; }],
    [/(coucher|sunset|crepuscule|golden hour)/, function () { mood('coucher'); return 'un coucher de soleil 🌅'; }],
    [/(jungle|tropical|foret tropicale)/, function () { mood('jungle'); many(palm, 5); many(tree, 4); return 'une jungle 🌴'; }],
    [/\b(jour|journee|day|matin)\b/, function () { mood('jour'); return 'il fait jour ☀️'; }],
    [/(vide|reset|efface|clear|nettoie|recommence)/, function () { resetScene(); return 'map réinitialisée ♻️'; }]
  ];
  function handle(q) { var n = norm(q), out = [], hit = false; for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(n)) { hit = true; out.push(RULES[i][1](n)); } if (!hit) { many(tree, 3); out.push('quelques arbres 🌳'); } return out.join(', puis '); }
  function resetScene() { spawned.forEach(function (o) { group.remove(o); }); spawned = []; water.visible = false; grassMat.color = new T.Color('#63c24f'); mood('jour'); }

  // ---------- modes : Explorer (orbite) / Jouer (1re ou 3e personne) ----------
  var mode = 'view', camA = 0.7, camTarget = 0.7, auto = true, drag = false, px = 0, py = 0, fpv = true;
  var keys = {}, run = false;
  function typing() { var a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); }
  function setMode(m) {
    mode = m; document.body.classList.toggle('s3-play', m === 'play');
    var pb = $('s3-playbtn'); if (pb) { pb.querySelector('span').textContent = m === 'play' ? 'Quitter' : 'Jouer'; pb.blur(); }
    var vb = $('s3-viewbtn'); if (vb) vb.style.display = m === 'play' ? 'inline-flex' : 'none';
    if (m === 'play') { player.x = 0; player.z = 0; player.y = terrainH(0, 0); player.vy = 0; player.yaw = -camA + Math.PI; player.pitch = 0; hero.visible = !fpv; var hint = $('s3-hint'); if (hint) { hint.classList.add('on'); clearTimeout(hint._t); hint._t = setTimeout(function () { hint.classList.remove('on'); }, 4200); } }
    else { hero.visible = true; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {} auto = true; }
  }
  function setFpv(v) { fpv = v; hero.visible = (mode !== 'play') || !fpv; var vb = $('s3-viewbtn'); if (vb) vb.querySelector('span').textContent = fpv ? '1re pers.' : '3e pers.'; }
  // clavier (écoute globale : marche avec ou sans pointer-lock)
  addEventListener('keydown', function (e) {
    if (e.code === 'Enter' && !typing() && mode === 'view') { setMode('play'); return; }
    if (mode !== 'play') return;
    if (typing()) return;
    keys[e.code] = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') run = true;
    if (e.code === 'KeyC') setFpv(!fpv);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === 'Escape') setMode('view');
  });
  addEventListener('keyup', function (e) { keys[e.code] = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') run = false; });
  // souris : pointer-lock si dispo, sinon glisser pour regarder — dans les deux cas le déplacement clavier fonctionne
  document.addEventListener('mousemove', function (e) { if (mode !== 'play' || document.pointerLockElement !== cv) return; player.yaw -= e.movementX * 0.0025; player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - e.movementY * 0.0025)); });
  cv.addEventListener('pointerdown', function (e) { if (mode === 'play') { drag = true; px = e.clientX; py = e.clientY; if (cv.requestPointerLock && document.pointerLockElement !== cv) { try { cv.requestPointerLock(); } catch (er) {} } try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; } drag = true; auto = false; px = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) { if (mode === 'play') { if (drag && document.pointerLockElement !== cv) { player.yaw -= (e.clientX - px) * 0.004; player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - (e.clientY - py) * 0.004)); px = e.clientX; py = e.clientY; } return; } if (!drag) return; camTarget += (e.clientX - px) * 0.008; px = e.clientX; });
  cv.addEventListener('pointerup', function () { if (mode === 'play') { drag = false; return; } drag = false; setTimeout(function () { auto = true; }, 3000); });
  // contrôles tactiles (mobile, en jeu)
  var mv = { f: 0, s: 0 };
  function bindPad() { ['f-up', 'f-down', 'f-left', 'f-right', 'f-jump'].forEach(function (id) { var el = $('s3-' + id); if (!el) return; var set = function (v) { return function (e) { e.preventDefault(); if (id === 'f-up') mv.f = v ? 1 : 0; if (id === 'f-down') mv.f = v ? -1 : 0; if (id === 'f-left') mv.s = v ? -1 : 0; if (id === 'f-right') mv.s = v ? 1 : 0; if (id === 'f-jump' && v) keys.Space = true; }; }; el.addEventListener('touchstart', set(1)); el.addEventListener('touchend', set(0)); el.addEventListener('mousedown', set(1)); window.addEventListener('mouseup', set(0)); }); var look = $('s3-look'); }
  bindPad();
  // regard tactile en jeu
  cv.addEventListener('touchmove', function (e) { if (mode !== 'play') return; var t = e.touches[0]; if (!t) return; if (cv._lx != null) { player.yaw -= (t.clientX - cv._lx) * 0.006; player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - (t.clientY - cv._ly) * 0.006)); } cv._lx = t.clientX; cv._ly = t.clientY; }, { passive: true });
  cv.addEventListener('touchend', function () { cv._lx = null; });

  function resize() { var w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(host); resize();

  var clock = new T.Clock(), walkT = 0;
  function frame() {
    requestAnimationFrame(frame); var t = performance.now(), dt = Math.min(0.05, clock.getDelta());
    // animations d'apparition + spéciaux
    for (var i = 0; i < spawned.length; i++) { var o = spawned[i]; if (o.userData.anim) o.userData.anim(t); if (o.userData.spin) o.rotation.y += dt * 1.2; if (o.userData.drift) { o.position.x += o.userData.drift * dt; if (o.position.x > HALF) o.position.x = -HALF; } }
    if (water.visible) water.position.y = -0.35 + Math.sin(t * 0.002) * 0.06;

    if (mode === 'view') {
      if (auto) camTarget += dt * 0.1; camA += (camTarget - camA) * 0.06;
      camera.position.set(Math.cos(camA) * 40, 20, Math.sin(camA) * 40); camera.lookAt(0, 3, 0);
      hero.position.set(0, terrainH(0, 0) + Math.sin(t * 0.002) * 0.12, 0); hero.rotation.y = -camA + Math.PI;
    } else {
      // déplacement
      var sp = (run ? 13 : 7), fwd = (keys.KeyW || keys.ArrowUp || keys.KeyZ ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) + mv.f;
      var strafe = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || keys.KeyQ ? 1 : 0) + mv.s;
      var sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
      var dx = (fwd * sin + strafe * cos) * sp * dt, dz = (fwd * cos - strafe * sin) * sp * dt;
      player.x = Math.max(-HALF, Math.min(HALF, player.x - dx)); player.z = Math.max(-HALF, Math.min(HALF, player.z - dz));
      // gravité + saut
      var gy = terrainH(player.x, player.z);
      player.vy -= 26 * dt; player.y += player.vy * dt;
      if (player.y <= gy) { player.y = gy; player.vy = 0; player.onGround = true; } else player.onGround = false;
      if ((keys.Space) && player.onGround) { player.vy = 9.5; player.onGround = false; } keys.Space = false;
      var moving = (fwd || strafe);
      // avatar : position + orientation + animation de marche
      hero.position.set(player.x, player.y, player.z);
      hero.rotation.y = player.yaw + Math.PI;
      var lb = hero.userData.limbs;
      if (lb) { if (moving) { walkT += dt * (run ? 16 : 10); var sw = Math.sin(walkT) * 0.6; lb.legL.rotation.x = sw; lb.legR.rotation.x = -sw; lb.armL.rotation.x = -sw; lb.armR.rotation.x = sw; } else { ['legL', 'legR', 'armL', 'armR'].forEach(function (k) { lb[k].rotation.x *= 0.8; }); } }
      if (fpv) {
        var ey = player.y + PH;
        camera.position.set(player.x, ey, player.z);
        var lx = player.x - Math.sin(player.yaw) * Math.cos(player.pitch), lz = player.z - Math.cos(player.yaw) * Math.cos(player.pitch), ly = ey + Math.sin(player.pitch);
        camera.lookAt(lx, ly, lz);
      } else {
        var back = 9, cp = Math.cos(player.pitch);
        camera.position.set(player.x + Math.sin(player.yaw) * back * cp, player.y + 4.5 - Math.sin(player.pitch) * back, player.z + Math.cos(player.yaw) * back * cp);
        camera.lookAt(player.x, player.y + 2.2, player.z);
      }
    }
    renderer.render(scene, camera);
  }
  frame();

  // ---------- chat ----------
  var log = $('s3-log'), inp = $('s3-input'), form = $('s3-form'), busy = false;
  function esc(x) { return String(x).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function bubble(who, text, typing) { var d = document.createElement('div'); d.className = 's3-msg ' + who; d.innerHTML = typing ? '<span class="s3-typing"><i></i><i></i><i></i></span>' : esc(text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  var DELAY = { flash: [420, 300], pro: [780, 450], max: [1150, 600] };
  function send(q) { if (busy || !q.trim()) return; busy = true; bubble('user', q); inp.value = ''; var ty = bubble('ai', '', true); var m = (document.querySelector('.s3-model.on') || {}).dataset; var d = DELAY[(m && m.m) || 'flash'] || DELAY.flash; setTimeout(function () { ty.innerHTML = esc('J\'ajoute ' + handle(q)); busy = false; }, d[0] + Math.random() * d[1]); }
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); send(inp.value); });
  document.querySelectorAll('.s3-chip').forEach(function (c) { c.addEventListener('click', function () { send(c.dataset.q || c.textContent); }); });
  document.querySelectorAll('.s3-model').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('.s3-model').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); }); });
  var rb = $('s3-reset'); if (rb) rb.addEventListener('click', function () { resetScene(); bubble('ai', 'Map réinitialisée. Dis-moi ce que tu veux construire 🌱'); });
  var pb = $('s3-playbtn'); if (pb) pb.addEventListener('click', function () { setMode(mode === 'play' ? 'view' : 'play'); });
  var vb = $('s3-viewbtn'); if (vb) vb.addEventListener('click', function () { setFpv(!fpv); }); setFpv(true);
  document.querySelectorAll('.s3-skin').forEach(function (b) { b.addEventListener('click', function () { applySkin(b.dataset.skin); }); });
  window.BloxiaStudio = { setMode: setMode, setFpv: function (v) { setFpv(v); }, applySkin: applySkin, say: send, player: player, get mode() { return mode; } };
  var cap = $('s3-capture'); if (cap) cap.addEventListener('click', function () { try { renderer.render(scene, camera); var url = renderer.domElement.toDataURL('image/png'); var a = document.createElement('a'); a.href = url; a.download = 'bloxia-map.png'; a.click(); } catch (e) {} });

  bubble('ai', 'Salut ! Décris ce que tu veux sur ta map : une forêt, une voiture, un immeuble, un lac… Et clique « Jouer » pour te balader dedans.');
  var w2 = $('s3-wait'); if (w2) w2.remove();
})();
