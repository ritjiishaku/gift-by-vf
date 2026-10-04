# Implementation Plan

## Overview
This project will move from a static catalogue with CSV-style data management into a CMS-powered storefront built on Next.js and Strapi. The goal is to replace spreadsheet-based updates with a client-friendly content management workflow while preserving the current referral and WhatsApp ordering flow.

## Phase 1: Discovery and data mapping
- Review the existing storefront pages and rep logic in the current static site.
- Audit the sample-data CSV files and map each tab to a corresponding CMS content type.
- Identify which content is editable by admin users and which content is rep-specific.
- Document shared business rules for pricing, visibility, ordering, publish status, and referral logic.

## Phase 2: CMS foundation
- Create the Strapi backend project and PostgreSQL database connection.
- Define content types for products, categories, gallery items, testimonials, why-us blocks, order steps, site settings, reps, payouts, and users.
- Add validation rules for required fields, pricing, image uploads, slug values, and publish states.
- Configure admin roles, rep access permissions, and secure media handling.

## Phase 3: Frontend rebuild
- Initialize the Next.js storefront and install required dependencies.
- Replace static HTML sections with API-driven rendering from the CMS.
- Build pages for home, product listing, product detail, portfolio, testimonials, and rep views.
- Maintain the premium visual language and mobile-friendly layout defined by the current design.

## Phase 4: Rep and conversion workflow
- Rebuild the rep dashboard from CMS data instead of static or spreadsheet-based records.
- Ensure share links retain rep referral identifiers and route correctly to the product page.
- Preserve WhatsApp order links and referral attribution for each purchase flow.
- Add rep-level restrictions to ensure sensitive payout and performance data stays protected.

## Phase 5: Data migration and quality assurance
- Import the legacy CSV data into the CMS collections.
- Verify field mapping for images, prices, descriptions, categories, and sorting.
- Check for broken product cards, missing media, hidden content, and empty rep records.
- Test admin CRUD actions for create, update, publish, hide, and delete across each collection.

## Phase 6: Launch and optimization
- Deploy the Strapi backend and PostgreSQL database to the chosen hosting provider.
- Deploy the Frontend to Vercel and configure environment variables.
- Validate media uploads, CMS permissions, and production API connectivity.
- Monitor the storefront and rep flows after launch, then refine content, UX, and performance as needed.

## Deliverables
- A working Strapi CMS with full content management capabilities
- A Next.js storefront consuming CMS content
- A rep dashboard with referral tracking and payouts
- A production-ready data migration from the current sample-data structure
- A documented process for future content updates without code changes

## Success criteria
- The client can manage products, reps, portfolio, testimonials, and site content via CMS without spreadsheet edits.
- The storefront remains premium, responsive, and conversion-focused.
- Reps can be created and managed through the CMS.
- Referral and WhatsApp ordering flows remain intact.
- The system is simple enough for a non-technical client to use confidently.
