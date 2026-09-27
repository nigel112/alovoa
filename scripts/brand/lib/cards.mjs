/** Social share card (Open Graph) and the iOS PWA splash screen. */
import { BRAND, lockupContent, lockupMarkSizeForWidth, textFragment } from './brand.mjs';
import { circle, num, pill, rect } from './draw.mjs';

export const SHARE = { w: 1200, h: 648 };
export const SPLASH = { w: 700, h: 762 };

function doc(w, h, body, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
  ${body.join('\n  ')}
</svg>
`;
}

/** 1200x648 link preview, shown when BaeLink is shared anywhere. */
export function shareCardSvg() {
  const parts = [
    rect({ x: 0, y: 0, w: SHARE.w, h: SHARE.h, fill: BRAND.ink }),
    circle({ cx: 1090, cy: 90, r: 250, fill: BRAND.rose, opacity: 0.20 }),
    circle({ cx: 1170, cy: 560, r: 250, fill: BRAND.violet, opacity: 0.18 }),
    `<g transform="translate(880 300) rotate(18)" opacity="0.30">
      <rect x="-90" y="-90" width="180" height="180" rx="44" fill="none" stroke="${BRAND.rose}" stroke-width="16"/>
    </g>`,
    `<g transform="translate(1010 430) rotate(-14)" opacity="0.30">
      <rect x="-58" y="-58" width="116" height="116" rx="30" fill="none" stroke="${BRAND.violet}" stroke-width="16"/>
    </g>`,
  ];

  const lock = lockupContent({ variant: 'dark', markSize: 116, x: 96, y: 140 });
  parts.push(lock.svg);
  parts.push(textFragment(BRAND.tagline, {
    size: 58, weight: 'semibold', color: BRAND.paper, x: 96, y: 368,
  }).svg);
  parts.push(textFragment(BRAND.tagline2, {
    size: 30, weight: 'medium', color: BRAND.rose, x: 96, y: 452,
  }).svg);

  let cx = 96;
  for (const label of ['No ads', 'No tracking', 'Open source']) {
    const chip = pill(label, {
      x: cx, y: 508, size: 20, weight: 'medium', height: 50, paddingX: 24,
      fill: 'none', stroke: 'rgba(255,255,255,0.28)', textColor: BRAND.paper,
    });
    parts.push(chip.svg);
    cx += chip.width + 14;
  }
  return doc(SHARE.w, SHARE.h, parts, `${BRAND.name} - ${BRAND.tagline}`);
}

/** 700x762 splash shown while the installed iOS web app loads. */
export function splashSvg() {
  const markSize = lockupMarkSizeForWidth(SPLASH.w - 120);
  const lockWidth = lockupContent({ variant: 'dark', markSize }).width;
  const parts = [
    rect({ x: 0, y: 0, w: SPLASH.w, h: SPLASH.h, fill: BRAND.ink }),
    circle({ cx: 600, cy: 130, r: 220, fill: BRAND.rose, opacity: 0.18 }),
    circle({ cx: 90, cy: 700, r: 240, fill: BRAND.violet, opacity: 0.16 }),
    lockupContent({ variant: 'dark', markSize, x: (SPLASH.w - lockWidth) / 2, y: 286 }).svg,
    textFragment(BRAND.tagline, {
      size: 30, weight: 'semibold', color: BRAND.paper, x: SPLASH.w / 2, y: 470, align: 'center',
    }).svg,
    textFragment(BRAND.tagline2, {
      size: 20, weight: 'medium', color: BRAND.rose, x: SPLASH.w / 2, y: 522, align: 'center',
    }).svg,
  ];
  return doc(SPLASH.w, SPLASH.h, parts, `${BRAND.name} splash screen`);
}

export function num2(n) { return num(n); }
