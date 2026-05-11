/* =========================================================
   gestia-admin — Admin de gestion des sites vitrines clients
   Stack : Node.js + Express + sessions
   Auteur : Geoclic Suite
   ========================================================= */

// Chargement minimal du .env (sans dépendance externe)
require('fs').readFileSync(require('path').join(__dirname, '.env'), 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#'))
  .forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });

const express  = require('express');
const session  = require('express-session');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const { exec } = require('child_process');

const PORT            = parseInt(process.env.PORT || '3001', 10);
// L'admin vit dans templates-vitrine/admin/, donc templates-vitrine est juste au-dessus.
const TEMPLATES_PATH  = process.env.TEMPLATES_PATH || path.join(__dirname, '..');
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || 'changeme';
const SESSION_SECRET  = process.env.SESSION_SECRET || 'changeme-secret';

const CLIENTS_DIR = path.join(TEMPLATES_PATH, 'clients');
const DIST_DIR    = path.join(TEMPLATES_PATH, 'dist');
const BUILD_JS    = path.join(TEMPLATES_PATH, 'build.js');

/* ----------------------------------------------------------
   App Express + sessions
   ---------------------------------------------------------- */
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// On est derrière un reverse proxy nginx en prod : req.ip = vrai IP client
app.set('trust proxy', 1);

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8 // 8 heures
  }
}));

// Toutes les routes de l'admin sont sous /admin
const ADMIN_PREFIX = '/admin';

/* ----------------------------------------------------------
   Rate limiting du login (anti-bruteforce)
   - 5 tentatives ratées → blocage 10 min pour l'IP
   - Fenêtre glissante de 15 min pour compter
   - Stockage en mémoire (acceptable pour un admin mono-utilisateur)
   ---------------------------------------------------------- */
const failedLogins = new Map(); // ip → { count, firstAttempt, blockedUntil }
const RL_MAX_ATTEMPTS    = 5;
const RL_BLOCK_DURATION  = 10 * 60 * 1000; // 10 min
const RL_ATTEMPT_WINDOW  = 15 * 60 * 1000; // 15 min

function getClientIp(req) {
  return req.ip || req.connection.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const entry = failedLogins.get(ip);
  if (!entry) return { allowed: true };
  if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
    return { allowed: false, retryInSec: Math.ceil((entry.blockedUntil - Date.now()) / 1000) };
  }
  // Si la fenêtre est expirée, on reset
  if (Date.now() - entry.firstAttempt > RL_ATTEMPT_WINDOW) {
    failedLogins.delete(ip);
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const now = Date.now();
  let entry = failedLogins.get(ip);
  if (!entry || now - entry.firstAttempt > RL_ATTEMPT_WINDOW) {
    entry = { count: 0, firstAttempt: now, blockedUntil: 0 };
  }
  entry.count++;
  if (entry.count >= RL_MAX_ATTEMPTS) {
    entry.blockedUntil = now + RL_BLOCK_DURATION;
  }
  failedLogins.set(ip, entry);
}

function clearFailedLogins(ip) {
  failedLogins.delete(ip);
}

// Nettoyage périodique des entrées trop anciennes
setInterval(() => {
  const cutoff = Date.now() - RL_ATTEMPT_WINDOW;
  for (const [ip, entry] of failedLogins.entries()) {
    if (entry.firstAttempt < cutoff && (!entry.blockedUntil || entry.blockedUntil < Date.now())) {
      failedLogins.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/* ----------------------------------------------------------
   Auth helpers
   ---------------------------------------------------------- */
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  // API JSON → 401 ; pages HTML → redirect login
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Non authentifié' });
  return res.redirect(ADMIN_PREFIX + '/login');
}

/* ----------------------------------------------------------
   Helpers fichiers
   ---------------------------------------------------------- */
function listClients() {
  if (!fs.existsSync(CLIENTS_DIR)) return [];
  return fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const slug = d.name;
      const configPath = path.join(CLIENTS_DIR, slug, 'config.json');
      let businessName = slug;
      let hasConfig = false;
      try {
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          businessName = (cfg.business && cfg.business.name) || slug;
          hasConfig = true;
        }
      } catch (e) {}
      const distExists = fs.existsSync(path.join(DIST_DIR, slug, 'index.html'));
      return { slug, businessName, hasConfig, distExists };
    })
    .sort((a, b) => a.businessName.localeCompare(b.businessName));
}

function readConfig(slug) {
  const p = path.join(CLIENTS_DIR, slug, 'config.json');
  if (!fs.existsSync(p)) throw new Error('Client introuvable');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeConfig(slug, config) {
  const p = path.join(CLIENTS_DIR, slug, 'config.json');
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
}

function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{1,50}$/.test(slug);
}

/* ----------------------------------------------------------
   Routes statiques + landing
   ---------------------------------------------------------- */
app.use(ADMIN_PREFIX + '/static', express.static(path.join(__dirname, 'public')));

// Servir les assets clients (pour la prévisualisation des images dans l'éditeur)
app.use(ADMIN_PREFIX + '/clients-assets', (req, res, next) => {
  if (!(req.session && req.session.authed)) return res.status(401).end();
  next();
}, express.static(CLIENTS_DIR));

app.get(ADMIN_PREFIX, (req, res) => {
  if (req.session && req.session.authed) return res.redirect(ADMIN_PREFIX + '/dashboard');
  return res.redirect(ADMIN_PREFIX + '/login');
});

