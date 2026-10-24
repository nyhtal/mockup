# Making the site feel alive, subtly: research and options

2026-10-24. Owner: "i want to do things like the home page hero that makes things more alive on the site, like periodic effects on cta buttons, maybe arrows move, icons spin or whatever, needs to be subtle though, i dont want all kinds of things moving all the time."

Status: research and brainstorm. Nothing here is approved or built. Consulted: Codex (blind, and as a critic of Claude's first sketch) and Grok (blind), all three with the motion bylaw, DESIGN §1/§3/§4, D52, D65 and the button primitive inlined.

## Where the rules stand today

- Nothing moves on its own except skeleton pulses, pending spinners and, since D65, the home hero's art clip (with a pause button).
- Motion today answers the visitor: entrances once on arrival, hover and press feedback, scroll-linked depth, counters once.
- D52 refused shimmer sweeps on buttons ("reads as a sale banner"), marquees, auto-advance, magnetic cursors, card flips, slot-machine digits and similar.
- Any new self-starting motion needs a new decision that amends R-MOT-03 (what may loop), R-MOT-10 (what the script may do) and DESIGN §4.

## What the evidence says

- **Peripheral vision is tuned to motion**, so even irrelevant movement pulls the eye off what the visitor is reading. NN/g accepts an attention-drawing effect "in limited doses" (a single halo on one control) and warns it becomes a problem applied site-wide. ([NN/g: the role of animation and motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/))
- **Animation makes things read as ads.** NN/g lists animation among the traits that make people skip content as advertising. Eye-tracking work finds that animated banners draw a glance but slow visual search and are remembered worse. ([NN/g: banner blindness](https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/))
- **WCAG 2.2.2 (Pause, Stop, Hide, level A):** motion that starts by itself, lasts more than 5 s and sits beside other content needs a way to pause, stop or hide it. The 5 s figure was chosen so a visitor can wait out a distraction. Short bursts that repeat for longer than that are not exempt just because each burst is short: Codex and the W3C text agree there is no per-burst reset. ([Understanding SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide))
- There is no solid study showing that pulsing or wiggling CTAs raise conversion; the claims found are vendor blogs without method.

## Where the three opinions agree

1. **One-shot gestures, not loops.** Each effect plays once per element per page view, about 0.4–1.2 s, then is still for good. No periodic repeats.
2. **One at a time.** At most one self-starting gesture on screen. The hero clip, while visible and playing, holds that slot.
3. **Never on load.** Gestures start only after the element has arrived and stayed in view (a dwell), never at first paint.
4. **Small.** Travel of 2–8 px, scale of at most 4 %, rotation of a few degrees; never a full spin (it reads as "loading").
5. **Flair levels set the allowance.** `calm`: none. `standard`: about 2 per page. `expressive`: 3–4. Phones: 1. Reduced motion: none, and the final state shows at once.
6. **Keep D52's refusals,** including the button shimmer. Add: periodic button scaling, bouncing arrows, full icon spins, fake "live" indicators.

## Where they disagree

| Question | Claude's first sketch | Codex (critic) | Codex (blind) | Grok |
|---|---|---|---|---|
| Trigger | visitor idle about 4 s | "idle is the wrong trigger: no input usually means someone is reading" | in view 1.5 s, then 3 s without input, never before 10 s after load, 20 s apart | in view, 2 s dwell; any nearby pointer, scroll or key cancels |
| CTA arrow | 3 px forward and back, twice | "two nudges read as beckoning"; once per page on one chosen CTA at most | 3 px forward and back once, 600 ms | 6 px forward once, 550 ms |
| Uptime "live" dot | a soft ring every 6 s | delete: it implies live monitoring a static site does not have | (not proposed) | (not proposed) |
| Icons | meaning-matched gestures (gear turns 60°, gauge swings) | cut the generic catalogue; keep one meaningful "process" moment | one part rotates 6° and back | a whole tile "breathes" 1 → 1.035 → 1 |
| Repeats | up to 3 per element | none | none | none |

## Candidate effects, ranked after the consults

1. **Light along a connector (the hero's idea, reused).** A single soft notch of light travels once along one real connector: a process diagram, the timeline rule, or the CTA band's hairline. It ties the site to the hero with one motion idea rather than many. All three rate it well; Codex calls it the strongest.
2. **Primary CTA arrow, once.** On the closing CTA band (not the hero, not the sticky header), after it has been in view for a moment: the arrow travels 3 px toward the reading direction and back, 600 ms, once per page view. Mirrored in RTL.
3. **CTA panel glow, once.** The panel's existing static highlight drifts about 16 px and settles, 1.2 s. It replaces, rather than adds to, that panel's scroll drift.
4. **One meaningful icon or process moment per page.** Only where the movement says something: a signal enters a controller and an output responds. No generic gear spins across every feature grid.
5. **Stats marker draw.** After a counter lands, its small accent rule draws in once.

Deferred or refused: an uptime "live" pulse (misleading), shimmer on buttons (D52), periodic anything, full icon spins, logo-cloud wiggles, help-icon nudges.

## The decision that shapes everything

**Periodic** (an effect repeats every N seconds while visible) is what the owner first described. It needs a site-wide "Pause decorative motion" control under WCAG 2.2.2, and NN/g's evidence says it will fight with reading and read as advertising.

**Once per arrival** (each effect plays once when its section has settled in view, then never again on that page) gets most of the "alive" feeling with almost none of the cost. It needs no pause control.

All three opinions recommend once per arrival.
