# Agent-operated sites: what I would do, and where it is weak

Date: 2026-10-19. Status: brainstorm, not a spec. Nothing here is decided.

Inputs: my own sketch; two independent Codex runs (one designed blind from the idea alone, one critiqued my sketch); the engine as it stands in `engine/` and the reference site. Grok could not be consulted: the CLI has no API key configured.

## 1. The idea and the four promises it makes

Turn the mockup engine into a product where a small business owner maintains their own website by talking to an agent. "Write a post about X", "make the hero calmer", "add a careers page", "send enquiries to my CRM". The owner's repo holds the site and everything needed to build it, so they are never stranded if the product dies. The owner (you) would like the rules and judgment to stay private. Changes should be previewed and approved before going live.

Those are four promises, and two of them pull against each other:

1. **Talk to it.** Chat-speed changes to content and design.
2. **It is yours.** The repo builds without us.
3. **The brain is private.** Rules, prompts, taste stay with us.
4. **Nothing goes live unapproved.**

Promise 2 and promise 3 cannot both be fully true. If the site builds without us, the catalog, the theme, the build tools and the gates are in the customer's repo, and the gates reveal the bylaws. Both Codex runs reached the same resolution I did, independently: **ship the deterministic contract, keep the judgment.** The engine, bylaws, checklists and gates go in the repo. Orchestration, system prompts, onboarding flow, model routing, the approval UI, billing and the taste layer stay private. That is the only honest version of "private brain", and it is enough. The moat is operational, not the code.

## 2. The shape I would choose

"Customer-owned repository, agent-operated, service-maintained." The blind Codex design put it better: Claude Code is an implementation detail, not the customer experience. The customer sees Preview, Request changes, Publish. They never see a branch.

### Layer 1: the customer's repo (complete, self-sufficient)

- `engine/` vendored as a pinned snapshot, never fetched from a registry at build time. Engine upgrades arrive as their own pull requests, never mixed into a content change.
- `site/`: brief, `site.json`, i18n, data, content, `assets/` (their real images), `extensions/` (site-local page compositions and component variants, see change lanes below), `DECISIONS.md`.
- `CLAUDE.md` and skills: how any Claude Code instance operates this site. Which checklist for which request, the change lanes, never edit `engine/`, always build and gate before opening a PR, how to write the PR summary for a non-technical reader.
- Workflows: one that runs the agent on a request and opens a PR; one that builds a PR into a preview; one that deploys `main`.
- The model credential is a repo secret. By default it points at our proxy (`ANTHROPIC_BASE_URL` plus a token we mint and bill). The customer can swap in their own Anthropic key and nothing else changes. That one line is the independence guarantee for the agent. The site itself needs no key at all.

### Layer 2: the engine (ours, versioned, de facto open)

- A **production profile** next to the mockup profile. The mockup rules that must invert: fictional content mandatory, real contact details forbidden, placeholder images, GET forms to thank-you pages, no analytics, no cookies. Production needs verified business facts, licensed assets, a working form destination, privacy disclosures that match what actually runs. This is the biggest hidden cost in the whole idea. Most of the engine carries over unchanged, which is the good news.
- A local MCP tool server (`engine/tools/mcp.js`) with typed, validated operations: add or update an entity, add a page from the inventory, set brand tokens, set navigation, add an extension, build, gate, summarise the diff. The agent edits through these instead of free-form JSON, so fewer bylaws need to be in context and bad writes fail before the build. Note from the critique: this is convenience and quality, **not** a security boundary. An agent with a shell can bypass it.
- A `pathPrefix` build option (the build has none today) so a preview can live under a sub-path, and a `<meta http-equiv>` CSP fallback for hosts that cannot send headers.

### Layer 3: our service (private, optional, what people pay for)

- A GitHub App installed on the customer's repo with contents, pull-requests and checks permissions and **without** the workflows permission, so the agent's token physically cannot change the workflows that enforce publication.
- Onboarding: import the existing site if there is one, collect the authoritative business facts and licensed assets, fill the brief, scaffold the repo from a template, connect hosting and the domain, first deploy.
- The approval surface: a request box, and a "pending changes" list where each agent PR is a card with the changed pages, a mobile and desktop preview, every affected language, what changed functionally, and Publish / Ask for changes / Discard. Approval is bound to the tested commit; any later edit invalidates it. Publish is a squash-merge behind branch protection. Rollback is a revert and redeploy.
- Key proxy and billing. Engine-update PRs. Optionally a remote "judgment" MCP (brief to page composition, design review of a diff) that holds our best prompts and never ships.

