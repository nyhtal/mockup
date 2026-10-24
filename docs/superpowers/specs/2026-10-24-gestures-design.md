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
| `gesture-glow` | brightens and grows a little, then settles, once | `opacity: .55, scale: .92` → `opacity: 1, scale: 1` | 1 200 ms `ease-reveal`, fill `backwards` |
| `gesture-glow-repeat` | `gesture-glow`, then up to three soft pulses, then still | the arrival glow, then `glow-pulse`: rest for 90 % of a 24 s cycle, then `opacity: 1 → .7 → 1` over the last 10 %; `animation-iteration-count: 3` | pulses at about 26, 50 and 74 s after arrival, then none |
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

The line is now a `before:` pseudo-element of the `<ol>`. It becomes a real `<span aria-hidden="true">` (absolute, start edge, 1 px, `bg-line`), so it can carry `gesture-trace`. Its draw-in stays keyed on the list's reveal: the list becomes a named group, and the span's `pending:`/`data-revealed:` classes become their `group-…/timeline` forms. The trace starts after the draw-in finishes (the draw takes 1 200 ms, so the trace's delay is 1 200 ms plus `--gesture-delay`).

### Not in the first wave

- **Stats band:** the counters already count and settle there, and its tinted backdrop is a pseudo-element that already moves with the scroll in expressive. A glow would need new markup or stack a second effect on a moving layer, so it waits.
- **Steps connector, stat marker line:** both need new markup. Dropped for simplicity.
- **Hero, header, footer, forms, cards:** no gestures.

## Rules and documents

- **D66** (new): gestures, the three utilities, the capped pulse, the reasoning (the research doc), and the WCAG 2.2.2 judgement. Each gesture is under 1.2 s and plays once. The glow's pulses span about 74 s with no pause control, defended as rare, faint (opacity only), capped at three, and off under reduced motion; the alternative, one pulse and stop, is noted.
- **R-PREC-07:** the app.css exception list gains the `arrived` variant and the four gesture utilities.
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
