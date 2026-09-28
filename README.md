# Adventum Pharma — site web

Site vitrine du laboratoire pharmaceutique Adventum Pharma (Alger), avec
blog éditorial, espace carrières et administration des offres d'emploi.

**Stack** : Next.js 15 (App Router) · React 19 · TypeScript strict ·
Tailwind CSS · Framer Motion · GSAP + ScrollTrigger · Lenis.

---

## Démarrage

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

---

## Variables d'environnement

| Variable | Rôle | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Origine canonique utilisée par les métadonnées, le sitemap, robots.txt, le flux RSS et les données structurées. | Recommandé |
| `ADMIN_PASSWORD` | Mot de passe de l'espace `/admin`. **Sans cette variable, l'administration refuse toute connexion** (aucun mot de passe par défaut). | Pour `/admin` |
| `ADMIN_SESSION_SECRET` | Clé de signature du cookie de session admin. À défaut, `ADMIN_PASSWORD` est utilisé. | Recommandé |
| `JOBS_DATA_DIR` | Répertoire d'écriture des offres créées depuis l'admin. Doit pointer vers un disque persistant en production. | Production |

---

## Contenu éditorial (blog)

Les articles sont des fichiers Markdown dans `content/blog/`. Ajouter un
fichier `.md` suffit : il est repris automatiquement dans la liste, le
sitemap, le flux RSS et les articles liés.

```markdown
---
title: "Titre de l'article"
description: "Résumé affiché dans Google et sur les réseaux (150–160 caractères)."
date: "2026-09-28"
updated: "2026-10-05"        # facultatif
author: "Adventum Pharma"
category: "Réglementaire"
tags: ["enregistrement", "Algérie"]
featured: true                # facultatif — met l'article en avant
---

Le corps de l'article en Markdown. Les titres `##` alimentent
automatiquement le sommaire latéral.
```

Le temps de lecture est calculé automatiquement. Chaque article publie ses
données structurées `BlogPosting` et son fil d'Ariane.

---

## Espace carrières et administration

- **Public** : `/carrieres` (liste) et `/carrieres/[slug]` (fiche de poste).
  Chaque fiche publie un `JobPosting` structuré, exploitable par Google for
  Jobs.
- **Administration** : `/admin` — création, modification, publication et
  suppression des offres. Page exclue de l'indexation (`noindex` +
  `Disallow` dans robots.txt).

### Persistance des offres

Les offres sont stockées dans `data/jobs.json`, écrit au moment de
l'enregistrement. Ce fichier est ignoré par Git : il appartient à
l'environnement d'exécution.

Au premier démarrage, s'il est absent, l'application lit
`data/jobs.seed.json` (versionné) afin que la page carrières ne soit jamais
vide.

> **Important pour Render** : le système de fichiers d'un conteneur est
> éphémère. Sans disque persistant, les offres créées depuis l'admin
> disparaissent au redéploiement et la liste revient au fichier seed.
> Attacher un disque, le monter sur `/var/data` et définir
> `JOBS_DATA_DIR=/var/data` (voir `render.yaml`). Le plan gratuit de Render
> ne propose pas de disque persistant.

---

## Intégration ERP

Le site expose une API de contenu versionnée (`/api/v1`) qui permet à l'ERP
de publier les offres d'emploi et les articles de blog sans passer par
l'espace `/admin`.

- **Contrat d'interface complet** : [`docs/ERP-INTEGRATION.md`](docs/ERP-INTEGRATION.md)
  — à remettre tel quel à l'équipe ERP.
- **Spécification machine** : [`docs/openapi.yaml`](docs/openapi.yaml)
  (OpenAPI 3.1, exploitable pour générer un client).

Principe : l'ERP est la source de vérité et **pousse** le contenu. Les
écritures sont idempotentes sur l'identifiant de l'ERP (`externalId`), et
le site revalide automatiquement les pages, le sitemap et le flux RSS.

Variables requises côté site : `ERP_API_KEY` (et `ERP_WEBHOOK_SECRET` pour
exiger en plus une signature HMAC du corps).

Un article committé dans `content/blog/` reste prioritaire sur un article
poussé par l'ERP qui porterait le même slug.

---

## SEO

Ce qui est en place :

- Métadonnées centralisées dans `lib/site.ts` (titre, description,
  mots-clés, Open Graph, Twitter Card, balises géographiques).
- Données structurées JSON-LD : `Organization` et `WebSite` sur tout le
  site ; `Blog`, `BlogPosting`, `JobPosting`, `CollectionPage` et
  `BreadcrumbList` sur les pages concernées.
- `sitemap.xml` dynamique (accueil, blog, articles, carrières, offres) avec
  dates de dernière modification.
- `robots.txt` avec exclusion de `/admin` et `/api/`.
- Flux RSS sur `/feed.xml`.
- URL canoniques sur chaque page, image de partage `public/og.png`.
- Rendu serveur en français (langue du marché cible) ; le sélecteur de
  langue bascule ensuite l'interface côté client.

### À faire hors code après la mise en ligne

1. Déclarer le site dans **Google Search Console** et y soumettre
   `sitemap.xml`.
2. Créer la fiche **Google Business Profile** (Cheraga, Alger).
3. Obtenir des liens entrants de qualité (annuaires professionnels,
   LinkedIn de l'entreprise, presse sectorielle).
4. Publier régulièrement de nouveaux articles : c'est le facteur qui pèse
   le plus dans la durée.

> Les articles fournis sont des textes de fond rédigés pour le
> référencement. Ils doivent être **relus et validés par l'équipe
> réglementaire** avant publication : ils décrivent des principes généraux
> et renvoient volontairement aux textes en vigueur plutôt que d'énoncer
> des chiffres ou des procédures susceptibles d'évoluer.

---

## Internationalisation

Quatre langues : français (défaut, rendu serveur), anglais, hindi, chinois.
Les dictionnaires sont dans `lib/i18n/dictionaries/`. `en.ts` fait
référence : toute clé absente d'une autre langue retombe automatiquement sur
l'anglais.

Le mot mis en avant dans un titre est encadré par les marqueurs `⟦ ⟧`, ce
qui permet d'appliquer le dégradé de marque dans n'importe quelle langue.

Les articles de blog sont rédigés en français uniquement : ils ciblent le
référencement sur le marché algérien.
