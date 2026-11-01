# Octobots

Plateforme web officielle de la compétition robotique **Octobots**. Elle permet la gestion des inscriptions des équipes, la visualisation en temps réel du bracket de tournoi (double élimination), et le streaming en direct de la compétition.

## Technologies utilisées

| Catégorie | Technologie | Version |
|---|---|---|
| **Langage** | TypeScript | 5 |
| **Runtime** | Node.js | 22 |
| **Framework** | Next.js (App Router) | 16.1 |
| **UI** | React | 19.2 |
| **CSS** | Tailwind CSS | 4 |
| **Base de données** | PostgreSQL (Neon Serverless) | — |
| **Authentification** | JWT (jose) + bcryptjs | — |
| **Tournoi** | brackets-manager + brackets-viewer | — |

## Architecture

```
octobots/
├── app/
│   ├── admin/            # Dashboard administrateur (protégé par JWT)
│   ├── api/
│   │   ├── auth/         # Login, logout, setup du compte admin
│   │   ├── bracket/      # CRUD du bracket + streaming SSE
│   │   └── inscriptions/ # Inscription des équipes
│   ├── bracket/          # Page publique du bracket
│   ├── components/       # Composants réutilisables (DraggableWindow, etc.)
│   ├── lib/              # Utilitaires (db, auth, rateLimit, cache)
│   ├── windows/          # Contenu des fenêtres (streaming, infos, etc.)
│   └── bureau.tsx        # Page principale — interface bureau rétro
├── middleware.ts          # Protection des routes /admin
├── next.config.ts         # Headers de sécurité (CSP, HSTS, etc.)
└── package.json
```

## Fonctionnalités

- **Interface bureau rétro** — UI avec fenêtres déplaçables et esthétique pixel art
- **Inscriptions** — Formulaire public pour enregistrer les équipes (nom, robot, pilotes)
- **Bracket de tournoi** — Double élimination avec mise à jour en temps réel via SSE
- **Streaming** — Intégration YouTube embed pour le direct de la compétition
- **Dashboard admin** — Gestion des inscriptions et du bracket (accès protégé)
- **Responsive** — Compatible desktop et mobile

## Sécurité

- Authentification JWT (HS256, expiration 8h) avec middleware Next.js
- Hachage des mots de passe avec bcrypt (12 rounds)
- Rate limiting sur les endpoints sensibles (login, inscriptions)
- Protection contre les attaques par timing sur le login
- Requêtes SQL paramétrées (protection injection SQL)
- Headers de sécurité : CSP, X-Frame-Options, HSTS, Referrer-Policy
- Validation et sanitisation de toutes les entrées utilisateur

## Prérequis

- **Node.js** >= 18
- **npm** >= 9
- Une base de données **PostgreSQL** (recommandé : [Neon](https://neon.tech))

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/dduricn/octobots.git
cd octobots

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env.local et remplir les variables ci-dessous
```

## Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
DATABASE_URL=postgresql://...    # URL de connexion PostgreSQL (Neon)
AUTH_SECRET=la-cle-secrete   # Clé secrète pour la signature des tokens JWT
```

## Démarrage

```bash
# Initialiser la base de données 
npm run db:init

# Développement
npm run dev

# Production
npm run build
npm start
```

## Premier lancement

1. Configurer `.env.local` avec les variables d'environnement (demander les clés au propriétaire du projet)
2. Exécuter `npm run db:init` pour créer les tables dans la base de données
3. Démarrer l'application avec `npm run dev`
4. Accéder à `/admin/setup` pour créer le compte administrateur
5. Se connecter sur `/admin/login`
6. Gérer les inscriptions et le bracket depuis le dashboard admin
