# BaeLink — Store Listing Page

A pixel-faithful, production-ready recreation of a Google Play–style dating-app
listing, rebranded as **BaeLink**. Static site — no frameworks, no build step.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8123
# → http://localhost:8123
```

Append `?noanim` to skip reveal animations (useful for screenshots/QA).

## Structure

```
baelink/
├── index.html          Semantic markup: header → stats band → screenshot rail → footer
├── css/styles.css      Design tokens, layout, container-query phone panels, motion
├── js/main.js          Scroll reveals (IntersectionObserver), drag-to-scroll rail,
│                       rail progress bar, download-pill micro-interaction, toasts
├── fonts/              Montserrat (SIL OFL) — bundled, self-hosted
└── img/                App icon (SVG) + 5 AI-generated lifestyle photos
```

## Implementation notes

- **Fluid screenshot panels** — each phone is a CSS size container; all in-panel
  typography and UI scale with `cqw` units, so panels render identically at every
  viewport size (no media-query type switching).
- **Responsive** — stats band reflows 6 → 3 → 2 columns; header wraps on small
  screens; the rail becomes a snap-scrolling carousel with a synced progress bar.
- **Interactions** — reveal-on-scroll with stagger, mouse drag-to-scroll with
  click suppression, keyboard-accessible rail (arrow keys), download button with
  loading → installed states and a toast.
- **Accessibility** — semantic landmarks, focus-visible rings, `aria-live` toast,
  screen-reader labels, and full `prefers-reduced-motion` support.
- **No dependencies** — system fallbacks if fonts fail; `<noscript>` shows all
  content statically.

All photos are AI-generated and used for illustrative purposes only.