### Change lanes the agent enforces

1. **Content and configuration.** Posts, people, jobs, opening hours, brand hue, navigation, enabling a page type from the inventory. Data files only. The 90 percent case.
2. **Site-local extensions, within contracts.** A new page composition from existing sections, a component variant exposed by the catalog, a section with site-specific limits. Lives in `site/extensions/`, flagged in the PR summary, still gated. My sketch had unrestricted template shadowing here and Codex rightly objected: that creates bespoke forks whose maintenance we silently inherit. Versioned variants and explicit extension points instead.
3. **Engine changes.** A genuinely new component or page type for everyone. Done in the engine repo, shipped to all customers as an update PR. My sketch turned a customer's "add a page type" into an upstream issue they wait on. That is bad product behaviour. Lane 2 has to absorb most of those requests; lane 3 is for what is reusable.

### Where the agent runs

Three real options, and the choice is the hinge of the design.

| | GitHub Actions running Claude Code | Anthropic Managed Agents (hosted sandbox) | Our own sandbox orchestrator |
|---|---|---|---|
| Who hosts the loop | GitHub, in the customer's repo | Anthropic | Us |
| Independence | Strongest: the workflow runs with the customer's own key if we vanish | Depends on Anthropic, not on us; the repo still has the workflow path | Weakest |
| Approval gate | PR plus branch protection | `always_ask` permission policy pauses the session until we confirm, plus PR | Whatever we build |
| Credentials | Repo secrets, App token without workflows permission | Repo token routed through Anthropic's git proxy, never inside the sandbox | Ours to get right |
| Cost shape | Customer's Actions minutes plus our tokens; cold builds slow | Per session, hard dollar budget per session | Infra plus tokens |
| Latency | Minutes to a preview | Seconds to start; live dev server possible | Same as Managed Agents |
| Build effort for us | Near zero | Small: agent config, session glue, event stream | Large |

For version one publishing, **Actions**. It is the cheapest, the most independent, and the approval flow falls out of PRs. For the later interactive design mode (the "change this widget while I watch" experience that needs a live preview and sub-minute turns), **Managed Agents**. It is almost exactly the "cloud setup of Claude Code" you described, with the repo mounted as a resource, the git token kept out of the sandbox by a proxy, `always_ask` on destructive tools as the human checkpoint, and a per-session budget cap. We should not build a sandbox orchestrator ourselves. The blind Codex design also rejected "a cloud Claude Code account per customer plus a private MCP brain" for exposing a developer workflow and tying continuity to our service.

### Hosting

GitHub as the repository, **Cloudflare Pages as the host**, GitHub Pages as a degraded fallback. GitHub Pages cannot send response headers, so the engine's CSP, HSTS, cache and staging no-index rules cannot be honoured there. It has no pull-request previews and one site per repo. And its own terms say it is not meant to run a business's online presence or anything primarily directed at commercial transactions. A brochure site is a grey area, but a paid product should not stand on a grey area. Cloudflare Pages supports `_headers`, `_redirects`, per-branch previews and custom domains on a free tier, at the cost of a second account at onboarding. Cloudflare is steering new projects toward Workers with static assets; Pages still works and is the lower-risk choice for a `_headers` and `_redirects` workflow today.

## 3. Critique: where this is weak

Merged from my own list and the two Codex runs. The ones that changed my mind are marked.

### Product

- **The mockup-to-production inversion is the biggest hidden cost.** Fictional-content rules, no-PII rules, placeholder images, GET forms, no analytics. Each is a bylaw with a gate. Each needs a production counterpart, and the bylaws must stay coherent as a rulebook when two profiles exist.
- **Forms cannot wait for version two** (changed my mind). I had punted forms and CRM because a static host has no server. Codex's critique is right that for this audience, receiving an enquiry is often the website's purpose. Version one ships one supported form provider under the customer's account, spam protection, delivery visibility and a recovery path. General CRM integration can wait; "I get the enquiry" cannot.
- **Latency.** Three to eight minutes from request to preview on the Actions path. Fine for publishing. Wrong for iterating on a design. Hence the two modes above, and the interactive one is the expensive one.
- **GitHub onboarding is friction** (changed my mind on the default). A small business owner does not want to create a GitHub account, install an App and connect Cloudflare. Codex's critique suggests managed onboarding, with customer-owned repository as the option and a tested transfer path. I would keep "it is already in your account" as the default for the pilot because it makes the independence promise a fact rather than a feature, but concierge onboarding has to hide every step of it.
- **Multi-locale strictness.** The build fails when a locale lacks content, so on a three-locale site every content request forces the agent to draft translations and the approval card must show every language. For one-locale small businesses it is a non-issue, and launch should be one locale.
- **Images in git.** Files over 100 MiB are blocked and GitHub recommends staying under about 1 GB. Replaced images accumulate in history. Fine for a plumber, wrong for a photographer.

