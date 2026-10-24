# Sound: a style guide and a fuller vocabulary

Date: 2026-10-23. Owner request: "add style guides on sound effects and usage and then implement it on the site. more things need sound effects, hover of links, opening dropdowns accordions etc. when things slide in and stuff make appropriate sounds". Second opinions: Codex (a blind design and a critique of the first sketch) and Grok. Owner approved the design in chat on 2026-10-23.

## Understanding

- **Outcome:** with sound switched on, the site answers the visitor's hand and accompanies its motion: hover on things that can be clicked, menus, accordions, dialogs, steps, toggles, sliders, copy and submit, and the scroll entrances. The rules for it live in a bylaw and the style guide shows and plays every sound.
- **What the owner said:** hover on links, dropdowns, accordions and slide-ins get sounds; "appropriate" sounds.
- **Kept from before (D44):** sound is off by default, behind the labelled toggle in the footer (header at `xl`, drawer below `lg`), the choice in `sessionStorage` for the tab, no audio files, no cookie, nothing on load.
- **Reversed:** D44's "never on hover, scroll …" and D52's "motion stays silent". Codex's critique argued for keeping both; the owner asked for the sounds, so the design keeps them and takes every rule that stops them chattering.
- **Success:** a visitor who turns sound on hears a quiet, coherent family of sounds that never stacks into noise; a visitor who leaves it off downloads no audio code; every gate green; `enhance.js` within 5120 B and `sound.js` within 4608 B.

## Architecture

