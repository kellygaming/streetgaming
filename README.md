# StreetGame

Réseau social pour joueurs mobile. Chaque jeu (Free Fire, Blood Strike, Roblox,
et d'autres à venir) a sa communauté : un salon de chat, des défis à relever
(conditions de performance en jeu, preuve à l'appui), et un catalogue de
récompenses échangeables contre des points.

Stack : **Next.js (App Router) + TypeScript + Tailwind + Supabase** (auth,
Postgres, Realtime, Storage). Design system **Nocturne** repris tel quel du
prototype fourni (`app/globals.css`).

## Structure

```
app/
  page.tsx                      → Accueil : hero jeux, défis en cours, récompenses populaires, classement
  defis/page.tsx                → Liste des défis, filtrable par jeu, soumission de preuve
  recompenses/page.tsx          → Catalogue de récompenses, échange contre points
  communautes/[game]/page.tsx   → Salon de chat d'un jeu (temps réel, présence, fond personnalisé)
  connexion/, inscription/      → Auth
  mes-commandes/, mes-defis/    → Historique perso (commandes de récompenses, soumissions de défis)
  auth/callback/route.ts        → Callback Supabase (confirmation e-mail)
  globals.css                   → Tokens + composants Nocturne (couleurs, boutons, cards, tags…)

components/                     → Header, cards, chat, formulaires…
lib/supabase/                   → Clients Supabase (browser / server / middleware / admin)
supabase/001_init.sql           → Schéma complet : tables, RLS, fonctions, seed (jeux/défis/récompenses de lancement)
```

## 1. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), crée un nouveau projet.
2. Dans **SQL Editor**, colle le contenu de `supabase/001_init.sql` et exécute-le.
   Ça crée tout le schéma (tables, sécurité RLS, fonctions métier) et seed les
   3 jeux de lancement avec leurs défis et récompenses.
3. Dans **Settings → API**, récupère l'URL du projet, la clé `anon` et la clé
   `service_role`.

## 2. Configurer et lancer en local

```bash
npm install
cp .env.example .env.local
# renseigne NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY dans .env.local
npm run dev
```

Ouvre http://localhost:3000.

## 3. Déployer sur Vercel

1. Importe le repo GitHub sur [vercel.com](https://vercel.com).
2. Vérifie que **Framework Preset** est **Next.js**.
3. Dans **Settings → Environment Variables**, ajoute les 3 variables Supabase
   (Production + Preview + Development).
4. **Deploy**.

## Comment ça marche

- **Comptes** : Supabase Auth (e-mail/mot de passe). Un profil (`profiles`)
  est créé automatiquement à l'inscription (pseudo dérivé de l'e-mail ou
  fourni au signup), avec un solde de points à 0 et un rôle `member`.
- **Points** : jamais modifiables directement par le client — uniquement via
  les fonctions `submit_challenge` / `review_submission` / `redeem_reward`
  (SQL, `security definer`), qui journalisent chaque mouvement dans
  `points_transactions`.
- **Défis** : un joueur soumet une preuve (capture uploadée dans le bucket
  privé `challenge-proofs`, ou lien replay) via `submit_challenge`. Un
  modérateur (`role = 'moderator'` ou `'admin'` sur `profiles`) valide ou
  rejette avec `review_submission` — les points sont crédités seulement à la
  validation. Pas d'anti-triche automatique au MVP, comme prévu.
- **Récompenses** : `redeem_reward` débite le solde et crée une commande
  (`reward_orders`, statut `pending`/`sent`/`received`). La livraison réelle
  (codes diamants, Robux…) reste un processus manuel ou via API tierce selon
  le jeu — à câbler au cas par cas plus tard via `update_order_status`.
- **Chat** : un salon par jeu (table `games`, donc ça scale à N jeux sans
  changement de code). Messages en temps réel via Supabase Realtime
  (`postgres_changes` + `broadcast` de présence). Le fond du salon est
  personnalisable (couleur ou image) et persisté par utilisateur **et** par
  jeu dans `chat_backgrounds` ; les images vont dans le bucket public
  `chat-backgrounds`.
- **Classement** : vue SQL `weekly_leaderboard`, points gagnés sur les 7
  derniers jours glissants, avec le jeu principal du joueur.

## Attribution des rôles modérateur/admin

Il n'y a pas encore d'interface d'administration. Pour promouvoir un compte :

```sql
update public.profiles set role = 'moderator' where username = 'pseudo';
```

## Ce qui n'est pas encore branché

- Pas d'interface de modération (validation des défis / commandes) — se fait
  pour l'instant via les fonctions SQL (`review_submission`,
  `update_order_status`) directement, ou à construire comme prochaine étape.
- La barre de recherche du header est visuelle uniquement, pas encore reliée.
- Pas de livraison automatique des récompenses (codes diamants, Robux...) —
  volontairement manuel au MVP, comme précisé dans le brief.
- Pas de rate limiting sur les routes/API — à ajouter avant un fort trafic.
