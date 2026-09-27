/**
 * BaeLink brand system - the single source of truth for colours, the logo mark
 * and the wordmark. Everything under src/main/resources/static (icons, favicon,
 * PWA splash, Open Graph card, README screenshots) is generated from these
 * builders by ../build-assets.mjs, so restyling the brand only happens here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..', '..');
export const STATIC = path.join(ROOT, 'src', 'main', 'resources', 'static');
export const IMG = path.join(STATIC, 'img');
export const FONT_DIR = path.join(STATIC, 'fonts', 'Montserrat');

export const BRAND = {
  name: 'BaeLink',
  rose: '#FF3D68',
  roseDark: '#D81E4C',
  violet: '#7C5CFF',
  ink: '#12121A',
  paper: '#FFFFFF',
  tagline: 'Meet new, exciting people!',
  tagline2: '100% free, no ads',
};

/* ------------------------------------------------------------------ mark --- */

/**
 * The mark: a geometric heart split down the middle by an interlocking seam,
 * so the two halves read as two links of a chain joining together.
 * 64x64 grid, flat colour, no strokes - survives being drawn at 16px.
 */
export const MARK_VIEWBOX = 64;

export function markSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${BRAND.name}">
  <defs>
    <clipPath id="baelink-heart">
      <path d="M32 57C32 57 5 39 5 23C5 14.5 11.5 8 20.5 8C26 8 30 11 32 14.5C34 11 38 8 43.5 8C52.5 8 59 14.5 59 23C59 39 32 57 32 57Z"/>
    </clipPath>
  </defs>
  <g clip-path="url(#baelink-heart)">
    <rect width="64" height="64" fill="${BRAND.rose}"/>
    <path d="M32 2C41 11 23 19 32 30C41 41 23 49 32 62L64 62L64 2Z" fill="${BRAND.violet}"/>
  </g>
