/* Bilingue FR/EN : traduit le texte (statique + généré par JS) via un dictionnaire + MutationObserver.
   Les chaînes absentes du dictionnaire restent en français (dégradation propre). */
(function () {
  var stored; try { stored = localStorage.getItem('bloxia.lang'); } catch (e) {}
  // ?lang=en/fr dans l'URL : force et mémorise la langue (lien partageable en anglais).
  var urlLang = null; try { var ul = new URLSearchParams(location.search).get('lang'); if (ul === 'en' || ul === 'fr') { urlLang = ul; localStorage.setItem('bloxia.lang', ul); } } catch (e) {}
  var nav = (navigator.language || 'fr').toLowerCase();
  var LANG = urlLang || stored || (nav.indexOf('fr') === 0 ? 'fr' : 'en');
  window.BXL = { lang: LANG };

  // Dictionnaire FR -> EN. Clé = texte français exact tel qu'affiché.
  var EN = {
    // nav
    'Aperçu': 'Preview', 'Comment ça marche': 'How it works', 'Le pack': 'The pack', 'Ressources': 'Resources', 'FAQ': 'FAQ', 'Studio': 'Studio',
    'Mon espace': 'My space', 'Je crée mon jeu': 'Create my game', 'Je crée mon jeu gratuitement': 'Create my game for free',
    'Je reprends': 'Resume', 'Connexion partenaire': 'Partner login',
    // hero
    'Pour Roblox Studio · aucun code requis': 'For Roblox Studio · no code required',
    'Décris ton jeu Roblox.': 'Describe your Roblox game.', 'On le construit.': 'We build it.', 'Tu encaisses les Robux.': 'You earn the Robux.',
    'Écris ton idée, je m\'occupe du reste.': 'Type your idea, I handle the rest.',
    'Décris ton jeu en une phrase': 'Describe your game in one sentence', 'Je génère ma map': 'Generate my map',
    'Essaie': 'Try', 'Gratuit': 'Free', 'Sans carte bancaire': 'No credit card', 'Aperçu en 30 secondes': 'Preview in 30 seconds',
    'Type': 'Type', 'Thème': 'Theme', 'Blocs posés': 'Blocks placed', 'Glisse pour tourner la map': 'Drag to spin the map',
    'Prompts, scripts et boutique inclus': 'Prompts, scripts and shop included', 'Descendre': 'Scroll down',
    // simulateur
    'Simulateur de revenus': 'Revenue simulator', 'Et si ton jeu': 'What if your game', 'marchait ?': 'took off?',
    'Règle les curseurs : le téléphone calcule ce que ton jeu pourrait rapporter avec des Game Pass, au taux officiel DevEx de Roblox.': 'Move the sliders: the phone estimates what your game could earn with Game Passes, at Roblox’s official DevEx rate.',
    'Visiteurs par jour': 'Visitors per day', 'Prix de ton Game Pass': 'Your Game Pass price',
    '1 % des visiteurs achètent un Game Pass': '1% of visitors buy a Game Pass', 'Tu touches 70 % du prix, Roblox garde 30 %': 'You keep 70% of the price, Roblox takes 30%',
    'DevEx : 0,0038 $ par Robux gagné, ≈ 0,87 € le dollar': 'DevEx: $0.0038 per earned Robux, ≈ $1 base',
    'Revenus · Game Pass (estimation)': 'Revenue · Game Pass (estimate)', 'Nouveau': 'New', 'Moyenne / jour': 'Average / day', 'Versement': 'Payout', 'Mensuel': 'Monthly',
    'Derniers revenus simulés': 'Latest simulated revenue',
    // pack
    'Ton pack, en direct': 'Your pack, live', 'Pas juste une map.': 'Not just a map.', 'la publier': 'publish it', '2 éléments débloqués sur 5': '2 of 5 items unlocked', 'Je récupère mon pack': 'Get my pack',
    'Ils l\'ont fait': 'They did it', 'Les jeux déjà lancés avec Bloxia': 'Games already launched with Bloxia', 'Les genres qui cartonnent sur Roblox': 'The genres blowing up on Roblox',
    // comment
    'De ta phrase': 'From your sentence', 'à ton jeu publié.': 'to your published game.', 'Ta phrase': 'Your sentence', 'Map générée': 'Map generated', 'blocs': 'blocks', 'Ta boutique': 'Your shop',
    'Tu écris ta phrase.': 'You write your sentence.', 'Ta map se construit.': 'Your map builds itself.', 'Tu colles dans Studio.': 'You paste into Studio.', 'Tu publies. Tu vends.': 'You publish. You sell.',
    // pourquoi
    'Pourquoi Bloxia': 'Why Bloxia', 'Une map seule': 'A map alone', 'ne rapporte rien.': 'earns nothing.',
    'Générer une map, n\'importe quel outil sait le faire. Ce qui fait gagner des Robux, c\'est tout ce qu\'il y a autour.': 'Any tool can generate a map. What actually earns Robux is everything around it.',
    'Un générateur de map': 'A map generator', 'Tu as un décor. Et maintenant ?': 'You’ve got scenery. Now what?', 'Une map 3D': 'A 3D map',
    'Les prompts pour Roblox Studio': 'The prompts for Roblox Studio', 'Tu as un jeu prêt à publier. Et à vendre.': 'You’ve got a game ready to publish. And to sell.', 'Une map 3D, depuis ta phrase': 'A 3D map, from your sentence', 'Les prompts Studio, à copier-coller': 'The Studio prompts, copy-paste ready',
    // offre
    'Ce que tu reçois': 'What you get', 'Tout pour publier': 'Everything to publish', 'ton jeu': 'your game', 'ce week-end.': 'this weekend.',
    'Pas une formation. Pas des heures de vidéos. Des fichiers prêts à coller dans Roblox Studio.': 'Not a course. Not hours of videos. Files ready to paste into Roblox Studio.',
    'Pack complet': 'Full pack', 'pour générer ta map et découvrir ton pack': 'to generate your map and preview your pack', 'Je génère mon jeu gratuitement': 'Generate my game for free',
    'Remboursé sous 14 jours si la map ou les scripts ne marchent pas': 'Refunded within 14 days if the map or scripts don’t work',
    'Prompts Roblox Studio': 'Roblox Studio prompts', 'Copie, colle : ta map se construit dans Studio, étape par étape.': 'Copy, paste: your map builds in Studio, step by step.',
    'Scripts Luau prêts à l\'emploi': 'Ready-to-use Luau scripts', 'Gameplay, sauvegarde, boutique. Commentés en français, rien à coder.': 'Gameplay, saving, shop. Commented, nothing to code.',
    'Achats à vendre, prix compris': 'Items to sell, prices included', 'Quoi vendre, combien de Robux, et à quel moment le proposer.': 'What to sell, how many Robux, and when to offer it.',
    'Visuels qui font cliquer': 'Click-worthy visuals', 'Le brief de ton icône et de tes 3 miniatures, et un titre optimisé.': 'The brief for your icon and 3 thumbnails, plus an optimized title.',
    'Vidéos TikTok à tourner': 'TikTok videos to film', 'Trois idées de vidéos prêtes à filmer pour tes premiers joueurs.': 'Three ready-to-film video ideas for your first players.',
    'Plan de la semaine 2': 'Week 2 plan', 'Ce qu\'il faut ajouter pour que tes joueurs reviennent.': 'What to add so your players come back.',
    // garantie
    'Ta map ne marche pas dans Studio ? On te rembourse.': 'Your map doesn’t work in Studio? We refund you.',
    // FAQ
    'Questions fréquentes': 'Frequently asked questions',
    'Bloxia, c\'est quoi exactement ?': 'What exactly is Bloxia?',
    'Je n\'ai jamais ouvert Roblox Studio. C\'est pour moi ?': 'I’ve never opened Roblox Studio. Is this for me?',
    'En combien de temps mon jeu peut être en ligne ?': 'How fast can my game be online?',
    'Roblox a déjà son propre outil IA. Pourquoi Bloxia ?': 'Roblox already has its own AI tool. Why Bloxia?',
    'Est-ce que je vais gagner des Robux ?': 'Will I earn Robux?',
    'Comment je récupère l\'argent gagné ?': 'How do I cash out what I earn?',
    'Pack ou abonnement Créateur : lequel choisir ?': 'Pack or Creator subscription: which one?',
    'J\'ai moins de 18 ans, je peux acheter ?': 'I’m under 18, can I buy?',
    'Oui, avec un parent : c\'est lui qui fait le paiement, ou qui te donne son accord.': 'Yes, with a parent: they make the payment, or give their consent.',
    'Et si ça ne marche pas ?': 'What if it doesn’t work?',
    'Comment j\'arrête l\'abonnement ?': 'How do I cancel the subscription?',
    // final
    'Toi, tu vas la publier.': 'You’re going to publish yours.', 'Ton idée, en une phrase': 'Your idea, in one sentence',
    'Un tycoon de pizzeria sur une île tropicale': 'A pizzeria tycoon on a tropical island', 'Remboursé si ça ne marche pas': 'Refunded if it doesn’t work',
    // footer (rendu par common.js)
    'Une question sur ton jeu, ton pack ou ton paiement ? L\'équipe te répond, en français.': 'A question about your game, pack or payment? The team replies, fast.',
    'Produit': 'Product', 'Créer mon jeu': 'Create my game', 'Bloxia': 'Bloxia', 'Nous contacter': 'Contact us', 'Légal': 'Legal',
    'Tous les guides': 'All guides', 'Programme partenaire': 'Partner program',
    'Conditions générales de vente': 'Terms of sale', 'Mentions légales': 'Legal notice', 'Politique de confidentialité': 'Privacy policy',
    'Garantie 14 jours': '14-day guarantee',
    // lp.js (aperçu dynamique)
    'Je crée mon jeu gratuitement ': 'Create my game for free ', 'ton jeu': 'your game', 'Ta map': 'Your map', 'Prompts Studio': 'Studio prompts', 'Monétisation': 'Monetization', 'Copié': 'Copied', 'Simulator': 'Simulator', 'Pêche': 'Fishing',
    // sim.js
    'Pet légendaire': 'Legendary pet', 'Skin doré': 'Golden skin', 'Zone secrète': 'Secret zone', 'Pack de départ': 'Starter pack', 'VIP': 'VIP', 'Double argent': 'Double money', 'Vitesse x2': '2x speed', 'Auto-collecte': 'Auto-collect',
    'retrait DevEx dès 30 000 R$ cumulés': 'DevEx cashout from 30,000 R$ earned', 'retrait DevEx possible chaque mois': 'DevEx cashout possible every month',
    // puces de suggestion (lp.js)
    'Obby dans un volcan': 'Volcano obby', 'Tycoon de pizzeria': 'Pizzeria tycoon', 'Survie zombie': 'Zombie survival', 'Minage sur Mars': 'Mining on Mars',
    // thèmes et genres (HUD, tags)
    'Volcan': 'Volcano', 'Glace': 'Ice', 'Ville': 'City', 'Espace': 'Space', 'Manoir hanté': 'Haunted manor', 'Île': 'Island', 'Jungle': 'Jungle', 'Bonbons': 'Candy', 'Prairie': 'Meadow',
    'Obby': 'Obby', 'Tycoon': 'Tycoon', 'Simulateur': 'Simulator', 'Horreur': 'Horror', 'Tower Defense': 'Tower Defense', 'Roleplay': 'Roleplay'
  };

  function tr(s) { var k = s.trim(); var v = EN[k]; if (v == null) return null; return s.replace(k, v); }

  function walk(node) {
    if (LANG !== 'en') return;
    if (node.nodeType === 3) { if (node.nodeValue && node.nodeValue.trim()) { var r = tr(node.nodeValue); if (r != null) node.nodeValue = r; } return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CANVAS' || tag === 'TEXTAREA') return;
    ['placeholder', 'aria-label', 'alt', 'title'].forEach(function (a) { if (node.hasAttribute && node.hasAttribute(a)) { var r = tr(node.getAttribute(a)); if (r != null) node.setAttribute(a, r); } });
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  function applyAll() { if (LANG !== 'en') return; document.documentElement.lang = 'en'; walk(document.body); var t = tr(document.title); if (t != null) document.title = t; }

  // bouton FR/EN dans la barre de nav
  function toggle() {
    var host = document.querySelector('.nav-actions'); if (!host || document.getElementById('langsw')) return;
    var box = document.createElement('div'); box.id = 'langsw'; box.className = 'langsw';
    box.innerHTML = '<button data-l="fr"' + (LANG === 'fr' ? ' class="on"' : '') + '>FR</button><button data-l="en"' + (LANG === 'en' ? ' class="on"' : '') + '>EN</button>';
    host.insertBefore(box, host.firstChild);
    box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { var l = b.dataset.l; if (l === LANG) return; try { localStorage.setItem('bloxia.lang', l); } catch (e) {} location.reload(); }; });
  }

  var st = document.createElement('style');
  st.textContent = '.langsw{display:inline-flex;border:1px solid var(--line-2,rgba(255,255,255,.18));border-radius:999px;overflow:hidden;margin-right:8px}.langsw button{border:0;background:transparent;color:var(--ink-2,#9aa);font:700 12px var(--mono,monospace);padding:7px 11px;cursor:pointer}.langsw button.on{background:var(--accent,#4f6bed);color:#fff}';
  (document.head || document.documentElement).appendChild(st);

  // observateur léger : regroupe les nœuds ajoutés et les traduit une fois par frame.
  if (LANG === 'en') {
    var pending = [], scheduled = false;
    function flush() { scheduled = false; var list = pending; pending = []; for (var i = 0; i < list.length; i++) walk(list[i]); }
    var mo = new MutationObserver(function (muts) { for (var i = 0; i < muts.length; i++) { var n = muts[i].addedNodes; for (var j = 0; j < n.length; j++) pending.push(n[j]); } if (!scheduled) { scheduled = true; requestAnimationFrame(flush); } });
    var start = function () { applyAll(); toggle(); mo.observe(document.body, { childList: true, subtree: true }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  } else {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', toggle); else toggle();
  }
})();
