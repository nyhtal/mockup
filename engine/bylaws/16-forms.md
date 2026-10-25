# 16 Forms

Purpose: every form on every site has the same field anatomy, validation behaviour, error handling and success flow, with no backend and no script. Sources: WCAG 2.2 SC 3.3.1–3.3.8, https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill, https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation.

### R-FORM-01 Method and destination
MUST. Forms use `method="get"` and `action="/<locale>/<form-slug>/thank-you/"`; the thank-you page reads nothing from the query string but exists for every form (R-PAGE-10). No form posts anywhere.
Why: A clickable flow with no server and no leaked data.
Gate: manual: checklists/new-component.md

### R-FORM-02 Field anatomy
MUST. Every field is the `field` primitive: `<div data-component="field">` containing `<label for>` (visible, with "(required)" when required), the control, optional help text `<p id="…-help">`, and an error text `<p id="…-error">` (rendered only in the error state), with `aria-describedby` on the control naming the help and error ids that exist.
Why: One anatomy makes every form familiar and accessible.
Gate: a11y/label

### R-FORM-03 Control classes
MUST. Text-like controls use `block w-full min-h-11 rounded-md border border-line-strong bg-surface-raised px-3 text-base text-ink placeholder:text-ink-muted` plus the focus ring; invalid-after-interaction styling uses `user-invalid:border-danger-strong` only (never `invalid:`), and disabled uses `disabled:opacity-60 disabled:cursor-not-allowed`.
Why: `:user-invalid` waits for the user; `:invalid` shouts on load.
Gate: manual: checklists/new-component.md

### R-FORM-04 Native validation
MUST. Validation is native: `required`, `type` (`email`, `tel`, `url`), `minlength`/`maxlength`, `pattern` with a `title` explaining the format; `novalidate` is never set. Error copy follows R-CONT-15.
Why: Native validation is accessible, localised by the browser and ships no code.
Gate: manual: checklists/new-component.md

### R-FORM-05 Autocomplete tokens
MUST. Controls carry the matching `autocomplete` token: `name`, `email`, `organization`, `organization-title`, `tel`, `street-address`, `postal-code`, `country-name`, `url`; and `inputmode="numeric"` or `"tel"` where appropriate.
Why: WCAG 1.3.5 and fewer keystrokes on phones.
Gate: a11y/autocomplete-valid

### R-FORM-06 Error summary
MUST. The error state of a form shows the `error-summary` component before the first field: a heading "Fix the following", a list of links to each invalid field, and `tabindex="-1"` on the summary so it can receive focus. The catalog shows this state statically on the style-guide page.
Why: WCAG 3.3.1 and 3.3.3; users must find every error.
Gate: manual: checklists/new-component.md

### R-FORM-07 Preserved input
MUST. Multi-step forms pass values forward as GET parameters and prefill via `value` attributes at build time for the mock flow; nothing already entered is asked again (R-A11Y-11). A stepped form declares `steps` and `stepPath`: each step submits to the next step's page, which the engine builds, and only the last goes to the thank-you page; a file field goes on the last step, since a file cannot travel in a GET URL (D68).
Why: WCAG 3.3.7.
Gate: manual: checklists/pre-delivery.md

### R-FORM-08 Submit button
MUST. One `button type="submit"` per form, primary variant, verb-first label specific to the form ("Request a demo", "Send message", "Subscribe"). No reset buttons.
Why: One obvious action; "Submit" tells the user nothing.
Gate: manual: checklists/new-component.md

### R-FORM-09 Spam control placeholder
MUST. Each form includes one honeypot text field inside a wrapper with `hidden`, `tabindex="-1"`, `autocomplete="off"` and `aria-hidden="true"`, named `website`; it is documented as the place a real deployment would add its anti-spam measure.
Why: Shows the pattern without shipping a captcha, which would fail the no-third-party rule and hurt accessibility.
Gate: manual: checklists/new-component.md

### R-FORM-10 Consent and privacy text
MUST. Forms that collect personal data show a one-sentence privacy note with a link to the privacy page above the submit button; marketing opt-in is an unchecked checkbox with its own label; no pre-ticked boxes.
Why: GDPR and the appearance of it.
Gate: manual: checklists/new-component.md

### R-FORM-11 File upload
MUST. The file field states accepted types and maximum size in its help text and sets `accept`; the mock flow never uploads.
Why: Expectations before the click.
Gate: manual: checklists/new-component.md

### R-FORM-12 Success page
MUST. The thank-you page confirms what happened ("We received your request"), says what happens next and when, and offers one next step; it is `noindex`.
Why: Closure for the user; no indexable duplicate.
Gate: manual: checklists/new-page.md

### R-FORM-13 Layout
MUST. Fields stack with `space-y-6`; short related fields (postal code and city) sit in `grid md:grid-cols-2 gap-6`; labels sit above controls, never beside or inside them; placeholder text is an example, never the label.
Why: Vertical forms read fastest and localise without breaking.
Gate: manual: checklists/new-component.md

### R-FORM-14 Pending state
MUST. The submit button has a documented pending state (`disabled` plus spinner icon and "Sending…" text) shown on the style-guide page; it is never triggered in the mock because submission is a navigation.
Why: The real deployment will need it, and it must look like the rest.
Gate: manual: checklists/new-component.md

## Checklist

- [ ] R-FORM-01 GET to thank-you
- [ ] R-FORM-02 field anatomy with describedby
- [ ] R-FORM-03 control classes, user-invalid
- [ ] R-FORM-04 native validation, no novalidate
- [ ] R-FORM-05 autocomplete tokens
- [ ] R-FORM-06 error summary state
- [ ] R-FORM-07 values carried forward
- [ ] R-FORM-08 one specific submit
- [ ] R-FORM-09 honeypot placeholder
- [ ] R-FORM-10 privacy note, unticked opt-in
- [ ] R-FORM-11 file field expectations
- [ ] R-FORM-12 success page content
- [ ] R-FORM-13 vertical layout
- [ ] R-FORM-14 pending state documented
