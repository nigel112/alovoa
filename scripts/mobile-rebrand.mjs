#!/usr/bin/env node
/**
 * Applies the BaeLink rebrand to a clone of the Alovoa Expo app.
 *
 *   node scripts/mobile-rebrand.mjs <path-to-alovoa-expo-clone> [options]
 *
 * Options:
 *   --name    <string>  display name           (default: BaeLink)
 *   --slug    <string>  expo slug              (default: baelink-expo)
 *   --package <string>  android/ios bundle id  (default: com.baelink.expo)
 *   --domain  <string>  back end base URL      (default: http://localhost:8080)
 *   --repo    <owner/name>  your app repo, used for links (default: nigel112/alovoa-expo)
 *   --no-workflow         skip copying the GitHub Actions build
 *
 * Everything it writes is derived from the brand system in scripts/brand, so
 * regenerating the artwork and re-running this keeps app and site in step.
 * Safe to re-run: every replacement is idempotent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const ASSETS = path.join(REPO, 'docs', 'mobile-assets', 'expo');
const WORKFLOW = path.join(REPO, 'docs', 'mobile-assets', 'build-android.yml');

/* ------------------------------------------------------------------- args -- */
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const flags = new Set(argv.filter((a) => a.startsWith('--')));

if (!target) {
  console.error('usage: node scripts/mobile-rebrand.mjs <path-to-alovoa-expo-clone> [--name BaeLink] [--domain https://…]');
  process.exit(1);
}
if (!fs.existsSync(path.join(target, 'app.config.js'))) {
  console.error(`no app.config.js in ${target} - is that an alovoa-expo clone?`);
  process.exit(1);
}

const NAME = opt('name', 'BaeLink');
const SLUG = opt('slug', 'baelink-expo');
const PKG = opt('package', 'com.baelink.expo');
const DOMAIN = opt('domain', 'http://localhost:8080');
const REPO_SLUG = opt('repo', 'nigel112/alovoa-expo');
const SCHEME = NAME.toLowerCase();

const BRAND = { rose: '#FF3D68', ink: '#12121A' };
let changed = 0;

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  console.log(`  wrote  ${path.relative(target, file)}`);
  changed++;
}

/** Replaces `pairs` in `file`; reports anything that did not match. */
function patch(rel, pairs) {
  const file = path.join(target, rel);
  if (!fs.existsSync(file)) return console.log(`  skip   ${rel} (missing)`);
  let text = fs.readFileSync(file, 'utf8');
  let touched = false;
  for (const [old, next] of pairs) {
    if (text.includes(old)) { text = text.replaceAll(old, next); touched = true; }
    else if (!text.includes(next)) console.log(`  miss   ${rel}: ${String(old).slice(0, 60).replace(/\n/g, '\\n')}`);
  }
  if (touched) { fs.writeFileSync(file, text); console.log(`  edited ${rel}`); changed++; }
}

console.log(`Rebranding ${target} -> ${NAME}\n`);

/* ----------------------------------------------------------------- artwork -- */
for (const file of fs.readdirSync(ASSETS)) {
  const src = path.join(ASSETS, file);
  if (!fs.statSync(src).isFile()) continue;
  fs.copyFileSync(src, path.join(target, 'assets', file));
  console.log(`  asset  assets/${file}`);
  changed++;
}

// source SVGs behind the adaptive and themed icons: flat white silhouette
const whiteMark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${NAME}">
  <defs>
    <clipPath id="${SCHEME}-heart">
      <path d="M32 57C32 57 5 39 5 23C5 14.5 11.5 8 20.5 8C26 8 30 11 32 14.5C34 11 38 8 43.5 8C52.5 8 59 14.5 59 23C59 39 32 57 32 57Z"/>
    </clipPath>
  </defs>
  <g clip-path="url(#${SCHEME}-heart)">
    <rect width="64" height="64" fill="#FFFFFF"/>
    <path d="M32 2C41 11 23 19 32 30C41 41 23 49 32 62L64 62L64 2Z" fill="#FFFFFF"/>
  </g>
</svg>
`;
for (const f of ['assets/adaptive-icon.svg', 'assets/monochrome-icon.svg']) {
  write(path.join(target, f), whiteMark);
}

/* ------------------------------------------------------------------ config -- */
patch('app.config.js', [
  ['"name": "Alovoa"', `"name": "${NAME}"`],
  ['"name": "BaeLink"', `"name": "${NAME}"`],
  ['"slug": "alovoa-expo"', `"slug": "${SLUG}"`],
  ['"slug": "baelink-expo"', `"slug": "${SLUG}"`],
  ['"scheme": "alovoa"', `"scheme": "${SCHEME}"`],
  ['"bundleIdentifier": "com.alovoa.expo"', `"bundleIdentifier": "${PKG}"`],
  ['"package": "com.alovoa.expo"', `"package": "${PKG}"`],
  ['"applinks:alovoa.com"', '"applinks:your-domain.com"'],
  ['"backgroundColor": "#ec407a"', `"backgroundColor": "${BRAND.rose}"`],
  ['"backgroundColor": "#121212"', `"backgroundColor": "${BRAND.ink}"`],
  ['"image": "./assets/splash.png",\n        "backgroundColor"', '"image": "./assets/splash-dark.png",\n        "backgroundColor"'],
  ['https://github.com/Alovoa/alovoa-expo/releases/latest', `https://github.com/${REPO_SLUG}/releases/latest`],
]);

