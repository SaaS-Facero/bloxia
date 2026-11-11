// Génère la section Ressources/Blog (SEO) : articles, hub, sitemap.xml, robots.txt.
// Lancer : node scripts/blog.js  (aussi appelé au build). Contenu honnête, sans promesse de gains.
const fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, '..', 'public');
const SITE = 'https://www.getbloxia.com', BRAND = 'Bloxia';
const today = new Date().toISOString().slice(0, 10);

// ---- contenu des articles ----
const A = [
  {
    slug: 'creer-un-jeu-roblox-sans-coder',
    title: 'Créer un jeu Roblox sans coder : le guide complet 2026',
    desc: 'Tu veux créer un jeu Roblox mais tu ne sais pas coder ? Voici comment partir d\'une idée en une phrase et obtenir une map, des scripts et une boutique, étape par étape.',
    cat: 'Débuter', mins: 7, date: '2026-11-11',
    h1: 'Créer un jeu Roblox sans coder (guide 2026)',
    lead: 'Pas besoin de savoir programmer en Luau pour lancer ton premier jeu Roblox. Voici la méthode, de l\'idée à la publication, et les outils qui écrivent le code à ta place.',
    body: [
      { h2: 'Faut-il vraiment savoir coder pour faire un jeu Roblox ?', p: [
        'Non. Créer un jeu Roblox demande trois choses : une map (le décor et les niveaux), des scripts (ce qui rend le jeu jouable) et une façon de gagner des Robux (la boutique). Le code Luau ne concerne que la partie scripts, et c\'est justement là que la plupart des débutants abandonnent.',
        'Aujourd\'hui, des outils génèrent les scripts pour toi. Tu décris ton idée, tu reçois le code prêt à coller dans Roblox Studio. Ton travail devient : assembler, personnaliser, publier.' ] },
      { h2: 'Les 4 étapes pour créer ton jeu', p: [
        '1. L\'idée. Résume ton jeu en une phrase : genre (obby, tycoon, simulator, horreur…), thème (espace, bonbons, ville…) et objectif. Plus c\'est précis, mieux c\'est.',
        '2. La map. Construis le décor dans Roblox Studio, ou pars d\'une map générée que tu ajustes. Pense à la zone de spawn, aux checkpoints et à la progression.',
        '3. Les scripts. C\'est le cœur : sauvegarde des joueurs, boutique, mécanique principale. Avec un générateur comme Bloxia, tu colles le code Luau sans l\'écrire.',
        '4. La publication. Tu publies depuis Roblox Studio, tu règles l\'icône et la description, et ton jeu est en ligne.' ] },
      { h2: 'Roblox Studio, par où commencer ?', p: [
        'Roblox Studio est gratuit, sur Windows et Mac. Télécharge-le depuis create.roblox.com, connecte-toi avec ton compte Roblox, et crée un nouveau projet « Baseplate ». L\'Explorer (à droite) liste tous les objets de ton jeu : c\'est là que tu colles tes scripts, dans ServerScriptService.',
        'Active la sauvegarde des données dans les paramètres du jeu (Security → Enable Studio Access to API Services) pour que la progression des joueurs soit gardée.' ] },
      { h2: 'Combien de temps pour un premier jeu ?', p: [
        'Un jeu simple et publiable peut se monter en un week-end si tu pars d\'une base toute prête. L\'important n\'est pas la taille : un petit jeu bien fini, avec une boutique claire et des mises à jour régulières, marche mieux qu\'un gros projet jamais terminé.' ] },
    ],
    faq: [
      { q: 'Est-ce que créer un jeu Roblox est gratuit ?', a: 'Oui. Roblox Studio est gratuit et publier un jeu ne coûte rien. Tu peux ensuite vendre des Game Pass pour gagner des Robux.' },
      { q: 'Quel âge faut-il pour gagner de l\'argent sur Roblox ?', a: 'Le programme DevEx, qui convertit les Robux en argent réel, est accessible dès 13 ans, avec l\'accord d\'un parent pour les mineurs.' },
      { q: 'Peut-on vraiment faire un jeu sans écrire de code ?', a: 'Oui pour la map et l\'assemblage. Les scripts restent nécessaires, mais un générateur peut les écrire pour toi : tu n\'as qu\'à les coller.' },
    ],
    related: ['comment-publier-un-jeu-roblox', 'idees-de-jeux-roblox'],
  },
  {
    slug: 'combien-gagne-un-createur-roblox',
    title: 'Combien gagne un créateur Roblox ? (chiffres réels, DevEx)',
    desc: 'Combien rapporte vraiment un jeu Roblox ? Taux DevEx, exemples de revenus, ce que Roblox prend, et pourquoi la plupart des jeux ne gagnent rien. Les chiffres honnêtes.',
    cat: 'Revenus', mins: 8, date: '2026-11-11',
    h1: 'Combien gagne un créateur Roblox ?',
    lead: 'La vraie réponse : ça dépend énormément du jeu, et la plupart ne rapportent rien. Mais voici comment fonctionne l\'argent sur Roblox, avec des chiffres vérifiables et sans promesse en l\'air.',
    body: [
      { h2: 'Comment on gagne de l\'argent sur Roblox', p: [
        'Les joueurs achètent des Robux, puis dépensent ces Robux dans ton jeu : Game Pass, objets, passes VIP. Tu touches une part de chaque vente. Une fois assez de Robux « gagnés » accumulés, tu peux les convertir en argent réel via le programme DevEx (Developer Exchange).' ] },
      { h2: 'Le taux DevEx : combien vaut un Robux', p: [
        'Roblox convertit les Robux gagnés en dollars selon un taux fixé par Roblox (de l\'ordre de 0,0038 $ par Robux fin 2025). Autrement dit, 100 000 Robux gagnés valent quelques centaines de dollars. Le taux exact évolue : vérifie toujours la page officielle DevEx de Roblox avant de faire tes calculs.',
        'Important : seuls les Robux « gagnés » (dépensés par d\'autres joueurs chez toi) comptent pour le DevEx, pas les Robux que tu achètes.' ] },
      { h2: 'Un exemple concret', p: [
        'Imagine un Game Pass à 99 Robux. Sur chaque vente, après la part de Roblox, il te reste une partie. Si 1 000 joueurs l\'achètent, tu accumules quelques dizaines de milliers de Robux, soit l\'équivalent de quelques centaines d\'euros une fois converti. Ça paraît peu par vente, mais ça se cumule avec le trafic.',
        'C\'est pour ça que le nombre de visiteurs par jour change tout : le même jeu à 500 ou à 10 000 visiteurs quotidiens n\'a rien à voir en revenus.' ] },
      { h2: 'La réalité : la plupart des jeux ne gagnent rien', p: [
        'Il faut être honnête : une immense majorité des jeux Roblox ne rapportent presque rien, surtout au début. Les jeux qui marchent ont en commun une boutique bien pensée, une belle vitrine (icône, miniatures), et surtout des mises à jour régulières qui ramènent les joueurs.',
        'Aucun revenu n\'est garanti. Vois Roblox comme un apprentissage : tu progresses à chaque jeu, et quelques-uns finissent par décoller.' ] },
      { h2: 'L\'écosystème en chiffres', p: [
        'Pour donner une idée de la taille : Roblox a reversé de l\'ordre d\'un milliard de dollars à l\'ensemble de ses créateurs sur 2025, avec des dizaines de millions de joueurs chaque jour. L\'argent existe ; le défi, c\'est d\'en capter une part avec un jeu que les gens aiment.' ] },
    ],
    faq: [
      { q: 'Quel est le taux DevEx de Roblox ?', a: 'Il est fixé par Roblox et évolue (environ 0,0038 $ par Robux gagné fin 2025). Vérifie toujours la page officielle DevEx avant de calculer.' },
      { q: 'À partir de combien de Robux peut-on retirer de l\'argent ?', a: 'Le DevEx demande un minimum de Robux gagnés (plusieurs dizaines de milliers) et un compte éligible. Le seuil exact est indiqué sur le site de Roblox.' },
      { q: 'Est-ce qu\'on gagne de l\'argent garanti avec un jeu Roblox ?', a: 'Non. Rien n\'est garanti : la plupart des jeux rapportent peu. Les revenus dépendent du trafic, de la boutique et des mises à jour.' },
    ],
    related: ['creer-un-jeu-roblox-sans-coder', 'idees-de-jeux-roblox'],
  },
  {
    slug: 'idees-de-jeux-roblox',
    title: '25 idées de jeux Roblox à créer en 2026 (par genre)',
    desc: 'À court d\'inspiration ? Voici 25 idées de jeux Roblox classées par genre (obby, tycoon, simulator, horreur, RP) pour lancer ton prochain projet.',
    cat: 'Idées', mins: 6, date: '2026-11-11',
    h1: '25 idées de jeux Roblox à créer',
    lead: 'Le plus dur, c\'est souvent de trouver une idée qui tient en une phrase. En voici 25, par genre, prêtes à être transformées en jeu.',
    body: [
      { h2: 'Obby (parcours)', p: [
        'Un obby dans un volcan où la lave monte. Un parcours à travers un gâteau géant. Une tour à gravir avec des checkpoints colorés. Un obby « sol qui disparaît » en multijoueur. Un parcours spatial en apesanteur.' ] },
      { h2: 'Tycoon (construis ton empire)', p: [
        'Un tycoon de pizzeria sur une île. Une usine à bonbons à automatiser. Un tycoon de studios de jeux vidéo. Un empire de fast-foods. Un tycoon spatial où tu construis ta station.' ] },
      { h2: 'Simulator (collecte et améliore)', p: [
        'Un simulator où tu fais grandir un animal. Un simulator de minage sur Mars. Un simulator de force à la salle de sport. Un simulator de pêche aux créatures rares. Un simulator où tu collectes des pets lumineux.' ] },
      { h2: 'Horreur et survie', p: [
        'Une survie dans une station spatiale abandonnée. Un manoir hanté à explorer la nuit. Une fuite face à un monstre dans un centre commercial. Une survie zombie en équipe. Une nuit à tenir dans une forêt maudite.' ] },
      { h2: 'RP et social', p: [
        'Un RP de ville où chacun a un métier. Un café à gérer avec des clients. Une école où les joueurs suivent des cours. Un RP de super-héros. Un monde médiéval avec des quêtes.' ] },
      { h2: 'Comment choisir ?', p: [
        'Prends une idée qui te parle, précise le genre et le thème, et résume-la en une phrase. C\'est cette phrase qui devient la base de ta map et de tes scripts. Ne cherche pas l\'idée parfaite : la meilleure idée est celle que tu finis et que tu publies.' ] },
    ],
    related: ['creer-un-jeu-roblox-sans-coder', 'comment-publier-un-jeu-roblox'],
  },
  {
    slug: 'comment-publier-un-jeu-roblox',
    title: 'Comment publier un jeu sur Roblox : guide étape par étape',
    desc: 'Ton jeu est prêt dans Roblox Studio ? Voici comment le publier, régler l\'icône, la description et les paramètres pour qu\'il soit trouvé et joué.',
    cat: 'Publier', mins: 6, date: '2026-11-11',
    h1: 'Comment publier un jeu sur Roblox',
    lead: 'Publier un jeu Roblox prend quelques minutes depuis Roblox Studio. Voici les étapes et les réglages à ne pas rater pour que ton jeu soit visible.',
    body: [
      { h2: 'Étape 1 : publier depuis Roblox Studio', p: [
        'Dans Roblox Studio, ouvre ton jeu, puis File → Publish to Roblox. Donne un nom clair et une description, choisis le genre, et valide. Ton jeu existe maintenant sur ta page de création.' ] },
      { h2: 'Étape 2 : rendre le jeu public', p: [
        'Va sur create.roblox.com, ouvre ton jeu, puis dans les paramètres passe la visibilité sur « Public ». Tant qu\'il est en « Privé », personne d\'autre que toi ne peut y jouer.' ] },
      { h2: 'Étape 3 : l\'icône et les miniatures', p: [
        'L\'icône (512×512) et les miniatures (format 16:9) sont la première chose que voient les joueurs. Soigne-les : un visuel propre fait une énorme différence sur le taux de clic. Ajoute plusieurs miniatures qui montrent l\'action du jeu.' ] },
      { h2: 'Étape 4 : la description et les tags', p: [
        'Écris une description courte qui dit ce qu\'on fait dans le jeu et pourquoi y revenir. Utilise un titre qui contient des mots que les gens recherchent (le genre, le thème). Mets à jour la description à chaque nouveauté.' ] },
      { h2: 'Étape 5 : les mises à jour', p: [
        'Un jeu publié n\'est pas fini : les jeux qui marchent se mettent à jour souvent. Ajoute du contenu, corrige les bugs remontés par les joueurs, et annonce tes updates. C\'est ce qui ramène du monde et fait monter ton jeu.' ] },
    ],
    faq: [
      { q: 'Combien coûte la publication d\'un jeu Roblox ?', a: 'Rien. Publier est gratuit. Seuls certains éléments payants (comme réserver un nom d\'objet) peuvent coûter des Robux.' },
      { q: 'Pourquoi mon jeu n\'apparaît pas dans les recherches ?', a: 'Un jeu neuf met du temps à être indexé et a besoin de visites pour remonter. Soigne l\'icône, le titre et partage ton jeu pour lancer les premières parties.' },
    ],
    related: ['creer-un-jeu-roblox-sans-coder', 'idees-de-jeux-roblox'],
  },
];

