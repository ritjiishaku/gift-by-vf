const { ContentError, getPublicCollection } = require('../lib/neon-content');

const COLLECTIONS = new Map([
    ['products', 'products'],
    ['portfolio', 'portfolio'],
    ['testimonials', 'testimonials'],
    ['why-us', 'why-us'],
    ['how-to-order', 'how-to-order'],
    ['faqs', 'faqs'],
]);

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed.' });
    }
    if (process.env.CMS_CONTENT_BACKEND !== 'neon') {
        return res.status(404).json({ error: 'Public content API is disabled for this deployment.' });
    }

    const collection = String(req.query?.collection || '');
    if (!COLLECTIONS.has(collection)) {
        return res.status(400).json({ error: 'Unknown public content collection.' });
    }

    try {
        const data = await getPublicCollection(collection);
        return res.status(200).json({ data });
    } catch (error) {
        if (error instanceof ContentError) {
            if (error.status >= 500) console.error('Public Neon content request failed:', error.message);
            return res.status(error.status).json({ error: error.message, code: error.code });
        }
        console.error('Public Neon content request failed:', error.message);
        return res.status(503).json({ error: 'Public content is temporarily unavailable.' });
    }
};
