// Formules : source unique pour l'affichage (/api/offer) et le paiement (/api/checkout).
// price = prix mensuel ; annual = prix total sur 12 mois (facturé une fois par an, après 3 jours d'essai gratuit).
// Offre de bienvenue : -30 % sur le 1er mois (formules mensuelles uniquement), valable 10 minutes à partir de la première visite. L'annuel est déjà à -40 %.
module.exports = {
  discount: 0.3,
  offerMs: 10 * 60 * 1000,
  trialDays: 3,
  list: [
    {
      id: 'starter', name: 'Starter', price: 9.90, annual: 70.80, tag: 'Pour débuter', cta: 'Je publie mon premier jeu',
      purpose: 'Tu veux voir ton premier jeu en ligne, sans te perdre.',
      specialty: 'Ton premier jeu publié ce week-end',
      features: [['games', '1 jeu généré par mois'], ['prompt', '4 prompts Roblox Studio par jeu'], ['script', '3 scripts Luau commentés en français'], ['shop', 'Ta boutique avec les prix conseillés'], ['launch', 'Un plan de lancement pas à pas']]
    },
    {
      id: 'essentiel', name: 'Essentiel', price: 16.90, annual: 118.80, featured: true, tag: 'Pour grandir', cta: 'Je lance mes jeux',
      purpose: 'Tu veux lancer plusieurs jeux et garder ceux qui marchent.',
      specialty: 'Lance, teste, garde ce qui rapporte',
      features: [['games', '5 jeux générés par mois'], ['refresh', 'Tes packs mis à jour chaque semaine'], ['video', '3 idées de vidéos TikTok par jeu'], ['chart', 'Le plan semaine 2 pour garder tes joueurs'], ['support', 'Support prioritaire en français']],
      plus: 'Tout ce qu\'il y a dans Starter'
    },
    {
      id: 'business', name: 'Business', price: 79.90, annual: 574.80, tag: 'Pour un studio', cta: 'Je monte mon studio',
      purpose: 'Tu veux créer à plusieurs et sortir des jeux en continu.',
      specialty: 'Un vrai studio, avec un coach',
      features: [['infinite', 'Jeux illimités'], ['team', '3 places pour ton équipe'], ['target', 'Un coaching par mois en visio'], ['bolt', 'Les nouveautés en avant-première'], ['shield', 'Support dédié, réponse sous 24 h']],
      plus: 'Tout ce qu\'il y a dans Essentiel'
    }
  ]
};
