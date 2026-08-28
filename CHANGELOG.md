# Changelog

All notable changes to the **Oops!** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.3-seo] - 2026-08-28

### 🔍 Long-Term Search Engine Optimization (SEO) Foundation
- **2.5D Puzzle Platformer Semantic Positioning**: Reframed website content around search intent for free 2.5D puzzle platformers, tricky trap puzzles, and browser-based platform puzzle games.
- **Indexable Multi-Page Architecture**: Established clear crawl paths between the main content portal (`/`) and dedicated gameplay environment (`/play`).
- **Canonical URLs**: Implemented authoritative `<link rel="canonical">` across all 5 indexable routes (`/`, `/play`, `/about`, `/privacy`, `/terms`) matching Vercel Clean URLs.
- **Sitemap & Robots**: Created XML sitemap (`sitemap.xml`) and crawl directives (`robots.txt`) ensuring complete search engine discoverability.
- **Schema.org Structured Data (JSON-LD)**:
  - Added `WebSite` and `VideoGame` schema declaring OOPS! as a free browser-based single-player 2.5D puzzle platformer.
  - Added `FAQPage` schema on homepage matching the 6 player-focused Q&As.
  - Added `BreadcrumbList` schema across `/play`, `/about`, `/privacy`, and `/terms`.
- **Image & Content SEO**: Enhanced screenshot alt text with rich puzzle descriptions, explicit image dimensions, and descriptive internal anchor links.
- **Phaser 3 & World 1 Preservation**: 100% preservation of all 30 handcrafted levels, 2.5D rendering pipeline, and working 7-death rewarded-ad monetization.

---

## [1.0.3] - 2026-08-28

### 🌟 Stable Baseline Release
- **World 1 Frozen Baseline**: All 30 handcrafted levels (Levels 1–30, indices 0–29) in World 1 (Desert Ruins) verified and frozen as the permanent baseline.
- **Phaser 3 & 2.5D Architecture Preserved**: Full preservation of Phaser 3.80.1 Arcade Physics and 2.5D multi-layer parallax depth, platform bevel extrusions, 3D faceted danger spikes, 3-part depth exit portals, and animated crushers.
- **Monetization & Rewarded Ad Integrity**:
  - Preserved Google H5 Games Ads / Placement API integration (`ca-pub-7942277005068512`).
  - Preserved 7-death rewarded level-skip offer modal with one-time appearance logic.
  - Preserved persistent `[ 📺 SKIP LEVEL ]` unlock on decline across mobile deck bar and in-game HUD.
  - Verified clean level progression and death count reset upon rewarded level skip.
  - Verified `ads.txt` live compliance on Vercel deployment.
- **Mobile & Responsive Verification**:
  - Verified responsive scaling across desktop, tablet, mobile portrait, and mobile landscape viewports without forced orientation locks.
  - Verified mobile touch gamepad with multi-touch directional sliding, jump, quick restart, and deck bar navigation.
- **Documentation & Standards Update**:
  - Completely overhauled `AGENTS.md` to accurately reflect Phaser 3, 2.5D visual depth, 30-level World 1 frozen baseline, and development guidelines.
  - Synchronized `package.json`, `package-lock.json`, `game.js`, `index.html`, and `README.md` to version `1.0.3` / `v1.03`.
  - Added this comprehensive `CHANGELOG.md`.

---

## [1.0.2] - 2026-08-26

### 🎨 Visuals & Monetization Update
- Integrated official Google AdSense H5 Games Ads SDK and `ads.txt`.
- Implemented 7-death rewarded-ad offer popup and level-skip system.
- Upgraded visual presentation to 2.5D stylized visuals with real-time parallax scrolling.
- Expanded World 1 from 10 to 30 individually handcrafted stages.
- Added AdSense compliance pages (`privacy.html`, `terms.html`, `about.html`).
- Added in-game player feedback & bug reporting modal.
- Fixed startup freeze by switching from external CDN loader to local engine scripts.
- Fixed `AudioEngine.sfxSpring` missing alias in `IntroScene`.
- Optimized GitHub profile presentation with 16:9 featured preview banner.

---

## [1.0.1] - 2026-08-25

### 🚀 Initial Prototype
- Initial migration to HTML5 Canvas platformer.
- 10 initial levels and core player mechanics (run, jump, die, restart).
- Chiptune Web Audio synthesis engine.
- Basic mobile touch controls.
