/** Small SVG drawing helpers shared by the screenshot and card generators. */
import fs from 'node:fs';
import path from 'node:path';
import { BRAND, IMG, measureText, textFragment } from './brand.mjs';

export const num = (n) => Math.round(n * 100) / 100;

export function rect({ x = 0, y = 0, w, h, r = 0, fill = 'none', stroke = null, sw = 1, opacity = 1 }) {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<rect x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" rx="${num(r)}" fill="${fill}"${s}${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

export function circle({ cx, cy, r, fill = 'none', stroke = null, sw = 1, opacity = 1 }) {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"${s}${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

export function line({ x1, y1, x2, y2, stroke = BRAND.paper, sw = 2, opacity = 1, cap = 'round' }) {
  return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="${cap}"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
}

/** A pill/chip: rounded rect sized around a label. */
export function pill(text, {
  x = 0, y = 0, size = 16, weight = 'medium', tracking = 0,
  fill = BRAND.rose, textColor = BRAND.paper, paddingX = 22, height = null,
  stroke = null, sw = 1, align = 'left', radius = null, opacity = 1,
} = {}) {
  const tw = measureText(text, size, weight, tracking);
  const h = height ?? size * 2.3;
  const w = tw + paddingX * 2;
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const label = textFragment(text, {
    size, weight, tracking, color: textColor,
    x: left + paddingX, y: y + (h - size * 0.98) / 2 - size * 0.02,
  });
  return {
    width: w,
    height: h,
    svg: rect({ x: left, y, w, h, r: radius ?? h / 2, fill, stroke, sw, opacity }) + label.svg,
  };
}

/** A chat bubble sized around its text. */
export function bubble(text, {
  x = 0, y = 0, maxWidth = 420, size = 15, weight = 'regular', tracking = 0,
  fill = '#1F1F1F', textColor = BRAND.paper, side = 'left', opacity = 1,
} = {}) {
  const tw = Math.min(maxWidth - 32, measureText(text, size, weight, tracking));
  const w = tw + 32;
  const h = size * 2;
  const left = side === 'right' ? x - w : x;
  const label = textFragment(text, { size, weight, tracking, color: textColor, x: left + 16, y: y + (h - size) / 2 - 1 });
  return { width: w, height: h, svg: rect({ x: left, y, w, h, r: 18, fill, opacity }) + label.svg };
}

/** A plain solid-colour tile (used for adaptive icon backgrounds). */
export function solidSvg(size, fill = BRAND.ink, radius = 0) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${rect({ x: 0, y: 0, w: size, h: size, r: radius, fill })}</svg>`;
}

/** Rounded clip path around a rectangle. */
export function clipRect(id, { x = 0, y = 0, w, h, r = 0 }) {
  return `<clipPath id="${id}">${rect({ x, y, w, h, r })}</clipPath>`;
}

/* ---------------------------------------------------------------- photos --- */

/**
 * Sample profile photos as data URIs, so the generated SVGs stay self-contained.
 * build-assets.mjs installs a JPEG source (photos re-encoded at screenshot
 * resolution) which keeps the rendered PNGs small; the PNG source below is the
 * fallback used when the generators are called directly.
 */
let photoSource = null;
const photoCache = new Map();

export function setPhotoSource(fn) {
  photoSource = fn;
  photoCache.clear();
}

export function photo(i) {
  if (!photoCache.has(i)) {
    if (photoSource) photoCache.set(i, photoSource(i));
    else photoCache.set(i, `data:image/png;base64,${fs.readFileSync(path.join(IMG, 'profile', `${i}.png`)).toString('base64')}`);
  }
  return photoCache.get(i);
}

/** Draws a sample photo cropped into a box. */
export function photoBox(i, { x, y, w, h, r = 0, clipId = null, opacity = 1 } = {}) {
  const tag = `<image href="${photo(i)}" x="${num(x)}" y="${num(y)}" width="${num(w)}" height="${num(h)}" preserveAspectRatio="xMidYMid slice"${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`;
  return clipId ? `<g clip-path="url(#${clipId})">${tag}</g>` : tag;
}

/* ----------------------------------------------------------------- glyphs --- */

/** Stroked brand glyphs used on the feature cards. */
export function glyph(kind, { x = 0, y = 0, size = 44, color = BRAND.rose, tile = null, tileOpacity = 0.16 } = {}) {
  const s = size / 48;
  const paths = {
    // heart (free / made with love)
    heart: `<path d="M24 42C24 42 5 30 5 18C5 11.5 9.5 7 15.5 7C19.5 7 22.5 9 24 12C25.5 9 28.5 7 32.5 7C38.5 7 43 11.5 43 18C43 30 24 42 24 42Z" fill="none" stroke="${color}" stroke-width="4.5" stroke-linejoin="round"/>`,
    // shield (private & secure)
    shield: `<path d="M24 5L41 11.5V25C41 34 33.5 40.5 24 43.5C14.5 40.5 7 34 7 25V11.5Z" fill="none" stroke="${color}" stroke-width="4.5" stroke-linejoin="round"/><path d="M17 24L22.5 29.5L32 19" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    // crossed-out rectangle (ad-free)
    noads: `<rect x="6" y="12" width="36" height="25" rx="6" fill="none" stroke="${color}" stroke-width="4.5"/><line x1="9" y1="39" x2="39" y2="10" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>`,
    // two interlocking links (open source / connected)
    link: `<path d="M20 30L28 22" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/><rect x="6" y="16" width="20" height="14" rx="7" fill="none" stroke="${color}" stroke-width="4.5"/><rect x="22" y="18" width="20" height="14" rx="7" fill="none" stroke="${color}" stroke-width="4.5"/>`,
  }[kind];
  const bg = tile ? rect({ x, y, w: size, h: size, r: size * 0.28, fill: tile, opacity: tileOpacity }) : '';
  return bg + `<g transform="translate(${num(x)} ${num(y)}) scale(${num(s)})">${paths}</g>`;
}
