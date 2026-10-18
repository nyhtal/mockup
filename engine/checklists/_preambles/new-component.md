# New component checklist

Use this for a new primitive, component or section in `engine/catalog/`, and for a new variant of an existing one. A page may not carry markup of its own (R-PREC-06), so a need no component covers ends here.

## Procedure

1. **Decide the layer**: primitive (one element and its states), component (a reusable block with a `data-component` root), section (a `<section>` with a `shell`, exported as `render(s, ctx)` and added to `sections/_render.njk`).
2. **Write the anatomy block first** (R-COMP-01): name, purpose, anatomy, variants, states, spacing, motion, keyboard, a11y, i18n, content limits, data. The data line is the contract pages and recipes use.
3. **Compose from existing layers** (button, field, icon, picture, card, shell, `cardGrid`, `formBody`); import macros `with context` so the `t` filter knows the page's language, and never name a macro argument like a page variable (`items`, `e`, `lang`, `title`, `content`).
4. **Classes**: Tailwind utilities only, logical properties for direction (`ps-`, `ms-`, `start-`, `text-start`), `motion-safe:` on every transition and animation, the focus-ring triple on every interactive element, `rtl:-scale-x-100` on directional icons, no arbitrary lengths, no palette colours (role tokens only).
5. **UI strings** through `t` with keys added to `engine/i18n/_template.json` and every engine locale file; plural strings as objects of CLDR forms.
6. **Add a sample** to `engine/catalog/samples.json` (sections) or to the style-guide page for the layer, so the style guide and the consistency gate exercise it.
7. **Build the reference site and gate** with `--skip lighthouse`; then open the style-guide page and one real page using it at 320 px, 1024 px and 1280 px, in an RTL locale too.
8. **Budget**: a section used on every page costs its markup times the page count; check the home page's HTML size in `reports/latest.md`.

## Learned on the reference site

- Text inside an SVG (wordmarks, logo clouds) is an axe "needs review" contrast item on every page; keep it on role colours the theme's contrast check already covers and note it under the review list.
- A section without a visible title needs `label` so the shell gives it `aria-label`; a heading inside it must be an `h2`, not an `h3`.
- `display: contents` on `<details>` slots its children into `::details-content`; style the panel through the `details-content:` variant.
