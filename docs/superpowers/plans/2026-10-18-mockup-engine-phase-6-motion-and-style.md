# Mockup Engine Phase 6 Implementation Plan (motion, style, sample video, reflow and rhythm gates)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the reference site demonstrably more elegant and alive without leaving the bylaws' constraints: visible scroll reveals, smooth scrolling, smooth overlays and back-to-top, button and card micro-interactions, a quieter and richer visual layer, a self-hosted sample video, one written rhythm scale enforced by a gate, a reflow gate that proves no page scrolls horizontally at phone widths, and a design document that would make a restart land this look first time.

**Architecture:** Motion stays compositor-only and `motion-safe:`; reveals stay transform-only and scroll-driven (`sda:`) with the `js:` fallback, so content is never hidden. New visual layers (glows, dot grid, accent rules, hairlines) are Tailwind utilities on existing roots, no new CSS. The sample video is generated at build time (frames from the placeholder generator through sharp, encoded with `ffmpeg-static`) and played by a native `<video>` behind a facade. Two gate checks: `consistency/rhythm` (section padding, heading-group gap, grid gaps) and `a11y/reflow` (puppeteer, 320 and 375 px). `engine/DESIGN.md` holds the design intent the bylaws enforce.

**Tech Stack:** Tailwind 4.3 utilities (`starting:`, `transition-discrete`, scroll-driven animation variant `sda:`), puppeteer 25 (already present through pa11y), `ffmpeg-static` 5, sharp.

**Spec:** `docs/superpowers/specs/2026-10-17-mockup-engine-design.md` §2 (motion), §6 (feature policy); the approved design in the session (motion language, look, sample video, gates and docs).

## Global Constraints

- R-MOT-01/02/04/11: transform and opacity only, everything `motion-safe:`, nothing hidden before reveal, nothing above the fold animates at load.
- R-PREC-07: `app.css` gains keyframes inside `@theme` only; no new selectors.
- R-PERF-01 budgets hold: HTML ≤ 60 KB, CSS ≤ 80 KB, JS ≤ 2 KB (enhance.js unchanged), page ≤ 300 KB; the video is `preload="none"` and not counted until play.
- Every change is visible in the reference site in en, de and ar; the gates without Lighthouse end green.
- Commit at the end of every task on `mockup-engine`.

## Review Focus

1. A reveal must never leave content invisible: partly visible sections at load keep opacity 1 and reduced-motion shows final states (T3: keyframes transform-only, build test asserts no `opacity-0` on sections).
2. A page must not scroll horizontally at 320 or 375 px in any locale (T2: `a11y/reflow` on every page).
3. Buttons must keep their 44 px target and focus ring with the new effects; the arrow nudge must mirror in RTL (T4: build test on the primary button markup).
4. The sample video must not request anything until play and must have a poster with reserved space (T6: build test on `preload="none"`, poster and `aspect-video`).
5. A section that deviates from the rhythm scale must fail `consistency/rhythm` (T2: unit test with a deviating section).

---

### Task 1: Design document, bylaws 0.4.0, tokens

**Files:** `engine/DESIGN.md` (new), `engine/bylaws/02-tokens.md` (R-TOK-11 easings, R-TOK-12 presets 12/24/32 px, R-TOK-13 keyframes `reveal`, `reveal-start`, `reveal-end`, `drop`, `scale-in`, `fade`, `rise-in` for the back-to-top), `03-layout.md` (R-LAY-02 rhythm scale with the gate `consistency/rhythm`; R-LAY-05 gate `a11y/reflow`), `05-color.md` (R-COL-02 accent also in the eyebrow rule and the footer hairline; R-COL-09 gradients: hero glow, CTA panel, stats numerals on the band, footer hairline), `06-motion.md` (R-MOT-03 budget with reveal distances, R-MOT-05 reveal pattern with `reveal-start`/`reveal-end` for alternating rows, R-MOT-06 overlays with `starting:` and backdrop, R-MOT-07 hover: lift, nudge, underline-grow, press; R-MOT-08 header shadow; new R-MOT-13 smooth scrolling and the floating back-to-top; new R-MOT-14 scroll-driven appearance), `07-components.md` (R-COMP-05 button effects; R-COMP-12 facades include the native `video` component), `15-performance.md` (R-PERF-16 video: `preload="none"`, poster, ≤ 1.5 MB per format), `17-assets.md` (R-ASSET-13 generated sample video), `19-quality-gates.md` (R-GATE-04 rhythm, R-GATE-09 reflow), `engine/CHANGELOG.md` 0.4.0, `engine/DECISIONS.md` D31–D34, `engine/site-brief/TEMPLATE.md` §4 look-and-feel rows, `engine/INDEX.md`.

- [ ] Write DESIGN.md: principles (quiet surfaces, one accent, motion that explains, nothing that hides), the rhythm scale, the motion table (what moves, how far, how long, which easing), the hover vocabulary, the hero recipe, what "pizzazz" is allowed to be, and the checklist a restart follows.
- [ ] Amend the rules above; `npm run checklists`; bylaws gate green. Commit `docs(bylaws): 0.4.0 — motion language, rhythm scale, reflow gate, sample video; DESIGN.md`.

### Task 2: `consistency/rhythm` and `a11y/reflow`

**Files:** `engine/tools/gates/consistency.js` (+ check `rhythm`), `engine/tools/gates/a11y.js` (+ check `reflow`, puppeteer at 320 and 375 px: `document.documentElement.scrollWidth <= clientWidth` at top and after scrolling to the bottom), `engine/tools/test/gate-consistency.test.js`, `engine/tools/test/gates-browser.test.js` (SMOKE).

