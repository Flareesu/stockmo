---
name: seo-web-vitals
description: Use this skill for search engine optimization, Core Web Vitals, meta tags, structured data (JSON-LD), Open Graph, sitemap generation, robots.txt, and crawlability. Trigger whenever someone mentions "SEO", "meta tags", "Core Web Vitals", "structured data", "schema markup", "Open Graph", "sitemap", "robots.txt", or "page speed".
---

# 18 — SEO & Web Vitals

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### Optimization by Metric

**LCP**: Optimize the largest visible element on initial viewport.
- Preload hero images: `<link rel="preload" as="image" href="...">`
- Use CDN for all static assets
- Server-side render above-the-fold content
- Set explicit dimensions on images/videos

**INP**: Make interactions respond within one frame.
- Break long tasks (> 50ms) with `scheduler.yield()`
- Minimize main-thread JavaScript
- Use `content-visibility: auto` for off-screen content

**CLS**: Prevent layout shifts.
- Always set `width` and `height` on images and video
- Reserve space for dynamic content (ads, embeds)
- Use CSS `aspect-ratio` for responsive media

## Meta Tags Template

```html
<head>
  <title>{Page Title} | {Site Name}</title>
  <meta name="description" content="{150-160 character description}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="{canonical URL}" />
  <!-- Open Graph -->
  <meta property="og:title" content="{Title}" />
  <meta property="og:description" content="{Description}" />
  <meta property="og:image" content="{1200x630 image URL}" />
  <meta property="og:url" content="{Page URL}" />
  <meta property="og:type" content="website" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
</head>
```

## Structured Data (JSON-LD)
Add to every page type. Validate with Google Rich Results Test.
Common schemas: Organization, Product, Article, FAQ, HowTo, BreadcrumbList

## Technical SEO Checklist
- [ ] Sitemap at `/sitemap.xml` (auto-generated, submitted to Search Console)
- [ ] `robots.txt` configured (block admin, API, staging)
- [ ] Canonical URLs on all pages
- [ ] 301 redirects for changed URLs (never 302 for permanent moves)
- [ ] HTTPS everywhere, no mixed content
- [ ] Mobile-friendly responsive design
- [ ] Page load < 3 seconds on 3G
- [ ] No broken links (crawl monthly)
- [ ] Proper heading hierarchy (single H1, logical H2-H6)
- [ ] Image alt text on all images
- [ ] Internal linking strategy

## External Skills (skills.sh)
```bash
npx skills add coreyhaines31/marketingskills/seo-audit
npx skills add coreyhaines31/marketingskills/programmatic-seo
npx skills add supercent-io/skills-template/schema-markup
npx skills add coreyhaines31/marketingskills/ai-seo
npx skills add resciencelab/opc-skills/seo-geo
```
