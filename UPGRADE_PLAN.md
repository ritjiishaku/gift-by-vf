# Gifts by VF — Upgrade Plan

**Status:** In progress; CMS and category-layout previews are being built separately from the live catalogue.

## Outcomes

1. Provide an owner CMS for all content currently managed in Google Sheets, replacing Google Forms after the replacement is verified.
2. Provide a secure sales-rep portal with owner-managed onboarding and private, rep-specific payout information.
3. Preserve the live catalogue URL, storefront behavior, product links, referrals, WhatsApp ordering, and current data until each replacement is tested.

## Non-goals

- Checkout, carts, or online payment processing.
- An installable/PWA or native mobile app.
- A wholesale frontend rewrite or immediate migration of all content into a new database.

## Hard constraints

- **Zero additional cost:** no new paid service, subscription, plan upgrade, email delivery, WhatsApp API, paid storage, or billable API. Do not configure automatic upgrades. If a free quota is reached, pause or limit the affected feature safely instead of generating a charge.
- **No email-based authentication.** The owner provisions rep credentials and shares them manually through the admin's copy or WhatsApp action.
- **Media is link-based:** the CMS accepts and previews image/video URLs; it does not upload or store media files.
- Confirm any existing service's cost, quotas, and commercial-use terms before relying on it. The current Vercel account plan is not visible in this repository; verify it before adding production workloads. If its free plan is not permitted for this commercial site, evaluate a zero-cost, commercially permitted path in preview before changing production.
- Keep the live customer catalogue operating throughout implementation. Production changes require explicit approval.

## Current baseline and risks

- The storefront and sales-rep page read Google Sheets data through `js/shared.js`; public content is rendered client-side.
- The rep page currently checks a rep code in browser code, downloads the payout tab, then filters payouts in the browser. Rep IDs are attribution identifiers, not authentication credentials.
- The admin page's passphrase gate is client-side and is not real authorization.
- `form-sync.gs` routes Google Form submissions into sheet tabs. The future CMS must replace those owner workflows before Forms are retired.
- Rep and payout data must not remain in a spreadsheet published for public catalogue reads. Put it in a separate private data source before serving it through the new portal.

## Phased delivery

### Phase 0 — Confirm cost, eligibility, and a safe preview

- Confirm which hosting and Google accounts/services are already in use, their current plans, commercial-use eligibility, and quotas.
- Do not activate a paid trial or enter a paid tier to complete this check.
- Create a non-production preview and a safe test copy of the data. Back up the current sheets privately; do not commit customer or rep data.
- Record the current catalogue and rep-tool behavior as the comparison baseline.
- If no compliant $0 preview/backend path is available, stop for a decision rather than changing the live site or incurring cost.

### Phase 1 — Secure the data boundary

- Keep public catalogue content in the existing sheet initially so customer browsing does not depend on a migration.
- Move `Sales Reps` and `Payouts` into a separate private spreadsheet or other already-available, verified-$0 private store. Do not rely on hiding tabs or filtering records in browser code.
- Provide a server-side access path for private rep data. Keep credentials and authorization checks out of public JavaScript.
- Enforce owner-only management and rep-scoped reads. A rep must only receive their own profile and payout rows from the trusted data layer.
- Keep a copy of private data for rollback, but never restore private rows to a public workbook as a rollback method.

### Phase 2 — Replace Google Forms with the owner CMS

