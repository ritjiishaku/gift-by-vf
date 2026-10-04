# Product Requirements Document (PRD)

## Product overview
Gifts by VF is a gifting and jewellery catalogue focused on personalized items, acrylic art, corporate gifting, and premium product presentation. The business currently relies on static storefront content and spreadsheet-style data management. The target solution is a CMS-driven storefront that allows the owner to manage content and rep operations without code changes or manual spreadsheet updates.

## Recommended solution architecture
- Frontend: Next.js
- CMS/backend: Strapi
- Database: PostgreSQL
- Media: Cloudinary or equivalent image hosting
- Deployment: Vercel + Render/Railway

This architecture gives the management team a simple admin dashboard while preserving a fast, premium customer storefront.

## Goals
- Let the client manage all content through a CMS dashboard
- Replace Google Sheet/form-driven updates with a real CMS
- Keep the storefront polished and conversion-focused
- Preserve WhatsApp ordering and referral attribution
- Support rep management and payout records
- Reduce dependency on manual spreadsheet edits

## Target users
- Business owner / admin
- Sales reps
- Buyers browsing the catalogue

## Core user stories
### Admin
- As an admin, I want to add products so I can update the catalogue quickly.
- As an admin, I want to edit product images, pricing, descriptions, and inventory status so offers stay current.
- As an admin, I want to hide or delete outdated items so the catalogue stays relevant.
- As an admin, I want to manage reps so the sales team can share referral links and track performance.
- As an admin, I want to edit site text and branding so the storefront stays consistent.
- As an admin, I want to manage gallery, testimonials, and order-step content without requiring code changes.

### Reps
- As a rep, I want to access my share links and commission information.
- As a rep, I want to share product links with buyers.
- As a rep, I want to see my referral conversion flow in a clean dashboard.

### Buyer
- As a buyer, I want to browse catalogue products and order quickly on WhatsApp.
- As a buyer, I want to see the correct referral attribution when I open a rep link.
- As a buyer, I want a mobile-friendly premium shopping experience.

## Functional requirements
- Full CRUD for all core content sections
- Product search and category filtering
- Product image upload and media management
- Gallery / portfolio item management
- Testimonial management
- Why-us and order-step management
- Site settings and brand text editing
- User role management for admins and reps
- Rep activation/deactivation
- Payout tracking support
- WhatsApp order links with product and referral data
- Sorting and visibility controls for all collections
- Draft/publish functionality for content items
- API-based storefront integration with the CMS

## Data model requirements
The CMS must support the following collections:
- Products
- Categories
- Portfolio items
- Testimonials
- Why-us blocks
- How-to-order steps
- Site settings
- Reps
- Payouts
- Admin users and rep users

## Non-functional requirements
- Mobile-responsive storefront
- Fast page loads and SEO-friendly rendering
- Easy-to-use admin experience for non-technical staff
- Secure data handling and role-based access
- Scalable architecture for future growth
- Clear data validation for product fields, pricing, and image uploads

## Migration requirements
- Existing CSV content must be imported into the CMS collections.
- Current product and rep flows should remain operational after migration.
- Existing referral logic must be preserved in the new system.
- All content needs to be editable from the CMS without editing source code.

## Setup steps for required implementation
### 1. Environment requirements
- Install Node.js LTS and a package manager
- Prepare a PostgreSQL database for CMS data
- Create a Git repository and branch structure for frontend and backend work

### 2. Backend setup
- Initialize a Strapi project with PostgreSQL connection settings
- Create content types for products, categories, gallery, testimonials, why-us, steps, site settings, reps, payouts, and admin users
- Configure media upload, roles, and public/private permissions

### 3. Frontend setup
- Initialize a Next.js storefront project
- Add CMS API integration for product listing and detail pages
- Rebuild home, product grid, rep, and referral-based pages from CMS data
- Preserve the existing premium visual design and responsive behavior

### 4. Data migration
- Import current sample-data rows into the matching content collections
- Validate field mappings for pricing, descriptions, images, visibility, and ordering
- Ensure rep records and payout records are aligned with the current referral flow

### 5. Deployment and operations
- Deploy the backend to Render or Railway
- Deploy the frontend to Vercel
- Configure environment variables for API URLs, database connection, and media credentials
- Conduct final tests for CRUD flows, imaging, publishing, and rep features

## Future scope
- Advanced analytics dashboards
- Payment or checkout integration
- Customer relationship flows
- Email automation and campaign tools
- Inventory and order tracking

## Success criteria
- The client can manage all catalogue content from a CMS without manual code or spreadsheet updates.
- The storefront remains fully functional, premium, and responsive.
- Reps can be created, managed, and tracked from the same system.
- WhatsApp order and referral flows continue to work without manual workarounds.
- The CMS is simple enough for a non-technical client to operate confidently.
