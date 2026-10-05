const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const driverPath = require.resolve('@neondatabase/serverless');
let rows = [];

function fakeNeon() {
    return async (parts, ...values) => {
        const query = parts.join('?').replace(/\s+/g, ' ').trim().toLowerCase();
        if (query.startsWith('select id, data, version, archived, updated_at')) {
            const [collection, includeArchived] = values;
            return rows
                .filter((row) => row.collection === collection && (includeArchived || !row.archived))
                .sort((left, right) => Number(left.data.display_order || 0) - Number(right.data.display_order || 0))
                .map((row) => ({ ...row, updated_at: new Date(row.updated_at) }));
        }
        if (query.startsWith('insert into public.cms_public_content')) {
            const [collection, id, data, , , archived] = values;
            if (rows.some((row) => row.collection === collection && row.id === id)) return [];
            const row = { collection, id, data: JSON.parse(data), version: 1, archived, updated_at: new Date() };
            rows.push(row);
            return [{ ...row }];
        }
        if (query.startsWith('update public.cms_public_content')) {
            const [data, archived, , collection, id, version] = values;
            const row = rows.find((item) => item.collection === collection && item.id === id);
            if (!row || row.version !== version) return [];
            row.data = JSON.parse(data);
            row.archived = archived;
            row.version += 1;
            row.updated_at = new Date();
            return [{ ...row }];
        }
        if (query.startsWith('delete from public.cms_public_content')) {
            const [collection, id, version] = values;
            const index = rows.findIndex((item) => item.collection === collection && item.id === id && item.version === version);
            if (index < 0) return [];
            const [row] = rows.splice(index, 1);
            return [{ id: row.id }];
        }
        if (query.startsWith('select id from public.cms_public_content')) {
            const [collection, id] = values;
            return rows.some((row) => row.collection === collection && row.id === id) ? [{ id }] : [];
        }
        throw new Error(`Unexpected SQL in test: ${query}`);
    };
}

require.cache[driverPath] = {
    id: driverPath,
    filename: driverPath,
    loaded: true,
    exports: { neon: fakeNeon },
};

const content = require('../lib/neon-content');

