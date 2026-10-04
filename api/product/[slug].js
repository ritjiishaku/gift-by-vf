const SHEET_ID = '1N3_A0mPYkbTZ1ZeC3b_-KdrgV84jPRfyfYwEqzIwNB4';
const SITE_NAME = 'Gifts by VF';
const SITE_URL = 'https://vf-gift-shop.vercel.app';
const WHATSAPP_NUMBER = '2348127252004';
const DEFAULT_IMAGE = 'https://lh3.googleusercontent.com/d/1I2iMEg47s7_ik0trBhvqbgrJIBQmFIBB';
const DEFAULT_DESCRIPTION = 'Gifts by VF handcrafts personalized jewelry, acrylic frames, and custom gifts for birthdays, weddings, and corporate events. Order on WhatsApp, delivered across Nigeria.';

function q(value) {
    return String(Array.isArray(value) ? value[0] : (value == null ? '' : value)).trim();
}

function parseCSV(text) {
    const src = String(text || '').replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [];
    let field = '';
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
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n') {
            row.push(field);
            field = '';
            rows.push(row);
            row = [];
        } else {
            field += char;
        }
    }
    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }

    const nonEmpty = rows.filter(r => r.some(cell => cell.trim() !== ''));
    if (nonEmpty.length < 2) return [];
    const headers = nonEmpty[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const result = [];
    for (let i = 1; i < nonEmpty.length; i++) {
        const values = nonEmpty[i];
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] != null ? String(values[index]).trim() : '';
        });
        result.push(obj);
    }
    return result;
}

