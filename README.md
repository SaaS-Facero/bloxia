# Bloxia
Local : `npm start` → http://localhost:3000 (paiement simulé sans clés Whop).

## Déploiement Vercel
1. Importer le repo (pas de framework, laisser les réglages de `vercel.json`).
2. Storage → ajouter **Upstash Redis** (injecte `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Variables : `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_WEBHOOK_SECRET`, `WHOP_PRICE`, `WHOP_CURRENCY`.
4. Whop → webhook vers `https://TON-DOMAINE/api/webhook/whop` (events `payment.succeeded`).
5. Images de fond : `public/img/*.jpg|png|webp`.
Sans clés Whop, le checkout renvoie une erreur en production (le mode simulé est local uniquement).