// ---- rendu ----
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const head = (title, desc, url, extra = '') => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<meta name="theme-color" content="#05060b">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/site.css"><link rel="stylesheet" href="/assets/css/blog.css">${extra}</head>
<body>
<a class="skip" href="#main">Aller au contenu</a>
<header class="nav nav-float" id="nav"><div class="nav-bar">
  <a class="logo" href="/" aria-label="Bloxia"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l11 6.3-11 6.3L5 9.3z" fill="#c7d2fe"/><path d="M5 9.3l11 6.3v12.6L5 21.9z" fill="#4f6bed"/><path d="M27 9.3l-11 6.3v12.6l11-6.3z" fill="#2f3fa8"/></svg><span>Bloxia</span></a>
  <nav class="nav-center" aria-label="Navigation"><a href="/#comment">Comment ça marche</a><a href="/#offre">Le pack</a><a href="/blog/">Ressources</a><a href="/#faq">FAQ</a></nav>
  <div class="nav-actions"><a class="btn btn-light btn-sm" href="/espace.html">Mon espace</a><a class="btn" href="/funnel.html" data-cta="blog"><span class="lbl">Je crée mon jeu</span><i data-i="arrow-right"></i></a></div>
</div></header>
<main id="main">`;
const foot = `</main><footer data-site-footer></footer>
<script src="/assets/js/config.js"></script><script src="/assets/js/common.js"></script></body></html>`;

const cta = `<aside class="bl-cta"><div><h2>Passe de l'idée au jeu</h2><p>Décris ton jeu Roblox en une phrase. Bloxia génère la map, les scripts Luau et la boutique. Aucun code à écrire.</p></div><a class="btn btn-gold" href="/funnel.html" data-cta="blog-cta"><span class="lbl">Je crée mon jeu gratuitement</span><i data-i="arrow-right"></i></a></aside>`;

