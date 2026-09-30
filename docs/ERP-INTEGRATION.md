# Intégration ERP ↔ site Adventum Pharma

Ce document est le contrat d'interface complet entre l'ERP d'Adventum et le
site public. La liaison fonctionne **dans les deux sens** :

- l'ERP **publie** sur le site les offres d'emploi et les articles ;
- le site **renvoie** à l'ERP les candidatures déposées par les visiteurs, et
  **recharge** ses contenus depuis l'ERP à chaque démarrage.

Côté personne, la mise en service tient en **un geste** : copier un bloc de
trois lignes que l'ERP fabrique lui-même, et le coller dans l'environnement du
site sur Render (§2). Tout le reste est automatique.

---

## 1. Principe retenu

L'**ERP est la source de vérité**. À chaque publication, modification ou
suppression d'une offre d'emploi ou d'un article, l'ERP **pousse** le
contenu vers le site (modèle *push*, comme un webhook sortant).

```
                     PUT / DELETE /api/v1/jobs/{externalId}
                     PUT / DELETE /api/v1/posts/{externalId}
┌──────────────┐     GET /api/v1/health · /jobs · /posts         ┌──────────────────┐
│              │ ──────────────────────────────────────────────► │                  │
│     ERP      │                                                 │   Site Adventum  │
│ (source de   │ ◄────────────────────────────────────────────── │   (publication)  │
│  vérité)     │     POST /api/site-web/v1/candidatures          │                  │
└──────────────┘     GET  /api/site-web/v1/contenus              └──────────────────┘
```

**Pourquoi push et non pull** : le site reste en ligne et complet même si
l'ERP est arrêté ou injoignable. Les pages sont servies depuis le stockage
local du site, sans appel réseau au moment de la visite — donc sans
dégradation du temps de chargement ni du référencement.

**Pourquoi un retour** : un hébergement sans disque (le plan gratuit de
Render) perd ce qu'on lui a poussé à chaque redémarrage. Le site se recharge
donc lui-même depuis l'ERP quand il démarre (§12). Et un candidat qui postule
sur le site doit arriver chez les RH, pas dans une boîte e-mail (§11).

