# Gifts by VF CMS Upgrade

This repository currently contains a storefront prototype and sample data for Gifts by VF. The next stage is to replace the current spreadsheet-based workflow with a proper CMS-managed content system for the business.

## Current state
- The Next.js storefront supports live product search/category filters, configurable site text, portfolio lightboxes, WhatsApp orders, and referral attribution.
- The protected rep portal supports product share links and rep-specific payout summaries.
- The protected admin includes product entry, rep/access-code management, payout records, and storefront settings, backed by local JSON content.
- Strapi/PostgreSQL are still a planned production backend; the current JSON store is suitable for local use, not multi-instance deployment.

## Target state
- Manage content through a real CMS dashboard.
- Support full CRUD operations for products, portfolio content, testimonials, reps, settings, and payouts.
- Keep the storefront and rep system working without manual spreadsheet edits.
- Enable the client to maintain the site independently.

## Recommended stack
- Frontend: Next.js
- CMS/backend: Strapi
- Database: PostgreSQL
- Media hosting: Cloudinary or similar
- Deployment: Vercel + Render/Railway

## Implementation plan
1. Audit the existing storefront and map current CSV content to CMS collections.
2. Create the Strapi backend with PostgreSQL and define the required content types.
3. Build the Next.js storefront and replace hardcoded sections with CMS-driven data.
4. Rebuild the rep dashboard and WhatsApp referral flow using CMS-connected content.
5. Migrate the sample data, validate CRUD, and test the full flow before launch.
6. Deploy the backend and frontend, configure production environment variables, and monitor the live system.

## Why this direction
This setup is a strong fit for a premium boutique storefront because it balances a polished customer-facing frontend with a simple admin experience. The client can manage content without touching code, while the storefront remains fast, mobile-friendly, and easy to maintain.

## CMS content model
The system should support these content collections:
- Products
- Categories
- Gallery / portfolio items
- Testimonials
- Why-us content blocks
- Order steps
- Site settings / branding
- Reps
- Payout records
- Admin and rep users

## Business goals
- Replace manual spreadsheet workflows with an admin panel
- Give the client direct control over content updates
- Preserve referral logic and WhatsApp conversion flows
- Keep the catalogue premium, conversion-focused, and easy to maintain

## Implementation notes
- Current CSV/Google Sheet data should be migrated into Strapi collections.
- The storefront should read content from the CMS API instead of static HTML blocks.
- Reps should be managed through the CMS as part of the same system.
- Product, rep, and portfolio records should support visibility toggles, ordering, and publishing states.

## Setup steps for the required stack
### 1. Prepare the local environment
- Install Node.js LTS (18 or 20 recommended)
- Install npm or pnpm
- Install PostgreSQL locally or use a managed service for development
- Install Git and create a repository branch for the CMS migration

### 2. Set up the CMS backend
- Create a Strapi project in a backend folder such as app-cms
- Configure PostgreSQL connection details in the Strapi environment file
- Create content types for products, categories, portfolio, testimonials, why-us, steps, site settings, reps, and payouts
- Set up admin roles for owner and rep access
- Enable media upload support and assign storage credentials

### 3. Set up the storefront frontend
- Create a Next.js app in a frontend folder such as storefront
- Install the required dependencies for fetching data from Strapi
- Build pages for home, product detail, rep page, and contact/WhatsApp ordering flow
- Reuse the current brand design and refactor the static catalogue into dynamic CMS-driven templates

### 4. Configure the data model
- Map each CSV tab to a content type in Strapi
- Add fields for title, slug, description, price, image, status, and ordering
- Add rep fields for name, contact, referral code, commission, active status, and payout history
- Add site settings for WhatsApp number, brand text, and hero message

### 5. Connect frontend to CMS
- Create environment variables for Strapi API URL and admin token
- Add fetch or server-side data loading in Next.js pages
- Build dynamic product listing, portfolio, testimonials, and rep pages
- Validate that the WhatsApp link includes referral data when applicable

### 6. Configure media and uploads
- Connect Cloudinary or equivalent storage to Strapi
- Ensure all product and portfolio images are uploaded through the CMS
- Use optimized image settings for mobile performance

### 7. Secure the admin and rep access
- Create admin account and role-based permissions
- Add rep login or restricted access for rep-specific views
- Protect payout and content-editing routes from unauthorized users

### 8. Deployment setup
- Deploy the Strapi backend to Render or Railway
- Deploy the Next.js frontend to Vercel
- Configure environment variables in both deployment environments
- Set up a production PostgreSQL database and confirm the API is connected correctly

### 9. Migration and validation
- Import the existing sample-data CSV files into the CMS content types
- Verify each product, testimonial, rep, and setting is rendering correctly
- Test product filters, visibility toggles, and WhatsApp ordering flow
- Test rep dashboards and referral attribution before launch

## Implementation plan
### Phase 1: Discovery and data mapping
- Review the current HTML storefront and rep behaviour in the existing static files
- Map each CSV tab to a CMS content type and required fields
- Confirm which content is editable by admin, rep, or both
- Document business rules for pricing, publishing, visibility, and referrals

### Phase 2: CMS foundation
- Create the Strapi project and PostgreSQL database
- Build content types for products, categories, portfolio, testimonials, why-us, steps, site settings, reps, payouts, and users
- Add validation, required fields, publish status, and sorting rules
- Configure role-based permissions and media handling

### Phase 3: Frontend rebuild
- Initialize the Next.js storefront
- Replace hardcoded sections with data fetched from the CMS API
- Build dynamic home, product, portfolio, testimonials, and rep pages
- Keep responsive styling and premium brand presentation consistent with the current site

### Phase 4: Rep and conversion workflow
- Rebuild rep dashboard and share links using CMS data
- Ensure WhatsApp purchase links retain referral parameters
- Validate commission logic and payout visibility for reps
- Add safeguards for rep-only access and restricted data

### Phase 5: Migration and quality assurance
- Import legacy sample data into the new CMS collections
- Check for broken links, missing images, pricing errors, and visibility issues
- Test admin CRUD workflows in the CMS
- Validate storefront rendering, rep flows, and mobile UX

### Phase 6: Launch and optimization
- Deploy backend and database to production hosting
- Deploy frontend to Vercel
- Configure environment variables and production media settings
- Monitor content updates, rep workflows, and conversion performance after launch

## Relevant repository sections
- index.html
- reps.html
- js/app.js
- js/reps.js
- css/style.css
- sample-data/
- AGENTS.md
- PRD.md
- README.md

## Summary
The project direction is now clear: build the catalogue as a Next.js storefront powered by Strapi and PostgreSQL, with full CMS control over products, reps, and marketing content while preserving the current WhatsApp and referral-driven ordering flow.

## Local app and access
- Start the app from the repository root with `npm run dev`.
- Open the storefront at `http://localhost:3000` and the staff login at `/admin/login`.
- The development-only admin password defaults to `giftbyvf-admin`; set `ADMIN_PASSWORD` before production deployment.
- Set strong random `ADMIN_SESSION_SECRET` and `REP_SESSION_SECRET` values in production. Reps sign in at `/reps` with the rep ID and access code configured by an admin.
- Public catalogue requests use `/api/content`. Admin and rep APIs return private records only after server-side authentication.
