# Gate report: reference

Date: 2026-10-17T19:16:46.192Z  Commit: 7f24a4d  OS: win32 x64
Node 24.19.0 · lighthouse 13.5.0 · tailwindcss 4.3.3 · eleventy 3.1.7 · pa11y 10.0.0 · vnu 26.10.12

| Gate | Result | Findings | Time |
|---|---|---|---|
| bylaws | pass | 0 | 0.0s |
| html | pass | 0 | 0.7s |
| consistency | pass | 0 | 0.0s |
| schema | pass | 0 | 0.0s |
| budget | pass | 0 | 0.0s |
| i18n | pass | 0 | 0.0s |
| links | pass | 0 | 0.0s |
| a11y | pass | 0 | 1.5s |
| lighthouse | pass | 0 | 61.2s |

## Lighthouse

Chrome 155.0.0.0 · 5 runs per page and profile, median reported · mobile: simulate (150ms RTT, 1.6Mbps, 4x CPU) · desktop: simulate (40ms RTT, 10.2Mbps, 1x CPU)

| Page | Profile | Perf | A11y | BP | SEO |
|---|---|---|---|---|---|
| /en/ | mobile | 100 | 100 | 100 | 100 |
| /en/ | desktop | 100 | 100 | 100 | 100 |

## Page weight

| Page | HTML | Total (mobile) |
|---|---|---|
| /en/ | 1458 B | 7054 B |

## Needs human review (axe incomplete)

- `a11y/color-contrast` http://127.0.0.1:57733/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > h1)
