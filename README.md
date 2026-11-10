# Bloxia
Local : `npm start` → http://localhost:3000 (paiement simulé sans clés Whop).

## Déploiement Vercel
1. Importer le repo (pas de framework, laisser les réglages de `vercel.json`).
2. Storage → ajouter **Upstash Redis** (injecte `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Variables : `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_WEBHOOK_SECRET`, `WHOP_CURRENCY` (prix des formules : `lib/plans.js`).
4. Whop → webhook vers `https://TON-DOMAINE/api/webhook/whop` (events `payment.succeeded`).
5. Images de fond : `public/img/*.jpg|png|webp`.
Sans clés Whop, le checkout renvoie une erreur en production (le mode simulé est local uniquement).

## Sur-mesure (Claude Fable 5.2)
Après paiement, l'espace client lance `/api/generate` : Claude Fable 5.2 écrit 5 prompts propres à l'idée et un script de mécanique spéciale (bloc CONFIG d'options). Le résultat est vérifié (noms d'objets requis présents, syntaxe Lua valide) puis sauvegardé. En cas d'échec, le client garde les prompts standards.
- Variables : `ANTHROPIC_API_KEY` (obligatoire), `BLOXIA_MODEL` (optionnel).
- Test local sans clé : `BLOXIA_FAKE_GEN=1 npm start` (simulation, jamais active sur Vercel).
- Durée max de la fonction : 300 s (`vercel.json`).
