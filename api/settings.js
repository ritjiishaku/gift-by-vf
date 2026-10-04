const SHEET_ID = '1N3_A0mPYkbTZ1ZeC3b_-KdrgV84jPRfyfYwEqzIwNB4';
const GID = 0;

function parseCSV(text) {
    const src = String(text || '').replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n') {
            row.push(field);
            field = '';
            rows.push(row);
            row = [];
        } else {
            field += ch;
        }
    }
    if (field !== '' || row.length) {
        row.push(field);
        rows.push(row);
    }

    return rows.filter(r => r.some(c => String(c == null ? '' : c).trim() !== ''));
}

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}&cb=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('export failed: ' + response.status);

        const rows = parseCSV(await response.text());
        const headers = rows[0]
            ? rows[0].map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9_]/g, ''))
            : [];
        const out = [];
        for (let i = 1; i < rows.length; i++) {
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = rows[i][idx] != null ? String(rows[i][idx]).trim() : '';
            });
            if (obj.key || obj.value) out.push(obj);
        }
        res.status(200).json(out);
    } catch (err) {
        res.status(200).json([]);
    }
};