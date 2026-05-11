# Prompt à utiliser pour créer le site d'un nouveau client

À copier-coller dans Claude Code en début de conversation, en remplaçant les `[...]` par les vraies infos.

---

## Version standard (à remplir)

```
Crée un nouveau site vitrine pour un client à partir du template situé dans
C:\Users\projets\templates-vitrine.

CONTEXTE
- Template paramétrable dans `template/`, build via `node build.js <slug>`, rendu dans `dist/<slug>/`.
- Référence de structure : `clients/hipolem/config.json` (site complet) et `clients/demo-paysagiste/config.json` (autre métier).
- Lis le README.md à la racine si tu as un doute sur le pipeline.

TÂCHE
1. Crée le dossier `clients/[SLUG-CLIENT]/` avec sous-dossiers `assets/logo/` et `assets/images/`.
2. Crée le `config.json` complet pour ce client (toutes les sections, sauf celles que je désactive).
3. Place les fichiers d'assets aux bons endroits :
   - Logo / favicon → `clients/[SLUG-CLIENT]/assets/logo/`
   - Photos hero, galerie, services → `clients/[SLUG-CLIENT]/assets/images/`
   - Les chemins dans le config.json doivent être relatifs (`assets/logo/...`).
4. Lance `node build.js [SLUG-CLIENT]` et vérifie qu'aucun placeholder `{{...}}` ne reste dans `dist/`.
5. Donne-moi le chemin du `index.html` à ouvrir pour vérifier.
6. À la fin, liste explicitement ce qui a été fait, ce qui manque, et ce qu'il faut que je fournisse pour finaliser.

INFOS CLIENT
- Slug (nom de dossier, en minuscules sans espace) : [ex: garage-martin]
- Nom commercial : [ex: Garage Martin]
- SIRET : [optionnel, sinon "non communiqué" et désactiver l'affichage]
- Slogan / tagline footer : [ex: "Votre garage de confiance depuis 1985"]
- Description en 2-3 phrases (utilisée pour SEO et sous-titre hero) :
  [ex: "Garage indépendant à Avignon spécialisé en entretien, mécanique et carrosserie..."]

CONTACT
- Téléphone (format affiché) : [ex: 04 90 00 00 00]
- Téléphone (format lien tel:) : [ex: +33490000000]
- Email : [ex: contact@garage-martin.fr]
- Zone d'intervention : [ex: Avignon et environs]

IDENTITÉ VISUELLE
- Couleurs (3 codes hex ou descriptions) :
  - Primaire (CTA) : [ex: #c0392b ou "rouge brique"]
  - Secondaire : [ex: #2c3e50 ou "anthracite"]
  - Tertiaire : [ex: #f39c12 ou "orange"]
- Style préféré : [moderne épuré / chaleureux artisanal / sérieux pro / audacieux coloré]
- Logo : [joint en pièce jointe / dans clients/[slug]/assets/logo/ déjà déposé / à créer en placeholder texte]

PRESTATIONS PRINCIPALES (3 ou 4)
Pour chacune : nom, description en 1 phrase, couleur d'accent (green/blue/red/dark)
1. [Prestation 1]
2. [Prestation 2]
3. [Prestation 3]
4. [Prestation 4 — optionnelle]

PRESTATION PHARE (cœur de métier)
- Laquelle : [reprendre une des prestations ci-dessus]
- 4 points forts à mettre en avant :
  1. [...]
  2. [...]
  3. [...]
  4. [...]
- 6 sous-prestations détaillées (mini-cards) :
  1. [Titre — description courte]
  2. [...]
  ...

SERVICE SECONDAIRE & TERTIAIRE
- Service secondaire (bloc avec image + 4 features) : [reprendre une autre prestation + 4 atouts]
- Service tertiaire (bloc avec liste de checks) : [reprendre une autre prestation + 6 points]

SECTIONS GÉNÉRIQUES
- Méthode 4 étapes : [garder par défaut Écoute → Devis → Réalisation → Livraison / adapter ainsi : ...]
- Pourquoi nous (4 cartes) : [garder par défaut / adapter ainsi : ...]
- Avis clients : [oui voici 3 témoignages : ... / non, désactiver la section]

PHOTOS
- État : [toutes fournies en pièces jointes / déjà dans clients/[slug]/assets/images/ / pas encore, utilise picsum.photos en placeholder]
- Si placeholders : utilise des seeds liées au métier (ex: "garage1", "atelier2"...).

FORMULAIRE
- Action Formspree : [URL fournie / "VOTRE_ID_FORMSPREE" en attente]
- Types de projet (options du select) : [liste adaptée au métier]

SIGNATURE FOOTER
- Conserver la signature Geoclic Suite : [oui (par défaut) / non]

CONSIGNES SPÉCIALES
- [Toute particularité que tu veux que je prenne en compte]

```

---

## Version courte (si tu as les réponses Tally en CSV/JSON)

```
Nouveau site client à générer dans C:\Users\projets\templates-vitrine.

Slug : [SLUG]
Réponses du formulaire Tally ci-dessous (CSV / JSON brut, peu importe le format) :

[COLLER ICI L'EXPORT TALLY]

Assets fournis dans : [PATH ou pièces jointes]

Crée clients/[SLUG]/, génère le config.json en mappant les réponses Tally selon le tableau de
mapping de marketing/onboarding-form.md, place les assets, lance le build, dis-moi quoi vérifier.
Si une info manque, propose une formulation par défaut et signale-le à la fin.
```

---

## Bonnes pratiques d'usage

1. **Toujours partir d'une conversation neuve** — pas de mémoire des projets précédents, pas de pollution.
2. **Coller le prompt rempli en un seul message** — Claude a tout le contexte d'un coup, pas besoin d'aller-retour.
3. **Joindre les fichiers** plutôt que de me dire "regarde dans le dossier X" — c'est plus rapide.
4. **Pour les photos volumineuses** : les déposer manuellement dans `clients/[slug]/assets/images/` avant de lancer le prompt, et indiquer dans le prompt « photos déjà déposées ».
5. **Si tu veux une démo non destinée à un vrai client** (ex: pour un autre métier que tu démarches) : ajouter au prompt « démo fictive, utilise picsum.photos pour les images et un nom d'entreprise plausible ».

---

## Itérations après le premier build

Une fois le site généré, pour les ajustements :

```
Dans clients/[slug]/config.json, fais les modifications suivantes :
- [Modification 1]
- [Modification 2]
Puis rebuild et dis-moi ce qui a changé.
```

Ou plus simplement, en langage naturel :

```
Sur le site [slug], change [ce que tu veux] et rebuild.
```

---

## Une fois le site validé : déploiement

```
Le site [slug] est validé. Prépare-moi le ZIP du dossier dist/[slug]/ et donne-moi
les étapes pour le mettre en ligne sur Netlify avec le nom de domaine [domaine].
```
