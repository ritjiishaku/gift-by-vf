# AGENTS.md

## Project role
This repository is the storefront for Gifts by VF. The project currently uses a static HTML/CSS/JS catalogue with CSV/Google Sheet-inspired data import support and a rep referral flow. The long-term direction is to replace manual spreadsheet updates with a proper CMS-driven system.

## Mission
Build a professional content-management workflow so the client can add, edit, hide, publish, and delete catalogue content without editing code or spreadsheets manually.

## Recommended architecture
- Frontend: Next.js
- Backend/CMS: Strapi
- Database: PostgreSQL
- Media storage: Cloudinary or object storage
- Deployment: Vercel for frontend, Render/Railway for backend

## Why this stack
- Next.js supports a premium storefront and strong SEO performance.
- Strapi gives the client a user-friendly admin dashboard for content management.
- PostgreSQL is reliable for transactional data, reps, payouts, and content relationships.
- This approach replaces spreadsheet-based workflows with a real CMS while preserving the existing WhatsApp ordering and referral experience.

## Product priorities
1. Replace sheet-based content management with a real CMS.
2. Support full CRUD for products, portfolio, testimonials, why-us, order steps, site settings, reps, and payouts.
3. Preserve WhatsApp ordering and referral flow.
4. Keep the storefront responsive and premium.
5. Keep the admin simple for a non-technical client.

## Core content types
- Products
- Product categories
- Gallery / portfolio items
- Testimonials
- Why-us sections
- How-to-order steps
- Site settings / branding
- Reps
- Payout entries and commission tracking
- User roles and admin access

## Core requirements
- Add/edit/delete products
- Add/edit/delete gallery items
- Add/edit/delete testimonials
- Add/edit/delete rep records
- Manage visibility, sorting, and status
- Support site text and branding updates
- Maintain WhatsApp order links
- Maintain rep tracking and payout data
- Keep the storefront synced with CMS updates
- Allow admin-only editing and rep-level access controls

## Implementation rules
- Do not use spreadsheet/manual updates as the final solution.
- Prefer CMS-driven content models over hardcoded HTML blocks.
- Keep the admin experience simple and client-friendly.
- Preserve referral logic and WhatsApp conversion flows.
- Keep performance and mobile UX in mind.
- Use a content model that maps directly to the current CSV tabs and business processes.

## Migration plan
- Export current sample-data content into CMS content types.
- Convert legacy CSV sections into Strapi collections.
- Rebuild storefront rendering to consume the CMS API.
- Add admin validation for required fields, pricing, media, and visibility.
- Keep rep links and payout logic working in the new data model.

## Setup steps for implementation
### 1. Local project setup
- Install Node.js LTS and package manager
- Create the Next.js frontend app
- Create the Strapi backend app
- Initialize PostgreSQL and confirm connection credentials

### 2. CMS content setup
- Create content types for products, categories, gallery items, testimonials, why-us, steps, settings, reps, and payouts
- Add required fields and validation rules
- Configure slug fields, published status, and admin permissions

### 3. Frontend integration
- Connect the storefront to the Strapi API
- Replace hardcoded static sections with CMS-driven data fetches
- Rebuild the rep page to read from CMS rep data
- Keep the existing WhatsApp order links and referral logic intact

### 4. Media and security
- Connect image storage provider
- Configure public and private media rules
- Protect admin routes and rep-sensitive data

### 5. Deployment and launch checklist
- Deploy database and backend to hosting service
- Deploy frontend to Vercel
- Populate environment variables
- Test all CRUD actions before full launch

## Files to treat as important
- index.html
- reps.html
- js/app.js
- js/reps.js
- css/style.css
- sample-data/README.md
- AGENTS.md
- PRD.md
- README.md

## Notes
The client expects a CMS that can manage everything they currently do with Google Sheets and forms, including reps, products, portfolio content, settings, and order/referral workflows.
