# Gifts by VF CMS Upgrade

This repository contains the Next.js storefront and Admin CMS for Gifts by VF.

## Current state
- The Next.js storefront supports live product search/category filters, configurable site text, portfolio lightboxes, WhatsApp orders, and referral attribution.
- The protected rep portal supports product share links and rep-specific payout summaries.
- The protected admin includes product entry, rep/access-code management, payout records, and storefront settings, backed by local JSON content.

## Recommended stack
- Frontend: Next.js
- CMS/backend: Next.js App APIs + Local Store (or Strapi)
- Database: PostgreSQL / JSON Store
- Media hosting: Cloudinary or similar
- Deployment: Vercel + Render/Railway

## Features
- **Storefront**: Product catalogue with search, category filters, lightbox, WhatsApp order flow, and rep attribution.
- **Sales Rep Portal (`/reps`)**: Rep login by `repId`, access code security, WhatsApp referral links, and commission tracking.
- **Admin Dashboard (`/admin`)**: Product management (add/delete), sales rep management, payout tracking, and site settings.

## Local app and access
- Start the app from the repository root with `npm run dev`.
- Open the storefront at `http://localhost:3000`, the staff login at `/admin/login`, and rep portal at `/reps`.
- Admin credentials default to environment configurations.

