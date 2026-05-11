# Formulaire d'onboarding client — spec pour Tally

Ce document décrit le formulaire à créer sur **Tally** (ou Typeform / Google Forms) pour collecter en une fois toutes les informations nécessaires à la création d'un site vitrine artisan.

L'objectif : **plus jamais avoir à relancer un client pour lui demander un truc.**

Chaque question indique le champ correspondant dans `config.json` du dossier `clients/<nom>/` — pour qu'on puisse copier-coller la réponse directement.

---

## Paramétrage Tally (recommandé)

- **Type de formulaire** : multi-pages avec barre de progression (taux de complétion 2× supérieur)
- **Sauvegarde automatique** : activée
- **Logique conditionnelle** : utilisée pour les sections optionnelles (avis, photos, etc.)
- **Upload de fichiers** : activé (Tally permet jusqu'à 5 Mo / fichier, illimité en nombre)
- **Notification email** : à `contact@geoclic.fr` à chaque soumission
- **Page de confirmation** : « Merci ! Vous recevrez votre maquette sous 3 jours ouvrés. »
- **Champ caché** : `source` (utm_source) pour tracer d'où vient le lead

Temps de remplissage cible : **15 à 20 minutes**.

---

## Page 1 — Votre entreprise

### Q1. Nom commercial de votre entreprise
- Type : texte court
- Obligatoire : oui
- Aide : « Tel qu'il apparaîtra en haut du site et dans le footer. »
- → `business.name`

### Q2. SIRET (si vous le souhaitez visible sur le site)
- Type : texte court
- Obligatoire : non
- Aide : « Affiché dans le footer. Laissez vide si vous préférez ne pas l'afficher. »
- → `business.siret`

### Q3. Slogan / phrase d'accroche
- Type : texte court (max 80 caractères)
- Obligatoire : oui
- Exemple : « Avec Hipolem, pas de problème ! » ou « Votre confort, notre savoir-faire »
- → `footer.tagline`

### Q4. En 2-3 phrases, qu'est-ce que vous faites et qu'est-ce qui vous distingue ?
- Type : texte long
- Obligatoire : oui
- Aide : « Cette description nous aidera à rédiger les textes du site. »
- → utilisée pour rédiger `hero.subtitle`, `showcase.lead` et `meta.description`

---

## Page 2 — Contact

### Q5. Téléphone (affiché et cliquable)
- Type : téléphone
- Obligatoire : oui
- → `contact.phone` (format affiché) + `contact.phone_link` (format international `+33...`)

### Q6. Email de contact
- Type : email
- Obligatoire : oui
- → `contact.email`

### Q7. Zone d'intervention
- Type : texte court
- Obligatoire : oui
- Exemple : « Aix-en-Provence et 30 km alentour » ou « Département du Var »
- → `contact.service_area`

### Q8. Vous voulez recevoir les demandes de devis par email ?
- Type : choix unique (oui / non)
- Si oui → on configure Formspree avec l'email de Q6
- → `contact_form.action` (URL Formspree à générer après création du compte)

---

## Page 3 — Identité visuelle

### Q9. Avez-vous un logo ?
- Type : choix unique
  - Oui, je vous le fournis → ouvre Q10
  - Non, je n'en ai pas → Q10 sautée, on proposera une création
- → `branding.logo`

### Q10. Upload de votre logo
- Type : upload de fichier
- Formats acceptés : PNG, JPG, SVG (préférer SVG ou PNG fond transparent)
- Aide : « Si vous avez plusieurs versions, envoyez la version principale + une version pour fond foncé si elle existe. »
- → fichier à placer dans `clients/<nom>/assets/logo/`

### Q11. Couleurs principales de votre marque
- Type : 3 champs texte (couleur 1, 2, 3) — codes hex ou descriptions
- Obligatoire : non
- Aide : « Si vous avez une charte graphique, donnez les codes (#xxxxxx). Sinon, décrivez (ex. "vert sapin + ocre"). »
- → `branding.colors.primary`, `secondary`, `tertiary`

### Q12. Votre style préféré
- Type : choix unique
  - Moderne et épuré
  - Chaleureux et artisanal
  - Sérieux et professionnel
  - Audacieux et coloré
- Aide : « Cela nous guide pour les choix esthétiques. »
- → influence le choix typographique et les nuances de couleurs

### Q13. 1 ou 2 sites concurrents que vous aimez (liens)
- Type : texte long
- Obligatoire : non
- → référence stylistique uniquement, pas mappé au config

### Q14. 1 site que vous trouvez moche (lien)
- Type : texte court
- Obligatoire : non
- Aide : « Pour qu'on évite les pièges esthétiques que vous détestez. »
- → référence stylistique uniquement

---

## Page 4 — Vos prestations

### Q15. Combien de prestations principales voulez-vous mettre en avant ?
- Type : choix unique (3 ou 4)
- → `specialties.columns`

### Q16-Q19 (répétées pour chaque prestation)
Pour chaque prestation (3 ou 4 selon Q15), créer un bloc de questions :

- **Nom de la prestation** (texte court) → `specialties.items[i].title`
- **Description en 1 phrase** (max 120 caractères) → `specialties.items[i].text`
- **Couleur d'accent** (choix : vert / bleu / rouge / sombre) → `specialties.items[i].accent`

### Q20. Quelle est votre prestation phare (le cœur de métier) ?
- Type : choix unique parmi les prestations renseignées
- → définit la section `showcase`

### Q21. Donnez 4 points forts de cette prestation phare
- Type : 4 champs texte court
- Obligatoire : oui
- Exemple : « Finitions soignées du sol au plafond »
- → `showcase.bullets`

### Q22. Pour cette prestation phare, listez 6 sous-prestations détaillées
- Type : 6 blocs (titre + description courte)
- Obligatoire : oui (au moins 3)
- → `service_detail.items`

---

## Page 5 — Méthode de travail

### Q23. Décrivez votre méthode en 4 étapes
- Type : 4 blocs (titre + description)
- Pré-rempli :
  1. Écoute du besoin
  2. Proposition & devis
  3. Réalisation du chantier
  4. Livraison soignée
- Le client peut adapter
- → `method.steps`

### Q24. Pourquoi vous choisir (4 arguments)
- Type : 4 blocs (titre court + 1 phrase)
- Pré-rempli :
  1. Travail soigné
  2. Matériel de qualité
  3. Intervention rapide
  4. Devis gratuit
- Le client peut adapter
- → `why.items`

---

## Page 6 — Réalisations

### Q25. Avez-vous des photos de vos chantiers / réalisations ?
- Type : choix unique
  - Oui → ouvre Q26
  - Non, mais je peux en prendre → on planifie une séance photo (option payante)
  - Non, utilisez des photos de banque d'images en attendant

### Q26. Uploadez vos photos de réalisations
- Type : upload multiple
- Aide : « Idéalement 6 à 12 photos en haute résolution. Format paysage de préférence. Si possible, classez par type de chantier. »
- → `gallery.items` + `showcase.gallery`

### Q27. Pour chaque type de chantier, donnez une catégorie courte
- Type : texte court répété
- Exemple : « Salle de bains », « Climatisation »
- → `gallery.filters`

---

## Page 7 — Avis clients

### Q28. Avez-vous des avis Google ou témoignages écrits ?
- Type : choix unique (oui / non)

### Q29-Q31. (si oui) 3 avis à mettre en avant
Pour chaque avis :
- **Texte de l'avis** (texte long)
- **Auteur** (texte court, ex. « Marie L., Aix-en-Provence »)
- **Note sur 5** (1 à 5 étoiles, défaut 5)
- → `reviews.items`

### Q32. (si non) Voulez-vous une section « Avis clients » désactivée ?
- Type : choix unique (oui / non)
- → `reviews.enabled = false`

---

## Page 8 — Hébergement et finalisation

### Q33. Avez-vous déjà un nom de domaine ?
- Type : choix unique
  - Oui, j'en ai un → texte (nom de domaine)
  - Non, je veux en acheter un → suggérer 3 idées
- Suivi commercial : nom de domaine à refacturer ~20 €/an

### Q34. Quelle formule choisissez-vous ?
- Type : choix unique (cartes visuelles si possible)
- Obligatoire : oui
- Options :
  - **Essentiel** — 300 € HT à la création + 25 €/mois HT (engagement 12 mois)
    - Site 5 pages, 1 modif/mois (30 min), hébergement France, SEO technique
    - SEO local en option à 250 € HT
  - **Pro** — 590 € HT à la création + 35 €/mois HT (engagement 12 mois) [le plus demandé]
    - Site jusqu'à 8 pages, personnalisation poussée
    - SEO local INCLUS (valeur 250 €)
    - 2 modifs/mois, rapport mensuel, livraison 2 semaines
  - **Pack annuel** — 890 € HT/an, renouvellement 490 €/an
    - Tout du Pro + 24 modifs/an cumulables
    - Une seule facture par an, zéro mensualité
- Texte d'aide affiché : « Vous pourrez en discuter avec nous avant de finaliser : c'est un premier choix indicatif. »

### Q34bis. Engagement & conditions
- Type : bloc d'information + case à cocher obligatoire
- Texte affiché au client :
  > « Votre site sera hébergé sur nos serveurs sécurisés en France pendant toute la durée de l'abonnement. Le nom de domaine est enregistré à votre nom (vous en restez propriétaire). À tout moment vous pouvez récupérer vos contenus (textes, photos, logo) — le site lui-même (design, code) reste notre propriété et est mis à disposition tant que vous êtes abonné. **Modifications hors-forfait facturées 50 €/h HT.** Engagement initial 12 mois (Essentiel/Pro) ou 1 an (Pack annuel), résiliable ensuite avec préavis d'un mois. »
- Case à cocher : *« J'ai pris connaissance des conditions générales (engagement, propriété, modifications hors-forfait) »*, obligatoire.

### Q35. Date souhaitée de mise en ligne
- Type : date
- Aide : « Délai standard : 2 à 3 semaines après réception de toutes les infos. »

### Q36. Une dernière chose à nous dire ?
- Type : texte long
- Obligatoire : non

---

## Mapping résumé Form → config.json

| Question Tally    | Champ config.json                       |
|-------------------|------------------------------------------|
| Q1                | `business.name`                          |
| Q2                | `business.siret`                         |
| Q3                | `footer.tagline`                         |
| Q4                | `hero.subtitle`, `meta.description`      |
| Q5                | `contact.phone` + `contact.phone_link`   |
| Q6                | `contact.email`                          |
| Q7                | `contact.service_area`                   |
| Q8                | `contact_form.action`                    |
| Q10 (upload)      | `clients/<nom>/assets/logo/`             |
| Q11               | `branding.colors.*`                      |
| Q15               | `specialties.columns`                    |
| Q16-Q19           | `specialties.items[]`                    |
| Q20               | `showcase.anchor` + `showcase.title`     |
| Q21               | `showcase.bullets[]`                     |
| Q22               | `service_detail.items[]`                 |
| Q23               | `method.steps[]`                         |
| Q24               | `why.items[]`                            |
| Q26 (upload)      | `clients/<nom>/assets/images/`           |
| Q27               | `gallery.filters[]`                      |
| Q29-Q31           | `reviews.items[]`                        |
| Q32               | `reviews.enabled`                        |

---

## Comment exploiter les réponses Tally

1. Tally permet d'**exporter les réponses en CSV** ou via webhook.
2. Pour automatiser : un petit script `import-tally.js` peut lire le CSV et générer le `config.json` directement (évolution future).
3. Pour démarrer : copie-colle manuel en 30 min, en suivant le tableau ci-dessus.

---

## Bonus : URL du formulaire à mettre partout

Une fois le formulaire créé sur Tally, l'URL ressemble à `https://tally.so/r/xxxxx`. À mettre :
- Sur la signature email
- Sur la plaquette PDF (QR code)
- En CTA sur ton propre site (geoclic.fr)
- Dans les groupes Facebook d'artisans
- Sur les cartes de visite
