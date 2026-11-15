# Nuvex Frontend — Agent Instructions

## Product
Build a premium, modern, fast, accessible headless commerce frontend. WordPress is the content CMS and WooCommerce owns commerce state, inventory, pricing and orders. Do not replace these systems.

## Architecture
- Next.js App Router + TypeScript (strict) + Tailwind CSS 4.
- Prefer Server Components, server-side API calls, semantic HTML and small client components.
- WordPress content via WP REST API; storefront/catalog/cart/checkout via WooCommerce Store API.
- Respect WordPress publication statuses and WooCommerce stock and price data. Never fabricate inventory or discounts.
- Centralize API contracts in src/lib and shared types in src/types. Handle loading, empty, and error states.
- Never access MySQL directly from the browser or hardcode content in place of live API data.

## Visual and UX principles
- Premium minimalist editorial aesthetic; clear hierarchy, generous spacing, deliberate typography, polished responsive layouts.
- Mobile-first; use 4/8px spacing rhythm; consistent radii and typography; accessible contrast.
- Semantic color tokens instead of arbitrary colors scattered through components. Keep brand customizable.
- Product cards: image, name, formatted price, availability, visible clear CTA.
- Use real assets; if missing, use elegant accessible placeholders, never invent product photography or branding.
- Navigation and forms must support keyboard access, visible focus, proper labels and WCAG 2.2 AA where practical.
- Avoid flashy animations, excessive gradients, clutter, misleading urgency and intrusive pop-ups.
- Respect prefers-reduced-motion; optimize Core Web Vitals and image loading.

## Content & SEO
- Spanish (Guatemala) by default. Render GTQ with locale es-GT unless changed in site config.
- Render unique title, description, canonical, Open Graph, sitemap and robots as appropriate.
- Prefer clean URLs, proper headings and structured product metadata when validated.

## Security — non-negotiable
- All secrets, API keys, tokens and WooCommerce administrator credentials live in Hostinger production environment variables (local .env.local only for development).
- Never commit .env.local/.env.production, API keys, passwords, access tokens or logs containing them.
- NEXT_PUBLIC_ variables are exposed to the browser; NEVER put secrets in them.
- Server-side operations requiring secrets stay server-side. Validate inputs; prevent accidental leakage in logs and error responses.
- Do not claim checkout/payment integration is ready until verified against the installed gateway.

## Development workflow
- main is production; develop integrates tested changes; feature/* is for individual tasks.
- Prefer small reusable, typed components. Do not add new dependencies without a clear need.
- Run npm run typecheck, npm run lint and npm run build before proposing deployment.
- Document new environment variables in .env.example, without real credentials.
- A page is not done without responsive, error/empty/loading, accessibility and SEO checks.
