# Intégration ERP → site Adventum Pharma

**À remettre tel quel à l'équipe (ou à l'agent) qui développe l'ERP.**

Ce document est le contrat d'interface complet. Le site web expose une API
de contenu ; l'ERP en est le client. Aucune modification du site n'est
nécessaire côté ERP : tout ce qui suit est déjà déployé et testé.

---

## 1. Principe retenu

L'**ERP est la source de vérité**. À chaque publication, modification ou
suppression d'une offre d'emploi ou d'un article, l'ERP **pousse** le
contenu vers le site (modèle *push*, comme un webhook sortant).

```
┌──────────────┐   PUT /api/v1/jobs/{externalId}    ┌──────────────────┐
│              │   PUT /api/v1/posts/{externalId}   │                  │
│     ERP      │ ─────────────────────────────────► │   Site Adventum  │
│ (source de   │   DELETE …                         │   (publication)  │
│  vérité)     │ ◄───────────────────────────────── │                  │
└──────────────┘   200/201 + URL publique           └──────────────────┘
```

**Pourquoi push et non pull** : le site reste en ligne et complet même si
l'ERP est arrêté ou injoignable. Les pages sont servies depuis le stockage
local du site, sans appel réseau au moment de la visite — donc sans
dégradation du temps de chargement ni du référencement.

**Publication immédiate** : après chaque écriture, le site invalide
automatiquement les pages concernées (`/blog`, `/carrieres`, la page de
l'élément, le sitemap et le flux RSS). Aucun redéploiement n'est requis.

---

## 2. Informations à fournir à l'ERP

| Paramètre | Valeur | Qui la fournit |
|---|---|---|
| `ADVENTUM_BASE_URL` | `https://www.adventumdz.com` (ou l'URL Render) | Vous |
| `ADVENTUM_API_KEY` | Clé secrète longue et aléatoire | Vous (générée une fois) |
| `ADVENTUM_WEBHOOK_SECRET` | Secret de signature — **optionnel** | Vous (si activé) |

Générer la clé (commande à lancer une seule fois) :

```bash
openssl rand -hex 32
```

Cette même valeur doit être placée :

- côté **site**, dans la variable d'environnement `ERP_API_KEY`
  (Render → Environment) ;
- côté **ERP**, dans son magasin de secrets.

> ⚠️ La clé donne le droit de publier sur le site public. Elle ne transite
> jamais dans une URL, uniquement dans l'en-tête `Authorization`. Ne pas la
> committer dans un dépôt.

---

## 3. Authentification

Chaque requête porte un jeton *bearer* :

```http
Authorization: Bearer <ADVENTUM_API_KEY>
Content-Type: application/json
```

### Signature de corps (recommandée en production)

Si la variable `ERP_WEBHOOK_SECRET` est définie côté site, chaque requête
avec corps (`PUT`) doit **en plus** porter une signature HMAC-SHA256 du
corps brut :

```http
X-Adventum-Signature: sha256=<hex>
```

Calcul : `HMAC_SHA256(clé = ADVENTUM_WEBHOOK_SECRET, message = corps brut exact)`.

La signature doit être calculée sur **les octets exacts envoyés**. Sérialiser
le JSON une seule fois, signer cette chaîne, puis envoyer cette même chaîne.

Exemple Node.js :

```js
const body = JSON.stringify(payload);            // sérialiser UNE fois
const sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex");

await fetch(`${BASE}/api/v1/posts/${externalId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "X-Adventum-Signature": `sha256=${sig}`,
  },
  body,                                           // la MÊME chaîne
});
```

Exemple Python :

```python
import hmac, hashlib, json, requests

body = json.dumps(payload, ensure_ascii=False)    # sérialiser UNE fois
sig = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()

