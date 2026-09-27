#!/usr/bin/env node
/**
 * BaeLink - static landing page preview.
 *
 * Renders the app's real Thymeleaf index.html into a plain HTML page, so the
 * rebranded site can be viewed in a browser without a JVM, a database or an
 * SMTP server. It is not a mock-up: the #{...} message keys are resolved from
 * the app's own i18n file, the header/footer fragments are inlined and the
 * real CSS, fonts, scripts and images are linked from src/main/resources.
 *
 * Usage:
 *   node scripts/preview-static.mjs [outputDir]      # default: .preview
 *   cd .preview && python3 -m http.server 8080 --bind 0.0.0.0
 *
 * The output directory is git-ignored. Every asset except index.html and
 * preview.css is a symlink, so re-running this after changing the brand shows
 * the new artwork on a browser reload.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TPL = path.join(REPO_ROOT, 'src', 'main', 'resources', 'templates');
const I18N = path.join(REPO_ROOT, 'src', 'main', 'resources', 'i18n', 'messages.properties');
const STATIC = path.join(REPO_ROOT, 'src', 'main', 'resources', 'static');
const OUT = path.resolve(process.argv[2] ?? path.join(REPO_ROOT, '.preview'));

const PREVIEW_CSS = `/* Only used by the static preview; not part of the application. */
#preview-bar {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(18, 18, 26, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 13px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}
#preview-bar a { color: #ffffff; opacity: 0.65; text-decoration: none; }
#preview-bar a:hover { opacity: 1; color: #FF3D68; }
.preview-tag {
  color: #ffffff;
  background: #FF3D68;
  border-radius: 999px;
  padding: 3px 10px;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
@media (max-width: 700px) {
  #preview-bar { font-size: 11px; gap: 9px; padding: 8px 12px; }
}
`;

/* --------------------------------------------------------- i18n (properties) */
function parseProperties(file) {
  const out = {};
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).replace(/\\n/g, '\n').replace(/\\'/g, "'");
  }
  return out;
}
const messages = parseProperties(I18N);

function resolveExpr(expr) {
  return expr
    .replace(/#\{([^}]+)\}/g, (m, key) => messages[key] ?? key)
    .replace(/\s*\+\s*/g, '')
    .replace(/'/g, '')
    .trim();
}
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => s.replace(/"/g, '&quot;').replace(/&/g, '&amp;');

/* --------------------------------------------------------- fragment inlining */
function extractFragment(source, name) {
  const marker = source.indexOf(`th:fragment="${name}"`);
  if (marker < 0) throw new Error(`fragment ${name} not found`);
  const open = source.lastIndexOf('<', marker);
  const tagName = /^<([a-zA-Z0-9]+)/.exec(source.slice(open))[1];
  let pos = source.indexOf('>', open) + 1;
  let depth = 1;
  const openRe = new RegExp(`<${tagName}\\b`, 'g');
  const closeRe = new RegExp(`</${tagName}\\s*>`, 'g');
  while (depth > 0 && pos < source.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const nextOpen = openRe.exec(source);
    const nextClose = closeRe.exec(source);
    const oi = nextOpen ? nextOpen.index : Infinity;
    const ci = nextClose ? nextClose.index : Infinity;
    if (ci < oi) { depth--; pos = ci + nextClose[0].length; }
    else if (oi < ci) { depth++; pos = oi + nextOpen[0].length; }
    else break;
  }
  return source.slice(open, pos);
}

/* ------------------------------------------------------------------- render */
function render(html) {
  // 1. th:text / th:utext -> element content (every such element is empty)
  html = html.replace(
    /<([a-zA-Z0-9]+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s+th:(utext|text)="([^"]*)"((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*>/g,
    (m, tag, pre, kind, expr, post) => {
      const value = resolveExpr(expr);
      return `<${tag}${pre}${post}>${kind === 'utext' ? value : escapeHtml(value)}`;
    },
  );
  // 2. other value-carrying th:* attributes
  html = html.replace(/\s+th:(content|href|src|placeholder|alt|title|value)="([^"]*)"/g, (m, attr, expr) =>
    expr.trim().startsWith('${') ? ` ${attr}="#"` : ` ${attr}="${escapeAttr(resolveExpr(expr))}"`);
  // 3. drop the rest of Thymeleaf
  html = html.replace(/\s+th:[a-zA-Z-]+(?:="[^"]*")?/g, '');
  html = html.replace(/\s+xmlns:th="[^"]*"/g, '');
  html = html.replace(/<th:block[^>]*>|<\/th:block>/g, '');
  return html.replace(/<html\b/, '<html lang="en"');
}

const fragments = fs.readFileSync(path.join(TPL, 'fragments.html'), 'utf8');
const header = extractFragment(fragments, 'header');
const footer = extractFragment(fragments, 'footer');

let page = fs.readFileSync(path.join(TPL, 'index.html'), 'utf8');
page = page.replace(/<header\s+th:insert="~\{fragments\.html::header\}"[^>]*><\/header>/, header);
page = page.replace(/<footer\s+th:replace="~\{fragments\.html::footer\}"[^>]*><\/footer>/, footer);
page = render(page);

// Static preview only: no service worker (it would cache stale assets) and a
// small bar linking to the generated artwork.
page = page.replace('<script src="/sw.js"></script>', '<!-- service worker disabled in the static preview -->');
page = page.replace('<link rel="manifest" href="/manifest/manifest.json">', '');
page = page.replace('</head>', '  <link rel="stylesheet" href="/preview.css">\n</head>');
page = page.replace('</body>', `  <div id="preview-bar">
    <span class="preview-tag">static preview</span>
    <a href="/screenshots/landing.png" target="_blank">landing</a>
    <a href="/screenshots/discover.png" target="_blank">discover</a>
    <a href="/screenshots/chat.png" target="_blank">chat</a>
    <a href="/img/share.png" target="_blank">share card</a>
    <a href="/img/ios-pwa.webp" target="_blank">splash</a>
    <a href="/logo.svg" target="_blank">logo.svg</a>
  </div>
</body>`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), page);
fs.writeFileSync(path.join(OUT, 'preview.css'), PREVIEW_CSS);

for (const entry of fs.readdirSync(STATIC)) {
  fs.symlinkSync(path.join(STATIC, entry), path.join(OUT, entry));
}
fs.symlinkSync(path.join(REPO_ROOT, 'docs', 'screenshots'), path.join(OUT, 'screenshots'));

console.log(`preview written to ${OUT}`);
console.log('serve it with:');
console.log(`  python3 -m http.server 8080 --bind 0.0.0.0 --directory ${OUT}`);
