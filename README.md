# Projet Fil-Rouge - Messagerie OCTOBOTS

Projet du cours 8WEB101 à l'UQAC.

On a ajouté une messagerie au site du club de robotique de l'UQAC, qui organise la compétition de robots OCTOBOTS. Les visiteurs peuvent poser leurs questions au club directement sur le site.

## Site en ligne

https://cruqac.ca

## Ce qui existait déjà

Le site de base du club : le bureau avec ses fenêtres, les inscriptions, l'arbre du tournoi et l'espace admin.

## Ce qu'on a ajouté

- Une icône « Question » sur le bureau, qui ouvre une fenêtre
- Une FAQ avec une barre de recherche (notre fonctionnalité supplémentaire)
- Un chat : on entre son nom et son courriel, puis on écrit au club. Les messages sont enregistrés dans la base de données avec l'heure
- Le visiteur reste connecté (localStorage) quand il revient sur le site, avec un bouton « Se déconnecter »
- Une notification sonore et visuelle quand le club répond
- Une page admin (/admin/messages) où les membres du club lisent les conversations et répondent. La réponse apparaît dans le chat du visiteur en quelques secondes
- Ce sont des membres du club qui répondent, pas une IA

## Conception

Un premier prototype de la messagerie a été fait en HTML, CSS et JavaScript (connexion, conversations, FAQ, paramètres). Il est sur la branche `Pages_anne`.

## Technologies

Next.js, React, Tailwind CSS et une base de données PostgreSQL sur Neon.

## Lancer le projet

1. `npm install`
2. Ajouter le fichier `.env.local` à la racine (il n'est pas sur GitHub)
3. `npm run db:init` pour créer les tables de la base de données
4. `npm run dev`, puis ouvrir http://localhost:3000

## Équipe

Inès Lyagoubi et Anne-Samuelle Allebi