app.get(ADMIN_PREFIX + '/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get(ADMIN_PREFIX + '/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get(ADMIN_PREFIX + '/client', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

/* ----------------------------------------------------------
   Auth endpoints
   ---------------------------------------------------------- */
app.post(ADMIN_PREFIX + '/api/login', (req, res) => {
  const ip = getClientIp(req);

  // Vérifie si l'IP est temporairement bloquée
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryInSec / 60)} min.`
    });
  }

  const password = (req.body && req.body.password) || '';
  if (password === ADMIN_PASSWORD) {
    clearFailedLogins(ip);
    req.session.authed = true;
    req.session.loginAt = Date.now();
    return res.json({ ok: true });
  }

  recordFailedLogin(ip);
  return res.status(401).json({ error: 'Mot de passe incorrect' });
});

app.post(ADMIN_PREFIX + '/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ----------------------------------------------------------
   API clients
   ---------------------------------------------------------- */
app.get(ADMIN_PREFIX + '/api/clients', requireAuth, (req, res) => {
  res.json({ clients: listClients() });
});

app.get(ADMIN_PREFIX + '/api/clients/:slug', requireAuth, (req, res) => {
  try {
    const slug = req.params.slug;
    if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug invalide' });
    const config = readConfig(slug);
    res.json({ slug, config });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.put(ADMIN_PREFIX + '/api/clients/:slug', requireAuth, (req, res) => {
  try {
    const slug = req.params.slug;
    if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug invalide' });
    const config = req.body && req.body.config;
    if (!config || typeof config !== 'object') return res.status(400).json({ error: 'Config manquante' });
    writeConfig(slug, config);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post(ADMIN_PREFIX + '/api/clients/new', requireAuth, (req, res) => {
  try {
    const { slug, businessName, baseClient } = req.body || {};
    if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug invalide (lettres minuscules, chiffres, tirets)' });
    const targetDir = path.join(CLIENTS_DIR, slug);
    if (fs.existsSync(targetDir)) return res.status(409).json({ error: 'Ce slug existe déjà' });

    // Base : on duplique un client existant (par défaut : hipolem)
    const baseSlug = baseClient && isValidSlug(baseClient) ? baseClient : 'hipolem';
    const baseDir  = path.join(CLIENTS_DIR, baseSlug);
    if (!fs.existsSync(baseDir)) return res.status(400).json({ error: 'Client de base introuvable: ' + baseSlug });

    // Copie récursive
    copyDirRecursive(baseDir, targetDir);

    // Met à jour le nom dans le config copié
    const cfg = readConfig(slug);
    if (businessName && typeof businessName === 'string') {
      cfg.business = cfg.business || {};
      cfg.business.name = businessName.trim();
    }
    writeConfig(slug, cfg);

    res.json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ----------------------------------------------------------
   Upload d'images
   ---------------------------------------------------------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const slug = req.params.slug;
      if (!isValidSlug(slug)) return cb(new Error('Slug invalide'));
      const folder = req.body.folder === 'logo' ? 'logo' : 'images';
      const target = path.join(CLIENTS_DIR, slug, 'assets', folder);
      fs.mkdirSync(target, { recursive: true });
      cb(null, target);
    },
    filename: (req, file, cb) => {
      // Nom safe : on garde le nom d'origine simplifié
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'image';
      cb(null, base + ext);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|webp|gif|svg|ico)$/i.test(file.originalname);
    cb(ok ? null : new Error('Format non supporté'), ok);
  }
});

app.post(ADMIN_PREFIX + '/api/clients/:slug/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    const slug = req.params.slug;
    const folder = req.body.folder === 'logo' ? 'logo' : 'images';
    const relativePath = `assets/${folder}/${req.file.filename}`;
    res.json({ ok: true, path: relativePath });
  });
});

app.get(ADMIN_PREFIX + '/api/clients/:slug/images', requireAuth, (req, res) => {
  try {
    const slug = req.params.slug;
    if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug invalide' });
    const imgDir = path.join(CLIENTS_DIR, slug, 'assets', 'images');
    const logoDir = path.join(CLIENTS_DIR, slug, 'assets', 'logo');
    const list = (dir, sub) => fs.existsSync(dir)
      ? fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp|gif|svg|ico)$/i.test(f)).map(f => `assets/${sub}/${f}`)
      : [];
    res.json({
      images: list(imgDir, 'images'),
      logo: list(logoDir, 'logo')
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ----------------------------------------------------------
   Build (rebuild d'un client après modif)
   ---------------------------------------------------------- */
app.post(ADMIN_PREFIX + '/api/clients/:slug/build', requireAuth, (req, res) => {
  const slug = req.params.slug;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug invalide' });
  if (!fs.existsSync(path.join(CLIENTS_DIR, slug))) return res.status(404).json({ error: 'Client introuvable' });

  const cmd = `node "${BUILD_JS}" ${slug}`;
  exec(cmd, { cwd: TEMPLATES_PATH, timeout: 60000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: err.message, stderr });
    res.json({ ok: true, stdout: stdout.trim() });
  });
});

/* ----------------------------------------------------------
   Servir les sites clients (dist/<slug>/) — en dernier pour ne
   pas masquer les routes /admin/*
   En production, c'est nginx qui sert ces fichiers directement
   sur gestia.ovh/<slug>/ ; cette route est utile en local pour
   la prévisualisation depuis l'éditeur.
   ---------------------------------------------------------- */
app.use('/', express.static(DIST_DIR, {
  index: ['index.html'],
  fallthrough: true,
  extensions: ['html']
}));

/* ----------------------------------------------------------
   Helper : copie récursive de dossier
   ---------------------------------------------------------- */
function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* ----------------------------------------------------------
   Démarrage
   ---------------------------------------------------------- */
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Gestia Admin — démarré');
  console.log('  URL          : http://localhost:' + PORT + ADMIN_PREFIX);
  console.log('  Templates    : ' + TEMPLATES_PATH);
  console.log('  Clients      : ' + listClients().length + ' détecté(s)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