</svg>
`;
}

/** The mark alone, as an SVG fragment scaled to `size` and centred in `box`. */
export function markFragment({ size = 64, x = 0, y = 0 } = {}) {
  const s = size / MARK_VIEWBOX;
  return `<g transform="translate(${x} ${y}) scale(${s})">
      <defs>
        <clipPath id="baelink-heart-${size}-${x}-${y}">
          <path d="M32 57C32 57 5 39 5 23C5 14.5 11.5 8 20.5 8C26 8 30 11 32 14.5C34 11 38 8 43.5 8C52.5 8 59 14.5 59 23C59 39 32 57 32 57Z"/>
        </clipPath>
      </defs>
      <g clip-path="url(#baelink-heart-${size}-${x}-${y})">
        <rect width="64" height="64" fill="${BRAND.rose}"/>
        <path d="M32 2C41 11 23 19 32 30C41 41 23 49 32 62L64 62L64 2Z" fill="${BRAND.violet}"/>
      </g>
    </g>`;
}

/* -------------------------------------------------------------- wordmark --- */

const TRACKING = -0.022; // em, pulls "Bae" and "Link" together

const WEIGHTS = {
  regular: 'Montserrat-Regular.ttf',
  medium: 'Montserrat-Medium.ttf',
  semibold: 'Montserrat-SemiBold.ttf',
  bold: 'Montserrat-Bold.ttf',
  extrabold: 'Montserrat-ExtraBold.ttf',
};

const fontCache = new Map();
function loadFont(weight = 'extrabold') {
  if (!fontCache.has(weight)) {
    const buf = fs.readFileSync(path.join(FONT_DIR, WEIGHTS[weight] ?? WEIGHTS.extrabold));
    fontCache.set(weight, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return fontCache.get(weight);
}

/** Cap height in px for a given font size (used to align mark and wordmark). */
export function capHeight(size, weight = 'extrabold') {
  const f = loadFont(weight);
  return ((f.tables.os2.sCapHeight ?? 700) / f.unitsPerEm) * size;
}

/**
 * Any string as font-independent outlines. `align: 'left' | 'center' | 'right'`
 * is resolved against `x`.
 */
export function textFragment(text, {
  size = 32, x = 0, y = 0, color = BRAND.ink, weight = 'regular', tracking = 0, align = 'left', opacity = 1,
} = {}) {
  const f = loadFont(weight);
  const width = f.getAdvanceWidth(text, size) + tracking * size * Math.max(0, text.length - 1);
  const originX = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  let cursor = originX;
  const paths = [];
  for (const ch of text) {
    paths.push(`<path d="${f.getPath(ch, cursor, 0, size).toPathData(2)}"/>`);
    cursor += f.getAdvanceWidth(ch, size) + tracking * size;
  }
  return {
    width,
    height: capHeight(size, weight),
    svg: `<g transform="translate(0 ${y + capHeight(size, weight)})" fill="${color}"${opacity !== 1 ? ` fill-opacity="${opacity}"` : ''}>${paths.join('')}</g>`,
  };
}

/** Advance width of a string, including tracking, in px. */
export function measureText(text, size, weight = 'regular', tracking = 0) {
  const f = loadFont(weight);
  return f.getAdvanceWidth(text, size) + tracking * size * Math.max(0, text.length - 1);
}

/** Greedy word wrap. Returns { lines, width } where width is the widest line. */
export function wrapText(text, maxWidth, { size = 16, weight = 'regular', tracking = 0 } = {}) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measureText(candidate, size, weight, tracking) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return { lines, width: Math.max(0, ...lines.map((l) => measureText(l, size, weight, tracking))) };
}

/**
 * "Bae" + "Link" as outlines (font independent), split so the two halves can be
 * coloured separately. Returns the fragment plus its advance width.
 */
export function wordmarkFragment({ size = 100, x = 0, y = 0, colorBae = BRAND.ink, colorLink = BRAND.rose } = {}) {
  const f = loadFont('extrabold');
  const fontSize = size;
  const cap = capHeight(fontSize);
  const parts = [
    { text: 'Bae', fill: colorBae },
    { text: 'Link', fill: colorLink },
  ];
  let cursor = 0;
  const out = [];
  for (const part of parts) {
    const d = f.getPath(part.text, cursor, 0, fontSize).toPathData(2);
    out.push(`<path d="${d}" fill="${part.fill}"/>`);
    cursor += f.getAdvanceWidth(part.text, fontSize) + TRACKING * fontSize;
  }
  const width = cursor - TRACKING * fontSize;
  return {
    width,
    height: cap,
    svg: `<g transform="translate(${x} ${y + cap})">${out.join('')}</g>`,
  };
}

/* ---------------------------------------------------------------- lockup --- */

/**
 * Horizontal lockup: mark + wordmark.
 * `variant`: 'light' (ink wordmark on light backgrounds), 'dark' (white
 * wordmark on dark backgrounds), 'mono' (all white, for brand-coloured fills).
 */
export function lockupContent({ variant = 'light', markSize = 64, gapRatio = 0.30, x = 0, y = 0 } = {}) {
  // Wordmark is sized so the mark sits at ~1.45x the cap height: small enough
  // that the wordmark still leads, big enough to read at icon sizes.
  const wordSize = markSize;
  const cap = capHeight(wordSize);
  const gap = markSize * gapRatio;
  const markY = y + (cap - markSize) / 2;
  const mark = markFragment({ size: markSize, x, y: markY });
  const colors =
    variant === 'dark' ? { colorBae: BRAND.paper, colorLink: BRAND.rose } :
    variant === 'mono' ? { colorBae: BRAND.paper, colorLink: BRAND.paper } :
    { colorBae: BRAND.ink, colorLink: BRAND.rose };
  const word = wordmarkFragment({ size: wordSize, x: x + markSize + gap, y, ...colors });
  const top = Math.min(y, markY);
  const bottom = Math.max(y + cap, markY + markSize);
  return {
    svg: mark + word.svg,
    width: markSize + gap + word.width,
    height: bottom - top,
    top,
    bottom,
  };
}

/** The mark size that makes a lockup exactly `targetWidth` wide. */
export function lockupMarkSizeForWidth(targetWidth, { variant = 'light', gapRatio = 0.30 } = {}) {
  const unitWidth = lockupContent({ variant, markSize: 100, gapRatio }).width / 100;
  return targetWidth / unitWidth;
}

export function lockupSvg({ variant = 'light', markSize = 64, gapRatio = 0.30, padding = 0 } = {}) {
  const { svg, width, height, top } = lockupContent({ variant, markSize, gapRatio });
  return {
    width,
    height,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(-padding)} ${round(top - padding)} ${round(width + padding * 2)} ${round(height + padding * 2)}" ` +
      `width="${round(width + padding * 2)}" height="${round(height + padding * 2)}" role="img" aria-label="${BRAND.name}">\n` +
      `  <title>${BRAND.name}</title>\n  ${svg}\n</svg>\n`,
  };
}

/** The mark centred in a square canvas, optionally on a solid tile. */
export function iconSvg({ size = 512, markRatio = 0.92, background = null, radius = 0 } = {}) {
  const markSize = size * markRatio;
  const mark = markFragment({ size: markSize, x: (size - markSize) / 2, y: (size - markSize) / 2 });
  const bg = background
    ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${BRAND.name}">\n  <title>${BRAND.name}</title>\n  ${bg}\n  ${mark}\n</svg>\n`;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/** Standalone svg documents for the repository (source files, not rendered). */
export function logoSvg(variant = 'light') {
  return lockupSvg({ variant, markSize: 64, padding: 8 }).svg;
}
