# CMS and Neon setup

The owner CMS stores only public catalogue and site content in Neon PostgreSQL: Products, Site Settings, Portfolio, Testimonials, Why Us, How to Order, and FAQs. The CMS and the Preview storefront use the same Neon database. Sales Reps and Payouts are excluded; existing rep tools and the production storefront keep their current Sheets source until a separately approved cutover.

The Neon connection string, owner password hash, and session secret are server-side Vercel environment variables. Never put them in browser code, `VITE_*` variables, this repository, or chat.

## 1. Create a no-cost Neon Preview database

1. Create a Neon project on its **Free** plan. Do not select a paid plan, add paid features, or configure automatic upgrades. Neon currently lists Free quotas including 100 compute-hours per project, 1 GB of storage per project, and 5 GB of public network transfer; limits and plan terms can change. If the database stops responding at its quota, the CMS reports an error and does not switch plans or report an edit as saved. Review [Neon's current plans and limits](https://neon.com/docs/introduction/plans) and [platform terms](https://neon.com/platform-terms) before any production use.
2. Use the Preview branch/database only. Do not import private rep or payout information.
3. Run the SQL in [`neon-schema.sql`](./neon-schema.sql) once in the Neon SQL Editor.
4. Copy the Preview branch's pooled PostgreSQL connection string. Keep it private.
5. From a trusted local terminal, import the existing public catalogue as the initial Preview data. In PowerShell, set the connection string without putting it in a committed file:

   ```powershell
   $secure = Read-Host "Neon Preview connection string" -AsSecureString
   $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
   try {
     $env:NEON_DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
     node scripts/import-public-content-to-neon.cjs
   } finally {
     Remove-Item Env:NEON_DATABASE_URL
     [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
   }
   ```

   The import reads only the seven public tabs and inserts rows only when their IDs do not exist. It never updates existing Neon rows, so rerunning it cannot overwrite CMS edits. Product `subcategory` and `product_type` values are blank when those columns do not exist in the source sheet; set taxonomy for those products in the CMS before relying on the filters. The import script requires the source tabs to be publicly readable, as they are for the existing catalogue. It prints row counts, not database credentials.

## 2. Configure Vercel Preview

Add these environment variables to the Vercel project's **Preview** environment only:

- `CMS_CONTENT_BACKEND` — `neon`
- `CMS_DATABASE_ENV` — `preview`
- `NEON_DATABASE_URL` — the Neon Preview branch's pooled connection string
- `CMS_OWNER_PASSWORD_HASH` — salted scrypt hash generated as described below
- `CMS_SESSION_SECRET` — a separate random secret of at least 32 bytes

Generate a strong owner passphrase in a password manager, then run `node cms/scripts/hash-owner-password.cjs` in an interactive terminal and save its output directly as `CMS_OWNER_PASSWORD_HASH`. The script masks the passphrase and prints only a salted scrypt hash. Keep the passphrase in the password manager; recovery is manual by generating a replacement hash and updating Vercel. There is no email reset.

Redeploy a **Preview** after setting the variables. The build embeds only the public backend selector (`neon`), never the database connection string. The API rejects Preview/Production environment mismatches. Every Vercel deployment now requires `CMS_CONTENT_BACKEND=neon`; a missing or mismatched Neon configuration fails the build instead of silently using Sheets. Local development builds still default to Sheets unless configured otherwise.

## 3. Verify Preview before using it

- Sign-in rejects incorrect passwords; sign-out clears the HTTP-only session.
- The CMS loads all seven collections from Neon; create, edit, hide, restore, and delete operations persist and refresh.
- Stale edits return a conflict instead of overwriting a newer change.
- Rep and payout collections are rejected by the server and are never read from Neon.
- Product, Site Settings, Portfolio, Testimonials, Why Us, How to Order, and FAQ changes appear in the Preview storefront, including product-share pages.
- Catalogue browsing, search and filters, product links, referral attribution, WhatsApp ordering, and existing sales-rep tools still work. The Preview rep tools remain on their existing Sheets source.
- Stop testing if Neon reports a quota, schema, or connection error. The CMS does not claim a failed write succeeded or automatically upgrade the Neon plan.

Neon's current Free plan is advertised for prototypes, side projects, and small teams, with no uptime SLA. Do not treat Preview success as production approval. Confirm the current commercial-use terms, quotas, and account billing settings before any live cutover; production must remain on Sheets until Preview is verified, the owner approves the cutover, and a rollback plan is ready.

## Production cutover and rollback

Do not configure Production variables or deploy the Neon-backed application to Production until the Neon Preview has passed the checks above, the Free plan's commercial-use eligibility is confirmed, and the owner explicitly approves a separate cutover. The existing live deployment stays unchanged until that point. Production will then require `CMS_CONTENT_BACKEND=neon`, `CMS_DATABASE_ENV=production`, the Production branch's `NEON_DATABASE_URL`, and the owner auth secrets; a Production build without these variables fails rather than reading public content from Sheets.

For an approved cutover, migrate and review public content in a separate Neon Production branch, configure the Production variables in Vercel, then test a production-like Preview deployment before the production release. Create a Neon backup/snapshot before writes and retain a verified Neon deployment for rollback. Do not use the Sheets-backed release as a rollback for public content after cutover. The sales-rep portal and referral validation remain on their existing Sheets source by the owner's scope decision; those private records are not copied into the public CMS.
