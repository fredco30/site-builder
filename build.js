/* =========================================================
   build.js - Moteur de génération du template vitrine
   Usage : node build.js <nom-client>
   Exemple : node build.js hipolem
            node build.js demo-paysagiste
   ========================================================= */

const fs = require('fs');
const path = require('path');

const ROOT       = __dirname;
const TEMPLATE   = path.join(ROOT, 'template');
const CLIENTS    = path.join(ROOT, 'clients');
const DIST       = path.join(ROOT, 'dist');

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rmDir(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

/* Accès à une propriété par chemin "a.b.c" */
function get(obj, p) {
  if (p === 'this') return obj.__this;
  return p.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

/* Échappement HTML pour les variables {{var}} (sécurité par défaut) */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ----------------------------------------------------------
   Moteur de template minimal
   Syntaxe supportée :
     {{var}}              → valeur échappée HTML
     {{{var}}}            → valeur brute (pour insérer du HTML)
     {{#each liste}}…{{/each}}   → boucle (this = élément courant)
     {{#if var}}…{{/if}}  → condition (vrai si valeur truthy)
   Les blocs each/if peuvent être imbriqués (parseur balancé).
   ---------------------------------------------------------- */

/* Trouve l'index du {{/tag}} correspondant au {{#tag …}} ouvrant
   en gérant les imbrications. Retourne -1 si non trouvé. */
function findMatchingClose(tpl, searchFrom, tag) {
  const openRe = new RegExp(`\\{\\{#${tag}\\s+[\\w.]+\\}\\}`, 'g');
  const closeTag = `{{/${tag}}}`;
  let depth = 1;
  let i = searchFrom;

  while (i < tpl.length) {
    openRe.lastIndex = i;
    const openMatch = openRe.exec(tpl);
    const nextOpen = openMatch ? openMatch.index : -1;
    const nextClose = tpl.indexOf(closeTag, i);

    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + closeTag.length;
    }
  }
  return -1;
}

/* Résout tous les blocs {{#tag path}}…{{/tag}} dans tpl, du plus extérieur
   au plus intérieur, en gérant les imbrications. */
function processBlocks(tpl, tag, handler) {
  const openRe = new RegExp(`\\{\\{#${tag}\\s+([\\w.]+)\\}\\}`);
  let m;
  while ((m = openRe.exec(tpl)) !== null) {
    const startOuter = m.index;
    const innerStart = m.index + m[0].length;
    const path = m[1];
    const closeIdx = findMatchingClose(tpl, innerStart, tag);
    if (closeIdx === -1) {
      // Bloc mal formé : on évacue pour éviter une boucle infinie
      break;
    }
    const inner = tpl.slice(innerStart, closeIdx);
    const replacement = handler(path, inner);
    tpl = tpl.slice(0, startOuter) + replacement + tpl.slice(closeIdx + `{{/${tag}}}`.length);
    // openRe est un regex non sticky : on relance depuis le début après chaque remplacement
  }
  return tpl;
}

function render(tpl, data) {
  // 1. Boucles {{#each path}} … {{/each}} (avec imbrications)
  tpl = processBlocks(tpl, 'each', (path, inner) => {
    const arr = get(data, path);
    if (!Array.isArray(arr)) return '';
    return arr
      .map((item, idx) => {
        const scope = (typeof item === 'object' && item !== null)
          ? { ...data, ...item, __this: item, __index: idx }
          : { ...data, __this: item, __index: idx };
        return render(inner, scope);
      })
      .join('');
  });

  // 2. Conditions {{#if path}} … {{/if}} (avec imbrications)
  tpl = processBlocks(tpl, 'if', (path, inner) => {
    const v = get(data, path);
    const truthy = Array.isArray(v) ? v.length > 0 : !!v;
    return truthy ? render(inner, data) : '';
  });

  // 3. Variables HTML brutes {{{var}}}
  tpl = tpl.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => {
    const v = get(data, p);
    return v == null ? '' : String(v);
  });

  // 4. Variables échappées {{var}}
  tpl = tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => {
    const v = get(data, p);
    return v == null ? '' : escapeHtml(v);
  });

  return tpl;
}

/* ----------------------------------------------------------
   Build d'un client
   ---------------------------------------------------------- */
function build(clientName) {
  const clientDir = path.join(CLIENTS, clientName);
  const configFile = path.join(clientDir, 'config.json');

  if (!fs.existsSync(configFile)) {
    console.error(`✗ Config introuvable : ${configFile}`);
    process.exit(1);
  }

  const config = readJSON(configFile);
  const outDir = path.join(DIST, clientName);

  // Reset du dossier de sortie
  rmDir(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. index.html
  const htmlTpl = readText(path.join(TEMPLATE, 'index.html'));
  writeText(path.join(outDir, 'index.html'), render(htmlTpl, config));

  // 2. styles.css (variables CSS injectées)
  const cssTpl = readText(path.join(TEMPLATE, 'styles.css'));
  writeText(path.join(outDir, 'styles.css'), render(cssTpl, config));

  // 3. script.js (tel quel)
  fs.copyFileSync(
    path.join(TEMPLATE, 'script.js'),
    path.join(outDir, 'script.js')
  );

  // 4. Assets partagés du template (s'il y en a)
  const sharedAssets = path.join(TEMPLATE, 'assets');
  if (fs.existsSync(sharedAssets)) {
    copyDir(sharedAssets, path.join(outDir, 'assets'));
  }

  // 5. Assets spécifiques au client (écrasent les partagés si même nom)
  const clientAssets = path.join(clientDir, 'assets');
  if (fs.existsSync(clientAssets)) {
    copyDir(clientAssets, path.join(outDir, 'assets'));
  }

  console.log(`✓ Site généré : ${path.relative(ROOT, outDir)}`);
  console.log(`  Ouvrir : ${path.join(outDir, 'index.html')}`);
}

/* ----------------------------------------------------------
   Entrée
   ---------------------------------------------------------- */
const arg = process.argv[2];

if (!arg || arg === '--all') {
  // Build tous les clients
  const clients = fs
    .readdirSync(CLIENTS, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
  for (const c of clients) build(c);
} else {
  build(arg);
}