requests.put(
    f"{BASE}/api/v1/posts/{external_id}",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "X-Adventum-Signature": f"sha256={sig}",
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

## 5. Endpoints

Base : `https://www.adventumdz.com/api/v1`

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/health` | Vérifier connectivité et validité de la clé |
| `GET` | `/jobs` | Lister toutes les offres détenues par le site |
| `GET` | `/jobs/{externalId}` | Relire une offre |
| `PUT` | `/jobs/{externalId}` | Créer ou mettre à jour une offre |
| `DELETE` | `/jobs/{externalId}` | Supprimer une offre |
| `GET` | `/posts` | Lister les articles gérés par l'ERP |
| `GET` | `/posts/{externalId}` | Relire un article |
| `PUT` | `/posts/{externalId}` | Créer ou mettre à jour un article |
| `DELETE` | `/posts/{externalId}` | Supprimer un article |

### 5.1 Vérification initiale

```bash
curl -H "Authorization: Bearer $ADVENTUM_API_KEY" \
     https://www.adventumdz.com/api/v1/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "service": "adventum-content-api",
  "version": "1",
  "configured": true,
  "authenticated": true,
  "capabilities": ["jobs", "posts"],
  "serverTime": "2026-09-28T12:32:33.044Z"
}
```

Si `"authenticated": false` avec une clé fournie → la clé ne correspond pas.
Si `"configured": false` → `ERP_API_KEY` n'est pas définie côté site.

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

Réponse `200` : `{"deleted": true, "externalId": "JOB-1042"}`
Réponse `404` si l'identifiant est inconnu.

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
| `401` | Clé ou signature invalide | Alerter. **Ne pas réessayer en boucle** |
| `404` | `externalId` inconnu (sur GET/DELETE) | Traiter comme déjà supprimé |
| `422` | Champ obligatoire manquant | Corriger la charge utile |
| `503` | API non configurée, ou stockage en lecture seule | **Réessayer plus tard** (voir §7) |

Toute réponse d'erreur a la forme `{"error": "message explicite"}`.

---

## 7. Robustesse attendue côté ERP

À implémenter dans l'ERP :

1. **File d'attente + réessais.** En cas de `503` ou d'erreur réseau,
   réessayer avec un délai croissant (1 s, 5 s, 30 s, 2 min, 10 min). Les
   requêtes étant idempotentes, un réessai est toujours sûr.
2. **Ne pas réessayer sur `4xx`** (hors `429`) : la charge utile est en
   cause, pas le réseau.
3. **Délai d'attente** de 10 s par requête.
4. **Journaliser** `externalId`, code HTTP et corps de réponse.
5. **Réconciliation périodique** (une fois par jour) : appeler `GET /jobs`
   et `GET /posts`, comparer à l'état de l'ERP, repousser ce qui diverge.
   Cela rattrape toute publication perdue.

---

## 8. Ce que l'ERP ne contrôle pas

- **Les articles versionnés.** Cinq articles fondateurs vivent dans le
  dépôt Git du site (`content/blog/*.md`). Ils apparaissent en lecture
  seule dans `GET /posts` sous `readOnlyFileArticles`. Si l'ERP pousse un
  article avec le même `slug`, **le fichier du dépôt reste prioritaire** et
  la version ERP est ignorée sur le site public. Choisir des slugs distincts.
- **L'espace `/admin` du site.** Il reste disponible pour une saisie
  manuelle de secours. Si l'ERP devient l'unique source, il est recommandé
  de ne plus définir `ADMIN_PASSWORD` : l'admin refuse alors toute
  connexion et l'ERP est seul maître du contenu.
- **La mise en page, le SEO et les traductions d'interface**, entièrement
  gérés par le site.

---

## 9. Condition de déploiement à ne pas manquer

Le site écrit les contenus reçus sur son disque. Sur Render, le système de
fichiers d'un conteneur est **éphémère**.

➡️ **Il faut attacher un disque persistant** (monté sur `/var/data`) et
définir `JOBS_DATA_DIR=/var/data`. Sans cela, tout contenu poussé par l'ERP
disparaît au prochain redéploiement.

Le plan gratuit de Render ne propose pas de disque persistant : un plan
payant est nécessaire pour cette intégration. La réconciliation quotidienne
du §7 limite les dégâts, mais ne remplace pas le disque.

---

## 10. Checklist de mise en service

- [ ] Générer la clé (`openssl rand -hex 32`)
- [ ] Définir `ERP_API_KEY` sur Render, et la même valeur dans l'ERP
- [ ] (Optionnel) Définir `ERP_WEBHOOK_SECRET` des deux côtés
- [ ] Attacher un disque persistant et définir `JOBS_DATA_DIR=/var/data`
- [ ] Vérifier `GET /api/v1/health` → `"authenticated": true`
- [ ] Publier une offre de test, vérifier son URL publique
- [ ] Publier un article de test, vérifier `/blog` et le sitemap
- [ ] Supprimer les deux éléments de test
- [ ] Activer la file de réessais et la réconciliation quotidienne
- [ ] Décider du sort de `ADMIN_PASSWORD` (conserver ou retirer)
