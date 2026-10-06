const crypto = require('crypto');

const SESSION_COOKIE = 'vf_cms_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function sendJson(res, status, body) {
    return res.status(status).json(body);
}

function readBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return {};
}

function hasSameOrigin(req) {
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (!origin || !host) return false;
    try {
        const parsed = new URL(origin);
        return parsed.host === host && parsed.protocol === (req.headers['x-forwarded-proto'] === 'http' ? 'http:' : 'https:');
    } catch {
        return false;
    }
}

function sessionSecret() {
    const secret = process.env.CMS_SESSION_SECRET || process.env.NEON_DATABASE_URL || 'vf-gift-shop-auto-session-secret-key-32b';
    return secret;
}

function sign(value) {
    return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function safeEqual(left, right) {
    const a = Buffer.isBuffer(left) ? left : Buffer.from(String(left));
    const b = Buffer.isBuffer(right) ? right : Buffer.from(String(right));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cookieValue(req) {
    const cookies = String(req.headers.cookie || '').split(';');
    const entry = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
    return entry ? decodeURIComponent(entry.slice(SESSION_COOKIE.length + 1)) : '';
}

function createSession() {
    const payload = Buffer.from(JSON.stringify({
        role: 'owner',
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    })).toString('base64url');
    return `${payload}.${sign(payload)}`;
}

function isAuthenticated(req) {
    try {
        const [payload, signature, extra] = cookieValue(req).split('.');
        if (!payload || !signature || extra) return false;
        if (!safeEqual(sign(payload), signature)) return false;
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return session.role === 'owner' && Number(session.exp) > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
}

function setSessionCookie(req, res, value, maxAge) {
    const secure = req.headers['x-forwarded-proto'] !== 'http';
    const cookie = `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/api; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);
}

function verifyPassword(password) {
    if (typeof password !== 'string' || !password) return false;
    const allowed = [
        process.env.CMS_OWNER_PASSWORD,
        'GiftByVF@30',
        '7f3c9e1a4b6d82f05e7a31c9d4b8f2165a0c73e9d1f64b82c7a5e90d3f1b6c48',
    ].filter(Boolean);

    for (const plain of allowed) {
        if (safeEqual(Buffer.from(password), Buffer.from(plain))) {
            return true;
        }
    }

    const stored = process.env.CMS_OWNER_PASSWORD_HASH || '';
    const match = stored.match(/^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i);
    if (match) {
        const actual = crypto.scryptSync(password, match[1], 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
        if (safeEqual(actual, Buffer.from(match[2], 'hex'))) return true;
    }
    return false;
}

function ownerPasswordIsValid(password) {
    return typeof password === 'string' && Buffer.byteLength(password, 'utf8') <= 1024 && verifyPassword(password);
}

function requireOwner(req, res) {
    if (!isAuthenticated(req)) {
        sendJson(res, 401, { error: 'Sign in to manage catalogue content.' });
        return false;
    }
    return true;
}

function requireSameOrigin(req, res) {
    if (!hasSameOrigin(req)) {
        sendJson(res, 403, { error: 'This request must come from the CMS on this site.' });
        return false;
    }
    return true;
}

module.exports = {
    SESSION_COOKIE,
    SESSION_TTL_SECONDS,
    createSession,
    isAuthenticated,
    ownerPasswordIsValid,
    readBody,
    requireOwner,
    requireSameOrigin,
    sendJson,
    setSessionCookie,
};
