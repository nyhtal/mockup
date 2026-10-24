# 20 Sound

Purpose: the site's opt-in UI sounds: when each plays, what it sounds like, how loud, and what stays silent, so sound on any site built on the engine is one quiet family that confirms what the visitor does and never competes with the content. Sources: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices, https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay, https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime.

### R-SND-01 Off by default, opt-in per tab
MUST. Sound is off until the visitor presses a sound toggle (`[data-sound]`, `aria-pressed`, named "Sound effects"; in the footer on every page, in the header from `xl`, in the drawer below `lg`). The choice lives in `sessionStorage.sound` for the tab; no cookie, no `localStorage`. Restoring "on" from the session plays nothing.
Why: A site that makes noise unasked is not professional; a choice that outlived the tab would surprise the visitor next time.
Gate: manual: checklists/pre-delivery.md

### R-SND-02 The sound module
MUST. Every sound is synthesised with the Web Audio API in `engine/scripts/sound.js`, an ES module of at most 4608 bytes with no dependencies and no audio files, which `enhance.js` imports only while sound is on (switched on, or restored for the tab) or when an audition button is pressed (R-SND-11). No page references it, so a visitor who leaves sound off never downloads it. It exports one function, `S(name, force, element, context)`.
Why: Most visitors never switch sound on; they should not pay for it.
Gate: budget/js

### R-SND-03 The vocabulary
MUST. The cues are these and no others. Pitches come from C major pentatonic (C4 262, G4 392, C5 523, D5 587, E5 659, G5 784 Hz) so overlaps agree; every voice rises from .0001 to its peak in 4 ms (25 ms for noise) and decays exponentially to .0001 by its length; gains are per voice before a master gain of 1.5 and a 6 kHz lowpass.

| Cue | Plays when | Recipe |
|---|---|---|
| `hover` | the mouse rests 100 ms on `a[href]`, an enabled `button` (not a style-guide audition button), a `summary` or a `label` | sine G5, 24 ms, .008 |
| `press` | a plain button or button-styled link is pressed (pointer down, or a keyboard activation) | triangle E5→C5, 35 ms, .02; primary .026 |
| `pop` / `unpop` | a popover opens / closes (menus, language switcher, tooltip) | sine C5→E5 45 ms .02 / E5→C5 35 ms .014 |
| `open` / `close` | a `<details>` opens / closes (accordion, FAQ, tabs, feature disclosures) | sine C5→E5 85 ms .018 / E5→C5 65 ms .012 |
| `sheet` / `unsheet` | a dialog opens / closes: a `<dialog>`, or a popover that is `[role=dialog]` or `[data-component$=drawer]` (modal, drawer, lightbox, contact launcher) | sine C4→G4 120 ms .028 / G4→C4 90 ms .02; at `expressive` `sheet` alone adds noise bandpassed at 900 Hz (Q .7), 120 ms, .004 |
| `step` | a carousel snaps to a new item; the lightbox moves to the next or previous picture | triangle E5, 40 ms, .018 |
| `on`·`up` / `off`·`down` | the sound toggle (`on`/`off`, which also switch the state) and the theme toggle (`up`/`down`); the style guide auditions the pair as `up`/`down`, the sound being identical | C5 then E5 / E5 then C5, 40 ms each, 45 ms apart, .022 |
| `detent` | a range input passes a tenth of its range | sine C5, 18 ms, .009 |
| `copy` | the clipboard write resolved | E5 then G5, 45 ms each, 55 ms apart, .025 |
| `submit` | a form's `submit` event fires | C5 then G5, 65 ms each, 75 ms apart, .03 |
| `in` | an entrance starts after the first report (R-MOT-05) | sine G4→C5, 100 ms, .005; at `expressive` a rising group adds sine C5→D5 and a settling one D5→C5, 55 ms, .007 |
| `count` / `land` | a figure counts up (R-MOT-10 behaviour 3): one tick each time the eased value passes a twelfth of its target / once when it lands | triangle, 18 ms, .008, climbing C5 D5 E5 G5 A5 C6 two ticks a step / sine G5→C6, 70 ms, .01 |

Loudness order, by what the visitor hears (peak gain, length and timbre together): `hover`, `in`, `count` and `land` are quieter than `detent`; `detent` is quieter than `press` and `step`; those are quieter than `pop`, `open` and `sheet` (and their closes); and those are quieter than `on`, `copy` and `submit`. A change to any recipe MUST be auditioned on laptop speakers, headphones and a phone before it ships.

Browser gaps: the `toggle` event of a `<dialog>` needs a recent engine (about Chrome 132, Firefox 133, Safari 18); an older one plays no `sheet` or `unsheet` for a `<dialog>`. `scrollsnapchange` is Chromium-only, so a carousel's `step` is silent in other engines.

Why: A fixed, small family is what makes the sound read as one product, the way the motion table does for movement.
Gate: manual: checklists/new-component.md

