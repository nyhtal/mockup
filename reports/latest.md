# Gate report: reference

Date: 2026-10-17T19:50:12.725Z  Commit: 9730de1  OS: win32 x64
Node 24.19.0 · lighthouse 13.5.0 · tailwindcss 4.3.3 · eleventy 3.1.7 · pa11y 10.0.0 · vnu 26.10.12

| Gate | Result | Findings | Time |
|---|---|---|---|
| bylaws | pass | 0 | 0.0s |
| html | pass | 0 | 0.9s |
| consistency | pass | 0 | 0.0s |
| schema | pass | 0 | 0.0s |
| budget | pass | 0 | 0.0s |
| i18n | pass | 0 | 0.0s |
| links | pass | 0 | 0.1s |
| a11y | pass | 0 | 9.2s |
| lighthouse | pass | 0 | 357.8s |

## Lighthouse

Chrome 155.0.0.0 · 5 runs per page and profile, median reported · mobile: simulate (150ms RTT, 1.6Mbps, 4x CPU) · desktop: simulate (40ms RTT, 10.2Mbps, 1x CPU)

| Page | Profile | Perf | A11y | BP | SEO |
|---|---|---|---|---|---|
| /404.html | mobile | 100 | 100 | 100 | n/a (noindex) |
| /404.html | desktop | 100 | 100 | 100 | n/a (noindex) |
| /500.html | mobile | 100 | 100 | 100 | n/a (noindex) |
| /500.html | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/404/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/404/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/500/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/500/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/ | mobile | 100 | 100 | 100 | 100 |
| /en/ | desktop | 100 | 100 | 100 | 100 |
| / | mobile | 100 | 100 | 100 | n/a (noindex) |
| / | desktop | 100 | 100 | 100 | n/a (noindex) |

## Page weight

| Page | HTML | Total (mobile) |
|---|---|---|
| /404.html | 3803 B | 66750 B |
| /500.html | 3838 B | 66785 B |
| /en/404/ | 4000 B | 66947 B |
| /en/500/ | 4035 B | 66982 B |
| /en/ | 4208 B | 67927 B |
| / | 1124 B | 61925 B |

## Needs human review (axe incomplete)

- `a11y/color-contrast` http://127.0.0.1:49715/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > h1)
- `a11y/color-contrast` http://127.0.0.1:49715/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > h1)
