# Gestia Admin

Admin web pour gérer les sites vitrines clients générés via `templates-vitrine`.

## Ce que ça permet

- Lister tous les clients (un par sous-dossier de `templates-vitrine/clients/`)
- Créer un nouveau client à partir d'un template existant (HIPOLEM, démo paysagiste)
- Éditer le `config.json` de chaque client via des formulaires (sans toucher au JSON brut)
- Uploader des images (logo, photos galerie, hero)
- Lancer un rebuild du site en un clic (exécute `node build.js <slug>`)
- Sécurisé par un mot de passe unique (env var)

## Architecture

```
gestia-admin/
├── server.js            ← Express + auth + API + multer
├── package.json
├── .env                 ← ADMIN_PASSWORD, TEMPLATES_PATH (non commité)
├── .env.example
└── public/
    ├── login.html
    ├── dashboard.html
    ├── editor.html
    ├── style.css
    └── (assets statiques)
```

## Démarrage en local (Windows)

```powershell
cd C:\Users\projets\gestia-admin
npm install
npm start
```

Puis ouvrir [http://localhost:3001/admin](http://localhost:3001/admin)

Le mot de passe par défaut est dans `.env` (`geoclic2026` à changer en prod).

## Déploiement serveur (VPS OVH)

### 1. Cloner sur le serveur

```bash
ssh ubuntu@<VPS>
cd /opt
sudo git clone https://github.com/fredco30/gestia-admin.git
cd gestia-admin
sudo npm install --omit=dev
```

### 2. Configurer `.env`

```bash
sudo cp .env.example .env
sudo nano .env
```

Ajuster :
- `ADMIN_PASSWORD=` (long, unique)
- `SESSION_SECRET=` (généré aléatoirement, ex. `openssl rand -hex 32`)
- `TEMPLATES_PATH=/opt/templates-vitrine`
- `PORT=3001`

### 3. Service systemd

```bash
sudo tee /etc/systemd/system/gestia-admin.service > /dev/null <<EOF
[Unit]
Description=Gestia Admin
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/gestia-admin
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gestia-admin
sudo systemctl start gestia-admin
sudo systemctl status gestia-admin
```

### 4. Reverse proxy nginx (gestia.ovh)

Créer `/etc/nginx/sites-available/gestia` :

```nginx
server {
    listen 80;
    server_name gestia.ovh www.gestia.ovh;
    return 301 https://gestia.ovh$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gestia.ovh;

    ssl_certificate     /etc/letsencrypt/live/gestia.ovh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gestia.ovh/privkey.pem;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis :
```bash
sudo ln -s /etc/nginx/sites-available/gestia /etc/nginx/sites-enabled/
sudo certbot --nginx -d gestia.ovh
sudo nginx -t && sudo systemctl reload nginx
```

### 5. DNS

Chez ton registrar (OVH), pointer `gestia.ovh` (A record) vers l'IP du VPS (`51.210.8.158`).

## Workflow d'utilisation

### Modifier un site existant

1. Se connecter sur `https://gestia.ovh/admin`
2. Cliquer sur la carte du client à modifier
3. Modifier les champs souhaités (texte, images…)
4. Cliquer sur **« Sauvegarder & publier »** : 
   - le `config.json` est mis à jour
   - `node build.js <slug>` est exécuté
   - le dossier `dist/<slug>/` est régénéré
5. Pour que le serveur public serve la nouvelle version, il faut que nginx pointe vers `dist/<slug>/` (à configurer par client)

### Ajouter un nouveau client

1. Cliquer sur **« + Nouveau client »**
2. Renseigner le nom commercial et le slug (auto-généré)
3. Choisir le modèle de base (HIPOLEM par défaut)
4. L'admin crée le dossier `clients/<slug>/` avec une copie du modèle
5. Adapter les champs dans l'éditeur

### Ajouter un site au reverse proxy (à automatiser plus tard)

Pour l'instant, étape manuelle après création d'un nouveau client :
```bash
# Sur le VPS, créer le vhost nginx
sudo tee /etc/nginx/sites-available/<slug> > /dev/null <<EOF
server {
    listen 80;
    server_name <slug>.geoclic.fr;
    root /opt/templates-vitrine/dist/<slug>;
    index index.html;
    location / { try_files \$uri \$uri/ =404; }
}
EOF
sudo ln -s /etc/nginx/sites-available/<slug> /etc/nginx/sites-enabled/
sudo certbot --nginx -d <slug>.geoclic.fr
sudo nginx -t && sudo systemctl reload nginx
```

→ À automatiser dans une **phase 2** de l'admin (bouton « Publier sur le web »).

## Sécurité

- Le `.env` ne doit JAMAIS être commité (déjà dans `.gitignore`)
- Mot de passe long et unique
- HTTPS obligatoire en prod
- Le serveur écoute uniquement sur `127.0.0.1` (nginx fait le proxy)
- Session cookies httpOnly + secure en HTTPS

## Roadmap

Phase 1 (livré) : édition + rebuild manuel
Phase 2 : déploiement automatique (vhost nginx + certbot via API admin)
Phase 3 : preview live, color picker avancé, gestion multi-comptes
