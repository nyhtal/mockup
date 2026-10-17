# 10 Content

Purpose: the words. Tone, casing, punctuation, lengths, link and button wording, microcopy and the rules that keep fictional content honest, so copy on any page sounds like the same company. Sources: Google Search Central (title and snippet guidance), GOV.UK content style (sentence case, plain language), Nielsen Norman Group (link text).

### R-CONT-01 Voice presets
MUST. The brief picks one voice: `plain` ("We build control software for factories."), `confident` ("Factories run better on Northwind."), or `warm` ("We help the people who keep factories running."). Every page's copy follows the chosen preset's sentence length (≤ 20, ≤ 14, ≤ 18 words on average) and person (we/you in all three).
Why: Tone drift between pages is the most common sign of a patched-together site.
Gate: manual: checklists/new-site.md

### R-CONT-02 Sentence case
MUST. Headings, buttons, nav items, labels and table headers use sentence case. Only proper nouns and product names are capitalised.
Why: Localises cleanly, reads faster, and matches R-TYPO-11.
Gate: manual: checklists/new-page.md

### R-CONT-03 Punctuation
MUST. Oxford comma; no exclamation marks; no ampersands outside names; en dash for ranges with no spaces (9–17); no trailing periods on headings, labels, list items under seven words, or buttons.
Why: One punctuation rule set reads as one author.
Gate: manual: checklists/new-page.md

### R-CONT-04 Numbers
MUST. Zero to nine as words, 10 and above as numerals, except in stats, tables, prices, dates and units which are always numerals. Percentages use `%` with no space; units follow locale rules in bylaw 11.
Why: Mixed number styles look careless.
Gate: manual: checklists/new-page.md

### R-CONT-05 Button labels
MUST. Buttons start with a verb from: Get, Start, Book, Talk, Request, Download, Apply, See, Read, Explore, Subscribe, Send, Search, Compare, Watch, Open, Close, Cancel, Save, Continue, Back. Labels are 1–4 words and never "Click here", "Submit", "Learn more" or "More".
Why: A verb tells the user what happens; a noun tells them nothing.
Gate: manual: checklists/new-page.md

### R-CONT-06 Link text
MUST. Link text describes the destination ("See pricing", "Read the Northwind case study") and is unique within a page. "Here", "this", "read more" and bare URLs are not link text.
Why: Screen-reader users navigate by link lists; crawlers weigh anchor text.
Gate: a11y/link-name

### R-CONT-07 Forbidden words
MUST. These words do not appear: leverage, synergy, cutting-edge, best-in-class, world-class, seamless, robust, utilize, solutions (as a noun on its own), innovative, disrupt, lorem, ipsum, "click here", "please note", very, really, just.
Why: Filler weakens every sentence it sits in.
Gate: manual: checklists/new-page.md

### R-CONT-08 Title and description
MUST. Page titles are ≤ 60 characters before the site suffix; meta descriptions are 120–155 characters, one or two full sentences, and contain the page's main noun. Neither repeats the other.
Why: Search snippets truncate; duplicated text wastes the slot.
Gate: lighthouse/mobile/seo

### R-CONT-09 Reading level
SHOULD. Body copy targets a grade-8 reading level: short sentences, common words, one idea per sentence, no nested clauses.
Why: Corporate readers skim; executives skim faster.
Gate: manual: checklists/new-page.md

### R-CONT-10 Microcopy keys
MUST. All UI strings (skip link, nav labels, button labels, form labels, help text, error messages, empty states, 404 copy, pagination, "opens in new tab") live in `engine/i18n/<locale>.json` under the keys listed in `engine/i18n/_template.json` and are used via the `t` filter. No UI string is typed into a template.
Why: One place to translate; one place to keep wording consistent.
Gate: i18n/keys

### R-CONT-11 Fictional, plausible, marked
MUST. Every company, person, customer, figure and quote is invented. Figures are plausible for the industry and never cite a real company, award body or regulator. Each site's `DECISIONS.md` carries the line "All names, figures and quotes on this site are fictional."
Why: A mockup that reads as real can mislead; one that reads as fake is useless. Plausible and marked is the balance.
Gate: manual: checklists/new-site.md

### R-CONT-12 Terminology glossary
MUST. `sites/<name>/glossary.json` lists the product and industry terms with their exact spelling and capitalisation per locale; copy uses only those forms (for example "control software", never "control-software" or "Control Software" mid-sentence).
Why: Terminology drift is the subtle inconsistency readers notice without naming it.
Gate: manual: checklists/new-page.md

### R-CONT-13 Lengths from the sections bylaw
MUST. Word and character limits in R-TYPO-07 and R-SEC-04 apply to every locale's copy, not only English.
Why: Translations that overflow break the layout limits in bylaw 03.
Gate: manual: checklists/new-locale.md

### R-CONT-14 Dates, times, currency
MUST. Dates are written out per locale (bylaw 11), times use the 24-hour clock with the time zone named, currencies show the symbol and ISO code once per page (€12,000 (EUR)).
Why: Corporate sites are read across borders.
Gate: manual: checklists/new-page.md

### R-CONT-15 Empty and error copy
MUST. Empty states say what is missing and offer one action ("No open roles right now. Subscribe to job alerts."). Error messages say what went wrong and how to fix it, in one sentence, without blame ("Enter an email address like name@company.com").
Why: These are the moments users most need help.
Gate: manual: checklists/new-component.md

### R-CONT-16 Alt text
MUST. Informative images get one sentence describing content and purpose (≤ 125 characters); decorative images get `alt=""`; images of text are not used; icons next to text get no alt (they are `aria-hidden`).
Why: WCAG 1.1.1 and good search signals.
Gate: a11y/image-alt

## Checklist

- [ ] R-CONT-01 voice preset applied
- [ ] R-CONT-02 sentence case
- [ ] R-CONT-03 punctuation rules
- [ ] R-CONT-04 number style
- [ ] R-CONT-05 verb-first buttons
- [ ] R-CONT-06 descriptive unique links
- [ ] R-CONT-07 no forbidden words
- [ ] R-CONT-08 title/description lengths
- [ ] R-CONT-09 reading level
- [ ] R-CONT-10 UI strings via i18n keys
- [ ] R-CONT-11 fiction marked in DECISIONS
- [ ] R-CONT-12 glossary respected
- [ ] R-CONT-13 limits per locale
- [ ] R-CONT-14 date/time/currency style
- [ ] R-CONT-15 empty and error copy
- [ ] R-CONT-16 alt text rules
