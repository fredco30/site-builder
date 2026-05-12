# Marketing — Geoclic Suite

Outils commerciaux pour vendre des sites internet à des artisans et services locaux.

## Contenu

```
marketing/
├── onboarding-form.md     ← spec du formulaire Tally (avec mapping vers config.json)
└── plaquette/
    └── index.html         ← plaquette commerciale A4 print-ready
```

---

## 1. Formulaire d'onboarding

Fichier : [`onboarding-form.md`](onboarding-form.md)

**À quoi ça sert** : récupérer en un seul aller-retour toutes les infos client pour construire le `config.json` du site.

**Comment l'utiliser** :
1. Créer un compte gratuit sur https://tally.so
2. Recopier les questions du fichier dans un nouveau formulaire Tally (compter ~45 min)
3. Activer les uploads de fichiers, la logique conditionnelle et la notification email
4. Récupérer l'URL publique (ex. `tally.so/r/xxxxx`)
5. Mettre l'URL dans :
   - La plaquette (remplacer `VOTRE_ID` dans `plaquette/index.html`)
   - La signature email
   - Le site geoclic.fr en CTA
   - Les cartes de visite (QR code)

**Mapping** : chaque question du formulaire indique vers quel champ du `config.json` elle pointe. Quand tu reçois une réponse, tu copies les réponses dans `clients/<nom>/config.json`, tu places les fichiers uploadés dans `clients/<nom>/assets/`, et tu lances `node build.js <nom>`.

---

## 2. Plaquette commerciale

Fichier : [`plaquette/index.html`](plaquette/index.html)

**Format** : 2 pages A4 portrait, print-ready, auto-suffisant (un seul fichier HTML).

**Contenu** :
- **Page 1** : hero, 3 formules tarifées (Essentiel 300 € + 25 €/mois, Pro 590 € + 35 €/mois avec SEO local inclus, Pack annuel 890 €/an tout-en-un), méthode en 5 étapes
- **Page 2** : 6 raisons de choisir Geoclic, cas client HIPOLEM, CTA + contact

**Comment générer le PDF** :
1. Ouvrir `plaquette/index.html` dans Chrome ou Edge
2. Ctrl+P (Imprimer)
3. Destination : **Enregistrer au format PDF**
4. Marges : **Aucune** (le HTML gère les marges intérieures)
5. **Cocher « Graphiques d'arrière-plan »** (sinon les couleurs sont perdues)
6. Format : A4 portrait
7. Enregistrer sous `plaquette-geoclic-2026.pdf`

**Personnalisation rapide** (à faire dans `plaquette/index.html`) :
- Tarifs : chercher `300 €`, `25 €`, `590 €`, `35 €`, `890 €`, `490 €`, `250 €` et adapter
- Coordonnées : chercher `contact@geoclic.ovh` et `Frédéric Lopez`
- URL du formulaire : chercher `tally.so/r/VOTRE_ID`
- Témoignage client : section `.case__quote` (modifier le texte si HIPOLEM ne souhaite pas être cité, ou ajouter d'autres cas plus tard)

**À ajouter idéalement** :
- Un vrai screenshot du site HIPOLEM dans le bloc `.case__visual` (actuellement un dégradé stylisé). Remplacer le contenu par `<img src="screenshot-hipolem.png" />`.
- Un QR code vers le formulaire Tally dans la zone CTA. Tu peux le générer sur https://qrcode-monkey.com et l'insérer en `<img>`.

---

## Workflow complet de prospection

```
1. Tu envoies la plaquette PDF (email, en main propre, sur stand)
   ↓
2. Le prospect intéressé clique sur le lien Tally / scanne le QR code
   ↓
3. Il remplit le formulaire en 15-20 min (uploads logo + photos compris)
   ↓
4. Tu reçois une notification email avec toutes les réponses
   ↓
5. Tu crées le dossier clients/<nom>/, tu remplis le config.json, tu places les assets
   ↓
6. node build.js <nom>  →  site dans dist/<nom>/
   ↓
7. Tu envoies un lien de preview (Netlify deploy preview ou simple ZIP)
   ↓
8. Le client valide ou demande des ajustements
   ↓
9. Mise en ligne sur son domaine + signature du contrat de maintenance
```

**Objectif temps de production** : moins de 6 heures de travail effectif par site, hors collecte des photos.

---

## Évolutions à prévoir

- **Script d'import Tally → config.json** : automatiser le copier-coller depuis le CSV export Tally
- **Plaquette PDF générée depuis le HTML par CI** (Puppeteer en headless) pour ne plus faire le Ctrl+P manuel
- **Variantes de plaquette par métier** (artisan / esthétique / restauration) avec photos et exemples adaptés
- **Page « tarifs » sur geoclic.fr** reprenant le contenu de la plaquette
