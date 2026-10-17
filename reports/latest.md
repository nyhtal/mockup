# Gate report: reference

Date: 2026-10-17T22:49:47.773Z  Commit: f1ec51c  OS: win32 x64
Node 24.19.0 · lighthouse 13.5.0 · tailwindcss 4.3.3 · eleventy 3.1.7 · pa11y 10.0.0 · vnu 26.10.12

| Gate | Result | Findings | Time |
|---|---|---|---|
| bylaws | pass | 0 | 0.0s |
| html | pass | 0 | 1.3s |
| consistency | pass | 0 | 0.1s |
| schema | pass | 0 | 0.0s |
| budget | pass | 0 | 0.1s |
| i18n | pass | 0 | 0.0s |
| links | pass | 0 | 0.2s |
| a11y | pass | 0 | 23.2s |
| lighthouse | pass | 0 | 917.9s |

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
| /en/style-guide/components/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/components/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/controls/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/controls/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/primitives/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/primitives/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-b/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-b/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-c/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-c/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-d/ | mobile | 100 | 100 | 100 | n/a (noindex) |
| /en/style-guide/sections-d/ | desktop | 100 | 100 | 100 | n/a (noindex) |
| / | mobile | 100 | 100 | 100 | n/a (noindex) |
| / | desktop | 100 | 100 | 100 | n/a (noindex) |

## Page weight

| Page | HTML | Total (mobile) | Total over gzip |
|---|---|---|---|
| /404.html | 13724 B | 118242 B | 65558 B |
| /500.html | 13763 B | 118281 B | 65552 B |
| /en/404/ | 13921 B | 118439 B | 65586 B |
| /en/500/ | 13960 B | 118478 B | 65582 B |
| /en/ | 44179 B | 174540 B | 95536 B |
| /en/style-guide/components/ | 51697 B | 170448 B | 85440 B |
| /en/style-guide/controls/ | 51740 B | 163190 B | 78579 B |
| /en/style-guide/ | 29084 B | 133602 B | 67207 B |
| /en/style-guide/primitives/ | 38696 B | 153174 B | 78922 B |
| /en/style-guide/sections/ | 71095 B | 197885 B | 94733 B |
| /en/style-guide/sections-b/ | 79756 B | 209488 B | 98724 B |
| /en/style-guide/sections-c/ | 79314 B | 187027 B | 76318 B |
| /en/style-guide/sections-d/ | 57419 B | 183075 B | 92443 B |
| / | 1233 B | 102958 B | 60646 B |

## Needs human review (axe incomplete)

- `a11y/color-contrast` http://127.0.0.1:65100/404.html — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/404.html — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/500.html — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/500.html — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/404/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/404/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/500/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/500/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(2) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(4) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(5) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(6) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(1) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(2) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > h2)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > p)
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > div > a:nth-child(2))
- `a11y/color-contrast` http://127.0.0.1:65100/en/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(4) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(4) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > div:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > div:nth-child(3) > figure > figcaption > span:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > ul > li:nth-child(1) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > ul > li:nth-child(2) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > ul > li:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/components/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/controls/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/controls/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(5) > div:nth-child(3) > aside > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/controls/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(3) > span:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(3) > span:nth-child(2) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(3) > span:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(4) > svg:nth-child(1) > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(4) > svg:nth-child(2) > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > div > section:nth-child(8) > div:nth-child(4) > svg:nth-child(3) > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/primitives/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(2) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(4) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(5) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div > ul > li:nth-child(6) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(13) > div > div > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(13) > div > div > figure > figcaption > span:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(14) > div > div:nth-child(2) > ul > li:nth-child(1) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(14) > div > div:nth-child(2) > ul > li:nth-child(2) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(14) > div > div:nth-child(2) > ul > li:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(15) > div > div:nth-child(2) > ul > li:nth-child(1) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(15) > div > div:nth-child(2) > ul > li:nth-child(2) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(15) > div > div:nth-child(2) > ul > li:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(15) > div > div:nth-child(2) > ul > li:nth-child(4) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(16) > div > h2)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(16) > div > p)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(16) > div > div > a:nth-child(2))
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(19) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(19) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(19) > div > div:nth-child(2) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(19) > div > div:nth-child(2) > ul > li:nth-child(4) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(20) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(20) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(20) > div > div:nth-child(2) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(20) > div > div:nth-child(2) > ul > li:nth-child(4) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > div > div:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(18) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(18) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(18) > div > div:nth-child(2) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-b/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-c/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-c/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-c/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(8) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-c/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(3) > div > div:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(4) > div > div > div > aside > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > div:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/en/style-guide/sections-d/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > header > div > a > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(1) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(2) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(3) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(4) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(5) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(2) > div > div > ul > li:nth-child(6) > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(1) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(2) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(6) > div > div:nth-child(2) > ul > li:nth-child(3) > figure > figcaption > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(1) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(2) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(7) > div > div:nth-child(2) > ul > li:nth-child(3) > div > svg > text)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > h2)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > p)
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (#main > section:nth-child(9) > div > div > a:nth-child(2))
- `a11y/color-contrast` http://127.0.0.1:65100/ — Elements must meet minimum color contrast ratio thresholds (https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=axeAPI) (html > body > footer > div > div:nth-child(1) > a:nth-child(1) > svg > text)