**Interfaces:** `rhythmFindings(root) → [{message}]`: every `section[data-component]` carries one allowed padding pair (`py-16 md:py-24`, `py-12 md:py-16`, `py-16 md:py-28`, `py-12 md:py-20` for heroes, `py-12 md:py-16` page-header, `py-6` article-meta); every heading group followed by a body carries `mt-12 md:mt-16`; every `ul.grid`/`div.grid` inside a section uses `gap-6 md:gap-8` or `gap-8` (stats) or `gap-12` (two-column media). `reflowOf(page) → { width, scrollWidth, clientWidth }[]`.

- [ ] Tests: a section with `py-14` fails; a grid with `gap-5` fails; the shell's output passes. Implement; run the consistency gate on the reference site; commit `feat(gates): consistency/rhythm and a11y/reflow`.

### Task 3: Motion — reveals, smooth scroll, back to top, overlays, header

**Files:** `engine/theme/app.css` (keyframes), `engine/tools/lib/theme.js` (presets), `engine/catalog/sections/_shell.njk` (`revealClasses(on, dir)`, stagger up to 8), `sections/feature-rows.njk` (alternate `reveal-start`/`reveal-end`), `sections/_grid.njk` (staggered items), `templates/base.njk` (`motion-safe:scroll-smooth` on html, floating back-to-top), `components/back-to-top.njk` (floating variant with `sda:[animation-timeline:scroll()]` fade-in after 60 vh, `href="#top"`), `components/header.njk` (shadow on scroll via `sda:`), `components/dialog.njk`, `components/drawer.njk`, `components/mobile-drawer.njk`, `components/nav-menu.njk`, `components/locale-switcher.njk`, `components/video-facade.njk` (entrance with `starting:open:opacity-0 starting:open:scale-95`, backdrop `backdrop:backdrop-blur-sm` fade).

- [ ] Build test: html carries `motion-safe:scroll-smooth`; a below-fold section carries the reveal classes and no `opacity-0`; the floating back-to-top exists with the scroll timeline; dialogs carry `starting:`. Implement; commit `feat(motion): fly-in reveals, smooth scroll, floating back to top, overlay entrances, header shadow`.

### Task 4: Buttons, cards, links, FAQ

**Files:** `primitives/button.njk` (group, arrow nudge `group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5`, lift `motion-safe:hover:-translate-y-px hover:shadow-md`, press `active:translate-y-0 active:scale-[0.98]`, link underline grow via `after:`), `components/card.njk` (lift, `hover:border-brand-300`, icon tile `group-hover:scale-105`, arrow nudge), `components/accordion.njk` + `sections/faq.njk` (chevron `group-open:rotate-180 motion-safe:transition-transform`), `components/nav-menu.njk` (item underline grow), `sections/_shell.njk` CTA with arrow.

- [ ] Build test: primary button markup contains the nudge classes and the arrow icon; RTL page contains the mirrored nudge. Implement; commit `feat(catalog): button, card, link and disclosure micro-interactions`.

### Task 5: Visual layer

**Files:** `sections/hero.njk` (glow blobs `bg-brand-200/40 blur-3xl`, dot grid via `bg-[radial-gradient(...)]`? — no: use `bg-size`/`bg-position` utilities on a `before:` pseudo with a two-colour radial gradient from role tokens; media frame `ring-1 ring-line shadow-xl rounded-2xl`), `sections/_shell.njk` (eyebrow accent rule `before:` 2×12 px `bg-accent-600`), `components/stat.njk` (gradient numerals on the band: `bg-linear-to-br from-ink-inverse to-brand-100 bg-clip-text text-transparent`), `components/testimonial.njk` (decorative quote mark `text-brand-100`), `sections/cta-band.njk` (inset `rounded-2xl` panel with radial highlight), `sections/logo-cloud.njk` (muted wordmarks, `hover:text-ink-brand`), `components/footer.njk` (hairline `bg-linear-to-r from-brand-600 to-accent-600 h-px`), `components/picture` frames in feature rows.

- [ ] Build; consistency and contrast tests green (theme contrast pairs extended for gradient endpoints). Commit `feat(style): hero glow and grid, eyebrow rule, gradient numerals, quote mark, CTA panel, footer hairline`.

### Task 6: Sample video

**Files:** `package.json` (`ffmpeg-static`), `engine/tools/build-video.js` (`generateVideo({ slug, hue, accentHue, seconds: 8, fps: 24, width: 1280 }) → { mp4, webm, poster }` from animated placeholder shapes; cached by slug in `dist/<site>/assets/video/`), `engine/tools/build.js` (runs for every `data-video` the pages declare), `components/video.njk` (native `<video preload="none" poster controls playsinline>` behind a play facade; `command`-free: a `<details>`? No: the facade is a `<button>` that swaps via `enhance.js`? JS budget — instead the `<video>` is rendered with `controls` and the poster; no facade script), `sections/hero.njk` video variant uses it, reference home hero (en/de/ar `pages.json` `hero-home` → `split` with `video`), `engine/tools/test/build-video.test.js`.

- [ ] Tests: generateVideo writes mp4, webm and poster under 1.5 MB each; the hero markup has `preload="none"`, poster and `aspect-video`. Implement; commit `feat(video): generated sample clip and native video component; home hero with video`.

### Task 7: Rebuild, gate, check, record

- [ ] `npm run build`, `npm run gate -- --skip lighthouse` green on every page; browser check at 375, 1024 and 1280 px in en and ar (reveals, buttons, dialog, back to top, video plays); `reports/latest.md` committed; ledger closed; final message with rulings and deferred items.