function articleLD(a, url) {
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.desc, datePublished: a.date, dateModified: today, author: { '@type': 'Organization', name: BRAND }, publisher: { '@type': 'Organization', name: BRAND }, mainEntityOfPage: url, inLanguage: 'fr-FR' };
  let out = `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  if (a.faq && a.faq.length) { const f = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }; out += `<script type="application/ld+json">${JSON.stringify(f)}</script>`; }
  const bc = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [ { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Ressources', item: SITE + '/blog/' }, { '@type': 'ListItem', position: 3, name: a.h1, item: url } ] };
  out += `<script type="application/ld+json">${JSON.stringify(bc)}</script>`;
  return out;
}

function renderArticle(a) {
  const url = `${SITE}/blog/${a.slug}.html`;
  const sections = a.body.map(s => `<h2>${esc(s.h2)}</h2>${s.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('');
  const faq = a.faq && a.faq.length ? `<section class="bl-faq"><h2>Questions fréquentes</h2>${a.faq.map(x => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</section>` : '';
  const related = (a.related || []).map(sl => A.find(x => x.slug === sl)).filter(Boolean);
  const rel = related.length ? `<section class="bl-rel"><h2>À lire ensuite</h2><div class="bl-rgrid">${related.map(r => `<a class="bl-card" href="/blog/${r.slug}.html"><span class="bl-cat">${esc(r.cat)}</span><h3>${esc(r.h1)}</h3><span class="bl-more">Lire l'article <i data-i="arrow-right"></i></span></a>`).join('')}</div></section>` : '';
  return head(a.title, a.desc, url, articleLD(a, url)) + `
  <article class="bl-article">
    <nav class="bl-bread" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>/</span><a href="/blog/">Ressources</a><span>/</span><span>${esc(a.cat)}</span></nav>
    <header class="bl-head"><span class="bl-cat">${esc(a.cat)}</span><h1>${esc(a.h1)}</h1><p class="bl-lead">${esc(a.lead)}</p><p class="bl-meta">Mis à jour le ${new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${a.mins} min de lecture</p></header>
    <div class="bl-body">${sections}${faq}</div>
    ${cta}
    ${rel}
  </article>` + foot;
}

