#!/usr/bin/env node
/**
 * Regenerates every BaeLink brand asset from the vector masters in lib/.
 *
 *   npm install     # sharp + opentype.js (see package.json)
 *   npm run build
 *
 * Outputs (all relative to the repository root):
 *   src/main/resources/static/logo.svg                     master lockup
 *   src/main/resources/static/img/baelink-mark.svg         mark only
 *   src/main/resources/static/img/baelink-logo-dark.svg    lockup for dark UIs
 *   src/main/resources/static/img/baelink_{56,112,128}.png PWA icons
 *   src/main/resources/static/img/android-chrome-{192,512}.png
 *   src/main/resources/static/img/apple-touch-icon.png
 *   src/main/resources/static/img/icon.png
 *   src/main/resources/static/favicon.ico
 *   src/main/resources/static/img/share.png                Open Graph card
 *   src/main/resources/static/img/ios-pwa.webp             iOS PWA splash
 *   docs/screenshots/{landing,discover,chat}.png           README screenshots
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  BRAND, IMG, ROOT, STATIC, iconSvg, lockupSvg, markSvg,
} from './lib/brand.mjs';
import { shareCardSvg, splashSvg, SHARE, SPLASH } from './lib/cards.mjs';
import { SCREENS, SCREEN } from './lib/screens.mjs';
import { setPhotoSource } from './lib/draw.mjs';

const DOCS = path.join(ROOT, 'docs', 'screenshots');
const skipScreens = process.argv.includes('--skip-screens');

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  console.log(`  wrote ${path.relative(ROOT, file)}`);
}

async function svgTo(svg, file, { width, height, format = 'png', supersample = 2.4, ...options } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const density = 96 * supersample;
  let img = sharp(Buffer.from(svg), { density });
  if (width) img = img.resize(width, height, { fit: 'fill', kernel: 'lanczos3' });
  if (format === 'webp') img = img.webp({ quality: 90, ...options });
  else img = img.png({ compressionLevel: 9, effort: 10, ...options });
  await img.toFile(file);
  const { size } = fs.statSync(file);
  console.log(`  wrote ${path.relative(ROOT, file)} (${width}x${height ?? width}, ${(size / 1024).toFixed(0)} KB)`);
}

/** Minimal .ico container wrapping PNG entries (supported by every browser). */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = entries.map(({ size, buffer }) => {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);
    d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(buffer.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += buffer.length;
    return d;
  });
  return Buffer.concat([header, ...dir, ...entries.map((e) => e.buffer)]);
}

async function main() {
  console.log(`BaeLink brand assets -> ${path.relative(process.cwd(), ROOT) || '.'}`);

  // --- vector masters -------------------------------------------------------
  write(path.join(STATIC, 'logo.svg'), lockupSvg({ variant: 'light', markSize: 64, padding: 8 }).svg);
  write(path.join(IMG, 'baelink-mark.svg'), markSvg());
  write(path.join(IMG, 'baelink-logo-dark.svg'), lockupSvg({ variant: 'dark', markSize: 64, padding: 8 }).svg);

  // --- app icons (mark on transparent canvas) -------------------------------
  const transparent = [
    ['baelink_56.png', 56],
    ['baelink_112.png', 112],
    ['baelink_128.png', 128],
    ['android-chrome-192x192.png', 192],
    ['android-chrome-512x512.png', 512],
  ];
  for (const [file, size] of transparent) {
    await svgTo(iconSvg({ size, markRatio: 0.9 }), path.join(IMG, file), { width: size, height: size });
  }

  // --- icons that must be opaque (iOS / generic) ----------------------------
  await svgTo(iconSvg({ size: 180, markRatio: 0.62, background: BRAND.ink }),
    path.join(IMG, 'apple-touch-icon.png'), { width: 180, height: 180 });
  await svgTo(iconSvg({ size: 512, markRatio: 0.62, background: BRAND.ink }),
    path.join(IMG, 'icon.png'), { width: 512, height: 512 });

  // --- favicon --------------------------------------------------------------
  const faviconEntries = [];
  for (const size of [16, 24, 32, 48, 64]) {
    const buf = await sharp(Buffer.from(iconSvg({ size, markRatio: size <= 24 ? 0.96 : 0.9 })), { density: 96 * 4 })
      .resize(size, size, { fit: 'fill', kernel: 'lanczos3' })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer();
    faviconEntries.push({ size, buffer: buf });
  }
  const faviconFile = path.join(STATIC, 'favicon.ico');
  fs.writeFileSync(faviconFile, ico(faviconEntries));
  console.log(`  wrote ${path.relative(ROOT, faviconFile)} (${faviconEntries.map((e) => e.size).join('/')}px)`);

  // --- share card + PWA splash ---------------------------------------------
  await svgTo(shareCardSvg(), path.join(IMG, 'share.png'), { width: SHARE.w, height: SHARE.h });
  await svgTo(splashSvg(), path.join(IMG, 'ios-pwa.webp'), {
    width: SPLASH.w, height: SPLASH.h, format: 'webp',
  });

  // --- README screenshots ---------------------------------------------------
  if (skipScreens) {
    console.log('  (screens skipped)');
  } else {
    // Re-encode the sample photos as JPEG at screenshot resolution: the same
    // frames as PNG would make discover.png ~1 MB instead of ~200 KB.
    const photos = {};
    for (let i = 1; i <= 10; i++) {
      const jpeg = await sharp(path.join(IMG, 'profile', `${i}.png`))
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
      photos[i] = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    }
    setPhotoSource((i) => photos[i]);
    for (const screen of SCREENS) {
      const svg = screen.svg();
      await svgTo(svg, path.join(DOCS, screen.file), { width: SCREEN.w, height: SCREEN.h, supersample: 2 });
    }
  }

  // --- retired Alovoa icon names -------------------------------------------
  for (const legacy of ['alovoa_56.png', 'alovoa_112.png', 'alovoa_128.png']) {
    const file = path.join(IMG, legacy);
    if (fs.existsSync(file)) {
      fs.rmSync(file);
      console.log(`  removed ${path.relative(ROOT, file)} (replaced by baelink_* equivalents)`);
    }
  }

  console.log('Done. Remember to bump the service-worker cache version in static/sw.js.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
