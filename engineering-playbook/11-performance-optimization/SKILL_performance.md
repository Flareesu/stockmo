---
name: performance-optimization
description: Use this skill for optimizing application performance including caching, CDN strategy, bundle size reduction, rendering optimization, database query tuning, image optimization, lazy loading, and Core Web Vitals improvement. Trigger whenever someone mentions "performance", "slow", "caching", "CDN", "bundle size", "lazy loading", "Core Web Vitals", "LCP", "FID", "CLS", "optimization", or "speed".
---

# 11 — Performance Optimization

## Performance Budget

Define before building, enforce in CI:

| Asset | Budget |
|-------|--------|
| Total JS (gzipped) | < 200KB |
| Total CSS (gzipped) | < 50KB |
| Largest image | < 200KB |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | < 600ms |
| API response (p95) | < 500ms |

## Frontend Performance

### Bundle Optimization
- Enable tree shaking (ESM imports only, no `require()`)
- Code-split by route (dynamic imports)
- Analyze bundle: `next build --analyze` or `webpack-bundle-analyzer`
- Replace heavy libraries: moment.js → date-fns, lodash → lodash-es (import specific functions)
- Externalize large dependencies to CDN when possible

### Image Optimization
- Use `<Image>` component (Next.js) or `<picture>` with `srcset`
- Serve WebP/AVIF with fallbacks
- Lazy-load below-fold images (`loading="lazy"`)
- Set explicit `width` and `height` to prevent CLS
- Use responsive sizes: `sizes="(max-width: 768px) 100vw, 50vw"`

### Rendering Performance
- Avoid layout thrashing (batch DOM reads, then writes)
- Use `will-change` sparingly for animated elements
- Virtualize lists > 100 items
- Debounce scroll/resize handlers (150ms)
- Use `requestAnimationFrame` for visual updates
- Minimize React re-renders: `React.memo`, `useMemo`, `useCallback` (only when profiler shows issues)

## Backend Performance

### Database Query Optimization
- Index all columns used in WHERE, JOIN, ORDER BY
- Use `EXPLAIN ANALYZE` on every slow query (> 100ms)
- Paginate all list endpoints (never return unbounded results)
- Use connection pooling
- Read replicas for read-heavy workloads
- Materialized views for complex dashboards

### Caching Layers
```
Browser Cache (static assets, 1 year)
  → CDN Cache (HTML, API responses, minutes-hours)
    → Application Cache (Redis, computed values, minutes)
      → Database Query Cache (prepared statements, connection pool)
```

### API Response Optimization
- Enable gzip/brotli compression
- Use `ETag` and `If-None-Match` for conditional requests
- Return only needed fields (sparse fieldsets)
- Batch related API calls into single endpoints
- Use HTTP/2 or HTTP/3 for multiplexing

## Monitoring Performance
- Set up Real User Monitoring (RUM): Vercel Analytics, Web Vitals
- Track p50, p95, p99 — not averages
- Alert on performance regression (> 20% degradation)
- Run Lighthouse in CI, fail on score drop

---

## External Skills (skills.sh)
```bash
npx skills add supercent-io/skills-template/performance-optimization
npx skills add wshobson/agents/python-performance-optimization
```
