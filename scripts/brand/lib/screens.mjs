/**
 * README screenshots. Each function returns a self-contained SVG document that
 * is rasterised by ../build-assets.mjs. They are stylised mock-ups of the app
 * screens (landing page, discover, chat) built from the same palette, fonts and
 * sample photos the app itself ships, so the docs match the product.
 */
import {
  BRAND, capHeight, lockupContent, measureText, textFragment, wrapText,
} from './brand.mjs';
import {
  bubble, circle, clipRect, glyph, line, num, photoBox, pill, rect,
} from './draw.mjs';

export const SCREEN = { w: 1280, h: 800 };
const BG = '#121212';
const PANEL = '#171717';
const CARD = '#1C1C1C';
const FIELD = '#1F1F1F';
const HAIRLINE = '#262626';
const WHITE = '#FFFFFF';

function doc(defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCREEN.w} ${SCREEN.h}" width="${SCREEN.w}" height="${SCREEN.h}" role="img" aria-label="${BRAND.name} app screenshots">
  <defs>${defs.join('')}</defs>
  ${body.join('\n  ')}
</svg>
`;
}

function backdrop() {
  return [
    rect({ x: 0, y: 0, w: SCREEN.w, h: SCREEN.h, fill: BG }),
    circle({ cx: 180, cy: 90, r: 300, fill: BRAND.rose, opacity: 0.10 }),
    circle({ cx: 1150, cy: 200, r: 260, fill: BRAND.violet, opacity: 0.10 }),
  ];
}

/** Top bar: wordmark on the left, account actions on the right. */
function nav({ active = null, avatar = null } = {}) {
  const parts = [lockupContent({ variant: 'dark', markSize: 34, x: 48, y: 30 }).svg];
  if (active) {
    const links = ['Discover', 'Likes', 'Messages'];
    let cursor = 620;
    for (const l of links) {
      const isActive = l === active;
      parts.push(textFragment(l, {
        size: 15, weight: isActive ? 'semibold' : 'medium', color: isActive ? WHITE : WHITE,
        opacity: isActive ? 1 : 0.55, x: cursor, y: 38,
      }).svg);
      const w = measureText(l, 15, isActive ? 'semibold' : 'medium');
      if (isActive) parts.push(rect({ x: cursor, y: 66, w, h: 3, r: 1.5, fill: BRAND.rose }));
      cursor += w + 38;
    }
  }
  const right = SCREEN.w - 48;
  if (avatar) {
    parts.push(`<g clip-path="url(#navAvatar)">${photoBox(avatar, { x: right - 40, y: 28, w: 40, h: 40 })}</g>`);
    parts.push(circle({ cx: right - 20, cy: 48, r: 20, stroke: BRAND.rose, sw: 2, fill: 'none' }));
  } else {
    const signup = pill('Sign up', {
      x: right, y: 30, size: 15, weight: 'semibold', fill: BRAND.rose, height: 40, paddingX: 20, align: 'right',
    });
    const login = pill('Log in', {
      x: right - signup.width - 16, y: 30, size: 15, weight: 'semibold', fill: 'none',
      stroke: 'rgba(255,255,255,0.25)', height: 40, paddingX: 20, align: 'right',
    });
    parts.push(signup.svg, login.svg);
  }
  return parts;
}

/* --------------------------------------------------------------- landing --- */

export function landingSvg() {
  const defs = [];
  const parts = backdrop();
  parts.push(...nav());

  const heroWidth = lockupContent({ variant: 'dark', markSize: 124 }).width;
  parts.push(lockupContent({ variant: 'dark', markSize: 124, x: (SCREEN.w - heroWidth) / 2, y: 148 }).svg);
  parts.push(textFragment(BRAND.tagline, {
    size: 44, weight: 'semibold', color: WHITE, x: SCREEN.w / 2, y: 312, align: 'center',
  }).svg);
  parts.push(textFragment(BRAND.tagline2, {
    size: 24, weight: 'medium', color: WHITE, opacity: 0.6, x: SCREEN.w / 2, y: 370, align: 'center',
  }).svg);
  parts.push(pill('Sign up now', {
    x: SCREEN.w / 2, y: 422, size: 19, weight: 'bold', fill: BRAND.rose,
    paddingX: 36, height: 58, align: 'center',
  }).svg);
  parts.push(textFragment('All photos are of models and used for illustrative purposes only', {
    size: 14, color: WHITE, opacity: 0.4, x: SCREEN.w / 2, y: 504, align: 'center',
  }).svg);

  const cards = [
    {
      icon: 'heart', title: 'Forever free',
      body: 'Every feature is free for everyone. No paywalls, no boosts, no super-likes.',
    },
    {
      icon: 'shield', title: 'Private and secure',
      body: 'Your most sensitive data is encrypted. We never sell it to anyone.',
    },
    {
      icon: 'noads', title: 'Ad-free',
      body: 'No trackers and no banners. Your experience always comes first.',
    },
  ];
  const cw = 352, ch = 190, gap = 24;
  const startX = (SCREEN.w - (cards.length * cw + (cards.length - 1) * gap)) / 2;
  cards.forEach((c, i) => {
    const x = startX + i * (cw + gap);
    const y = 556;
    parts.push(rect({ x, y, w: cw, h: ch, r: 18, fill: CARD }));
    parts.push(glyph(c.icon, { x: x + 26, y: y + 26, size: 44, color: BRAND.rose, tile: BRAND.rose, tileOpacity: 0.16 }));
    parts.push(textFragment(c.title, { size: 20, weight: 'semibold', color: WHITE, x: x + 26, y: y + 92 }).svg);
    wrapText(c.body, cw - 52, { size: 14 }).lines.forEach((ln, j) => {
      parts.push(textFragment(ln, { size: 14, color: WHITE, opacity: 0.55, x: x + 26, y: y + 126 + j * 21 }).svg);
    });
  });

  return doc(defs, parts);
}

/* -------------------------------------------------------------- discover --- */

const PROFILES = [
  { photo: 1, name: 'Mia, 24', place: 'Harare · 3 km', bio: 'Coffee, sunsets and good conversation.' },
  { photo: 2, name: 'Leo, 28', place: 'Borrowdale · 6 km', bio: 'Gym, hiking and terrible puns.' },
  { photo: 3, name: 'Ava, 26', place: 'Avondale · 4 km', bio: 'Books, wine and slow Sundays.' },
  { photo: 4, name: 'Noah, 30', place: 'Mount Pleasant · 9 km', bio: 'Live music and weekend road trips.' },
  { photo: 5, name: 'Zoe, 25', place: ' Highlands · 5 km', bio: 'Photography, plants and cooking.' },
  { photo: 6, name: 'Kai, 27', place: 'Eastlea · 7 km', bio: 'Cycling, chess and strong coffee.' },
];

export function discoverSvg() {
  const defs = [];
  const parts = backdrop();
  parts.push(...nav({ active: 'Discover', avatar: 7 }));

  // filter row
  const filters = [
    { label: 'All', active: true },
    { label: 'Dating', active: false },
    { label: 'Friendship', active: false },
    { label: '18 - 30', active: false },
    { label: 'Within 25 km', active: false },
  ];
  let fx = 48;
  for (const f of filters) {
    const chip = pill(f.label, {
      x: fx, y: 96, size: 14, weight: 'medium', height: 40, paddingX: 18,
      fill: f.active ? BRAND.rose : 'none', stroke: f.active ? null : 'rgba(255,255,255,0.16)',
      textColor: f.active ? WHITE : WHITE, opacity: f.active ? 1 : 1,
    });
    if (!f.active) {
      // dim the label on outlined chips
      parts.push(rect({ x: fx, y: 96, w: chip.width, h: 40, r: 20, fill: 'none', stroke: 'rgba(255,255,255,0.16)' }));
      parts.push(textFragment(f.label, {
        size: 14, weight: 'medium', color: WHITE, opacity: 0.6, x: fx + 18, y: 108,
      }).svg);
    } else {
      parts.push(chip.svg);
    }
    fx += chip.width + 12;
  }
  parts.push(pill('Filters', {
    x: SCREEN.w - 48, y: 96, size: 14, weight: 'semibold', height: 40, paddingX: 20,
    fill: 'none', stroke: BRAND.rose, textColor: BRAND.rose, align: 'right',
  }).svg);

  // profile grid
  const cw = 352, ch = 290, gapX = 24, gapY = 28;
  const startX = (SCREEN.w - (3 * cw + 2 * gapX)) / 2;
  PROFILES.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cw + gapX);
    const y = 168 + row * (ch + gapY);
    const clipId = `cardPhoto${i}`;
    defs.push(clipRect(clipId, { x, y, w: cw, h: ch, r: 18 }));
    parts.push(rect({ x, y, w: cw, h: ch, r: 18, fill: CARD }));
    parts.push(photoBox(p.photo, { x, y, w: cw, h: 196, clipId }));
    parts.push(rect({ x, y: y + 118, w: cw, h: 78, fill: '#000000', opacity: 0.55, clipId: undefined }));
    parts.push(textFragment(p.name, { size: 21, weight: 'semibold', color: WHITE, x: x + 20, y: y + 142 }).svg);
    parts.push(textFragment(p.place, { size: 13, weight: 'medium', color: WHITE, opacity: 0.7, x: x + 20, y: y + 172 }).svg);
    parts.push(textFragment(p.bio, { size: 14, color: WHITE, opacity: 0.55, x: x + 20, y: y + 226 }).svg);

    // action buttons
    const cy = y + 252;
    parts.push(circle({ cx: x + 252, cy, r: 22, fill: 'none', stroke: 'rgba(255,255,255,0.22)', sw: 2 }));
    parts.push(line({ x1: x + 244, y1: cy - 8, x2: x + 260, y2: cy + 8, stroke: WHITE, sw: 2.4, opacity: 0.75 }));
    parts.push(line({ x1: x + 260, y1: cy - 8, x2: x + 244, y2: cy + 8, stroke: WHITE, sw: 2.4, opacity: 0.75 }));
    parts.push(circle({ cx: x + 306, cy, r: 22, fill: BRAND.rose }));
    parts.push(glyph('heart', { x: x + 292, y: cy - 12, size: 24, color: WHITE }));
  });

  return doc(defs, parts);
}

/* ------------------------------------------------------------------ chat --- */

const THREAD = [
  { side: 'left', text: 'Hey! Your sunset photo is unreal.' },
  { side: 'right', text: 'Thanks! Taken at Lake Chivero last week.' },
  { side: 'left', text: 'I keep meaning to go. Worth the drive?' },
  { side: 'right', text: 'Totally. We should grab a coffee first though.' },
  { side: 'left', text: 'I would love that. Saturday?' },
];

const CONVERSATIONS = [
  { photo: 3, name: 'Ava', snippet: 'Saturday works for me!', time: '09:41', active: true },
  { photo: 1, name: 'Mia', snippet: 'That hike was beautiful', time: '08:12' },
  { photo: 4, name: 'Noah', snippet: 'Sending you the playlist', time: 'Yesterday' },
  { photo: 6, name: 'Kai', snippet: 'Rematch tonight?', time: 'Yesterday' },
  { photo: 5, name: 'Zoe', snippet: 'Thanks for the book tip', time: 'Tue' },
];

export function chatSvg() {
  const defs = [];
  const parts = [rect({ x: 0, y: 0, w: SCREEN.w, h: SCREEN.h, fill: BG })];
  const sidebarW = 360;

  // sidebar
  parts.push(rect({ x: 0, y: 0, w: sidebarW, h: SCREEN.h, fill: PANEL }));
  parts.push(lockupContent({ variant: 'dark', markSize: 30, x: 28, y: 30 }).svg);
  parts.push(rect({ x: 28, y: 78, w: sidebarW - 56, h: 44, r: 22, fill: FIELD }));
  parts.push(textFragment('Search conversations', {
    size: 14, color: WHITE, opacity: 0.4, x: 50, y: 92,
  }).svg);
  parts.push(circle({ cx: sidebarW - 58, cy: 100, r: 8, fill: 'none', stroke: WHITE, sw: 2, opacity: 0.4 }));
  parts.push(line({ x1: sidebarW - 52, y1: 106, x2: sidebarW - 46, y2: 112, stroke: WHITE, sw: 2, opacity: 0.4 }));

  CONVERSATIONS.forEach((c, i) => {
    const y = 150 + i * 78;
    if (c.active) {
      parts.push(rect({ x: 0, y: y - 14, w: sidebarW, h: 70, fill: '#202020' }));
      parts.push(rect({ x: 0, y: y - 14, w: 4, h: 70, fill: BRAND.rose }));
    }
    const clipId = `convAvatar${i}`;
    defs.push(`<clipPath id="${clipId}">${circle({ cx: 28 + 26, cy: y + 21, r: 26 })}</clipPath>`);
    parts.push(photoBox(c.photo, { x: 28, y: y - 5, w: 52, h: 52, clipId }));
    parts.push(textFragment(c.name, { size: 16, weight: 'semibold', color: WHITE, x: 96, y: y }).svg);
    parts.push(textFragment(c.snippet, {
      size: 13, color: WHITE, opacity: c.active ? 0.7 : 0.45, x: 96, y: y + 26,
    }).svg);
    parts.push(textFragment(c.time, {
      size: 11, color: WHITE, opacity: 0.35, x: sidebarW - 28, y: y + 2, align: 'right',
    }).svg);
  });

  // conversation header
  const px = sidebarW;
  parts.push(line({ x1: px, y1: 96, x2: SCREEN.w, y2: 96, stroke: HAIRLINE, sw: 1 }));
  const headClip = 'threadAvatar';
  defs.push(`<clipPath id="${headClip}">${circle({ cx: px + 52, cy: 48, r: 24 })}</clipPath>`);
  parts.push(photoBox(3, { x: px + 28, y: 24, w: 48, h: 48, clipId: headClip }));
  parts.push(textFragment('Ava', { size: 19, weight: 'semibold', color: WHITE, x: px + 92, y: 30 }).svg);
  parts.push(circle({ cx: px + 98, cy: 62, r: 4.5, fill: BRAND.rose }));
  parts.push(textFragment('Online', { size: 13, weight: 'medium', color: BRAND.rose, x: px + 110, y: 54 }).svg);

  // thread
  parts.push(textFragment('Today', {
    size: 12, weight: 'medium', color: WHITE, opacity: 0.35, x: px + (SCREEN.w - px) / 2, y: 126, align: 'center',
  }).svg);
  let y = 156;
  for (const m of THREAD) {
    const b = bubble(m.text, {
      x: m.side === 'right' ? SCREEN.w - 36 : px + 36,
      y, maxWidth: 460, size: 15,
      fill: m.side === 'right' ? BRAND.rose : FIELD,
      side: m.side,
    });
    parts.push(b.svg);
    y += b.height + 16;
  }

  // composer
  parts.push(rect({ x: px + 36, y: 700, w: 760, h: 56, r: 28, fill: FIELD }));
  parts.push(textFragment('Write a message...', {
    size: 15, color: WHITE, opacity: 0.4, x: px + 62, y: 718,
  }).svg);
  parts.push(circle({ cx: SCREEN.w - 62, cy: 728, r: 28, fill: BRAND.rose }));
  parts.push(`<path d="M${SCREEN.w - 74} 716L${SCREEN.w - 50} 728L${SCREEN.w - 74} 740L${SCREEN.w - 70} 732L${SCREEN.w - 78} 732Z" fill="${WHITE}"/>`);

  return doc(defs, parts);
}

export const SCREENS = [
  { file: 'landing.png', svg: landingSvg, alt: 'Landing page' },
  { file: 'discover.png', svg: discoverSvg, alt: 'Discover people nearby' },
  { file: 'chat.png', svg: chatSvg, alt: 'Private, encrypted chat' },
];
