---
layout: base.njk
title: Home
description: Northwind Dynamics builds industrial automation that teams actually enjoy using.
pageType: home
---
{% from "primitives/picture.njk" import picture %}
<div class="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
<h1 class="text-4xl md:text-5xl font-bold tracking-tight text-balance">{{ site.name }}</h1>
<p class="mt-4 text-lg md:text-xl text-ink-muted">{{ site.tagline }}</p>
<div class="mt-12 overflow-hidden rounded-xl">
{{ picture({ slug: "hero-automation", ratio: "16:9", alt: "Abstract shapes in the brand colours standing in for a photograph of a factory floor.", max: 1600 }, { priority: true, sizes: "(min-width: 80rem) 80rem, 100vw", class: "aspect-video w-full object-cover" }) }}
</div>
</div>
