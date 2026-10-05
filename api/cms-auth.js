const {
    SESSION_TTL_SECONDS,
    createSession,
    isAuthenticated,
    ownerPasswordIsValid,
    readBody,
    requireSameOrigin,
    sendJson,
    setSessionCookie,
} = require('../lib/cms-common');

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.method === 'GET') {
        return sendJson(res, 200, { authenticated: isAuthenticated(req) });
    }

    if (req.method !== 'POST' && req.method !== 'DELETE') {
        res.setHeader('Allow', 'GET, POST, DELETE');
        return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    if (!requireSameOrigin(req, res)) return;

    if (req.method === 'DELETE') {
        setSessionCookie(req, res, '', 0);
        return sendJson(res, 200, { authenticated: false });
    }

    let body;
    try {
        body = readBody(req);
    } catch {
        return sendJson(res, 400, { error: 'Request body must be valid JSON.' });
    }

    try {
        if (!ownerPasswordIsValid(body.password)) {
            return sendJson(res, 401, { error: 'The owner passphrase was not accepted.' });
        }
        setSessionCookie(req, res, createSession(), SESSION_TTL_SECONDS);
        return sendJson(res, 200, { authenticated: true });
    } catch (error) {
        console.error('CMS authentication is unavailable:', error.message);
        return sendJson(res, 503, { error: 'CMS sign-in is not configured yet.' });
    }
};
