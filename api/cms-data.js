const { readBody, requireOwner, requireSameOrigin, sendJson } = require('../lib/cms-common');
const {
    ContentError,
    deleteRecord,
    getAllCollections,
    saveRecord,
} = require('../lib/neon-content');

const MAX_BODY_BYTES = 256 * 1024;

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    if (req.method === 'POST' && !requireSameOrigin(req, res)) return;
    if (!requireOwner(req, res)) return;
    if (process.env.CMS_CONTENT_BACKEND !== 'neon') {
        return sendJson(res, 503, { error: 'The Neon-backed CMS is not enabled for this deployment.' });
    }

    let operation;
    try {
        if (req.method === 'GET') {
            const collection = String(req.query?.collection || '');
            operation = { action: 'list', collection };
        } else {
            const length = Number(req.headers['content-length'] || 0);
            if (length > MAX_BODY_BYTES) return sendJson(res, 413, { error: 'CMS changes must be smaller than 256 KB.' });
            let body;
            try {
                body = readBody(req);
            } catch {
                return sendJson(res, 400, { error: 'Request body must be valid JSON.' });
            }
            if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
                return sendJson(res, 413, { error: 'CMS changes must be smaller than 256 KB.' });
            }
            if (!['create', 'update', 'delete', 'archive'].includes(body.action)) {
                return sendJson(res, 400, { error: 'Unknown CMS operation.' });
            }
            operation = {
                action: body.action,
                collection: body.collection,
                record: body.record,
            };
        }

        if (operation.action === 'list') {
            const data = operation.collection === 'all'
                ? await getAllCollections()
                : await getAllCollections(operation.collection);
            return sendJson(res, 200, { data });
        }
        if (operation.action === 'delete') {
            await deleteRecord(operation.collection, operation.record);
            return sendJson(res, 200, { ok: true });
        }
        const record = await saveRecord(operation.collection, operation.action, operation.record);
        return sendJson(res, 200, { ok: true, record });
    } catch (error) {
        if (error instanceof ContentError) {
            if (error.status >= 500) console.error('CMS database request failed:', error.message);
            return sendJson(res, error.status, { error: error.message, code: error.code });
        }
        console.error('CMS database request failed:', error.message);
        return sendJson(res, 503, { error: 'The content database is temporarily unavailable. No change was confirmed.' });
    }
};