test('Neon content operations stay public-only and protect edits', async () => {
    const oldEnvironment = process.env.VERCEL_ENV;
    process.env.NEON_DATABASE_URL = 'postgresql://user:pass@ep-test.neon.tech/db?sslmode=require';
    process.env.CMS_DATABASE_ENV = 'preview';
    process.env.CMS_CONTENT_BACKEND = 'neon';
    process.env.VERCEL_ENV = 'preview';
    rows = [
        { collection: 'products', id: 'visible', data: { name: 'Visible', is_visible: true, display_order: 1 }, version: 1, archived: false, updated_at: new Date() },
        { collection: 'products', id: 'hidden', data: { name: 'Hidden', is_visible: false, display_order: 2 }, version: 1, archived: false, updated_at: new Date() },
        { collection: 'products', id: 'archived', data: { name: 'Archived', is_visible: true, display_order: 3 }, version: 1, archived: true, updated_at: new Date() },
        { collection: 'settings', id: 'site-title', data: { key: 'site_title', value: 'Preview', display_order: 1 }, version: 1, archived: false, updated_at: new Date() },
    ];

    try {
        assert.deepEqual((await content.getPublicCollection('products')).map(({ id }) => id), ['visible']);
        await assert.rejects(content.getPublicCollection('payouts'), { code: 'COLLECTION_NOT_ALLOWED', status: 400 });

        const all = await content.getAllCollections();
        assert.deepEqual(Object.keys(all).sort(), [...content.COLLECTIONS].sort());

        const created = await content.saveRecord('products', 'create', {
            id: 'new-product',
            name: 'New product',
            description: 'A public item',
            category: 'More to Love',
            display_order: 4,
            is_visible: true,
        });
        assert.equal(created._version, 1);
        assert.equal(created.name, 'New product');

        const updated = await content.saveRecord('products', 'update', { ...created, name: 'Updated product' });
        assert.equal(updated._version, 2);
        assert.equal(updated.name, 'Updated product');
        await assert.rejects(
            content.saveRecord('products', 'update', { ...created, name: 'Stale update' }),
            { code: 'CONFLICT', status: 409 },
        );

        const sessionSecret = crypto.randomBytes(48).toString('base64url');
        process.env.CMS_SESSION_SECRET = sessionSecret;
        process.env.CMS_OWNER_PASSWORD_HASH = 'configured-for-route-test';
        const { createSession } = require('../lib/cms-common');
        const ownerCookie = `vf_cms_session=${encodeURIComponent(createSession())}`;
        const makeResponse = () => ({
            statusCode: 200,
            headers: {},
            body: undefined,
            setHeader(key, value) { this.headers[key] = value; },
            status(code) { this.statusCode = code; return this; },
            json(body) { this.body = body; return this; },
            send(body) { this.body = body; return this; },
        });

        const cmsHandler = require('../api/cms-data');
        const cmsResponse = makeResponse();
        await cmsHandler({ method: 'GET', headers: { cookie: ownerCookie }, query: { collection: 'all' } }, cmsResponse);
        assert.equal(cmsResponse.statusCode, 200);
        assert.deepEqual(Object.keys(cmsResponse.body.data).sort(), [...content.COLLECTIONS].sort());

        const unauthorizedResponse = makeResponse();
        await cmsHandler({ method: 'GET', headers: {}, query: { collection: 'all' } }, unauthorizedResponse);
        assert.equal(unauthorizedResponse.statusCode, 401);

        const privateWriteResponse = makeResponse();
        await cmsHandler({
            method: 'POST',
            headers: { cookie: ownerCookie, host: 'shop.test', origin: 'https://shop.test', 'x-forwarded-proto': 'https' },
            body: { collection: 'payouts', action: 'delete', record: { id: 'private', _version: 1 } },
        }, privateWriteResponse);
        assert.equal(privateWriteResponse.statusCode, 400);

        const malformedBodyResponse = makeResponse();
        await cmsHandler({
            method: 'POST',
            headers: { cookie: ownerCookie, host: 'shop.test', origin: 'https://shop.test', 'x-forwarded-proto': 'https' },
            body: '{invalid',
        }, malformedBodyResponse);
        assert.equal(malformedBodyResponse.statusCode, 400);

        const publicHandler = require('../api/public-content');
        const publicResponse = makeResponse();
        await publicHandler({ method: 'GET', query: { collection: 'products' } }, publicResponse);
        assert.equal(publicResponse.statusCode, 200);
        assert.deepEqual(publicResponse.body.data.map(({ id }) => id), ['visible', 'new-product']);
        const privateReadResponse = makeResponse();
        await publicHandler({ method: 'GET', query: { collection: 'payouts' } }, privateReadResponse);
        assert.equal(privateReadResponse.statusCode, 400);

        const settingsHandler = require('../api/settings');
        const settingsResponse = makeResponse();
        await settingsHandler({ method: 'GET' }, settingsResponse);
        assert.equal(settingsResponse.statusCode, 200);
        assert.equal(settingsResponse.body[0].value, 'Preview');

        const productHandler = require('../api/product/[slug].js');
        const productResponse = makeResponse();
        await productHandler({ query: { slug: 'visible' } }, productResponse);
        assert.equal(productResponse.statusCode, 200);
        assert.match(productResponse.body, /Visible/);

        process.env.CMS_CONTENT_BACKEND = 'sheets';
        const disabledCmsResponse = makeResponse();
        await cmsHandler({ method: 'GET', headers: { cookie: ownerCookie }, query: { collection: 'all' } }, disabledCmsResponse);
        assert.equal(disabledCmsResponse.statusCode, 503);
        process.env.CMS_CONTENT_BACKEND = 'neon';

        const archived = await content.saveRecord('products', 'archive', updated);
        assert.equal(archived.archived, true);
        assert.equal(archived.is_visible, false);
        assert.deepEqual((await content.getPublicCollection('products')).map(({ id }) => id), ['visible']);

        const faq = await content.saveRecord('faqs', 'create', {
            id: 'faq-1',
            question: 'Question?',
            answer: 'Answer.',
        });
        await content.deleteRecord('faqs', faq);
        await assert.rejects(content.deleteRecord('products', created), { code: 'VALIDATION', status: 422 });

        process.env.VERCEL_ENV = 'production';
        await assert.rejects(content.getPublicCollection('products'), { code: 'CONFIG', status: 503 });
    } finally {
        if (oldEnvironment == null) delete process.env.VERCEL_ENV;
        else process.env.VERCEL_ENV = oldEnvironment;
        delete process.env.NEON_DATABASE_URL;
        delete process.env.CMS_DATABASE_ENV;
        delete process.env.CMS_CONTENT_BACKEND;
        delete process.env.CMS_SESSION_SECRET;
        delete process.env.CMS_OWNER_PASSWORD_HASH;
    }
});
