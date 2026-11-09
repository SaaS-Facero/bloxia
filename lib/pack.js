// Contenu payant : jamais servi sans paiement confirmé par webhook.
module.exports = function pack(lead) {
  const a = lead.answers || {};
  const type = a.type || 'tycoon', theme = a.phrase || 'ta map';
  return {
    titre: `Pack Bloxia — ${type}`,
    prompts: [
      `Crée un script Luau Roblox Studio pour un ${type} : ${theme}. Structure : ServerScriptService + ModuleScripts.`,
      `Génère le terrain en Parts : thème "${theme}", zone de spawn, 3 zones progressives.`,
      `Écris la boucle économique du ${type} : gain/seconde, upgrades x1.5, sauvegarde DataStore.`,
      `Crée l'UI ScreenGui : argent, boutique, bouton rebirth, animations Tween.`
    ],
    scripts: [
      { nom: 'Leaderstats', code: `game.Players.PlayerAdded:Connect(function(p)\n local f=Instance.new("Folder",p) f.Name="leaderstats"\n local c=Instance.new("IntValue",f) c.Name="Cash" c.Value=0\nend)` },
      { nom: 'Collecteur', code: `local part=script.Parent\npart.Touched:Connect(function(h)\n local p=game.Players:GetPlayerFromCharacter(h.Parent)\n if p then p.leaderstats.Cash.Value+=10 end\nend)` },
      { nom: 'Sauvegarde', code: `local DS=game:GetService("DataStoreService"):GetDataStore("v1")\ngame.Players.PlayerRemoving:Connect(function(p)\n pcall(DS.SetAsync,DS,p.UserId,p.leaderstats.Cash.Value)\nend)` }
    ],
    achats: ['Game Pass x2 Cash', 'Game Pass VIP zone', 'Produit développeur : boost 15 min', 'Pack de départ'],
    briefs: ['Miniature : contraste fort, perso à gauche, texte 3 mots max', 'Icône du jeu : carrée, 1 objet, fond saturé'],
    videos: ['TikTok 15 s : avant/après de la map', 'Short : "J\'ai créé un jeu en 1 phrase"', 'Devlog 60 s'],
    semaine2: ['J8 publier + test 5 amis', 'J9 corriger onboarding', 'J10 ajouter Game Pass', 'J11 miniature v2', 'J12 vidéo promo', 'J13 analyser rétention', 'J14 update']
  };
};
