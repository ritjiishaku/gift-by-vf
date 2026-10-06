const { neon } = require('@neondatabase/serverless');

const COLLECTION_FIELDS = Object.freeze({
    products: new Set([
        'name', 'description', 'price', 'category', 'subcategory', 'product_type',
        'image_url', 'video_url', 'occasion', 'material', 'size', 'turnaround',
        'delivery_notes', 'payment_terms', 'sales_caption', 'display_order',
        'featured', 'is_visible', 'in_stock', 'stock_label',
    ]),
    settings: new Set(['key', 'value']),
    portfolio: new Set(['caption', 'image_url', 'category', 'wide', 'display_order', 'is_visible']),
    testimonials: new Set(['name', 'quote', 'source', 'rating', 'display_order', 'is_visible']),
    'why-us': new Set(['title', 'description', 'icon', 'display_order', 'is_visible']),
    'how-to-order': new Set(['title', 'description', 'display_order', 'is_visible']),
    faqs: new Set(['question', 'answer', 'display_order', 'is_visible']),
});
const COLLECTIONS = Object.keys(COLLECTION_FIELDS);
const MAX_RECORDS = 2000;
const MAX_STRING_LENGTH = 50000;
const NUMERIC_FIELDS = new Set(['display_order', 'rating']);
const BOOLEAN_FIELDS = new Set(['featured', 'is_visible', 'in_stock', 'wide']);

class ContentError extends Error {
    constructor(code, status, message) {
        super(message);
        this.name = 'ContentError';
        this.code = code;
        this.status = status;
    }
}

let client;
let clientUrl;

function databaseUrl() {
    const url = process.env.NEON_DATABASE_URL;
    const expectedEnvironment = process.env.CMS_DATABASE_ENV || process.env.VERCEL_ENV || 'preview';
    if (!url || !['preview', 'production'].includes(expectedEnvironment)) {
        throw new ContentError('CONFIG', 503, 'Neon database is not configured for this deployment.');
    }
    if (process.env.CMS_DATABASE_ENV && process.env.VERCEL_ENV && process.env.CMS_DATABASE_ENV !== process.env.VERCEL_ENV) {
        throw new ContentError('CONFIG', 503, 'Neon database environment does not match this deployment.');
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw new ContentError('CONFIG', 503, 'Neon database connection string is invalid.');
    }
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !parsed.hostname.endsWith('.neon.tech')) {
        throw new ContentError('CONFIG', 503, 'Configure a Neon PostgreSQL connection string.');
    }
    return url;
}

function database() {
    const url = databaseUrl();
    if (!client || clientUrl !== url) {
        client = neon(url);
        clientUrl = url;
    }
    return client;
}

function assertCollection(collection) {
    if (!Object.hasOwn(COLLECTION_FIELDS, collection)) {
        throw new ContentError('COLLECTION_NOT_ALLOWED', 400, 'Unknown public content collection.');
    }
}

function rowRecord(row) {
    const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    return {
        ...data,
        id: row.id,
        archived: Boolean(row.archived),
        updatedAt: new Date(row.updated_at).toISOString(),
        _version: Number(row.version),
    };
}

function validateRecord(collection, input) {
    assertCollection(collection);
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ContentError('VALIDATION', 422, 'A content record is required.');
    }
    if (typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.id)) {
        throw new ContentError('VALIDATION', 422, 'The content record ID is invalid.');
    }

    const fields = COLLECTION_FIELDS[collection];
    const data = {};
    for (const [key, value] of Object.entries(input)) {
        if (['id', '_version', 'updatedAt', 'archived'].includes(key)) continue;
        if (!fields.has(key)) {
            throw new ContentError('VALIDATION', 422, `The ${key} field is not supported in ${collection}.`);
        }
        if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) {
            throw new ContentError('VALIDATION', 422, `The ${key} field must be text, a number, or a toggle.`);
        }
        if (NUMERIC_FIELDS.has(key) && value != null && typeof value !== 'number') {
            throw new ContentError('VALIDATION', 422, `The ${key} field must be a number.`);
        }
        if (BOOLEAN_FIELDS.has(key) && value != null && typeof value !== 'boolean') {
            throw new ContentError('VALIDATION', 422, `The ${key} field must be a toggle.`);
        }
        if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
            throw new ContentError('VALIDATION', 422, `The ${key} field is too long.`);
        }
        if (typeof value === 'number' && !Number.isFinite(value)) {
            throw new ContentError('VALIDATION', 422, `The ${key} field must be a finite number.`);
        }
        data[key] = value;
    }
    const required = {
        products: ['name', 'description', 'category'],
        settings: ['key', 'value'],
        portfolio: ['caption', 'image_url'],
        testimonials: ['name', 'quote', 'rating'],
        'why-us': ['title', 'description'],
        'how-to-order': ['title', 'description'],
        faqs: ['question', 'answer'],
    }[collection];
    if (required.some((key) => data[key] == null || String(data[key]).trim() === '')) {
        throw new ContentError('VALIDATION', 422, 'Complete all required content fields before saving.');
    }
    return { id: input.id, data, archived: input.archived === true };
}

