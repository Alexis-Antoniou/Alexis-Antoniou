# Alexis Antoniou: Personal Portfolio

![Performance 100](https://img.shields.io/badge/Lighthouse_Performance-100-brightgreen?logo=lighthouse&logoColor=white)
![Accessibility 100](https://img.shields.io/badge/Lighthouse_Accessibility-100-brightgreen?logo=lighthouse&logoColor=white)
![Best Practices 100](https://img.shields.io/badge/Lighthouse_Best_Practices-100-brightgreen?logo=lighthouse&logoColor=white)
![SEO 100](https://img.shields.io/badge/Lighthouse_SEO-100-brightgreen?logo=lighthouse&logoColor=white)

A handwritten, single-page portfolio for an engineering professional specialising in atomic force microscopy and semiconductor metrology tooling. Bundled with a small canvas game that dramatises a day on the fab floor.

**Live site:** [alexis-antoniou.github.io/Alexis-Antoniou](https://alexis-antoniou.github.io/Alexis-Antoniou/)
**Licence:** [MIT](./LICENSE)

> **Lighthouse note** - the badges above show target scores. To verify on your own machine: open the live site in Chrome → DevTools (F12) → Lighthouse tab → Analyze. Lighthouse runs four audits (Performance, Accessibility, Best Practices, SEO) and scores each 0–100. Re-run after every meaningful change. The CI-friendly variant is the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) (`npm i -g lighthouse && lighthouse https://alexis-antoniou.github.io/Alexis-Antoniou/`). Update the badge numbers above if your real scores differ; pinning a number you can't reproduce is worse than no badge.

---

## What's here

| File | What it is |
| --- | --- |
| `index.html` | Portfolio entry point: hero, about, projects, skills, experience, education, contact |
| `styles.css` | All site styling, split into clearly-labelled sections |
| `main.js` | Hero canvas, scroll reveals, tilt cards, lazy video, nav |
| `game.html` | Canvas-game shell, "Fab Floor: Service Call" |
| `game.css`  | Game styling (extracted from `game.html`) |
| `game.js`   | Game logic - tile world, sprites, audio, scenes |
| `assets/` | Screen recordings, stills, and supporting media |
| `sitemap.xml` / `robots.txt` | Search indexing |

## Running locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Tech stack

**Site:** vanilla HTML, CSS, and JavaScript. No framework, no bundler, no tracking. Google Fonts is the only external dependency. Canvas for the hero particle field, IntersectionObserver for scroll reveals and lazy video.

**Game:** single-file HTML5 canvas, WebAudio-generated SFX, hand-written 4-frame walk cycle, tile-based camera. No assets loaded at runtime.

## A note on confidentiality

The projects shown on the site are real tools built for a live commercial semiconductor metrology environment. Screen recordings and descriptions are the public-safe surface of that work. Underlying measurement data, customer names, and specific performance figures are covered by confidentiality obligations. The MIT licence on this repository applies to the portfolio site code itself, not to the tools depicted in the media assets.

## Accessibility

The site is built to common WCAG 2.1 AA expectations:

- Skip-to-content link and semantic landmarks
- `prefers-reduced-motion` disables every non-essential animation
- `:focus-visible` styling on all interactive elements
- AA-contrast typography throughout
- ARIA on the mobile nav toggle and decorative SVGs
- `<noscript>` fallback with core content intact

## Performance

- External CSS and JS so the browser can cache across page loads
- Project videos lazy-load via IntersectionObserver and pause when offscreen or the tab is hidden
- Hero canvas pauses when the hero is offscreen
- `preload="metadata"` on above-the-fold video, `preload="none"` below
- Event delegation for tilt cards, one listener instead of dozens
- Inline SVG favicon (zero extra requests)

## Contact

`antoniou.a.alexis@gmail.com` · [LinkedIn](https://www.linkedin.com/in/alexis-antoniou/)
