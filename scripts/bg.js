// Génère public/bg.json (liste des images de fond) — lancé au build et au démarrage.
const fs = require('fs'), path = require('path'), d = path.join(__dirname, '..', 'public');
let l = []; try { l = fs.readdirSync(path.join(d, 'assets', 'img', 'bg')).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().map(f => '/assets/img/bg/' + f); } catch {}
fs.writeFileSync(path.join(d, 'bg.json'), JSON.stringify(l));