function renderHub() {
  const url = `${SITE}/blog/`;
  const ld = { '@context': 'https://schema.org', '@type': 'Blog', name: BRAND + ' · Ressources', url, inLanguage: 'fr-FR', blogPost: A.map(a => ({ '@type': 'BlogPosting', headline: a.title, url: `${SITE}/blog/${a.slug}.html`, datePublished: a.date })) };
  const cards = A.map(a => `<a class="bl-card" href="/blog/${a.slug}.html"><span class="bl-cat">${esc(a.cat)}</span><h2>${esc(a.h1)}</h2><p>${esc(a.desc)}</p><span class="bl-more">Lire l'article <i data-i="arrow-right"></i></span></a>`).join('');
  return head('Ressources Roblox : créer, publier et gagner — Bloxia', 'Guides et conseils pour créer un jeu Roblox sans coder, le publier et comprendre les revenus. Des articles clairs pour débuter sur Roblox Studio.', url, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`) + `
  <section class="bl-hub">
    <header class="bl-hubhead"><span class="mono">Ressources</span><h1>Tout pour créer ton jeu Roblox</h1><p>Des guides clairs pour débuter sur Roblox Studio, publier ton jeu et comprendre comment marchent les revenus. Sans blabla.</p></header>
    <div class="bl-grid">${cards}</div>
    ${cta}
  </section>` + foot;
}

function sitemap() {
  const urls = [ { u: SITE + '/', p: '1.0' }, { u: SITE + '/funnel.html', p: '0.9' }, { u: SITE + '/blog/', p: '0.8' } ].concat(A.map(a => ({ u: `${SITE}/blog/${a.slug}.html`, p: '0.7' })));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x => `  <url><loc>${x.u}</loc><lastmod>${today}</lastmod><priority>${x.p}</priority></url>`).join('\n')}\n</urlset>\n`;
}

const robots = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /espace.html\nDisallow: /merci.html\n\nSitemap: ${SITE}/sitemap.xml\n`;

// ---- écriture ----
const dir = path.join(PUB, 'blog'); fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'index.html'), renderHub());
A.forEach(a => fs.writeFileSync(path.join(dir, a.slug + '.html'), renderArticle(a)));
fs.writeFileSync(path.join(PUB, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(PUB, 'robots.txt'), robots);
console.log('blog généré :', A.length, 'articles + hub + sitemap + robots');
