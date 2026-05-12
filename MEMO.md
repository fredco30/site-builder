# MEMO — Geoclic Suite Pro & Gestia

> Document de référence pour ne plus jamais se perdre dans l'archi.
> Mis à jour : mai 2026.

---

## 1. Vue d'ensemble du projet

Activité **GeoClic Suite Pro** : création de sites internet vitrines et d'applications métier sur mesure pour artisans, commerçants, indépendants, PME.

C'est une **nouvelle branche** d'activité, en parallèle de **GeoClic Suite Collectivités** (logiciels SaaS pour mairies — qui continue son propre cycle).

### Les deux marques

| Marque | Cible | Site public |
|---|---|---|
| **GeoClic Suite Collectivités** | Mairies, intercos | https://geoclic.fr/ |
| **GeoClic Suite Pro** | Artisans, commerçants, TPE/PME | https://geoclic.fr/creations-web.html |

---

## 2. Les 3 offres commerciales

| | **Essentiel** | **Pro** ⭐ | **Pack annuel** |
|---|---|---|---|
| Création | 300 € HT | 590 € HT | inclus |
| Récurrent | 25 €/mois HT | 35 €/mois HT | 890 €/an puis **490 €/an** |
| Année 1 totale | 600 € HT | 1 010 € HT | 890 € HT |
| Engagement | 12 mois | 12 mois | 1 an renouvelable |
| Pages | 5 max | 8 max | 8 max |
| Personnalisation graphique | Template paramétré | + customisations | + customisations |
| **Pack SEO local** (valeur 250 €) | En option (+250 €) | **INCLUS** | **INCLUS** |
| Modifications | 1/mois (30 min) | 2/mois (30 min) | 24/an cumulables |
| Rapport mensuel | Non | Oui | Oui |
| Délai livraison | 2-3 semaines | 2 semaines | 2 semaines |
| Facturation | Mensuelle | Mensuelle | **Annuelle unique** |

**Apps métier sur mesure** : 500 € à 15 000 € HT, étude gratuite, atelier de cadrage, maintenance 6 mois incluse.

---

## 3. Conditions essentielles (CGU/contrat)

- **Engagement initial** : 12 mois sur Essentiel et Pro (résiliable ensuite préavis 1 mois), 1 an renouvelable sur Pack annuel
- **Modifications hors-forfait** : 50 €/h HT
- **Nouvelle page / fonctionnalité** : sur devis
- **Nom de domaine** : enregistré au nom du client (~20 €/an refacturés)
- **Propriété client** : contenus (textes, photos, logo) + nom de domaine
- **Non-propriété client** : le code source et le design du site (modèle SaaS hébergé, comme Wix/Shopify)

---

## 4. Architecture serveur

