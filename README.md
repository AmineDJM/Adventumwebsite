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
| `NEXT_PUBLIC_SITE_URL` | Origine canonique utilisée par les métadonnées, le sitemap, robots.txt, le flux RSS et les données structurées. Défaut : `https://adventumdz.com` (l'adresse sans `www`, celle qui sert le site). | Recommandé |
| `ADMIN_PASSWORD` | Mot de passe de l'espace `/admin`. **Sans cette variable, l'administration refuse toute connexion** (aucun mot de passe par défaut). | Pour `/admin` |
| `ADMIN_SESSION_SECRET` | Clé de signature du cookie de session admin. À défaut, `ADMIN_PASSWORD` est utilisé. | Recommandé |
| `ERP_API_KEY`, `ERP_WEBHOOK_SECRET`, `ERP_BASE_URL` | La liaison avec l'ERP, dans les deux sens. **Générées par l'ERP** (Site web › Connexion au site › « Générer la clé ») sous la forme d'un bloc à coller tel quel dans Render (Environment › Add from .env › Save and deploy). Ne jamais les committer. | Pour l'ERP |
| `JOBS_DATA_DIR` | Répertoire d'écriture (offres, articles de l'ERP, candidatures pas encore envoyées). S'il n'est pas inscriptible, le site écrit dans `./data` puis dans le répertoire temporaire, et le signale. | Facultatif |

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

### Candidatures

Quand le site est relié à l'ERP, chaque fiche de poste porte un
**formulaire de candidature** (nom, e-mail, téléphone, message, CV,
consentement) et la page `/carrieres` un formulaire de candidature
spontanée. La candidature part **dans l'ERP** (Recrutement › Candidatures du
site) — pas dans une boîte e-mail. Le site ne la garde que le temps de
l'envoyer. Sans liaison, les deux formulaires reviennent au bouton e-mail.

### Persistance des offres

Les offres sont stockées dans `data/jobs.json`, écrit au moment de
l'enregistrement. Ce fichier est ignoré par Git : il appartient à
l'environnement d'exécution.

Au premier démarrage d'un site **non relié** à l'ERP, s'il est absent,
l'application lit `data/jobs.seed.json` (versionné) afin que la page
carrières ne soit jamais vide. Un site relié affiche les offres de l'ERP.

> **Sur Render** : le système de fichiers d'un conteneur est éphémère, et le
> plan gratuit n'a pas de disque. Un site relié à l'ERP **recharge ses offres
> et ses articles depuis l'ERP à chaque démarrage** : rien de ce que l'ERP a
> publié ne se perd. Un disque (monté sur `/var/data`, voir `render.yaml`)
> reste nécessaire pour les offres saisies dans l'admin du site, et pour
> qu'une candidature qui attend l'ERP survive à un redémarrage.

---

## Intégration ERP

Le site expose une API de contenu versionnée (`/api/v1`) qui permet à l'ERP
de publier les offres d'emploi et les articles de blog sans passer par
l'espace `/admin`. Dans l'autre sens, le site envoie à l'ERP les
candidatures qu'il reçoit, et recharge ses contenus depuis l'ERP quand il
démarre (`instrumentation.ts`, `lib/erp-sync.ts`, `lib/applications.ts`).

- **Contrat d'interface complet** : [`docs/ERP-INTEGRATION.md`](docs/ERP-INTEGRATION.md)
  — à remettre tel quel à l'équipe ERP.
- **Spécification machine** : [`docs/openapi.yaml`](docs/openapi.yaml)
  (OpenAPI 3.1, exploitable pour générer un client).

Principe : l'ERP est la source de vérité et **pousse** le contenu. Les
écritures sont idempotentes sur l'identifiant de l'ERP (`externalId`), et
le site revalide automatiquement les pages, le sitemap et le flux RSS.

Mise en service : un seul geste. L'ERP génère la clé, le secret et son
adresse, et les affiche en un bloc de trois lignes (`ERP_API_KEY`,
`ERP_WEBHOOK_SECRET`, `ERP_BASE_URL`) à coller dans l'environnement du site
sur Render. Toute requête est alors signée (HMAC-SHA256 du corps, de la
chaîne vide pour un `GET` ou un `DELETE`), dans les deux sens.

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
