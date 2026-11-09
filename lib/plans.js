// Formules d'abonnement : source unique pour l'affichage (via /api/offer) et le paiement (/api/checkout).
// Offre de bienvenue : -30 % sur le premier mois, valable 10 minutes à partir de la première visite du pricing.
module.exports = {
  discount: 0.3,
  offerMs: 10 * 60 * 1000,
  list: [
    { id: 'starter', name: 'Starter', price: 9.90, glyph: 'cube', features: ['1 jeu généré par mois', 'Pack complet : prompts, scripts, boutique', 'Plan de lancement'] },
    { id: 'essentiel', name: 'Essentiel', price: 16.90, glyph: 'rocket', featured: true, features: ['5 jeux générés par mois', 'Tout ce qu\'il y a dans Starter', 'Mises à jour de tes packs chaque semaine', 'Support prioritaire'] },
    { id: 'business', name: 'Business', price: 79.90, glyph: 'crown', features: ['Jeux illimités', 'Tout ce qu\'il y a dans Essentiel', 'Plans de lancement avancés', 'Accompagnement personnalisé'] }
  ]
};