### R-SND-04 One action, one sound
MUST. A control that opens something (`popovertarget`, `commandfor`, a `summary`) plays the open cue and not `press`; a submit button plays `submit` (when the form really submits) and not `press`, and a `method="dialog"` form (a dialog's Close) plays only `unsheet`; a form that navigates to another page may cut its `submit` cue short, and nothing delays the navigation for it; a `<details>` closing because a sibling of its `name` group opened, and a popover closing because another non-dialog popover opened, are silent; the lightbox's next and previous play one `step`, not `unsheet` and `sheet`; nothing plays for something that failed (an invalid form, a rejected copy).
Why: Two sounds for one click is noise, and a success sound for a failure is a lie.
Gate: manual: checklists/new-component.md

### R-SND-05 Mixer and limits
MUST. At most three voices sound at once; a two-note cue counts as two. `hover`, `in`, `count` and `land` are ambient: a direct cue that needs a voice cuts the oldest ambient one with a 5 ms fade, then the oldest voice; an ambient cue that finds no ambient voice to cut is dropped. Rate limits: `hover` one per 250 ms, `in` one per 1.2 s, `step` and `detent` one per 125 ms, `count` one per 40 ms, `land` one per 150 ms.
Why: Limits are what keep a sweep across a menu or a page of cards from turning into chatter.
Gate: manual: checklists/pre-delivery.md

### R-SND-06 Pointer, keyboard and touch
MUST. `hover` plays only for a mouse on a device that matches `(hover:hover) and (pointer:fine)`, only after real pointer movement, after 100 ms of dwell, and once per target until the pointer leaves it. Keyboard focus moving is silent; activating a control by keyboard plays its cue. Touch gets the action cues only.
Why: A tick on every Tab is a penalty for keyboard users; hover sounds on touch would fire on taps that are already actions.
Gate: manual: checklists/new-component.md

### R-SND-07 Entrances
MUST. `enhance.js` asks for `in` for each entrance it reveals after its first report; the module's rate limit turns a section's cascade into one soft rising note. Nothing that is in view at load makes a sound, and no card or item has a sound of its own. A counting figure is the one exception: it ticks as it counts and lands on one note (R-SND-03), because the count is motion the visitor watches, like a dial.
Why: The note accompanies the motion the visitor caused by scrolling; per-item sounds would be a xylophone.
Gate: manual: checklists/pre-delivery.md

### R-SND-08 Reduced motion and the motion level
MUST. `prefers-reduced-motion: reduce` silences `in` and keeps the action cues (it is a motion preference, not an audio one). The page carries the flair level as `data-motion` on `<html>`: `calm` drops `hover`, `in`, `count` and `land` and sets the master gain to 1.2; `standard` is the table; `expressive` adds the air layer to `sheet` and the contour to `in`, never more cues (the air layer and the contour are extra voices of a cue that already sounds).
Why: Sound scales with the site's motion so a calm brief stays calm in both.
Gate: manual: checklists/pre-delivery.md

### R-SND-09 Activation and silence
MUST. The module creates or resumes its audio context only inside a `pointerdown`, `keydown` or `click` handler, or adopts the one `enhance.js` creates synchronously in the click that turns sound on or auditions a cue; never on load. A cue plays only while the context is `running`; otherwise it is dropped, never queued or replayed, so after a navigation the page stays silent until the first click or key press. A hidden tab, and turning sound off, cut every sounding and scheduled voice at once (`off` itself still plays). A failed import leaves the toggle truthful and the page working. Always silent: a validation error, navigation and view transitions, loading, a toast appearing, a video starting, a disabled control.
Why: Browsers do not count hover or scroll as a gesture; a sound that arrives late is worse than none.
Gate: manual: checklists/pre-delivery.md

### R-SND-10 The same in every locale
MUST. Every locale and writing direction hears the same cues with the same meanings: no speech, no culture-specific instrument, no stereo position (right-to-left mirrors the layout, not the sound).
Why: Sound is part of the brand, and a cue that changed meaning by language would be a translation bug nobody can see.
Gate: manual: checklists/new-locale.md

### R-SND-11 The style guide auditions every cue
MUST. The style guide's foundations page has a Sound section listing every cue of R-SND-03 with when it plays and what it sounds like, each with a Play button (`button[data-sound-demo="<cue>"]`, shown only with the script) that plays that cue once through the production module without turning sound on; the mouse resting 100 ms on a row plays it too, once the page has had a click or key press, and the Play button itself has no `hover` tick. A new cue gets a row before it ships.
Why: Sound cannot be reviewed from a table of numbers; whoever changes it has to hear it.
Gate: manual: checklists/new-component.md

## Checklist

- [ ] R-SND-01 off by default, sessionStorage only, restore is silent
- [ ] R-SND-02 sound.js ≤ 4608 B, imported on demand, no page references it
- [ ] R-SND-03 only the listed cues, pentatonic, envelope and gains as in the table; loudness order kept; recipe changes auditioned on laptop, headphones and phone
- [ ] R-SND-04 one action, one sound; silent closes in groups; lightbox step
- [ ] R-SND-05 three voices, ambient stolen first, rate limits
- [ ] R-SND-06 hover: fine pointer, dwell, once per target; focus silent
- [ ] R-SND-07 one note per section, nothing at load
- [ ] R-SND-08 reduced motion silences in; calm, standard, expressive
- [ ] R-SND-09 context only from a gesture; dropped, never queued; hidden and off cut
- [ ] R-SND-10 same in every locale, no panning
- [ ] R-SND-11 Sound section with a Play button per cue
