'use strict';
const { neon } = require('@neondatabase/serverless');

async function main() {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
        throw new Error('NEON_DATABASE_URL environment variable is required.');
    }
    const sql = neon(url);
    await sql`
        CREATE TABLE IF NOT EXISTS public.cms_public_content (
            collection TEXT NOT NULL CHECK (
                collection IN (
                    'products', 'settings', 'portfolio',
                    'testimonials', 'why-us', 'how-to-order', 'faqs'
                )
            ),
            id TEXT NOT NULL,
            data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
            version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
            archived BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order BIGINT NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (collection, id)
        )
    `;
    await sql`
        CREATE INDEX IF NOT EXISTS cms_public_content_order_idx
            ON public.cms_public_content (collection, sort_order, id)
    `;
    console.log('Schema created OK');
}

main().catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
});