- Build the CMS interface as a separate React + TypeScript + Vite application. Keep it isolated from the live customer storefront until preview verification.
- Use sample/local preview data until a secure, commercially permitted backend is configured. The preview must clearly state that edits are local-only and must never accept real rep credentials.
- Use the supplied four top-level product categories, with product groups for Customized Jewelry and Brand Signages and the listed product types beneath them. Keep category, subgroup, and product type distinct from the editable product name; add sheet columns only after a backward-compatible preview migration.
- Keep product media link-based: accept and preview image/video URLs without uploading files to CMS storage.
- Add URL inputs in Site Settings for the hero image and one cover image per category. Keep product and portfolio image/video links on their own records; use a product image or branded placeholder when a shared cover link is blank or unavailable.
- Restructure the public catalogue into four stacked sections. Category cards jump to sections; product listings remain grouped under their category and subgroup, and each product appears once. Keep Featured as a badge/order within its category rather than a duplicate strip.
- Apply the approved premium editorial direction with existing product media links, accessible typography, and responsive layouts.
- Make the CMS mobile-first: keep all sections reachable through a slide-in menu, use mobile record cards, and provide full-screen phone forms with sticky actions.
- Map current legacy sheet category values in preview before changing live data. Keep search, sorting, price/occasion filters, product links, referrals, and WhatsApp ordering compatible.

Build the admin interface for the current sheet-managed collections:

- Products
- Site Settings
- Portfolio
- Testimonials
- Why Us
- How to Order
- FAQs
- Sales Reps
- Payouts

The owner should be able to add, view, edit, activate/deactivate, and delete or archive records. Use existing image URLs and current content fields initially; do not add paid media storage.

- Preserve the existing sheet-backed data workflow initially, with validated writes through the trusted backend. Do not make the browser write directly to a public sheet.
- Keep visibility/active state separate from payment status. Payouts retain their paid/pending state.
- For records with financial, referral, or other history, deletion means archive/deactivate so history remains intact. Use a confirmation step for destructive actions on records without history.
- Replace each Google Form workflow only after the matching CMS flow has passed preview testing. Retire Forms after the owner can complete those workflows in the CMS.

### Phase 3 — Secure rep onboarding and account management

- The owner creates a rep with a unique rep code, name, commission details, and active status.
- On successful creation, show a welcome/success panel containing the rep code, existing rep login URL, and a cryptographically random one-time password.
- Provide **Copy** and a WhatsApp share action that opens a prefilled message for the owner to send manually. Do not use the WhatsApp Business API or email delivery.
- Store only a verifier/hash for temporary credentials. A one-time password is single-use; require the rep to set a permanent password at first login. Regenerating it invalidates the previous unused credential. Admin reset/revocation must be available without email.
- Keep the rep code for referral attribution, but never treat it as a secret. Active/inactive controls must prevent inactive reps from signing in while preserving historical commissions.
- Rate-limit credential attempts and expire authenticated sessions. Define owner credential recovery without email before implementation.

### Phase 4 — Preview verification and cutover

Verify in preview before any production release:

- Catalogue browsing, search, filters, product links, referral attribution, and WhatsApp ordering behave as before.
- The four category sections and subgroups stay organized on mobile and desktop; a product appears in only one category section, and category navigation lands on the matching section.
- The CMS remains fully navigable at phone widths; record cards and edit forms are usable without horizontal page scrolling.
- The CMS can manage every listed collection without Google Forms, and active/inactive changes appear as intended.
- New-rep onboarding shows the correct code, login URL, one-time password, Copy action, and WhatsApp draft.
- One-time credentials work once, are invalidated when regenerated, and require a permanent password on first use.
- Anonymous visitors cannot retrieve rep or payout data; one rep cannot retrieve another rep's data; inactive reps cannot sign in.
- Payout history remains correct after a rep is archived, and payout payment status is not confused with active/inactive status.
- No secrets or private rep/payout records appear in browser-loaded public data, public Sheets, or repository files.
- Check quota behavior and confirm that exceeding a free limit does not trigger automatic billing.

After explicit approval, cut over in small, reversible steps. Keep the customer storefront independent of rep authentication. If the rep portal needs rollback, disable or revert that portal while keeping its data private. Keep the existing sheet-backed public catalogue available until its successor is proven.

## Release acceptance

- All required admin workflows work in preview without Google Forms.
- Rep onboarding, authentication, password reset, deactivation, and private payout access pass the checks above.
- Existing customer-facing journeys and URLs remain intact.
- The chosen hosting and data path are verified as $0 additional cost and permitted for commercial use; no automatic paid upgrade is enabled.
- A rollback path is documented, and production deployment is explicitly approved.