- **`engine/scripts/sound.js`** (new, passthrough to `/assets/sound.js`): an ES module, no dependencies, ≤ 4608 B minified. It owns the audio context, the mixer, the vocabulary and its own listeners (`pointerover`, `pointerdown`, `keydown`, `toggle`, `submit`, `input`, `scrollsnapchange`, `visibilitychange`). It exports one function `cue(name, el)` for the events only `enhance.js` sees.
- **`enhance.js`** keeps the toggle state (`sessionStorage.sound`, `aria-pressed` on every `[data-sound]`) and loads the module with `import("./sound.js")`, once (one cached promise), when sound is switched on or is already on at load. It calls the hook at three points: an entrance revealed after the first report (`in`), a copy that succeeded (`copy`), the toggle itself (`on` / `off`). Its own synthesiser `S` and the four inline sounds go, so it gets smaller.
- **Activation:** hover and scroll are not user activations. The module creates or resumes its context inside a trusted `pointerdown`/`keydown`/`click` handler, synchronously; a cue plays only while `state == "running"` and is otherwise dropped, never queued. After a cross-document navigation the page stays silent until the first click or key press. When the visitor switches sound on, `enhance.js` creates the context synchronously in that click and hands it to the module, so the confirming `on` sound is heard.
- **Failure:** if the import fails, the toggle stays truthful and the page works; nothing retries in a loop. Turning sound off cancels every scheduled and sounding voice at once. Restoring "on" from the session plays nothing.
- **Motion level in the DOM:** `<html>` gains `data-motion="calm|standard|expressive"` (the site's flair level, R-TOK-12) so the module can scale the vocabulary.
- **CSP:** `script-src 'self'` already covers a second module; no change.

## Vocabulary

One scale, C major pentatonic (C, D, E, G, A; C4 = 262, C5 = 523, D5 = 587, E5 = 659, G5 = 784, A5 = 880 Hz), so overlapping sounds agree. Every voice starts at .0001, peaks in 4 ms, decays exponentially to .0001 by its length and then stops and disconnects. Gains are per voice, before a master gain of .6 and a gentle lowpass. No reverb, no panning.

| Name | Event | Recipe | Notes |
|---|---|---|---|
| `hover` | pointer comes to rest on `a[href]`, `button`, `summary`, `label` of a control, a linked card | sine G5, 24 ms, .008 | `(hover:hover) and (pointer:fine)` only; 100 ms dwell; ≤ 1 per 250 ms; not again on the same target until the pointer leaves it; never from layout moving under a still pointer |
| `press` | `pointerdown` or Enter/Space on a button or button-like link | triangle E5→C5, 35 ms, .02 (primary .026) | suppressed when the same action opens something (the open sound plays instead) |
| `pop` / `unpop` | a popover opens / closes (mega menu, compact dropdown, locale switcher, tooltip) | sine C5→E5 45 ms .02 / E5→C5 35 ms .014 | |
| `open` / `close` | a `<details>` opens / closes (accordion, FAQ, tabs, feature disclosures) | sine C5→E5 85 ms .018 / E5→C5 65 ms .012 | exclusive groups: the closing sibling stays silent, only the open plays |
| `sheet` / `unsheet` | a dialog opens / closes (modal, drawer, lightbox, contact launcher) | sine C4→G4 120 ms .028 / G4→C4 90 ms .02; at `expressive` plus bandpassed noise 900 Hz Q .7, .004 | |
| `step` | carousel snaps to a new item, lightbox next/previous | triangle E5, 40 ms, .018 | ≤ 8 per second |
| `on` / `off` | the sound toggle, the theme toggle | C5 then E5 / E5 then C5, 40 ms each, 45 ms apart, .022 | `off` plays before muting |
| `detent` | a range input crosses a tenth of its range (before/after slider, pricing estimate) | sine C5, 18 ms, .009 | key repeat and fast drags rate-limited to 8 per second |
| `copy` | the clipboard write resolved | E5 then G5, 45 ms each, 55 ms apart, .025 | never on a failed copy; `navigator.share` plays nothing |
| `submit` | a form's `submit` event | C5 then G5, 65 ms each, 75 ms apart, .03 | means "sent", not "succeeded"; a blocked (invalid) form fires no submit and stays silent |
| `in` | a group crosses into view and its entrance starts (after the first report) | bandpassed noise 900 Hz Q .7, 180 ms, .005, 25 ms attack; a `rise` group adds sine C5→D5 55 ms .007, a `settle` group D5→C5 | one per section, never per item; groups starting within 200 ms merge; ≤ 1 per 1.2 s |
| — | count-up, validation errors, navigation and view transitions, loading, the toast appearing, video play, keyboard focus moving, disabled controls | silent | |

## Rules (bylaw 20, R-SND)

1. **Off by default, opt-in per tab** (unchanged from D44).
2. **Loudness order:** `hover` and `in` < `detent` < `press` and `step` < `pop`/`open`/`sheet` < `on`/`copy`/`submit`. Audition on laptop speakers, headphones and a phone.
3. **One action, one sound:** an action that opens something plays the open sound, not `press` as well; a closing sibling in an exclusive group is silent; a cue never plays for something that failed.
4. **Mixer limits:** at most three voices; a two-note cue counts as two; a direct action (anything but `hover` and `in`) steals the oldest `hover`/`in` voice with a 5 ms fade; per-cue rate limits as in the table.
5. **Hover:** fine pointer only, dwell, global throttle, once per target; touch gets action sounds only.
6. **Keyboard:** focus moving is silent; activating plays the action's sound.
7. **Entrances:** one breath per group at the moment its entrance starts, never for what is in view at load, never per card.
8. **Reduced motion** (`prefers-reduced-motion: reduce`) silences `in`; it is not an audio preference, so action sounds stay.
9. **Motion level:** `calm` has no `hover` and no `in` and the master gain at .8 of standard; `standard` is the table; `expressive` adds the air layer to `sheet` and the contour to `in`, never more voices.
10. **Silence:** hidden tab (`visibilitychange` cancels everything), sound turned off, the list in the last table row. Missed cues are dropped, never replayed.
11. **Locale-neutral:** the same sounds and meanings in every locale; no speech, no culture-specific instrument; RTL mirrors layout, not sound; no stereo position.
12. **Budget:** `sound.js` ≤ 4608 B minified, loaded only when sound is on; `enhance.js` stays ≤ 5120 B.

## Documents

- `engine/bylaws/20-sound.md`: R-SND-01 … with the vocabulary table and the rules, a checklist, sources (MDN Web Audio best practices and the autoplay guide).
- `engine/bylaws/00-precedence.md` R-PREC-08: a second module, `sound.js`, loaded only while sound is on (switched on or restored for the tab) or for an audition; its budget.
- `engine/bylaws/06-motion.md` R-MOT-10 behaviour 4: the toggle and the hook; the sounds themselves are bylaw 20.
- `engine/DESIGN.md` §4 Sound, the "pizzazz" line, and the signature-devices line ("the quiet sounds").
- `engine/DECISIONS.md`: D-new superseding D44's trigger list and D52's last sentence.
- `engine/CHANGELOG.md`: 0.21.0, minor (a new bylaw with gates).
- `engine/INDEX.md` and the checklists (`pre-delivery`, `new-component`) gain the sound items if they list the bylaws.

## Style guide

The foundations page (`style-guide-foundations.njk`) gets a **Sound** section after Motion: a short lead (off by default, how to switch it on), then a table with one row per cue (name, when it plays, what it sounds like) and a **Play** button per row (`data-sound-demo="<name>"`). A Play click is an explicit request to hear that one cue: it loads `sound.js` and plays through the production mixer even while the toggle is off, without turning sound on. The buttons are `hidden js:inline-flex` like the motion demo's replay. A last row lists what stays silent.

## Testing

- **Unit (`engine/tools/test/sound.test.js`):** import `sound.js` against a fake `AudioContext` and fake document; assert the throttles (hover once per 250 ms and once per target, `in` once per 1.2 s, merges within 200 ms), the voice cap and stealing, one-action-one-sound (an opening button plays `pop` not `press`), reduced motion silences `in`, `calm` drops `hover` and `in`, nothing plays while the context is suspended or the tab hidden, `off` cancels voices.
- **Build (`build.test.js`):** `sound.js` ships ≤ 4608 B; `enhance.js` ≤ 5120 B and imports `./sound.js`; no page's HTML references `sound.js` (the default visitor never fetches it); `<html>` carries `data-motion`; the style guide's Sound section has a Play button for every cue; the old D44 assertions updated.
- **Browser:** in the in-app browser, switch sound on, wrap the page's `AudioContext.prototype.createOscillator` and `createBufferSource` with a counter through `javascript_tool` (nothing debug-only ships), and confirm that each listed interaction produces its cue and that a fast pointer sweep across the nav stays within the hover limits.
- **Gates:** `npm run build`, `npm test`, `npm run gate`.

## Out of scope

Audio files or samples, a volume control, sound for errors or navigation, per-site sound palettes (every site shares the vocabulary, as with the other signature devices).
