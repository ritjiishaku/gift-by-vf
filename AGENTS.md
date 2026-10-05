# Project Rules

## Follow these rules

- Before taking action in this repository, read and follow this file and any more specific `AGENTS.md` files that apply to the files being changed.

## Protect the live catalogue

- Treat the catalogue as a live service with active users. Preserve its current URL and customer-facing behavior unless a change is explicitly requested.
- Make changes backward-compatible where possible. Avoid replacing or disabling a working data source or workflow until its successor has been verified and a rollback path is available.
- Test changes in a preview or other non-production environment before production. Do not deploy to production unless explicitly asked.
- Before release, verify the main journeys: catalogue browsing, search and filters, product links, referral attribution, WhatsApp ordering, and sales-rep tools.
- Keep a straightforward rollback path for changes that affect production behavior.

## Keep upgrades within the agreed scope and cost

- Keep upgrade work at zero additional cost. Do not add paid services, subscriptions, paid tiers, email delivery, or billable APIs, and do not enable automatic upgrades. If a free quota is reached, pause or safely limit the affected feature rather than incur charges.
- Verify that existing free services permit commercial use before relying on them for the business. If eligibility or cost is unclear, stop and clarify before proceeding.
- Do not introduce email-based authentication. Rep credentials are provisioned by the owner and shared manually using the approved copy/WhatsApp flow.
- The owner CMS is intended to replace Google Forms for current sheet-managed content. Keep existing workflows available until their replacements are verified; the owner should not need Google Forms after the CMS cutover.
- Keep checkout and an installable catalogue app out of scope unless explicitly requested.

## Keep these rules current

- When a new project rule is agreed, add it to the relevant section of this file.
- If a new rule conflicts with an existing one, clarify the intended decision before replacing the existing rule.
