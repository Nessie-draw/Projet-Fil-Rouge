# Projet Fil-Rouge - Messagerie OCTOBOTS

Projet du cours 8WEB101 à l'UQAC.

On a ajouté une messagerie au site du club de robotique de l'UQAC (https://cruqac.ca/), qui organise la compétition de robots OCTOBOTS. Les visiteurs peuvent poser leurs questions au club directement sur le site.

## Site en ligne

(à venir)

## Ce qui existait déjà

Le site de base du club : le bureau avec ses fenêtres, les inscriptions, l'arbre du tournoi et l'espace admin.

## Ce qu'on a ajouté

- Une icône "Question" sur le bureau, qui ouvre une fenêtre
- Une FAQ avec une barre de recherche (notre fonctionnalité supplémentaire)
- Un chat : on entre son nom et son courriel ensuite on ecrit au club. Les messages sont enregistres dans la base de donnees avec l'heure
- Une page admin (/admin/messages) ou les membres du club lisent les messages et repondent. La reponse apparait dans le chat du visiteur en quelques secondes
- Ce sont des membres du club qui répondent, pas une IA

## Conception

Un premier prototype de la messagerie a été fait en HTML, CSS et JavaScript (connexion, conversations, FAQ, paramètres). Il est sur la branche `Pages_anne`.

## Technologies

Next.js, React, Tailwind CSS et une base de données PostgreSQL sur Neon.

## Lancer le projet

npm install, puis npm run dev, et ouvrir http://localhost:3000.
Il faut aussi le fichier .env.local (pas sur GitHub).
Pour crééer lestables de la base : run.cmd db:init

## Équipe

Inès Lyagoubi et Anne-Samuelle Allebi