function expectedVersion(record) {
    const version = Number(record?._version);
    if (!Number.isSafeInteger(version) || version < 1) {
        throw new ContentError('VALIDATION', 422, 'Refresh this record before saving your changes.');
    }
    return version;
}

function queryFailure(error) {
    if (error instanceof ContentError) throw error;
    const message = String(error?.message || '');
    if (/does not exist|undefined table/i.test(message)) {
        throw new ContentError('SCHEMA_MISSING', 503, 'The Neon content table is not initialized. Follow the database setup guide.');
    }
    throw new ContentError('DATABASE_UNAVAILABLE', 503, 'The Neon database could not complete this request. Check its Free plan quota and connection settings.');
}

async function listCollection(collection, includeArchived = true) {
    assertCollection(collection);
    try {
        const rows = await database()`
            SELECT id, data, version, archived, updated_at
            FROM public.cms_public_content
            WHERE collection = ${collection}
                AND (${includeArchived} OR archived = FALSE)
            ORDER BY NULLIF(data->>'display_order', '')::numeric NULLS LAST, sort_order, id
            LIMIT ${MAX_RECORDS + 1}
        `;
        if (rows.length > MAX_RECORDS) {
            throw new ContentError('CONTENT_LIMIT', 503, 'This collection exceeds the safe display limit. Reduce its size before retrying.');
        }
        return rows.map(rowRecord);
    } catch (error) {
        queryFailure(error);
    }
}

async function getAllCollections(collection) {
    if (collection && collection !== 'all') {
        return { [collection]: await listCollection(collection) };
    }
    const pairs = await Promise.all(COLLECTIONS.map(async (key) => [key, await listCollection(key)]));
    return Object.fromEntries(pairs);
}

async function getPublicCollection(collection) {
    const records = await listCollection(collection, false);
    return records.filter((record) => {
        if (record.is_visible == null) return true;
        return !/^(false|0|no)$/i.test(String(record.is_visible).trim());
    });
}

async function saveRecord(collection, action, input) {
    const record = validateRecord(collection, input);
    try {
        const sql = database();
        if (action === 'create') {
            const rows = await sql`
                INSERT INTO public.cms_public_content (collection, id, data, sort_order, archived)
                VALUES (
                    ${collection},
                    ${record.id},
                    ${JSON.stringify(record.data)}::jsonb,
                    COALESCE(NULLIF(${String(record.data.display_order ?? '')}, '')::bigint, ${Date.now()}),
                    ${record.archived}
                )
                RETURNING id, data, version, archived, updated_at
            `;
            if (!rows.length) throw new ContentError('DATABASE_UNAVAILABLE', 503, 'The new record was not saved.');
            return rowRecord(rows[0]);
        }

        const version = expectedVersion(input);
        const archived = action === 'archive' ? true : record.archived;
        const data = action === 'archive' ? { ...record.data, is_visible: false } : record.data;
        const rows = await sql`
            UPDATE public.cms_public_content
            SET data = ${JSON.stringify(data)}::jsonb,
                archived = ${archived},
                version = version + 1,
                updated_at = NOW(),
                sort_order = COALESCE(NULLIF(${String(data.display_order ?? '')}, '')::bigint, sort_order)
            WHERE collection = ${collection} AND id = ${record.id} AND version = ${version}
            RETURNING id, data, version, archived, updated_at
        `;
        if (rows.length) return rowRecord(rows[0]);

        const [existing] = await sql`
            SELECT id FROM public.cms_public_content
            WHERE collection = ${collection} AND id = ${record.id}
        `;
        if (!existing) throw new ContentError('NOT_FOUND', 404, 'This content record no longer exists. Refresh the collection.');
        throw new ContentError('CONFLICT', 409, 'This content changed in another session. Refresh the collection before saving again.');
    } catch (error) {
        queryFailure(error);
    }
}

async function deleteRecord(collection, input) {
    assertCollection(collection);
    if (collection === 'products') {
        throw new ContentError('VALIDATION', 422, 'Products must be hidden instead of permanently deleted.');
    }
    if (!input || typeof input.id !== 'string') {
        throw new ContentError('VALIDATION', 422, 'A content record ID is required.');
    }
    const version = expectedVersion(input);
    try {
        const rows = await database()`
            DELETE FROM public.cms_public_content
            WHERE collection = ${collection} AND id = ${input.id} AND version = ${version}
            RETURNING id
        `;
        if (rows.length) return;
        const [existing] = await database()`
            SELECT id FROM public.cms_public_content
            WHERE collection = ${collection} AND id = ${input.id}
        `;
        if (!existing) throw new ContentError('NOT_FOUND', 404, 'This content record no longer exists. Refresh the collection.');
        throw new ContentError('CONFLICT', 409, 'This content changed in another session. Refresh the collection before deleting it.');
    } catch (error) {
        queryFailure(error);
    }
}

module.exports = {
    COLLECTIONS,
    ContentError,
    getAllCollections,
    getPublicCollection,
    saveRecord,
    deleteRecord,
};
