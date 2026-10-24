# Gestures: small, generic, once-per-arrival motion (design)

2026-10-24 · D66 (to be written) · research: `docs/ideas/2026-10-24-alive-motion.md`

## Intent

The owner wants the site to feel more alive, "like the home page hero", but subtle: "i dont want all kinds of things moving all the time". Then: "i dont want custom code really for each little thing, want to keep the css and stuff generic and simple low maintenance".

Agreed in brainstorming:

- **Once per arrival.** Each effect plays once when its section arrives, then is still for the rest of the page view. The one exception is a rare, capped pulse on the closing CTA panel's green glow (owner: "make the green gradient glow grow maybe pulse then pulse a little rarely").
- **Generic.** Three reusable utilities that any template opts into with a class. No per-effect code, no new script.
- **First wave:** the closing CTA panel (glow grows, then rare pulses; the primary button's arrow nudges once) and the timeline (a notch of light runs once along its line).

Success: on a page with a timeline and a CTA band, reading top to bottom, the page is still nearly all the time; two small things happen, each once, each where the eye already is. Adding or removing one later is a one-class change.

## The three utilities

All three live in `engine/theme/app.css`. Each is an `@utility` whose animation applies only inside a new custom variant, `arrived`, so templates write a plain class and never a variant.

```css
@custom-variant arrived {
  @media screen and (prefers-reduced-motion: no-preference) {
    &:where([data-revealed], [data-revealed] *) { @slot; }
  }
}
```

| Utility | Effect | Keyframes (compositor only) | Timing |
|---|---|---|---|
| `gesture-nudge` | moves toward the reading direction and back, once | `translate: 0` → `calc(3px * var(--g-dir))` → `0`; `--g-dir` is 1, and −1 under `:dir(rtl)` (set inside the utility) | 600 ms `ease-in-out`, fill `none` so it hands back to the hover nudge |
| `gesture-glow` | grows from nothing to its full size, once (revised after the owner saw it: "start with none then grow to its full size in a smooth motion") | `opacity: 0, scale: .2` → `opacity: 1, scale: 1` | 2 000 ms `ease-in-out`, 600 ms after arrival, fill `backwards` |
| `gesture-glow-repeat` | `gesture-glow`, then up to three soft pulses, then still | the arrival glow, then `glow-pulse`: rest for 90 % of a 24 s cycle, then `opacity: 1 → .7 → 1` over the last 10 %; `animation-iteration-count: 3` | pulses at about 26, 50 and 74 s after arrival, then none |
| `gesture-glint` / `gesture-glint-rare` | a slanted band of light crosses a clipped mark: once on hover or focus of its link; the rare form sweeps once 20 s after load, then every 60 s, 3 times at most | `glint`: `translate: -24px 0 → 100px 0`; `glint-rare`: the same sweep in the first 1.5 % of a 60 s cycle | 900 ms `ease-in-out`; the rare one 60 s `linear`, delay 20 s, 3 iterations |
| `gesture-trace` | a soft notch of light runs once along a line (the element is the line; its `::after` is the light) | `::after` is a strip as tall as the line, transparent with one accent band in its middle; `translate: 0 -50%` → `0 50%`, `opacity: 0 → 1 → 1 → 0` | 1 200 ms `ease-in-out`, fill `none` |

Shared rules:

- **Start.** Every gesture waits `--gesture-delay` (800 ms) after its section is marked `data-revealed`, so it begins as the entrance settles. `gesture-nudge` on the CTA arrow takes a further 400 ms, so it follows the glow.
- **Tokens.** Four animation tokens join the `@theme` list: `--animate-nudge`, `--animate-glow`, `--animate-glow-pulse` and `--animate-trace`, with their keyframes (R-TOK-13 grows from eleven to fifteen). Durations reuse `duration-1200`; the nudge's 600 ms is the one new duration, named in R-TOK-11.
- **Off switches.** Reduced motion and print never match `arrived`. No script means no `data-revealed`, so nothing plays. The motion level decides whether a template writes the class at all: two new flair booleans, `gesture` (`standard` and `expressive`) and `gestureRepeat` (`expressive` only, which turns `gesture-glow-repeat` into a plain `gesture-glow`). `calm` writes none.
- **Load.** A section already in view at load is marked `data-revealed` by the script's first report, so its gesture plays about 0.8 s after load. That is after first paint and never in the hero, which has no gestures. R-MOT-11 gains one sentence allowing it, as it did for the hero clip.
- **Never** on text, labels, focus rings or hit areas: gestures go on decorative layers and icons (`aria-hidden`).

## First wave

### Closing CTA panel (`cta-band`)

- **Glow.** One decorative element joins the panel: `<span aria-hidden="true">` in the bottom-end corner (where the gradient turns green), `absolute -bottom-32 -end-32 -z-10 size-96 rounded-full bg-accent-300/30 blur-3xl`, plus `gesture-glow-repeat` (expressive) or `gesture-glow` (standard). The blur is static; only opacity and scale animate. The existing white highlight in the top-start corner and its scroll drift stay as they are.
- **Arrow.** The primary (`inverse`) button's trailing arrow takes `gesture-nudge`. The button primitive gains one option, `opts.gesture`, which appends the class to the trailing icon. Only the CTA band passes it; every other button is unchanged.

### Timeline

As built: the line stays a pseudo-element and the `<ol>` itself carries `gesture-trace`, whose band runs down the element's start edge (a span inside the list would be invalid HTML). The CTA band has no entrance, so its panel carries `pending:visible`, an invisible from-state the script observes, to be marked `data-revealed` on arrival.


The line is now a `before:` pseudo-element of the `<ol>`. It becomes a real `<span aria-hidden="true">` (absolute, start edge, 1 px, `bg-line`), so it can carry `gesture-trace`. Its draw-in stays keyed on the list's reveal: the list becomes a named group, and the span's `pending:`/`data-revealed:` classes become their `group-…/timeline` forms. The trace starts after the draw-in finishes (the draw takes 1 200 ms, so the trace's delay is 1 200 ms plus `--gesture-delay`).

### The header logo

Owner, mid-design: "the logo should do some sort of animation always, maybe on hover too", then "hover but every once in a while also, 12 sec seems too fast". A soft slanted band of light (the hero's motif) glints across the blue tile, clipped to the tile's notched shape. The "N" and the wordmark stay still.

- **Hover or keyboard focus on the logo link:** the glint plays once (900 ms). Class `gesture-glint` on the band; it plays when its nearest link or button is hovered or focused.
- **Every once in a while:** `gesture-glint-rare` on the band's wrapper sweeps it once 20 s after the page loads, then every 60 s, at most 3 times per page view (at about 20, 80 and 140 s), then never again on that page. Two layers, so a hover never restarts the rare count.
- Header logo only (`logo(name, { glint, rare })`); the footer and the style guide's specimen stay still. Hover glint from `standard` (`gesture`), the rare glint in `expressive` (`gestureRepeat`).
- The band is `aria-hidden` inside the already hidden SVG; the clip path has one id per page, `logo-glint`, since only the header logo carries it.
- WCAG 2.2.2: the same judgement as the CTA glow's pulses (rare, under a second each, capped at 3 per page, off under reduced motion). D52's refused hover shimmer was on buttons; this is the brand mark, asked for by the owner.

### Not in the first wave

- **Stats band:** the counters already count and settle there, and its tinted backdrop is a pseudo-element that already moves with the scroll in expressive. A glow would need new markup or stack a second effect on a moving layer, so it waits.
- **Steps connector, stat marker line:** both need new markup. Dropped for simplicity.
- **Hero, header, footer, forms, cards:** no gestures.

## Rules and documents

- **D66** (new): gestures, the three utilities, the capped pulse, the reasoning (the research doc), and the WCAG 2.2.2 judgement. Each gesture is under 1.2 s and plays once. The glow's pulses span about 74 s with no pause control, defended as rare, faint (opacity only), capped at three, and off under reduced motion; the alternative, one pulse and stop, is noted.
- **R-PREC-07:** the app.css exception list gains the `arrived` variant and the six gesture utilities.
- **R-MOT-03:** what may repeat gains "the CTA glow's three pulses (D66)".
- **R-MOT-11:** gestures may start after load on sections already in view (never the hero).
- **R-MOT-16 / DESIGN §3:** a "Gestures" table listing the three utilities, where they are used, and how to add one.
- **R-TOK-11, R-TOK-13:** the new duration and the four tokens.
- **Catalog headers** of `cta-band`, `timeline` and the button primitive: their motion lines.
- **CHANGELOG** 0.26.0; checklists regenerated.

`enhance.js` does not change.

## Testing

- **Build test, reference site (expressive):** the CTA band has the glow span with `gesture-glow-repeat` and the arrow with `gesture-nudge`; the timeline line is a span with `gesture-trace`; no other button has `gesture-nudge`; the hero has no `gesture-` class.
- **Flair test:** `flairFor("calm")` has neither boolean, `standard` has `gesture` only, `expressive` has both. A calm build of a fixture page writes no `gesture-` class; standard writes `gesture-glow`, not `-repeat`.
- **CSS test:** the built CSS puts every `gesture-*` animation inside `@media screen and (prefers-reduced-motion: no-preference)` and the `[data-revealed]` selector; the four new keyframes touch only `translate`, `scale` and `opacity`; `glow-pulse` runs exactly 3 iterations; RTL flips `--g-dir`.
- **Gates:** the full gate run stays green (HTML, a11y, budgets, consistency, Lighthouse).
- **In the browser (headless Chrome, as for D65):** scroll to the timeline and the CTA band in en and ar. Each gesture plays once, the arrow nudges toward the reading direction, and the pulses stop after three. Under reduced motion nothing moves. Screenshots of the CTA panel at rest and mid-glow.

## Addendum: D67 and the review (2026-10-24)

Built after this spec, at the owner's requests during implementation: the closing CTA's gradient fills in (its green half is a layer that grows from the bottom-right corner, replacing the separate glow blob); cards draw a blue-to-green border on hover (`border-draw`, R-MOT-01's second exception); filled CTA buttons sweep the logo's sheen on hover (`gesture-shine`), and in expressive the header CTA and the closing CTA's button also every 30 s, four times (`gesture-shine-rare`); the footer logo glints on hover. The fresh review's fixes: the rare logo glint moves an inner group so its clip stays on the tile; glows wait hidden until they play; the RTL nudge selector is forgiving; the gate flags an arrival gesture with nothing observing it; motion-level tests cover calm and standard. See D66 and D67.