function slugify(str) {
    return String(str || '').trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function driveId(url) {
    const u = String(url || '');
    let m = u.match(/\/file\/d\/([A-Za-z0-9_-]{20,})/i);
    if (m) return m[1];
    m = u.match(/[?&]id=([A-Za-z0-9_-]{20,})/i);
    if (m) return m[1];
    m = u.match(/\/d\/([A-Za-z0-9_-]{20,})/i);
    if (m) return m[1];
    return null;
}

function isDriveUrl(url) {
    return /drive\.google\.com|googleusercontent\.com/i.test(String(url || ''));
}

function directImageUrl(url) {
    const u = String(url || '').trim();
    if (!u) return '';
    const id = driveId(u);
    if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    if (isDriveUrl(u)) return '';
    return u;
}

function validateUrl(str) {
    const s = String(str || '').trim();
    return /^https?:\/\//i.test(s) ? s : '';
}

function ogImage(url) {
    const direct = validateUrl(directImageUrl(url));
    if (!direct) return DEFAULT_IMAGE;
    if (/googleusercontent\.com\/d\//i.test(direct)) {
        return direct.replace(/=[a-z0-9-]*$/i, '') + '=s1200';
    }
    return direct;
}

function priceNumber(row) {
    const s = String(row && row.price != null ? row.price : '').trim();
    if (!s) return null;
    const cleaned = s.replace(/^ngn\s*/i, '').replace(/^[₦#N₹?]+\s*/i, '');
    if (!/^[0-9,.]+$/.test(cleaned)) return null;
    const n = parseFloat(cleaned.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
}

function formatNaira(str) {
    const s = String(str == null ? '' : str).trim();
    if (!s) return '';
    const cleaned = s.replace(/^ngn\s*/i, '').replace(/^[₦#N₹?]+\s*/i, '');
    if (/^[0-9,.]+$/.test(cleaned)) {
        const n = Math.round(parseFloat(cleaned.replace(/,/g, '')));
        if (Number.isFinite(n)) return '₦' + n.toLocaleString('en-US');
        return s;
    }
    return s;
}

function esc(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function visibleProducts(rows) {
    const seen = new Set();
    return rows.filter(r => {
        const on = String(r.is_visible || '').toLowerCase();
        if (on === 'false' || on === '0') return false;
        const key = String(r.name || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function findProduct(slug) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch Products');
    const rows = visibleProducts(parseCSV(await response.text()));
    if (rows.length === 0) return null;

    const target = slugify(slug);
    let match = rows.find(p => slugify(p.name) === target) || null;
    if (!match && /^\d+$/.test(target)) {
        match = rows.find(p => String(p.display_order || '').trim() === target) || null;
    }
    return match || null;
}

function productSchema(product, pageUrl) {
    const img = ogImage(product.image_url);
    const item = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || undefined,
        image: img === DEFAULT_IMAGE ? undefined : [img],
        url: pageUrl
    };
    const price = parseFloat(String(product.price || '').replace(/[^0-9.-]/g, ''));
    if (Number.isFinite(price) && price > 0) {
        item.offers = {
            '@type': 'Offer',
            priceCurrency: 'NGN',
            price,
            availability: /^(false|0|no)$/i.test(String(product.in_stock || ''))
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock'
        };
    }
    return JSON.stringify(item).replace(/</g, '\\u003c');
}

function renderMeta(tags) {
    const lines = [
        '<meta property="og:type" content="product">',
        `<meta property="og:site_name" content="${esc(tags.site_name)}">`,
        `<meta property="og:url" content="${esc(tags.url)}">`,
        `<meta property="og:title" content="${esc(tags.title)}">`,
        `<meta property="og:description" content="${esc(tags.description)}">`,
        `<meta property="og:image" content="${esc(tags.image)}">`,
        '<meta property="og:locale" content="en_US">',
        '<meta name="twitter:card" content="summary_large_image">',
        `<meta name="twitter:title" content="${esc(tags.title)}">`,
        `<meta name="twitter:description" content="${esc(tags.description)}">`,
        `<meta name="twitter:image" content="${esc(tags.image)}">`,
        `<link rel="canonical" href="${esc(tags.url)}">`
    ];
    if (tags.image_alt) lines.push(`<meta property="og:image:alt" content="${esc(tags.image_alt)}">`);
    if (tags.image_width) lines.push(`<meta property="og:image:width" content="${esc(tags.image_width)}">`);
    if (tags.image_height) lines.push(`<meta property="og:image:height" content="${esc(tags.image_height)}">`);
    if (tags.price != null && Number(tags.price) > 0) {
        lines.push(`<meta property="og:product:price:amount" content="${esc(tags.price)}">`);
        lines.push('<meta property="og:product:price:currency" content="NGN">');
    }
    return lines.join('\n    ');
}

function productPage(product, slug, ref) {
    const pageUrl = `${SITE_URL}/product/${enc(slug)}${ref ? '?ref=' + enc(ref) : ''}`;
    const target = `/?p=${enc(slug)}${ref ? '&ref=' + enc(ref) : ''}`;
    const image = ogImage(product.image_url);
    const price = formatNaira(product.price);
    const priceNum = priceNumber(product);
    const imageSquare = image !== DEFAULT_IMAGE && /googleusercontent\.com\/d\//i.test(image);
    const waMsg = `Hello! I'd like to order ${product.name}${price ? ' (from ' + price + ')' : ''}.`;
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

    const body = `
        <div style="max-width:520px;margin:40px auto;padding:0 20px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1c1c1c;line-height:1.6">
            <p style="text-align:center;letter-spacing:2px;text-transform:uppercase;font-size:12px;color:#c9a96e;margin-bottom:24px"><strong>Gifts by VF</strong></p>
            ${image !== DEFAULT_IMAGE ? `<img src="${esc(image)}" alt="${esc(product.name)}" style="width:100%;max-width:480px;display:block;margin:0 auto 20px auto;border-radius:12px">` : ''}
            <h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 8px;text-align:center">${esc(product.name)}</h1>
            ${price ? `<p style="text-align:center;font-size:20px;margin:0 0 12px;color:#8a6d3b"><strong>${esc(price)}</strong></p>` : ''}
            ${product.description ? `<p style="text-align:center;font-size:15px;color:#555;margin:0 0 28px">${esc(product.description)}</p>` : ''}
            <p style="text-align:center;margin:0 0 12px">
                <a href="${esc(waLink)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:999px">Order on WhatsApp</a>
            </p>
            <p style="text-align:center;font-size:14px;margin:0">
                <a href="${esc(target)}" style="color:#c9a96e;text-decoration:none">Open the full catalogue &rarr;</a>
            </p>
        </div>`;

    return `<!DOCTYPE html>
<html lang="en-NG">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(product.name)} — Gifts by VF</title>
    <meta name="description" content="${esc(product.description || DEFAULT_DESCRIPTION)}">
    <meta name="theme-color" content="#c9a96e">
    <meta name="robots" content="index, follow">
    ${renderMeta({
        site_name: SITE_NAME,
        url: pageUrl,
        title: `${product.name} — Gifts by VF`,
        description: product.description || DEFAULT_DESCRIPTION,
        image,
        image_alt: product.name,
        image_width: imageSquare ? '1200' : undefined,
        image_height: imageSquare ? '1200' : undefined,
        price: priceNum
    })}
    <script type="application/ld+json">${productSchema(product, pageUrl)}</script>
    <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>${body}
</body>
</html>`;
}

function genericPage(ref) {
    const target = ref ? '/?ref=' + enc(ref) : '/';
    return `<!DOCTYPE html>
<html lang="en-NG">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(SITE_NAME)}</title>
    <meta name="description" content="${esc(DEFAULT_DESCRIPTION)}">
    <meta name="theme-color" content="#c9a96e">
    <meta name="robots" content="index, follow">
    ${renderMeta({ site_name: SITE_NAME, url: (ref ? `${SITE_URL}/?ref=${enc(ref)}` : SITE_URL + '/'), title: SITE_NAME, description: DEFAULT_DESCRIPTION, image: DEFAULT_IMAGE })}
    <script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
    <div style="max-width:520px;margin:60px auto;padding:0 20px;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1c1c1c">
        <h1 style="font-family:Georgia,serif;color:#c9a96e">Gifts by VF</h1>
        <p style="color:#555">${esc(DEFAULT_DESCRIPTION)}</p>
        <p><a href="${esc(target)}" style="display:inline-block;background:#c9a96e;color:#fff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:999px">Open the full catalogue</a></p>
    </div>
</body>
</html>`;
}

function enc(str) {
    return encodeURIComponent(String(str == null ? '' : str));
}

module.exports = async function handler(req, res) {
    const slug = q(req.query.slug);
    const ref = q(req.query.ref).replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 30);

    let html;
    if (slug) {
        try {
            const product = await findProduct(slug);
            html = product ? productPage(product, slug, ref) : genericPage(ref);
        } catch (err) {
            html = genericPage(ref);
        }
    } else {
        html = genericPage(ref);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=3600');
    res.setHeader('X-Robots-Tag', 'index, follow');
    res.status(200).send(html);
};