const crypto = require('node:crypto');
const { neon } = require('@neondatabase/serverless');

const SHEET_ID = process.env.PUBLIC_SHEET_ID || '1N3_A0mPYkbTZ1ZeC3b_-KdrgV84jPRfyfYwEqzIwNB4';
const TABS = [
    ['products', 'Products'],
    ['settings', 'Site Settings'],
    ['portfolio', 'Portfolio'],
    ['testimonials', 'Testimonials'],
    ['why-us', 'Why Us'],
    ['how-to-order', 'How to Order'],
    ['faqs', 'FAQs'],
];
const FIELDS = {
    products: ['name', 'description', 'price', 'category', 'subcategory', 'product_type', 'image_url', 'video_url', 'occasion', 'material', 'size', 'turnaround', 'delivery_notes', 'payment_terms', 'sales_caption', 'display_order', 'featured', 'is_visible', 'in_stock', 'stock_label'],
    settings: ['key', 'value'],
    portfolio: ['caption', 'image_url', 'category', 'wide', 'display_order', 'is_visible'],
    testimonials: ['name', 'quote', 'source', 'rating', 'display_order', 'is_visible'],
    'why-us': ['title', 'description', 'icon', 'display_order', 'is_visible'],
    'how-to-order': ['title', 'description', 'display_order', 'is_visible'],
    faqs: ['question', 'answer', 'display_order', 'is_visible'],
};
const BOOLEAN_FIELDS = new Set(['featured', 'is_visible', 'in_stock', 'wide']);
const NUMBER_FIELDS = new Set(['display_order', 'rating']);

function parseCSV(text) {
    const source = String(text || '').replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        if (quoted) {
            if (char === '"' && source[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += char;
        }
    }
    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }
    const nonempty = rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
    if (nonempty.length < 2) return [];
    const headers = nonempty[0].map((value) => value.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    return nonempty.slice(1).map((cells) => Object.fromEntries(
        headers.map((header, index) => [header, String(cells[index] ?? '').trim()]),
    ));
}

function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'row';
}

function valueFor(field, value) {
    if (field === 'is_visible' && value === '') return true;
    if (BOOLEAN_FIELDS.has(field)) return /^(true|1|yes)$/i.test(value);
    if (NUMBER_FIELDS.has(field)) {
        const number = Number(value);
        return value !== '' && Number.isFinite(number) ? number : undefined;
    }
    return value;
}

function recordsFor(collection, rows) {
    const keyField = {
        products: 'name',
        settings: 'key',
        portfolio: 'caption',
        testimonials: 'name',
        'why-us': 'title',
        'how-to-order': 'title',
        faqs: 'question',
    }[collection];
    return rows.map((source, index) => {
        const data = {};
        for (const field of FIELDS[collection]) {
            const value = valueFor(field, source[field] || '');
            if (value !== undefined) data[field] = value;
        }
        if (collection === 'products') {
            data.subcategory = data.subcategory || '';
            data.product_type = data.product_type || '';
        }
        const identity = collection === 'settings'
            ? source.key
            : `${source[keyField] || 'row'}-${index + 2}`;
        const suffix = crypto.createHash('sha256').update(`${collection}\0${identity}`).digest('hex').slice(0, 12);
        const id = `sheet-${slug(identity)}-${suffix}`.slice(0, 128);
        const sortOrder = Number.isSafeInteger(Number(data.display_order)) && Number(data.display_order) > 0
            ? Number(data.display_order)
            : index + 2;
        return { collection, id, data, sort_order: sortOrder };
    });
}

async function readTab(tabName) {
    const url = tabName === 'Site Settings'
        ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
        : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Could not read public ${tabName} tab (HTTP ${response.status}).`);
    return parseCSV(await response.text());
}

async function main() {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) throw new Error('Set NEON_DATABASE_URL in this terminal; do not commit or share it.');
    if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
        throw new Error('NEON_DATABASE_URL must be a Neon PostgreSQL connection string.');
    }

    const sql = neon(url);
    for (const [collection, tabName] of TABS) {
        const sourceRows = await readTab(tabName);
        const records = recordsFor(collection, sourceRows);
        if (!records.length) {
            console.log(`${tabName}: no public rows found.`);
            continue;
        }
        const inserted = await sql`
            INSERT INTO public.cms_public_content (collection, id, data, sort_order)
            SELECT item.collection, item.id, item.data, item.sort_order
            FROM jsonb_to_recordset(${JSON.stringify(records)}::jsonb)
                AS item(collection TEXT, id TEXT, data JSONB, sort_order BIGINT)
            ON CONFLICT (collection, id) DO NOTHING
            RETURNING id
        `;
        console.log(`${tabName}: imported ${inserted.length} of ${records.length} rows; existing IDs were left unchanged.`);
    }
    console.log('Public content import complete. No private rep or payout tabs were read.');
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
