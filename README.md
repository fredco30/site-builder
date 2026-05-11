# Gestia — Site Builder & Admin

**Plateforme complète de création et gestion de sites vitrines** pour artisans, commerçants et services locaux. Comprend :

1. **Le générateur** (`template/`, `clients/`, `build.js`) : un template paramétrable + un moteur de build qui produit des sites statiques HTML/CSS/JS prêts à déployer
2. **L'admin web** (`admin/`) : une UI Node.js/Express pour gérer les sites de tous tes clients depuis un seul tableau de bord (`gestia.ovh/admin`)
3. **Le marketing** (`marketing/`) : plaquette commerciale PDF + formulaire d'onboarding Tally + prompts de création client

Un seul template, un fichier `config.json` par client, et un build qui produit un site statique prêt à déployer (Netlify, OVH, n'importe quel hébergement statique).

## Démarrer l'admin localement

```bash
cd admin
npm install
npm start
# → http://localhost:4001/admin
```

Voir [`admin/README.md`](admin/README.md) pour le déploiement serveur, la config nginx et les détails d'utilisation.

## Structure du dossier

```
templates-vitrine/
├── template/              ← le template source (à ne pas modifier sauf évolution globale)
│   ├── index.html         ← HTML avec {{placeholders}}
│   ├── styles.css         ← CSS avec variables paramétrables
│   └── script.js          ← JS (interactions, identique pour tous les clients)
│
├── build.js               ← générateur (Node.js pur, zéro dépendance)
│
├── clients/               ← un dossier par client
│   ├── hipolem/
│   │   ├── config.json    ← contenu, couleurs, services, etc.
│   │   └── assets/
│   │       ├── logo/      ← logo, favicon
│   │       └── images/    ← photos hero, galerie, services
│   │
│   └── demo-paysagiste/   ← démo fictive (paysagiste en Provence)
│       └── config.json    ← images en placeholders picsum.photos
│
└── dist/                  ← sortie du build (un sous-dossier par client)
    ├── hipolem/
    └── demo-paysagiste/
```

## Utilisation

### Générer un site

```bash
# Un client précis
node build.js hipolem

# Tous les clients
node build.js --all
```

Le site généré se trouve dans `dist/<nom-client>/`. Ouvrir `index.html` dans un navigateur pour le voir.

### Créer un nouveau client

1. **Dupliquer un dossier client** existant (`clients/hipolem` ou `clients/demo-paysagiste`).
2. **Remplacer le `config.json`** par les infos du nouveau client.
3. **Placer ses assets** dans `clients/<nom>/assets/logo/` et `clients/<nom>/assets/images/`.
4. **Lancer le build** : `node build.js <nom>`.

## Que peut-on personnaliser via `config.json` ?

### Identité de marque
- Nom de l'entreprise, SIRET, slogan, tagline du footer
- Logo, favicon
- **7 couleurs de marque** (primaire, secondaire, tertiaire + variantes foncées + couleur sombre)
- Polices Google Fonts (URL + déclarations CSS)

### Contact
- Téléphone (affiché + lien `tel:`)
- Email
- Zone d'intervention
- Action du formulaire (URL Formspree ou autre)

### Sections de contenu (toutes paramétrables et désactivables sauf l'essentiel)
- **Hero** : bannière desktop + mobile, titre HTML, sous-titre, 2 CTAs
- **Spécialités** : 3 ou 4 cartes avec icône SVG, titre, texte, lien, couleur d'accent
- **Showcase** : section "savoir-faire principal" avec bullets et mini-galerie
- **Service détaillé** : 3 à 6 mini-cards (sous-prestations)
- **Service secondaire** : bloc avec image + features list
- **Service tertiaire** : bloc avec checks + encadré note
- **Méthode** : timeline 4 étapes
- **Pourquoi nous choisir** : 3 ou 4 cartes
- **Galerie réalisations** : filtres + grille d'images
- **Avis clients** : 3 témoignages avec étoiles
- **Contact** : intro + formulaire + types de projets
- **Footer** : tagline, liste services, signature concepteur (optionnelle), liens légaux

Chaque section avec `"enabled": false` est exclue du build.

## Syntaxe du moteur de template

Le générateur supporte 3 constructions :

```
{{var}}              → valeur échappée HTML (sécurité par défaut)
{{{var}}}            → valeur brute (pour insérer du HTML, ex. icônes SVG)
{{#each liste}}…{{/each}}   → boucle (this = élément courant)
{{#if var}}…{{/if}}  → condition (truthy / array non vide)
```

Accès aux propriétés imbriquées avec `.` : `{{business.name}}`, `{{branding.colors.primary}}`.

## Workflow typique pour un nouveau client

1. **Briefing client** : formulaire d'onboarding (Tally / Typeform) → récupère textes, photos, couleurs, services.
2. **Création du dossier client** : `cp -r clients/hipolem clients/<nouveau>` puis édition du `config.json`.
3. **Build local** : `node build.js <nouveau>` puis ouverture de `dist/<nouveau>/index.html` pour vérifier.
4. **Déploiement** :
   - Glisser `dist/<nouveau>/` sur Netlify → site en ligne en 30 secondes.
   - Ou uploader en FTP chez OVH / autre.
5. **Configurer le domaine** + formulaire Formspree (remplacer `VOTRE_ID_FORMSPREE` dans le `config.json` et rebuild).

Temps cible une fois le process rodé : **3 à 6 heures par site** (hors collecte des photos client).

## Évolutions possibles

- Ajouter d'autres variantes de sections (FAQ, tarifs, équipe, plan d'accès Google Maps).
- Plusieurs templates de base (artisan / restaurant / cabinet libéral / e-commerce simple).
- Mini CMS Decap pour que le client modifie ses textes / photos en autonomie.
- Watch mode dans `build.js` pour rebuild auto pendant l'édition du config.