**Publication immédiate** : après chaque écriture, le site invalide
automatiquement les pages concernées (`/blog`, `/carrieres`, la page de
l'élément, le sitemap et le flux RSS). Aucun redéploiement n'est requis.

---

## 2. Mise en service — un seul geste

1. Dans l'ERP : **Site web › Connexion au site › « Générer la clé »**
   (Super Admin). L'ERP fabrique la clé et le secret de signature, et connaît
   sa propre adresse. Il affiche un bloc de trois lignes :

   ```
   ERP_API_KEY=…
   ERP_WEBHOOK_SECRET=…
   ERP_BASE_URL=https://…
   ```

2. Dans Render, ouvrir le service **du site** (`adventum-pharma`, pas celui de
   l'ERP) → **Environment** → **Add from .env** → coller le bloc →
   **Save, rebuild, and deploy**. Pas « Save only » : rien ne changerait. Ni
   « Save and deploy » : d'après la documentation de Render, ce bouton
   redéploie la version DÉJÀ construite, qui peut être une ancienne version
   du site — elle reconnaîtrait la clé et publierait les offres, mais sans
   formulaire de candidature. L'écran de l'ERP le signale (la santé du site
   n'annonce pas `applications`) et nomme le geste qui rattrape :
   **Manual Deploy › Deploy latest commit**.

3. C'est tout. Le site se reconstruit et redémarre (quelques minutes). L'ERP présente la nouvelle
   clé au site chaque minute pendant 30 minutes, puis toutes les 10 minutes
   jusqu'à 24 h, puis toutes les heures ; dès que le site l'accepte — ou dès
   que le site s'en sert pour appeler l'ERP — elle devient la clé active et
   l'écran de l'ERP passe à **« Relié »**.

**Changer de clé ne coupe rien.** Tant que le site n'a pas la nouvelle clé,
l'ERP continue de publier avec l'ancienne. Si le site refuse l'ancienne
(`401`), l'ERP lui présente aussitôt la nouvelle au lieu de s'arrêter.

> ⚠️ La clé donne le droit de publier sur le site public. Elle ne transite
> jamais dans une URL, uniquement dans l'en-tête `Authorization`. Ne pas la
> committer dans un dépôt — ce dépôt est public.

### Configuration manuelle (sans le bouton de l'ERP)

Réservée à un client autre que l'ERP d'Adventum. Générer une clé
(`openssl rand -hex 32`, au moins 24 caractères) et un secret de la même façon,
poser `ERP_API_KEY` et `ERP_WEBHOOK_SECRET` sur le site et les mêmes valeurs
côté client, puis `ERP_BASE_URL` (adresse `https` du client) si le site doit
lui envoyer les candidatures.

---

## 3. Authentification — la même règle dans les deux sens

Chaque requête porte un jeton *bearer* :

```http
Authorization: Bearer <clé>
```

### Signature (toujours active avec le bloc de l'ERP)

Quand `ERP_WEBHOOK_SECRET` est défini sur le site — c'est le cas dès que le
bloc de l'ERP a été collé —, **chaque requête** doit en plus porter une
signature HMAC-SHA256, **y compris un `GET` et un `DELETE`** :

```http
X-Adventum-Signature: sha256=<hex>
```

Calcul : `HMAC_SHA256(clé = secret, message = corps brut exact)` — et pour une
requête **sans corps** (`GET`, `DELETE`), le HMAC de la **chaîne vide**.

> Correction du 30/09/2026 : une version précédente de ce document disait la
> signature exigée « pour les requêtes avec corps (`PUT`) ». C'était faux :
> `lib/api-auth.ts` la vérifie sur toute requête authentifiée, lecture
> comprise. C'est ce qui protège un `DELETE` : sans cela, une clé seule —
> fuitée d'un journal de mandataire sans son secret — suffirait à supprimer
> une offre.

**L'ERP applique la même règle au site** : une candidature est signée sur son
corps exact, le rechargement (`GET`) sur la chaîne vide. Une seule règle,
une seule paire clé + secret, dans les deux sens.

La signature doit être calculée sur **les octets exacts envoyés**. Sérialiser
le JSON une seule fois, signer cette chaîne, puis envoyer cette même chaîne.

Exemple Node.js :

```js
const body = JSON.stringify(payload);            // sérialiser UNE fois
const sign = (s) => `sha256=${crypto.createHmac("sha256", SECRET).update(s).digest("hex")}`;

await fetch(`${BASE}/api/v1/posts/${externalId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "X-Adventum-Signature": sign(body),
  },
  body,                                           // la MÊME chaîne
});

// Une lecture se signe aussi — sur la chaîne vide.
await fetch(`${BASE}/api/v1/jobs`, {
  headers: { Authorization: `Bearer ${API_KEY}`, "X-Adventum-Signature": sign("") },
});
```

Exemple Python :

```python
import hmac, hashlib, json, requests

body = json.dumps(payload, ensure_ascii=False)    # sérialiser UNE fois
sign = lambda s: "sha256=" + hmac.new(SECRET.encode(), s.encode(), hashlib.sha256).hexdigest()

requests.put(
    f"{BASE}/api/v1/posts/{external_id}",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-Adventum-Signature": sign(body),
    },
    data=body.encode(),                           # la MÊME chaîne
)
```

---

## 4. Le concept clé : `externalId`

Chaque objet est identifié par **l'identifiant de l'ERP**, placé dans
l'URL. C'est la clé d'idempotence.

- Premier `PUT` sur un `externalId` → **création** (HTTP `201`)
- `PUT` suivants sur le même `externalId` → **mise à jour** (HTTP `200`)
- Rejouer deux fois la même requête ne crée jamais de doublon

L'ERP n'a donc **aucun identifiant à stocker en retour** : il lui suffit
d'utiliser son propre identifiant interne (`JOB-1042`, `ART-77`, un UUID…).

Contrainte : 1 à 128 caractères, sûr pour une URL.

---

## 5. Endpoints du site (ERP → site)

Base : `https://adventumdz.com/api/v1` — l'adresse sans `www` est celle qui
sert le site ; `www.adventumdz.com` y redirige.

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/health` | Vérifier connectivité et validité de la clé ; état de la liaison retour |
| `GET` | `/jobs` | Lister toutes les offres détenues par le site |
| `GET` | `/jobs/{externalId}` | Relire une offre |
| `PUT` | `/jobs/{externalId}` | Créer ou mettre à jour une offre |
| `DELETE` | `/jobs/{externalId}` | Supprimer une offre |
| `GET` | `/posts` | Lister les articles gérés par l'ERP |
| `GET` | `/posts/{externalId}` | Relire un article |
| `PUT` | `/posts/{externalId}` | Créer ou mettre à jour un article |
| `DELETE` | `/posts/{externalId}` | Supprimer un article |

### 5.1 Vérification et état de la liaison

```bash
SIG=$(printf '' | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')
curl -H "Authorization: Bearer $CLE" -H "X-Adventum-Signature: sha256=$SIG" \
     https://adventumdz.com/api/v1/health
```

Sans en-tête `Authorization`, la réponse dit seulement si l'API est
configurée (`configured`) et `authenticated: false`. Avec une clé valide :

```json
{
  "status": "ok",
  "service": "adventum-content-api",
  "version": "1",
  "configured": true,
  "authenticated": true,
  "capabilities": ["jobs", "posts", "applications"],
  "serverTime": "2026-09-30T12:32:33.044Z",
  "bootId": "5b0c…",
  "startedAt": "2026-09-30T12:30:02.118Z",
  "erp": {
    "linked": true,
    "signing": true,
    "reason": null,
    "lastError": null,
    "lastRestore": { "ok": true, "at": "2026-09-30T12:30:03.410Z", "jobs": 4, "posts": 7, "error": null }
  },
  "applications": { "pending": 0, "rejected": 0, "oldestAt": null, "lastDeliveredAt": "2026-09-30T11:02:41.927Z" },
  "storage": { "fallback": true }
}
```

| Champ | Sens |
|---|---|
| `configured` | `ERP_API_KEY` est défini sur le site |
| `authenticated` | La clé présentée (et sa signature) est acceptée |
| `bootId`, `startedAt` | Changent à chaque démarrage : l'ERP se resynchronise dès qu'il voit un nouveau `bootId` |
| `erp.linked` | Le site connaît l'adresse de l'ERP (`ERP_BASE_URL`) et sa clé : les candidatures peuvent partir |
| `erp.signing` | Le site signe ce qu'il envoie (`ERP_WEBHOOK_SECRET` défini) |
| `erp.reason` | Pourquoi la liaison retour manque, quand elle manque |
| `erp.lastError` | Dernier refus ou panne en parlant à l'ERP |
| `erp.lastRestore` | Dernier rechargement des contenus depuis l'ERP (§12) |
| `applications.*` | **Comptes et dates seulement** : candidatures en attente d'envoi, refusées par l'ERP, la plus ancienne en attente, dernier envoi réussi. Jamais la donnée d'un candidat |
| `storage.fallback` | Le répertoire demandé (`JOBS_DATA_DIR`) n'est pas inscriptible : le site écrit ailleurs (§9) |

Si `"authenticated": false` avec une clé fournie → la clé ne correspond pas.
Si `401 "Invalid body signature."` → la clé est la bonne mais le secret ne
l'est pas : le bloc a été collé en partie. Si `"configured": false` →
`ERP_API_KEY` n'est pas définie côté site.

### 5.2 Publier une offre d'emploi

```http
PUT /api/v1/jobs/JOB-1042
```

```json
{
  "title": "Directeur Supply Chain",
  "department": "Supply Chain",
  "location": "Cheraga, Alger",
  "type": "CDI",
  "experience": "10 ans minimum",
  "summary": "Pilotage de la chaîne d'approvisionnement, de l'importation à la livraison institutionnelle.",
  "mission": [
    "Piloter les flux d'importation et de distribution",
    "Structurer la politique de stocks"
  ],
  "profile": [
    "Ingénieur ou formation supérieure en logistique",
    "Expérience confirmée en environnement pharmaceutique"
  ],
  "offer": [
    "Un rôle de direction avec un mandat réel",
    "Une exposition à toute la chaîne"
  ],
  "published": true
}
```

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `title` | string | **oui** | ≤ 160 car. Détermine l'URL publique |
| `department` | string | non | ≤ 120 car. |
| `location` | string | non | ≤ 120 car. |
| `type` | string | non | `CDI`, `CDD`, `Stage`… pilote le champ `employmentType` des données structurées |
| `experience` | string | non | ≤ 120 car. |
| `summary` | string | non | ≤ 600 car. Affiché dans la liste |
| `mission` | string[] | non | ≤ 30 éléments. Accepte aussi une chaîne avec sauts de ligne |
| `profile` | string[] | non | idem |
| `offer` | string[] | non | idem |
| `published` | bool | non | `false` = brouillon, invisible publiquement |

Réponse `201` (ou `200` si mise à jour) :

```json
{
  "created": true,
  "job": {
    "externalId": "JOB-1042",
    "slug": "directeur-supply-chain",
    "url": "/carrieres/directeur-supply-chain",
    "title": "Directeur Supply Chain",
    "published": true,
    "createdAt": "2026-09-28T12:32:33.081Z",
    "updatedAt": "2026-09-28T12:32:33.081Z"
  }
}
```

👉 **L'ERP devrait stocker `job.url`** pour afficher le lien public dans son
interface.

### 5.3 Publier un article de blog

```http
PUT /api/v1/posts/ART-77
```

```json
{
  "title": "Traçabilité des lots : ce que change la sérialisation",
  "description": "Pourquoi la sérialisation modifie en profondeur la traçabilité pharmaceutique.",
  "body": "Texte d'introduction.\n\n## Le principe\n\nChaque unité reçoit un code unique vérifiable.\n\n## En pratique\n\nLe système doit être relié à la chaîne logistique.",
  "category": "Qualité",
  "tags": ["traçabilité", "qualité"],
  "author": "Adventum Pharma",
  "date": "2026-09-20",
  "featured": false,
  "published": true
}
```

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `title` | string | **oui** | ≤ 200 car. Sert de titre `<h1>` et de balise title |
| `body` | string | **oui** | **Markdown**. ≤ 200 000 car. |
| `description` | string | non mais **fortement recommandé** | ≤ 400 car. C'est le texte affiché par Google. Viser 150–160 car. |
| `slug` | string | non | Dérivé du titre si absent. Déterminant pour l'URL |
| `category` | string | non | Défaut `Secteur` |
| `tags` | string[] | non | ≤ 20. Sert au calcul des articles liés |
| `author` | string | non | Défaut `Adventum Pharma` |
| `date` | ISO date | non | Défaut : maintenant. Alimente `datePublished` |
| `updated` | ISO date | non | Alimente `dateModified` |
| `featured` | bool | non | `true` met l'article en avant en tête de la page blog |
| `published` | bool | non | Défaut `true`. `false` = brouillon |

**Le corps est du Markdown.** Le site s'occupe seul :

- du rendu HTML et de la typographie ;
- du **sommaire latéral**, construit à partir des titres `##` ;
- du **temps de lecture** ;
- des **données structurées** `BlogPosting` ;
- de l'ajout au **sitemap** et au **flux RSS** ;
- des **articles liés**, via les `tags`.

Conventions de rédaction attendues côté ERP :

- Ne pas mettre de `#` (titre de niveau 1) dans le corps : le `title` le fournit.
- Structurer avec des `##`, et des `###` en sous-niveau.
- `**gras**`, `*italique*`, listes `-`, liens `[texte](url)` sont supportés.

### 5.4 Supprimer

```http
DELETE /api/v1/jobs/JOB-1042
DELETE /api/v1/posts/ART-77
```

Signées sur la chaîne vide (§3). Réponse `200` :
`{"deleted": true, "externalId": "JOB-1042"}`. Réponse `404` si
l'identifiant est inconnu.

> Alternative recommandée à la suppression : envoyer `"published": false`.
> Le contenu disparaît du site public mais reste consultable dans l'ERP et
> peut être republié.

---

## 6. Codes de réponse

| Code | Sens | Que doit faire l'ERP |
|---|---|---|
| `200` | Mise à jour réussie | Rien |
| `201` | Création réussie | Stocker `url` |
| `400` | JSON invalide, ou `externalId` hors format | Corriger — ne pas réessayer tel quel |
| `401` | Clé ou signature invalide | Alerter. **Ne pas réessayer en boucle** (présenter la clé en attente s'il y en a une) |
| `404` | `externalId` inconnu (sur GET/DELETE) | Traiter comme déjà supprimé |
| `422` | Champ obligatoire manquant | Corriger la charge utile |
| `503` | API non configurée, ou stockage en lecture seule | **Réessayer plus tard** (voir §7) |

Toute réponse d'erreur a la forme `{"error": "message explicite"}`.

---

## 7. Robustesse attendue côté ERP

Implémentée dans l'ERP d'Adventum :

1. **File d'attente + réessais.** En cas de `503` ou d'erreur réseau,
   réessayer avec un délai croissant (1 s, 5 s, 30 s, 2 min, 10 min). Les
   requêtes étant idempotentes, un réessai est toujours sûr.
2. **Ne pas réessayer sur `4xx`** (hors `429`) : la charge utile est en
   cause, pas le réseau.
3. **Délai d'attente** de 10 s par requête.
4. **Journaliser** `externalId`, code HTTP et corps de réponse.
5. **Réconciliation périodique** (une fois par jour, et aussitôt que le
   `bootId` du site change) : appeler `GET /jobs` et `GET /posts`, comparer
   à l'état de l'ERP, repousser ce qui diverge. Cela rattrape toute
   publication perdue.

---

## 8. Ce que l'ERP ne contrôle pas

- **Les articles versionnés.** Cinq articles fondateurs vivent dans le
  dépôt Git du site (`content/blog/*.md`). Ils apparaissent en lecture
  seule dans `GET /posts` sous `readOnlyFileArticles`. Si l'ERP pousse un
  article avec le même `slug`, **le fichier du dépôt reste prioritaire** et
  la version ERP est ignorée sur le site public. Choisir des slugs distincts.
- **Les offres d'exemple.** `data/jobs.seed.json` ne sert qu'à un site **non
  relié** (pour que la page carrières ne soit jamais vide). Dès que le site
  est relié à l'ERP, ce sont les offres de l'ERP qui s'affichent — avec
  celles saisies dans l'admin du site.
- **L'espace `/admin` du site.** Il reste disponible pour une saisie
  manuelle de secours. Si l'ERP devient l'unique source, il est recommandé
  de ne plus définir `ADMIN_PASSWORD` : l'admin refuse alors toute
  connexion et l'ERP est seul maître du contenu.
- **La mise en page, le SEO et les traductions d'interface**, entièrement
  gérés par le site.

---

## 9. Hébergement : le disque est facultatif

Le site écrit ce qu'il détient dans le répertoire `JOBS_DATA_DIR`. Sur Render,
le système de fichiers d'un conteneur est **éphémère**, et le plan gratuit
n'a pas de disque.

- **Le site se recharge lui-même** depuis l'ERP à chaque démarrage (§12) :
  un redémarrage ne perd plus rien de ce que l'ERP a publié. Les pages
  attendent ce rechargement au plus 4 secondes, puis s'affichent avec ce
  qu'elles ont.
- **Si `JOBS_DATA_DIR` n'est pas inscriptible**, le site écrit dans `./data`,
  puis dans le répertoire temporaire, et le dit (`storage.fallback` dans
  `/api/v1/health`, affiché par l'ERP).
- **Un disque reste utile pour deux choses** : les offres saisies dans
  l'admin du site (hors ERP) ne survivent qu'à un disque ; et une candidature
  qui n'a pas encore pu partir vers l'ERP (ERP endormi ou en redéploiement)
  attend sur le disque — sans disque, un redémarrage pendant cette attente la
  perd. Le site l'envoie à l'instant où le candidat clique, puis chaque
  minute : la fenêtre est courte, et l'ERP affiche le nombre de candidatures
  en attente.
- **Plan gratuit** : Render endort le site après 15 minutes sans visite, et
  le réveil prend environ une minute. Pour un site vitrine qui reçoit des
  candidatures, un plan payant (instance toujours éveillée + disque) est
  recommandé.

---

## 10. Checklist de mise en service

- [ ] ERP : **Site web › Connexion au site › « Générer la clé »**
- [ ] Render (service du site) : **Environment › Add from .env** → coller le
      bloc → **Save, rebuild, and deploy**
- [ ] Attendre quelques minutes : l'ERP passe à **« Relié »** de lui-même
- [ ] Publier une offre de test depuis l'ERP, vérifier `/carrieres`
- [ ] Postuler à cette offre avec un CV de test, vérifier qu'il arrive dans
      l'ERP (**Recrutement › Candidatures du site**)
- [ ] Supprimer l'offre et la candidature de test
- [ ] Décider du sort de `ADMIN_PASSWORD` (conserver ou retirer)

---

## 11. Candidatures (site → ERP)

### 11.1 Côté visiteur

Quand le site est relié (`ERP_BASE_URL` et `ERP_API_KEY` définis), chaque
fiche de poste (`/carrieres/{slug}`) porte un **formulaire de candidature**,
et la page `/carrieres` un formulaire de **candidature spontanée**. Sans
liaison, les deux reviennent au bouton e-mail : postuler n'est jamais
impossible.

Le formulaire envoie `POST /api/candidatures` (multipart) au site lui-même,
qui se défend là où il se trouve — l'adresse est publique par nature :

- un champ piège invisible (`website`) que les robots remplissent ;
- 5 envois par adresse et 60 au total par tranche de 10 minutes ;
- un CV de **5 Mo au plus**, **PDF, Word (.doc, .docx) ou OpenDocument
  (.odt)**, reconnu à ses **premiers octets** et non à son seul nom ;
- un **consentement explicite**, obligatoire, revérifié par l'ERP.

Le candidat reçoit une référence (les 8 premiers caractères de l'identifiant).

### 11.2 Envoi à l'ERP

```http
POST {ERP_BASE_URL}/api/site-web/v1/candidatures
Authorization: Bearer <ERP_API_KEY>
Content-Type: application/json
X-Adventum-Signature: sha256=<HMAC du corps exact>
```

```json
{
  "id": "0f6f3f2a-6c1e-4f55-9a4e-2b7f3c9d1e20",
  "submittedAt": "2026-09-30T12:40:11.502Z",
  "job": { "externalId": "cmuo63kp1020q13ls0p40612p", "slug": "directeur-supply-chain", "title": "Directeur Supply Chain" },
  "fullName": "Nom Prénom",
  "email": "candidat@example.com",
  "phone": "+213 555 00 00 00",
  "message": "Texte libre du candidat.",
  "consent": true,
  "language": "fr",
  "cv": { "fileName": "cv.pdf", "contentType": "application/pdf", "base64": "JVBERi0…", "sha256": "9f2c…" }
}
```

| Champ | Type | Requis | Notes |
|---|---|---|---|
| `id` | string | **oui** | 8 à 64 caractères `[A-Za-z0-9-]`. **Clé d'idempotence** : renvoyer la même candidature ne crée pas de doublon |
| `submittedAt` | ISO date | non | Heure du dépôt. Une date du futur n'est pas crue : c'est la réception qui fait foi |
| `job` | objet \| null | non | `null` = candidature spontanée. `externalId` n'est rempli que pour une offre publiée par l'ERP |
| `fullName` | string | **oui** | 2 à 160 car. |
| `email` | string | **oui** | Adresse lisible, ≤ 254 car. |
| `phone` | string | non | Chiffres, espaces, `+ ( ) . -` |
| `message` | string | non | ≤ 5 000 car. |
| `consent` | `true` | **oui** | Toute autre valeur est refusée : sans consentement, rien n'est traité |
| `language` | string | non | Langue de l'interface au moment du dépôt |
| `cv` | objet \| null | non | `base64` du fichier ; `sha256` de ses octets (vérifié par l'ERP) |

Réponses :

| Code | Sens | Ce que fait le site |
|---|---|---|
| `201` | Reçue | Supprime sa copie |
| `200` | Déjà reçue (même `id`) | Supprime sa copie |
| `400` | Corps illisible | Garde la candidature 7 jours pour examen, puis la supprime |
| `401` | Clé ou signature refusée | Réessaie (la clé est peut-être en train de changer) |
| `413` | Trop lourde | Comme `400` |
| `422` | Incomplète — la raison est dans `error` | Comme `400` |
| `429`, `5xx`, réseau | Indisponible | Réessaie |

**Politique d'envoi** : une tentative immédiate pendant que le candidat
attend, puis, en tâche de fond, chaque minute pour les candidatures dues,
avec un délai croissant (1, 2, 4… minutes, jusqu'à une heure).

**Le site ne garde pas les données des candidats** : une candidature n'est
écrite sur son disque que tant que l'ERP ne l'a pas confirmée, et effacée dès
qu'il l'a. Côté ERP, elle arrive dans **Recrutement › Candidatures du site** ;
quand l'offre est rattachée à un recrutement ouvert, elle y entre directement
comme candidat.

## 12. Rechargement au démarrage (site → ERP)

```http
GET {ERP_BASE_URL}/api/site-web/v1/contenus
Authorization: Bearer <ERP_API_KEY>
X-Adventum-Signature: sha256=<HMAC de la chaîne vide>
```

Réponse `200` :

```json
{
  "generatedAt": "2026-09-30T12:30:03.102Z",
  "count": 11,
  "jobs":  [ { "externalId": "…", "title": "…", "published": true } ],
  "posts": [ { "externalId": "…", "title": "…", "body": "…", "published": true } ]
}
```

Chaque élément est **exactement le corps** que l'ERP pousserait par `PUT`,
plus son `externalId`. Le site remplace alors tout ce qu'il tient de l'ERP par
cette liste — un contenu de l'ERP absent de la liste est retiré — sans toucher
aux offres saisies dans son admin. Une réponse qui ne porte pas **les deux**
listes est refusée : « l'ERP n'a rien » ne se déduit pas d'une réponse
incomplète. Un échec est réessayé au plus toutes les 5 minutes.

Appeler l'ERP avec la clé en attente (après le collage du bloc) suffit à la
rendre active : c'est la preuve que le site l'a.
