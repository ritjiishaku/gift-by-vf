// Gifts by VF — one-time Google Sheet → Supabase migration.
// Reads the public Google Sheet tabs and upserts into Supabase.
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// (loaded from process env or ./.env.local).
//
// Run: npm run migrate

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SHEET_ID = "1N3_A0mPYkbTZ1ZeC3b_-KdrgV84jPRfyfYwEqzIwNB4";

// Tab names as they appear in the spreadsheet.
const TABS = [
  "Site Settings",
  "Products",
  "Sales Reps",
  "Payouts",
  "Testimonials",
  "Portfolio",
  "Why Us",
  "How to Order",
  "FAQs",
];

function loadEnv() {
  const file = path.resolve(__dirname, "..", ".env.local");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync(file)) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, "");
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

function log(...args) {
  console.log("[migrate]", ...args);
}

function parseCSV(text) {
  const src = String(text || "").replace(/\r\n?/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));
  const result = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const values = nonEmpty[i];
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] != null ? String(values[index]).trim() : "";
    });
    result.push(obj);
  }
  return result;
}

function tabUrl(tabName) {
  if (tabName === "Site Settings") {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
  }
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

async function fetchTab(tabName) {
  const url = tabUrl(tabName);
  log(`Fetching "${tabName}" …`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${tabName} (HTTP ${res.status})`);
  const text = await res.text();
  const rows = parseCSV(text);
  if (!rows.length) log(`  -> no data rows`);
  return rows;
}

function toBool(value, fallback) {
  if (value == null || String(value).trim() === "") return fallback;
  const v = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return fallback;
}

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNum(value, fallback) {
  if (value == null || String(value).trim() === "" || String(value).trim().toLowerCase() === "n/a") return fallback;
  const n = parseFloat(String(value).replace(/[₦,#\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function uniqueSlug(candidate, taken) {
  let slug = slugify(candidate);
  if (!slug) slug = "item";
  let out = slug;
  let n = 2;
  while (taken.has(out)) {
    out = `${slug}-${n++}`;
  }
  taken.add(out);
  return out;
}

function ensureUniqueRows(rows, keyFn) {
  const taken = new Set();
  return rows.map((r) => {
    const out = JSON.parse(JSON.stringify(r));
    out.__slug = uniqueSlug(keyFn(r), taken);
    return out;
  });
}

const ON_CONFLICT = {
  site_settings: "key",
  products: "slug",
  sales_reps: "rep_id",
};

async function upsert(client, table, rows) {
  if (!rows.length) {
    log(`  ${table}: 0 rows (skip)`);
    return 0;
  }
  const onConflict = ON_CONFLICT[table];
  const { count, error } = await client
    .from(table)
    .upsert(rows, { onConflict, count: "exact" });
  if (error) throw error;
  log(`  ${table}: ${count ?? rows.length} rows upserted`);
  return count ?? rows.length;
}

async function replaceAll(client, table, rows) {
  const { error: delError } = await client.from(table).delete().neq("id", 0);
  if (delError) throw delError;
  if (!rows.length) {
    log(`  ${table}: 0 rows (cleared)`);
    return 0;
  }
  const { count, error } = await client.from(table).insert(rows, { count: "exact" });
  if (error) throw error;
  log(`  ${table}: ${count ?? rows.length} rows inserted (cleared + inserted)`);
  return count ?? rows.length;
}

function mapSiteSettings(rows) {
  return rows
    .filter((r) => r.key && r.value)
    .map((r) => ({ key: r.key, value: r.value }));
}

function mapProducts(rows, takenSlugs) {
  return ensureUniqueRows(
    rows.filter((r) => String(r.name || "").trim() !== ""),
    (r) => r.name
  ).map((r) => ({
    slug: r.__slug,
    name: r.name,
    description: r.description || null,
    image_url: r.image_url || null,
    video_url: r.video_url || null,
    price: r.price || null,
    category: r.category || null,
    subcategory: r.subcategory || null,
    product_type: r.product_type || null,
    display_order: toInt(r.display_order, 999),
    is_visible: toBool(r.is_visible, true),
    in_stock: toBool(r.in_stock, true),
    stock_label: r.stock_label || null,
    occasion: r.occasion || null,
    featured: toBool(r.featured, false),
    material: r.material || null,
    size: r.size || null,
    turnaround: r.turnaround || null,
    delivery_note: r.delivery_notes || r.delivery_note || null,
    payment_note: r.payment_terms || r.payment_note || null,
    sales_caption: r.sales_caption || null,
    icon: r.icon || null,
  }));
}

function mapSalesReps(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const repId = String(r.rep_id || "").trim();
    if (!repId) continue;
    const key = repId.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      rep_id: repId,
      name: r.name || null,
      commission_rate: toNum(r.commission_rate, null),
      is_active: toBool(r.is_active != null ? r.is_active : r.is_visible, true),
    });
  }
  return out;
}

function mapPayouts(rows) {
  return rows
    .filter((r) => String(r.rep_id || "").trim() !== "")
    .map((r) => ({
      rep_id: r.rep_id,
      product: r.product || null,
      order_amount: toNum(r.order_amount, null),
      commission: toNum(r.commission, null),
      status: r.status || null,
      date: r.date || null,
    }));
}

function mapTestimonials(rows) {
  return rows
    .filter((r) => String(r.quote || "").trim() !== "" || String(r.name || "").trim() !== "")
    .map((r) => ({
      name: r.name || null,
      quote: r.quote || null,
      source: r.source || null,
      rating: toInt(r.rating, 0),
      display_order: toInt(r.display_order, 999),
      is_visible: toBool(r.is_visible, true),
    }));
}

function mapPortfolio(rows) {
  return rows
    .filter((r) => String(r.image_url || "").trim() !== "" || String(r.caption || "").trim() !== "")
    .map((r) => ({
      image_url: r.image_url || null,
      caption: r.caption || null,
      category: r.category || null,
      is_wide: toBool(r.is_wide != null ? r.is_wide : r.wide, false),
      display_order: toInt(r.display_order, 999),
      is_visible: toBool(r.is_visible, true),
    }));
}

function mapWhyUs(rows) {
  return rows
    .filter((r) => String(r.heading || r.title || "").trim() !== "")
    .map((r) => ({
      heading: r.heading || r.title || null,
      title: r.title || null,
      description: r.description || null,
      icon: r.icon || null,
      display_order: toInt(r.display_order, 999),
      is_visible: toBool(r.is_visible, true),
    }));
}

function mapHowToOrder(rows) {
  return rows
    .filter((r) => String(r.title || "").trim() !== "")
    .map((r) => ({
      title: r.title,
      description: r.description || null,
      display_order: toInt(r.display_order, 999),
      is_visible: toBool(r.is_visible, true),
    }));
}

function mapFaqs(rows) {
  return rows
    .filter((r) => String(r.question || "").trim() !== "")
    .map((r) => ({
      question: r.question,
      answer: r.answer || null,
      display_order: toInt(r.display_order, 999),
      is_visible: toBool(r.is_visible, true),
    }));
}

async function main() {
  loadEnv();

  const dryRun = process.argv.includes("--dry");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !serviceKey)) {
    console.error("Missing SUPABASE env vars. Check .env.local");
    process.exit(1);
  }

  const client = dryRun
    ? null
    : createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  const takenSlugs = new Set();
  const TABLE_FOR_TAB = {
    "Site Settings": "site_settings",
    Products: "products",
    "Sales Reps": "sales_reps",
    Payouts: "payouts",
    Testimonials: "testimonials",
    Portfolio: "portfolio",
    "Why Us": "why_us",
    "How to Order": "how_to_order",
    FAQs: "faqs",
  };
  const MAPPERS = {
    "Site Settings": (r) => mapSiteSettings(r),
    Products: (r) => mapProducts(r, takenSlugs),
    "Sales Reps": (r) => mapSalesReps(r),
    Payouts: (r) => mapPayouts(r),
    Testimonials: (r) => mapTestimonials(r),
    Portfolio: (r) => mapPortfolio(r),
    "Why Us": (r) => mapWhyUs(r),
    "How to Order": (r) => mapHowToOrder(r),
    FAQs: (r) => mapFaqs(r),
  };
  const REPLACE = new Set([
    "payouts",
    "testimonials",
    "portfolio",
    "why_us",
    "how_to_order",
    "faqs",
  ]);

  for (const tab of TABS) {
    try {
      const rows = await fetchTab(tab);
      const table = TABLE_FOR_TAB[tab];
      const mapped = MAPPERS[tab](rows);

      if (dryRun) {
        log(`  ${tab} -> ${table}: ${mapped.length} rows (dry run, not written)`);
        if (mapped[0]) log(`    sample: ${JSON.stringify(mapped[0]).slice(0, 160)}`);
        continue;
      }

      if (REPLACE.has(table)) await replaceAll(client, table, mapped);
      else await upsert(client, table, mapped);
    } catch (err) {
      console.error(`[migrate] ERROR migrating "${tab}":`, err.message);
      process.exitCode = 1;
    }
  }

  log(dryRun ? "Dry run complete." : "Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});