### Platform facts to respect

- **Vendoring is not "builds forever."** The README's own setup downloads the Nu checker with a Windows-only pin, needs a local Chrome for two gates, and depends on native binaries (sharp, ffmpeg). Independence needs a pinned build environment (a container image or devcontainer committed to the repo), vendored or mirrored binaries, and a restore drill from a clean machine at least yearly.
- **PRs opened with the default Actions token do not trigger other workflows.** The preview and deploy workflows will not run on an agent PR unless the agent uses a GitHub App token or the triggering is wired deliberately. Easy to miss, hard to debug.
- **Actions minutes are per account and plan, not per repo.** Public repos are free on standard runners but expose drafts. Cloudflare's free tier has its own build and project quotas. Neither changes the support economics.
- **The OIDC exchange yields our proxy credential, not an Anthropic key.** The "swap in your own key" path must be an explicit, documented configuration, not an assumption.

### Security

- **Gates are not a security boundary** (sharpened by the critique). An agent with a shell can bypass typed writes, alter checks or read any secret in its job. Untrusted generation and trusted validation must be separate: the agent job gets contents and pull-requests write only; the build, gate and deploy run in separate workflows from `main` that the agent's token cannot modify; approval binds to the exact tested commit; the agent never holds a deploy credential or can approve itself.
- **Prompt injection through content.** A blog post, an imported page or a form submission can carry instructions. The deterministic gates catch the worst outcomes (an external script, a CSP breach), the human approval catches the rest, and the agent's narrow permissions bound the blast radius.

### Economics, abuse, day 400

- Content edits and design requests have very different token and time costs. Price or cap them differently. A turn cap bounds one run, not a frustrated customer retrying five times. Measure tokens, failed runs, build minutes, onboarding labour and support minutes per customer before setting a price.
- Fraudulent businesses, phishing pages, unauthorised edits, asset rights, personal data in prompts and logs, deletion requests, complaints, suspension. Someone owns each of these before the second customer.
- Day 400 is maintenance: expired domains, revoked App installations, changed APIs, unavailable dependencies, abandoned extensions, customers who never approve update PRs. Define support windows, backup and restore, and what happens after cancellation.

### The framing

I wrote "the repo is the product, the service is convenience." Codex's critique reframed it better: **the repo is the exit asset; the service is maintained publishing, reliable integrations, recovery and accountability.** Portability does not destroy recurring value, it exposes whether any exists. Promise continuity and replaceability, sell dependable operation.

## 4. What I would do first, and what I would refuse

Revised order, taking the critique's point that the first milestone is reliable publishing, not an architecture.

1. **Find three real businesses in one narrow segment** (professional services publishing service pages and articles, one locale) and establish willingness to pay. Nothing below matters without this.
2. **Production profile for the engine**, extension lane, MCP tool server, `CLAUDE.md` and skills. Dogfood on this repo first: operate the reference site through issues before any service code exists.
3. **One production site end to end by hand**: domain, working enquiries, factual content, rollback. Concierge everything. Learn the real request mix.
4. **The Actions-driven publishing loop** with isolated generation, trusted validation and revision-bound approval, surfaced as PR cards.
5. **Measure** cost, completion rate and support burden through concierge operation. Then automate onboarding, billing and engine updates around what repeats.
6. **Later**: interactive design sessions on Managed Agents, broad design extensions, multi-locale workflows, CRM relays.

Refuse in version one: arbitrary widget redesigns, customer-authored page types outside the extension contracts, general CRM integration, autonomous publishing without approval, and anything that exposes a terminal or IDE to the customer. A curated catalog with bounded brand controls keeps quality, cost and support predictable.

## 5. Decisions only you can make

- Which segment, and how many locales at launch. One locale changes the economics of every content request.
- Cloudflare Pages by default despite the second account, or GitHub Pages despite its terms and missing headers.
- How much design freedom in version one: curated catalog plus brand controls, or the extension lane open from day one.
- Concierge for the first customers, or self-serve from the start.
- How private the brain must be. If "the gates reveal the rules" is unacceptable, the independence promise has to shrink to "export your site" and the whole design changes.
- Whether the first customer is you: running Northwind's successor through this loop for a month would answer half the questions above for free.