// deep-link + query schemes (the top-level one is handled above)
patch('app.config.js', [
  ['"scheme": "alovoa"', `"scheme": "${SCHEME}"`],
  ['"LSApplicationQueriesSchemes": [\n          "alovoa"\n        ]', `"LSApplicationQueriesSchemes": [\n          "${SCHEME}"\n        ]`],
]);

/* ------------------------------------------------------------------ source -- */
patch('URL.tsx', [
  [
    '//export const DOMAIN : string = "http://localhost:8080"\n//export const DOMAIN : string = "https://beta.alovoa.com"\nexport const DOMAIN : string = "https://alovoa.com"',
    `// Point this at your own ${NAME} server.\n//   iOS simulator / web:  http://localhost:8080\n//   Android emulator:     http://10.0.2.2:8080\n//   physical device:      http://<your-lan-ip>:8080\n// Replace it with your public URL before releasing.\n//export const DOMAIN : string = "http://10.0.2.2:8080"\nexport const DOMAIN : string = "${DOMAIN}"\n//export const DOMAIN : string = "https://alovoa.com"   // upstream Alovoa, for reference`,
  ],
]);
patch('screens/Login.tsx', [[`}}>Alovoa<`, `}}>${NAME}<`]]);
patch('screens/YourProfile.tsx', [
  ['const userdataFileName = "userdata-alovoa.json"', `const userdataFileName = "userdata-${SCHEME}.json"`],
  ["'/alovoa.json'", `'/${SCHEME}.json'`],
]);
patch('package.json', [['"name": "alovoa-expo"', `"name": "${SLUG}"`]]);

/* ------------------------------------------------------------- store listing */
patch('fastlane/metadata/android/en-US/title.txt', [['Alovoa', NAME]]);
patch('fastlane/metadata/android/en-US/full_description.txt', [
  ['Native Android application for Alovoa,', `Native Android application for ${NAME},`],
  ['Alovoa aims to be the first global', `${NAME} aims to be the first global`],
]);

/* -------------------------------------------------------------------- docs -- */
patch('README.md', [
  ['**Alovoa - Expo**', `**${NAME} - Expo**`],
  ['React Native mobile application for Alovoa.', `React Native mobile application for ${NAME}.`],
  ['https://raw.githubusercontent.com/Alovoa/alovoa-expo/master/', `https://raw.githubusercontent.com/${REPO_SLUG}/master/`],
  ['https://f-droid.org/packages/com.alovoa.expo/', `https://f-droid.org/packages/${PKG}/`],
  ['https://play.google.com/store/apps/details?id=com.alovoa.expo', `https://play.google.com/store/apps/details?id=${PKG}`],
  ['[Issues](https://github.com/Alovoa/alovoa-expo/issues)', `[Issues](https://github.com/${REPO_SLUG}/issues)`],
  ['git clone https://github.com/Alovoa/alovoa-expo', `git clone https://github.com/${REPO_SLUG}`],
  ['cd alovoa-expo', `cd ${SLUG}`],
  ['native mobile apps for Android and iOS for Alovoa.',
    `native mobile apps for Android and iOS for ${NAME}. ${NAME} is a personalized build of [Alovoa](https://github.com/Alovoa/alovoa-expo) by nonononoki, and stays under the same AGPLv3 license.`],
]);
for (const f of ['.github/ISSUE_TEMPLATE/bug_report.md', '.github/ISSUE_TEMPLATE/feature_request.md']) {
  patch(f, [
    ['This repository only covers bugs of app.alovoa.com and iOS/Android apps only. Go to [alovoa](https://github.com/Alovoa/alovoa) for reporting bugs on app.alovoa.com and the backend.',
      `This repository only covers bugs in the mobile apps. Go to [the ${NAME} server repository](https://github.com/nigel112/alovoa) for bugs in the backend and web UI.`],
    ['This repository only covers feature requests for app.alovoa.com and iOS/Android apps only. Go to [alovoa](https://github.com/Alovoa/alovoa) for requesting feature requests on app.alovoa.com and the backend.',
      `This repository only covers feature requests for the mobile apps. Go to [the ${NAME} server repository](https://github.com/nigel112/alovoa) for the backend and web UI.`],
  ]);
}

/* --------------------------------------------------- illustrations + palette */
const svgDir = path.join(target, 'assets');
let recoloured = 0;
for (const file of fs.readdirSync(svgDir, { recursive: true })) {
  if (!file.endsWith('.svg')) continue;
  const full = path.join(svgDir, file);
  const text = fs.readFileSync(full, 'utf8');
  if (!/ec407a/i.test(text)) continue;
  fs.writeFileSync(full, text.replaceAll(/ec407a/gi, BRAND.rose.slice(1)));
  recoloured++;
}
if (recoloured) { console.log(`  recoloured ${recoloured} illustrations to ${BRAND.rose}`); changed++; }

/* ---------------------------------------------------------------- workflow -- */
if (!flags.has('--no-workflow')) {
  const dest = path.join(target, '.github', 'workflows', 'build-android.yml');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(WORKFLOW, dest);
  console.log('  wrote  .github/workflows/build-android.yml');
  changed++;
}

console.log(`\nDone - ${changed} changes. Next:`);
console.log(`  cd ${target}`);
console.log('  git checkout -b rebrand/' + SCHEME + ' && git add -A');
console.log('  git commit -m "Rebrand the app to ' + NAME + '"');
console.log('  git push -u origin rebrand/' + SCHEME);
console.log('\nThen push the branch and let GitHub Actions build the APK (Actions -> Build Android APK -> Run workflow).');