### VPS 1 — geoclic.fr (le site public)
- **IP** : 51.210.8.158
- **Hostname** : vps-78e9c3c9
- **DNS** : `geoclic.fr`, `www.geoclic.fr`
- **Sert** : la landing Collectivités + la page Pro (creations-web.html)
- **Path racine nginx** : `/opt/geoclic/deploy/www`
- **Repo Git** : [fredco30/site-web-pro](https://github.com/fredco30/site-web-pro)
- **Alias mise à jour** : `geoclic-update` (déjà installé)

### VPS 2 — gestia.ovh (admin + sites clients)
- **IP** : 135.125.159.92
- **Hostname** : vps-c4f983e3
- **DNS** : `gestia.ovh`, `www.gestia.ovh`
- **Sert** :
  - `https://gestia.ovh/` → landing GestIA
  - `https://gestia.ovh/admin` → admin web (Node.js Express, port 4001)
  - `https://gestia.ovh/hipolem/` → site HIPOLEM (et tout futur client)
  - `https://gestia.ovh/app/` et `/frais/` → PWA mobile (existant)
- **Path racine projet** : `/opt/site-builder`
- **Repo Git** : [fredco30/site-builder](https://github.com/fredco30/site-builder)
- **Alias mise à jour** : `gestia-update` (déjà installé)
- **Service systemd admin** : `gestia-admin.service`

---

## 5. Les 2 repos GitHub

### fredco30/site-web-pro
**Contient** : les fichiers statiques HTML/CSS/JS du site **public geoclic.fr**.
**Cible déploiement** : VPS 1 (`/opt/geoclic/deploy/www`).
**Quand y push-t-on ?** : à chaque modif des pages publiques (creations-web.html, index.html, tarifs.html, etc.).

### fredco30/site-builder
**Contient** : le **système complet** :
- `template/` : template HTML/CSS/JS paramétrable
- `clients/<slug>/config.json` + assets : configs des clients
- `dist/` : sites buildés (gitignored)
- `build.js` : générateur Node.js
- `admin/` : l'app Node.js Express (Gestia Admin)
- `marketing/` : plaquette PDF, formulaire onboarding, prompts
- `MEMO.md` : ce document

**Cible déploiement** : VPS 2 (`/opt/site-builder`).
**Quand y push-t-on ?** : à chaque modif du template, de l'admin, ou de la config d'un client (pour version git).

---

## 6. Workflows de mise à jour

### Cas A — Modif d'un site client existant
**Le plus simple : passer par l'admin web.**

1. https://gestia.ovh/admin → connexion
2. Cliquer sur le client (HIPOLEM, etc.)
3. Modifier les champs (textes, photos…)
4. Bouton **"Sauvegarder & publier"** → écrit `config.json` + rebuild auto
5. Site immédiatement à jour sur https://gestia.ovh/\<slug\>/

Pas de git, pas de SSH, pas de commande.

### Cas B — Modif du template (HTML/CSS partagé entre tous les clients)
1. Modifier dans `C:\Users\projets\templates-vitrine\template\`
2. `git add . && git commit -m "..." && git push` (vers site-builder)
3. Sur VPS 2 : `gestia-update`
4. Tous les sites clients sont rebuildés et à jour

### Cas C — Modif d'une page publique geoclic.fr
1. Modifier dans `C:\Users\projets\site-web-pro\` (ex. creations-web.html)
2. `git add . && git commit -m "..." && git push` (vers site-web-pro)
3. Sur VPS 1 : `geoclic-update`

### Cas D — Ajout d'un nouveau client
**Via l'admin web** :
1. https://gestia.ovh/admin → bouton "+ Nouveau client"
2. Renseigner nom commercial + slug
3. Choisir le modèle de base (HIPOLEM par défaut)
4. L'admin crée le dossier `clients/<slug>/` avec une copie du modèle
5. L'éditeur s'ouvre → personnaliser tous les champs
6. Bouton "Sauvegarder & publier" → site dispo à https://gestia.ovh/<slug>/

**Manuellement** (alternative) : suivre `marketing/prompt-nouveau-client.md` pour briefer Claude avec les infos du formulaire Tally.

---

## 7. L'admin Gestia (https://gestia.ovh/admin)

### Accès
- **URL** : https://gestia.ovh/admin
- **Mot de passe** : stocké dans `/opt/site-builder/admin/.env` sur le VPS 2 (variable `ADMIN_PASSWORD`)
- **Rate limiting** : 5 tentatives ratées → blocage 10 min de l'IP

### Sections éditables par client (dans l'éditeur)
- 🏢 Identité & contact (nom, SIRET, slogan, téléphone, email, zone)
- 🔍 SEO (title, description, Open Graph)
- 🎨 Logo & couleurs (upload logo + 7 couleurs palette)
- 🖼️ Hero (bannières desktop/mobile, titre H1, sous-titre, CTAs)
- ⭐ Prestations principales (3-4 cartes)
- 🛁 Showcase savoir-faire principal
- 📋 Mini-cartes sous-prestations
- 🛠️ Méthode (4 étapes)
- 📸 Galerie réalisations
- ⭐ Avis clients
- ✉️ Formulaire contact (Formspree)
- 🦶 Pied de page

### Sections désactivables
Showcase, méthode, galerie, avis, etc. — toggle ON/OFF dans la nav latérale de l'éditeur.

### Fonctionnalités
- Upload d'images avec preview
- Listes dynamiques (ajout/suppression/réorder ↑↓)
- Color picker pour la palette
- "Sauvegarder & publier" = écrit config + rebuild en 1 clic
- Détection auto des nouveaux clients (ajoute un dossier `clients/<slug>/` → apparaît dans le dashboard)

---

## 8. Outils marketing (`marketing/`)

| Fichier | Usage |
|---|---|
| `marketing/plaquette/index.html` | Plaquette commerciale A4 print-ready (Ctrl+P → PDF). 2 pages. |
| `marketing/onboarding-form.md` | Spec complète du formulaire Tally (8 pages, 36 questions, avec mapping vers config.json) |
| `marketing/prompt-nouveau-client.md` | Prompt à coller dans Claude pour créer un site client à partir des réponses Tally |
| `marketing/README.md` | Doc des outils marketing |

---

## 9. Commandes essentielles

### Sur le PC Windows
```powershell
# Site public geoclic.fr
cd C:\Users\projets\site-web-pro
git add . && git commit -m "..." && git push

# Système complet (template + admin + clients)
cd C:\Users\projets\templates-vitrine
git add . && git commit -m "..." && git push

# Build un client localement (test)
cd C:\Users\projets\templates-vitrine
node build.js <slug>           # un client
node build.js --all            # tous

# Lancer l'admin localement (dev)
cd C:\Users\projets\templates-vitrine\admin
npm start
# → http://localhost:4001/admin
```

### Sur VPS 1 (geoclic.fr — vps-78e9c3c9)
```bash
geoclic-update                 # met à jour le site public
```

### Sur VPS 2 (gestia.ovh — vps-c4f983e3)
```bash
gestia-update                  # pull repo + rebuild tous les clients
sudo systemctl status gestia-admin   # vérifier l'admin
sudo systemctl restart gestia-admin  # redémarrer l'admin (après modif server.js)
sudo journalctl -u gestia-admin -f   # logs admin en live
```

---

## 10. Structure des dossiers locaux

```
C:\Users\projets\
├── templates-vitrine\            ← repo site-builder
│   ├── template\                 ← template HTML/CSS/JS
│   ├── clients\<slug>\           ← config + assets de chaque client
│   ├── dist\<slug>\              ← sites buildés (gitignored)
│   ├── build.js                  ← générateur
│   ├── admin\                    ← app Node.js Express
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── public\               ← UI (login, dashboard, editor)
│   │   └── .env                  ← secrets (gitignored)
│   ├── marketing\
│   │   ├── plaquette\
│   │   ├── onboarding-form.md
│   │   └── prompt-nouveau-client.md
│   └── MEMO.md                   ← CE DOCUMENT
│
├── site-web-pro\                 ← repo site-web-pro (geoclic.fr public)
│   ├── index.html                ← accueil collectivités
│   ├── creations-web.html        ← page offre Pro
│   ├── tarifs.html, fonctionnalites.html, etc.
│   ├── screenshots\              ← logos, captures, illustrations
│   ├── style.css
│   └── animations.js
│
└── site hipolem\                 ← legacy, le tout premier site HIPOLEM (référence)
```

---

## 11. Variables sensibles (à ne JAMAIS commiter)

| Fichier | Contenu |
|---|---|
| `templates-vitrine/admin/.env` | `ADMIN_PASSWORD`, `SESSION_SECRET`, `PORT` |
| ` /opt/site-builder/admin/.env` (sur VPS 2) | Idem mais valeurs de prod (mot de passe fort) |

Les `.env` sont dans `.gitignore`. Ne JAMAIS les pousser sur GitHub.

---

## 12. Troubleshooting fréquent

| Problème | Solution |
|---|---|
| `dubious ownership` au `git pull` | `sudo git config --system --add safe.directory <chemin>` |
| `Your local changes would be overwritten` | `sudo git -C <path> fetch && sudo git -C <path> reset --hard origin/main` |
| L'admin renvoie 502 | Vérifier `sudo systemctl status gestia-admin` — relancer si pas actif |
| Modif non visible après push | `Ctrl+F5` (vide cache navigateur), ou clear Cloudflare si CDN |
| nginx ne reload pas après modif config | `sudo nginx -t && sudo systemctl reload nginx` |
| Conflit de port (3001 déjà pris) | Notre admin tourne sur **4001** (PORT dans .env) |

---

## 13. Roadmap (idées pour plus tard)

- **Phase 2 admin** : automatisation déploiement (création vhost nginx + certbot via bouton "Mettre en ligne")
- **Phase 3 admin** : preview live dans iframe, color picker avancé, stats par site
- **Démarchage** : messages type email + LinkedIn pour prospection artisans locaux
- **Sous-domaines clients** : `<slug>.geoclic.fr` au lieu de `gestia.ovh/<slug>` (plus pro pour les clients)
- **Domaines custom clients** : pointer `hipolem-batiment.fr` directement vers `/opt/site-builder/dist/hipolem/` via vhost dédié
- **Page "Réalisations" sur geoclic.fr/creations-web.html** : afficher tous les sites clients en vitrine
- **Avis clients réels** : passer de témoignages génériques à de vrais avis vérifiés

---

## 14. Contacts & accès

- **GitHub** : fredco30
- **Compte OVH** : (pour les VPS et DNS)
- **Email pro** : contact@geoclic.fr
- **Compte Tally** : à créer pour le formulaire d'onboarding (voir `marketing/onboarding-form.md`)
- **Compte Formspree** : pour recevoir les demandes de devis client par email

---

*Document maintenu à jour au fil des décisions d'archi.*
