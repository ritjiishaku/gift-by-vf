// Gifts by VF — Catalogue Script
// All content is editable from a Google Sheet (no code changes needed).

const VF = {
    TABS: {
        SETTINGS: 'Site Settings',
        PRODUCTS: 'Products',
        REPS: 'Sales Reps',
        WHY_US: 'Why Us',
        TESTIMONIALS: 'Testimonials',
        PORTFOLIO: 'Portfolio',
        HOW_TO_ORDER: 'How to Order',
        FAQ: 'FAQs'
    },

    DEFAULTS: {
        whatsapp_number: '2348127252004',
        site_title: 'Gifts by VF — Handcrafted & Bespoke Gifts',
        brand_name: 'Gifts by V',
        brand_accent: 'F',
        hero_label: 'Thoughtful Gifts',
        hero_title: 'Thoughtful gifts for every special moment.',
        hero_desc: 'Handcrafted jewellery, acrylic keepsakes, and personalised gifts for birthdays, weddings, and meaningful occasions — made with care and delivered across Nigeria.',
        hero_cta: 'Chat on WhatsApp',
        products_label: 'Gift Collection',
        products_title: 'Choose the perfect gift',
        products_desc: 'From personalised keepsakes to statement jewellery and meaningful gifting moments, discover pieces made to celebrate the people you love.',
        featured_label: 'Bestsellers',
        featured_title: 'Most-loved gifts',
        why_label: 'Why VF',
        why_title: 'Why People Choose Us',
        why_desc: 'Handcrafted with care, delivered with love.',
        testimonials_label: 'Kind Words',
        testimonials_title: 'What Our Customers Say',
        portfolio_label: 'Recent Moments',
        portfolio_title: 'Some of what we\'ve made',
        howto_label: 'Simple & Easy',
        howto_title: 'How to Order',
        howto_steps: [
            {
                title: 'Find what you love',
                description: 'Use the search bar to browse by keyword, category, or occasion and find the perfect gift for your moment.'
            },
            {
                title: 'Choose your favourite',
                description: 'Browse the catalogue, compare styles, and pick the piece that feels most personal and meaningful.'
            },
            {
                title: 'Send your custom details',
                description: 'Tap the WhatsApp button and send us the name, initials, photo, text, or custom details you want included.'
            },
            {
                title: 'Confirm & pay',
                description: 'We’ll confirm the design, final details, and pricing with you before payment is completed.'
            },
            {
                title: 'We create & deliver',
                description: 'Leave the rest to us and we’ll craft your gift with care and deliver it to you with love.'
            }
        ],
        faq_label: 'Good to Know',
        faq_title: 'Before You Order',
        footer_text: `© ${new Date().getFullYear()} Gifts by VF. All rights reserved.`
    },

    WA_ICON: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-whatsapp"/></svg>',

    PRODUCT_LIMIT: 12,
    PRODUCT_CHUNK: 12,
    FEATURED_LIMIT: 6,
    TESTIMONIAL_LIMIT: 6,

    PRICE_RANGES: [
        ['any', 'Any price'],
        ['under-20000', 'Under \u20A620,000'],
        ['20000-50000', '\u20A620,000 \u2013 \u20A650,000'],
        ['above-50000', 'Above \u20A650,000']
    ],

    ICONS: {
        jewelry: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        acrylic: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>',
        gift: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>',
        corporate: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
        star: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
        target: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-9h4V7h2v4h4v2h-4v4h-2v-4H7z"/></svg>',
        chat: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
        truck: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5l1.9 5.1H17V9.5h2.5m0-2H17c-1.1 0-2 .9-2 2v8h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-3.5l-2.5-6.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM8 9.5v6H4.5L2 17V4.5C2 3.67 2.67 3 3.5 3h9c.83 0 1.5.67 1.5 1.5V9.5H8z"/></svg>',
        heart: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
        camera: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>',
        award: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>',
        sparkle: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2zm8 12l.9 2.9L24 18l-3.1.9L20 22l-.9-3.1L16 18l3.1-1.1L20 14zM4 15l.7 2.2L7 18l-2.3.8L4 21l-.7-2.2L1 18l2.3-.8L4 15z"/></svg>',
        link: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.9 12c0-2.21 1.79-4 4-4h4V6H7.9c-3.31 0-6 2.69-6 6s2.69 6 6 6h4v-2h-4c-2.21 0-4-1.79-4-4zM8 13h8v-2H8v2zm12-7h-4v2h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4v2h4c3.31 0 6-2.69 6-6s-2.69-6-6-6z"/></svg>'
    },

    _cache: {},
    _fadeObserver: null,

    async fetchTab(tabName) {
        return VFUtils.fetchTab(tabName, VFUtils.SHEET_ID, this._cache);
    },

    icon(name) {
        const key = String(name || '').trim().toLowerCase();
        return this.ICONS[key] || this.ICONS.star;
    },

    setText(id, value) {
        if (value == null || value === '') return;
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    observeFadeIns() {
        if (!this._fadeObserver) {
            this._fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            }, { threshold: 0.1 });
        }
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => this._fadeObserver.observe(el));
    },

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (container.querySelector('.empty-state')) return;
        const el = document.createElement('div');
        el.className = 'empty-state';
        el.textContent = message;
        container.appendChild(el);
    },

    showCatalogueError(message) {
        const container = document.getElementById('products-grid');
        if (!container) return;
        if (container.querySelector('.empty-state')) return;
        const el = document.createElement('div');
        el.className = 'empty-state';
        el.innerHTML = `<p>${VFUtils.sanitize(message)}</p>
            <a class="product-order-btn" href="${this.waLink(null, null)}" target="_blank" rel="noopener noreferrer" aria-label="Order now on WhatsApp">${this.WA_ICON}<span>Order now</span></a>`;
        container.appendChild(el);
    },

    // ══════════════════════════════════════════════════════
    //  LIGHTBOX
    // ══════════════════════════════════════════════════════
    openLightbox(url, name, video) {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        const caption = VFUtils.sanitize(name || '');
        let media;
        if (video && video.src && video.type === 'iframe') {
            media = `<iframe src="${VFUtils.sanitize(video.src)}" title="${caption}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        } else if (video && video.src) {
            const img = VFUtils.directImageUrl(url);
            const poster = img ? VFUtils.sanitize(this.srcVariant(img, 1200, 1200)) : '';
            media = `<video src="${VFUtils.sanitize(video.src)}"${poster ? ` poster="${poster}"` : ''} controls autoplay playsinline></video>`;
        } else {
            const img = VFUtils.directImageUrl(url);
            if (!img) return;
            const src = this.srcVariant(img, 1200, 1200);
            media = `<img src="${VFUtils.sanitize(src)}" alt="${caption}" decoding="async">`;
        }
        lb.innerHTML = `<button type="button" class="lightbox-close" aria-label="Close">&times;</button>
            ${media}
            ${caption ? `<p class="lightbox-caption">${caption}</p>` : ''}`;
        lb.hidden = false;
        document.body.classList.add('lightbox-open');
    },

    closeLightbox() {
        const lb = document.getElementById('lightbox');
        if (!lb) return;
        lb.hidden = true;
        lb.innerHTML = '';
        document.body.classList.remove('lightbox-open');
    },

    getReferral() {
        try {
            const raw = localStorage.getItem('vf_referral');
            if (!raw) return null;
            const ref = JSON.parse(raw);
            const maxAge = 30 * 24 * 60 * 60 * 1000;
            if (!ref || !ref.rep_id || Date.now() - ref.arrive_at > maxAge) {
                localStorage.removeItem('vf_referral');
                return null;
            }
            return ref;
        } catch (e) {
            return null;
        }
    },

    async resolveReferral() {
        this._referral = null;
        const stored = this.getReferral();
        if (!stored) return;
        try {
            const reps = await this.fetchTab(this.TABS.REPS);
            if (reps === null) return;
            const rep = (reps || []).find(r => String(r.rep_id || '').trim().toLowerCase() === stored.rep_id.toLowerCase());
            if (!rep || !VFUtils.isActive(rep)) {
                localStorage.removeItem('vf_referral');
                return;
            }
            const name = rep.name || stored.rep_id;
            this._referral = { rep_id: stored.rep_id, name };
            if (this._showRefBanner) {
                this._showRefBanner = false;
                this.showReferralBanner();
            }
        } catch (e) {
            localStorage.removeItem('vf_referral');
        }
    },

    showReferralBanner() {
        const banner = document.getElementById('referral-banner');
        if (!banner || !this._referral) return;
        banner.innerHTML = '';
        const text = document.createElement('span');
        text.textContent = `You were referred by ${this._referral.name}`;
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'referral-close';
        close.setAttribute('aria-label', 'Dismiss referral message');
        close.innerHTML = '&times;';
        close.addEventListener('click', () => this.dismissReferralBanner());
        banner.appendChild(text);
        banner.appendChild(close);
        banner.classList.add('visible');
        document.body.classList.add('has-referral');
    },

    dismissReferralBanner() {
        const banner = document.getElementById('referral-banner');
        if (banner) banner.classList.remove('visible');
        document.body.classList.remove('has-referral');
        this._referral = null;
        try {
            localStorage.removeItem('vf_referral');
            localStorage.removeItem('vf_ref_new');
        } catch (e) { /* storage may be unavailable */ }
    },

    orderMessage(productName, price) {
        let msg = productName
            ? `Hello! I'd like to order ${productName}${price ? ` (from ${price})` : ''}.`
            : 'Hello! I would love to place an order with Gifts by VF.';
        if (this._referral) msg += ` I was referred by ${this._referral.name}.`;
        return encodeURIComponent(msg);
    },

    waLink(productName, price) {
        return `https://wa.me/${this._waNumber}?text=${this.orderMessage(productName, price)}`;
    },

    srcVariant(url, width, height) {
        const u = String(url || '').trim();
        if (!u) return '';
        const h = height == null ? width : height;

        if (/googleusercontent\.com\/d\//i.test(u)) {
            const cleanUrl = u.replace(/=[a-z0-9-]*$/i, '');
            return `${cleanUrl}=s${width}`;
        }

        if (/[?&]sz=/i.test(u)) {
            return u.replace(/([?&])sz=[^&]*/i, `$1sz=w${width}-h${h}`);
        }

        if (!/[?&](w|h)=/i.test(u)) return u;

        let out = u;
        if (/[?&]w=\d+/i.test(out)) out = out.replace(/([?&])w=\d+/i, `$1w=${width}`);
        else out += (out.includes('?') ? '&' : '?') + `w=${width}`;
        if (/[?&]h=\d+/i.test(out)) out = out.replace(/([?&])h=\d+/i, `$1h=${h}`);
        else out += `&h=${h}`;
        return out;
    },

    // ══════════════════════════════════════════════════════
    //  SITE SETTINGS
    // ══════════════════════════════════════════════════════

    // Synchronously paint a settings object onto the DOM.
    _applySettings(settings) {
        const brandName = settings.brand_name || '';
        const brandAccent = settings.brand_accent || '';
        document.querySelectorAll('.brand-text').forEach(el => (el.textContent = brandName));
        document.querySelectorAll('.brand-accent').forEach(el => (el.textContent = brandAccent));

        if (settings.site_title) document.title = settings.site_title;

        if (settings.whatsapp_number) {
            this._waNumber = settings.whatsapp_number.replace(/[^0-9]/g, '');
        }

        const navWa = document.getElementById('nav-wa-btn');
        if (navWa) navWa.href = this.waLink(null, null);

        this.setText('products-label', settings.products_label);
        this.setText('products-title', settings.products_title);
        this.setText('products-desc', settings.products_desc);
        this.setText('hero-label', settings.hero_label);
        this.setText('hero-title', settings.hero_title);
        this.setText('hero-desc', settings.hero_desc);
        this.setText('hero-cta-text', settings.hero_cta);
        this.setText('featured-label', settings.featured_label);
        this.setText('featured-title', settings.featured_title);
        this.setText('why-label', settings.why_label);
        this.setText('why-title', settings.why_title);
        this.setText('why-desc', settings.why_desc);
        this.setText('testimonials-label', settings.testimonials_label);
        this.setText('testimonials-title', settings.testimonials_title);
        this.setText('portfolio-label', settings.portfolio_label);
        this.setText('portfolio-title', settings.portfolio_title);
        this.setText('howto-label', settings.howto_label);
        this.setText('howto-title', settings.howto_title);
        this.setText('faq-label', settings.faq_label);
        this.setText('faq-title', settings.faq_title);
        this.setText('footer-text', settings.footer_text);

        const howtoWa = document.getElementById('howto-wa');
        if (howtoWa) howtoWa.href = this.waLink(null, null);

        const heroWa = document.getElementById('hero-wa');
        if (heroWa) heroWa.href = this.waLink(null, null);
    },

    settingsFromRows(rows) {
        if (!rows || rows.length === 0) return null;
        if (!rows.some(row => 'key' in row)) return null;
        const settings = { ...this.DEFAULTS };
        rows.forEach(row => {
            if (row.key && row.value) settings[row.key] = row.value;
        });
        return settings;
    },

    async applySiteSettings() {
        // 1. Paint the last good settings immediately (defaults only when there is no cache).
        const cached = VFUtils.cacheRead(this.TABS.SETTINGS);
        const boot = cached ? this.settingsFromRows(cached) : null;
        this._applySettings(boot || this.DEFAULTS);
        console.info('[VF] settings painted(initial): ' + (boot ? 'cached' : 'defaults'));

        // 2. Fetch sheet values and patch on top once ready.
        const rows = await this.fetchTab(this.TABS.SETTINGS);
        if (!rows || rows.length === 0) return;

        const fresh = this.settingsFromRows(rows);
        if (!fresh) {
            console.warn('[VF] Site Settings loaded without a `key` column — check the tab layout (row 1 = key,value, one key pair per row, no merged cells).');
            return;
        }
        this._applySettings(fresh);
        console.info('[VF] settings painted(sheet): ' + Object.keys(fresh).length + ' keys');
    },

    // ══════════════════════════════════════════════════════
    //  PRODUCTS / CATALOGUE
    // ══════════════════════════════════════════════════════
    async renderProducts() {
        const container = document.getElementById('products-grid');
        if (!container) return;

        const rows = await this.fetchTab(this.TABS.PRODUCTS);
        if (rows === null) {
            this.showCatalogueError("Couldn't load the catalogue right now. Order directly on WhatsApp instead.");
            const count = document.getElementById('catalogue-count');
            if (count) count.textContent = '';
            return;
        }
        const items = VFUtils.filterAndSort(rows);
        if (items.length === 0) {
            this.showError('products-grid', 'No products yet.');
            const count = document.getElementById('catalogue-count');
            if (count) count.textContent = '';
            return;
        }

        this._products = items;
        this._featuredProducts = items.filter(p => this.isFeatured(p));
        this._featuredIds = new Set(this._featuredProducts.map(p => this.keyOf(p)));
        this.renderFilterPills();
        this.renderOccasionControls();
        this.renderPriceSelect();
        this.renderFeaturedStrip();
        this.applyProductFilters();
        this.buildProductJsonLd();
    },

    keyOf(p) {
        return [p.name, p.price, p.image_url]
            .map(x => String(x == null ? '' : x).trim().toLowerCase())
            .join('::');
    },

    buildProductJsonLd() {
        if (!this._products || this._products.length === 0) return;
        const urlFor = p => location.origin + '/product/' + encodeURIComponent(VFUtils.slugify(p.name) || VFUtils.slugify(p.display_order || ''));
        const list = this._products.slice(0, 100).map(p => {
            const img = VFUtils.validateUrl(VFUtils.directImageUrl(p.image_url));
            const item = {
                '@type': 'Product',
                name: p.name,
                description: p.description || undefined,
                image: img ? [img] : undefined,
                url: urlFor(p)
            };
            const price = VFUtils.priceNumber(p);
            if (price != null && price > 0) {
                item.offers = {
                    '@type': 'Offer',
                    priceCurrency: 'NGN',
                    price: price,
                    availability: VFUtils.isSoldOut(p)
                        ? 'https://schema.org/OutOfStock'
                        : 'https://schema.org/InStock'
                };
            }
            return item;
        });

        const data = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: list.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item }))
        };

        let el = document.getElementById('product-jsonld');
        if (!el) {
            el = document.createElement('script');
            el.id = 'product-jsonld';
            el.type = 'application/ld+json';
            document.head.appendChild(el);
        }
        el.textContent = JSON.stringify(data);
    },

    isFeatured(p) {
        const v = String(p && p.featured != null ? p.featured : '').toLowerCase();
        return v === 'true' || v === '1' || v === 'yes';
    },

    isFilteredView() {
        return this._activeCategory !== 'all'
            || String(this._searchQuery || '').trim() !== ''
            || this._activeOccasion !== 'all'
            || this._priceRange !== 'any';
    },

    matchesFilters(p) {
        if (this._activeCategory !== 'all') {
            const cat = String(p.category || '').trim().toLowerCase();
            if (cat !== this._activeCategory) return false;
        }
        if (this._activeOccasion !== 'all') {
            const tags = String(p.occasion || '').toLowerCase().split(',').map(t => t.trim());
            if (!tags.includes(this._activeOccasion)) return false;
        }
        if (this._priceRange !== 'any') {
            const n = VFUtils.priceNumber(p);
            if (n == null) return false;
            if (this._priceRange === 'under-20000' && !(n < 20000)) return false;
            if (this._priceRange === '20000-50000' && !(n >= 20000 && n <= 50000)) return false;
            if (this._priceRange === 'above-50000' && !(n > 50000)) return false;
        }
        const q = String(this._searchQuery || '').toLowerCase();
        if (q) {
            const haystack = [
                p.name,
                p.description,
                p.category,
                p.material,
                p.size,
                p.price
            ].join(' ').toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    },

    renderFeaturedStrip() {
        const section = document.getElementById('featured-section');
        const container = document.getElementById('featured-grid');
        if (!section || !container) return;
        if (!this._featuredProducts || this._featuredProducts.length === 0) {
            section.hidden = true;
            return;
        }
        const pool = this.isFilteredView()
            ? this._featuredProducts.filter(p => this.matchesFilters(p))
            : this._featuredProducts.slice();
        if (pool.length === 0) {
            section.hidden = true;
            return;
        }
        const shown = pool.slice(0, this.FEATURED_LIMIT);
        const sig = shown.map(p => this.keyOf(p)).join('|');
        if (container.dataset.sig !== sig) {
            container.dataset.sig = sig;
            container.innerHTML = shown.map((p, i) =>
                this.productCardHTML(p, p.display_order || i + 1)
            ).join('');
            this.observeFadeIns();
        }
        section.hidden = false;
    },

    renderPriceSelect() {
        const sel = document.getElementById('catalogue-price');
        if (!sel) return;
        const options = this.PRICE_RANGES
            .map(([value, label]) => `<option value="${value}"${this._priceRange === value ? ' selected' : ''}>${VFUtils.sanitize(label)}</option>`)
            .join('');
        if (sel.innerHTML !== options) sel.innerHTML = options;
    },

    renderOccasionControls() {
        const pillsBar = document.getElementById('occasion-filters');
        const selectRow = document.getElementById('occasion-select-row');
        const dropdown = document.getElementById('occasion-filter');
        const products = Array.isArray(this._products) ? this._products : [];
        const map = new Map();
        products.forEach(p => {
            String(p.occasion || '').split(',').forEach(t => {
                t = t.trim();
                if (t) map.set(t.toLowerCase(), t);
            });
        });
        const occasions = [...map.values()].sort((a, b) => a.localeCompare(b));
        const hasOccasions = occasions.length > 0;

        if (pillsBar) {
            const pills = [['all', 'All'], ...occasions.map(o => [o.toLowerCase(), o])]
                .map(([key, label]) => `<button type="button" class="pill${this._activeOccasion === key ? ' active' : ''}" data-occasion="${VFUtils.sanitize(key)}">${VFUtils.sanitize(label)}</button>`)
                .join('');
            pillsBar.innerHTML = hasOccasions ? pills : '';
            pillsBar.classList.toggle('hidden', !hasOccasions);
        }
        if (dropdown) {
            const options = [['all', 'All occasions'], ...occasions.map(o => [o.toLowerCase(), o])]
                .map(([key, label]) => `<option value="${VFUtils.sanitize(key)}"${this._activeOccasion === key ? ' selected' : ''}>${VFUtils.sanitize(label)}</option>`)
                .join('');
            dropdown.innerHTML = options;
        }
        if (selectRow) selectRow.classList.toggle('hidden', !hasOccasions);
    },

    _setOccasion(key) {
        this._activeOccasion = String(key || 'all').toLowerCase();
        this.renderOccasionControls();
        if (this._products) this.applyProductFilters();
    },

    _setPriceRange(value) {
        this._priceRange = String(value || 'any');
        if (this._products) this.applyProductFilters();
    },

    _setCategory(key) {
        this._activeCategory = String(key || 'all').toLowerCase();
        this.renderFilterPills();
        if (this._products) this.applyProductFilters();
    },

    renderFilterPills() {
        const bar = document.getElementById('catalogue-filters');
        if (!bar) return;

        const products = Array.isArray(this._products) ? this._products : [];
        const cats = [];
        const counts = {};
        products.forEach(p => {
            const c = String(p.category || '').trim();
            if (c) {
                const key = c.toLowerCase();
                counts[key] = (counts[key] || 0) + 1;
                if (!cats.some(x => x.toLowerCase() === key)) cats.push(c);
            }
        });

        const pillLabel = (c) => {
            const key = c === 'All' ? null : c.toLowerCase();
            return key && counts[key] ? `${c} (${counts[key]})` : c;
        };

        const pills = ['All', ...cats].map(c => {
            const key = c === 'All' ? 'all' : c.toLowerCase();
            return `<button type="button" class="pill${this._activeCategory === key ? ' active' : ''}" data-category="${VFUtils.sanitize(key)}">${VFUtils.sanitize(pillLabel(c))}</button>`;
        }).join('');
        bar.innerHTML = pills;

        const dropdown = document.getElementById('catalogue-filter');
        if (dropdown) {
            const options = [['all', 'All categories'], ...cats.map(c => [c.toLowerCase(), c])]
                .map(([key, label]) => `<option value="${VFUtils.sanitize(key)}"${this._activeCategory === key ? ' selected' : ''}>${VFUtils.sanitize(pillLabel(label))}</option>`)
                .join('');
            dropdown.innerHTML = options;
        }

        if (typeof this._refreshFilterFades === 'function') this._refreshFilterFades();
    },

    applyProductFilters() {
        const allProducts = Array.isArray(this._products) ? this._products : [];
        const container = document.getElementById('products-grid');
        if (!container) return;

        this.renderFeaturedStrip();

        let filtered = allProducts.filter(p => this.matchesFilters(p));

        if (this._sort === 'price-asc' || this._sort === 'price-desc') {
            const dir = this._sort === 'price-asc' ? 1 : -1;
            filtered.sort((a, b) => {
                const pa = VFUtils.priceNumber(a);
                const pb = VFUtils.priceNumber(b);
                if (pa == null && pb == null) return 0;
                if (pa == null) return 1;
                if (pb == null) return -1;
                return dir * (pa - pb);
            });
        } else if (this._sort === 'name-asc') {
            filtered.sort((a, b) => {
                const na = (a.name || '').trim().toLowerCase();
                const nb = (b.name || '').trim().toLowerCase();
                if (!na && !nb) return 0;
                if (!na) return 1;
                if (!nb) return -1;
                return na < nb ? -1 : na > nb ? 1 : 0;
            });
        }

        this._lastFiltered = filtered;
        this._productShown = Math.min(this.PRODUCT_LIMIT, filtered.length);
        this.renderProductGrid(filtered);
    },

    renderProductGrid(filtered) {
        const container = document.getElementById('products-grid');
        if (!container) return;

        if (filtered.length === 0) {
            const featuredVisible = !this.isFilteredView()
                && this._featuredProducts && this._featuredProducts.length > 0;
            if (!featuredVisible) {
                container.innerHTML = `<div class="empty-state">No products match your search.</div>`;
            } else {
                container.innerHTML = '';
            }
        } else {
            const shown = Math.min(this._productShown, filtered.length);
            const visible = filtered.slice(0, shown);
            let html = visible.map((p, i) =>
                this.productCardHTML(p, p.display_order || i + 1)
            ).join('');
            const more = filtered.length - visible.length;
            if (more > 0) {
                html += VFUtils.loadMoreButton(more, 'load-more-products-btn');
            }
            container.innerHTML = html;
        }

        const count = document.getElementById('catalogue-count');
        if (count) {
            const displayed = Math.min(this._productShown, filtered.length);
            count.textContent = `Showing ${displayed} of ${filtered.length} pieces`;
        }
        this.observeFadeIns();
    },

    showMoreProducts() {
        if (!this._lastFiltered || this._lastFiltered.length === 0) return;
        const container = document.getElementById('products-grid');
        if (!container) return;
        const append = Math.min(this.PRODUCT_CHUNK, this._lastFiltered.length - this._productShown);
        if (append <= 0) return;
        const start = this._productShown;
        this._productShown += append;

        const html = this._lastFiltered.slice(start, start + append)
            .map((p, i) => this.productCardHTML(p, p.display_order || start + i + 1))
            .join('');

        let btn = container.querySelector('#load-more-products-btn');
        if (btn) {
            const wrap = btn.closest('.load-more-wrap');
            if (wrap) wrap.insertAdjacentHTML('beforebegin', html);
            else container.insertAdjacentHTML('beforeend', html);
            const remaining = this._lastFiltered.length - this._productShown;
            if (remaining > 0) {
                btn.textContent = `Show more (${remaining} more)`;
            } else {
                btn.closest('.load-more-wrap').remove();
            }
        } else {
            container.insertAdjacentHTML('beforeend', html);
        }

        const count = document.getElementById('catalogue-count');
        if (count) count.textContent = `Showing ${this._productShown} of ${this._lastFiltered.length} pieces`;
        this.observeFadeIns();
    },

    clearProductFilters() {
        this._activeCategory = 'all';
        this._searchQuery = '';
        this._activeOccasion = 'all';
        this._priceRange = 'any';
        const input = document.getElementById('catalogue-search');
        if (input) input.value = '';
        const priceSel = document.getElementById('catalogue-price');
        if (priceSel) priceSel.value = 'any';
        const occasionSel = document.getElementById('occasion-filter');
        if (occasionSel) occasionSel.value = 'all';
        if (this._products) {
            this.renderFilterPills();
            this.renderOccasionControls();
            this.applyProductFilters();
        }
    },

    productCardHTML(p, pid) {
        let imageUrl = String(p.image_url || '').trim();
        let video = VFUtils.videoUrl(p.video_url);

        // Safety net: if a video link (YouTube, Short, or direct .mp4/.webm)
        // was pasted into image_url, treat it as the card's video instead of
        // rendering a broken image. Drive links stay treated as images.
        if (!video) {
            const peek = VFUtils.videoUrl(imageUrl);
            if (peek && !VFUtils.isDriveUrl(imageUrl)) {
                video = peek;
                imageUrl = '';
            }
        }

        const url = VFUtils.validateUrl(VFUtils.directImageUrl(imageUrl));
        const srcset = url
            ? this.srcVariant(url, 300, 300) + ' 300w, ' + this.srcVariant(url, 600, 600) + ' 600w, ' + this.srcVariant(url, 900, 900) + ' 900w'
            : '';
        const price = VFUtils.formatNaira(p.price);
        const category = String(p.category || '').trim() || 'Custom';
        const slug = VFUtils.slugify(p.name) || VFUtils.slugify(pid);
        const soldOut = VFUtils.isSoldOut(p);
        const badgeLabel = soldOut ? (String(p.stock_label || '').trim() || 'Sold Out') : category;
        const img = (url || video)
            ? `<button type="button" class="js-lightbox" data-img="${VFUtils.sanitize(url)}" data-name="${VFUtils.sanitize(p.name)}"${video ? ` data-video="${VFUtils.sanitize(video.src)}" data-video-type="${video.type}"` : ''} aria-label="${video ? 'Play video of' : 'View larger image of'} ${VFUtils.sanitize(p.name)}">
                    ${url ? `<img src="${VFUtils.sanitize(url)}" srcset="${VFUtils.sanitize(srcset)}" sizes="(min-width: 768px) 320px, 100vw" alt="${VFUtils.sanitize(p.name)}" loading="lazy" decoding="async" onerror="if(!this.dataset.retried){this.dataset.retried='true';this.removeAttribute('srcset');this.src='${VFUtils.sanitize(url)}';}else{var c=this.closest('.product-img');if(c){c.classList.add('no-image');}}">` : ''}
                    ${video ? '<span class="product-play-wrap" aria-hidden="true"><span class="product-play"></span><span class="product-play-label">Watch</span></span>' : ''}
                </button>`
            : '';
        const meta = [
            ['Material', p.material],
            ['Size', p.size],
            ['Turnaround', p.turnaround],
            ['Delivery', p.delivery_notes],
            ['Payment', p.payment_terms]
        ].filter(([, v]) => v != null && String(v).trim() !== '')
            .map(([k, v]) => `<li><span>${k}:</span> ${VFUtils.sanitize(v)}</li>`)
            .join('');
        const orderText = soldOut ? 'Request a custom quote' : 'Order this gift';
        return `
            <div class="product-card fade-in${soldOut ? ' is-soldout' : ''}" id="product-${VFUtils.sanitize(slug)}">
                <div class="product-img${url ? '' : ' no-image'}">
                    ${img}
                    <div class="product-icon-fallback">${this.icon(p.icon || category.toLowerCase())}</div>
                    <span class="product-badge${soldOut ? ' out' : ''}">${VFUtils.sanitize(badgeLabel)}</span>
                </div>
                <div class="product-body">
                    <h3>${VFUtils.sanitize(p.name)}</h3>
                    ${price ? `<span class="product-price">From ${VFUtils.sanitize(price)}</span>` : ''}
                    <p>${VFUtils.sanitize(p.description)}</p>
                    ${meta ? `<ul class="product-meta">${meta}</ul>` : ''}
                    <div class="product-actions">
                        <a href="${this.waLink(p.name, price)}" class="product-order-btn" target="_blank" rel="noopener noreferrer" aria-label="${soldOut ? `Enquire on WhatsApp about ${VFUtils.sanitize(p.name)}` : `Order ${VFUtils.sanitize(p.name)} on WhatsApp`}">
                            ${this.WA_ICON}
                            <span>${orderText}</span>
                        </a>
                        <button type="button" class="product-share-btn js-share" data-slug="${VFUtils.sanitize(slug)}" aria-label="Copy link to ${VFUtils.sanitize(p.name)}" title="Copy product link">
                            ${this.ICONS.link}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    handleProductGridClick(e) {
        if (e.target.closest('#load-more-products-btn')) return this.showMoreProducts();
        const shareBtn = e.target.closest('.js-share[data-slug]');
        if (shareBtn) {
            this.copyProductLink(shareBtn);
            return;
        }
        const lightboxBtn = e.target.closest('.js-lightbox');
        if (lightboxBtn) {
            const src = lightboxBtn.getAttribute('data-video');
            const type = lightboxBtn.getAttribute('data-video-type');
            const video = src ? { src, type: type === 'file' ? 'file' : 'iframe' } : null;
            this.openLightbox(lightboxBtn.getAttribute('data-img'), lightboxBtn.getAttribute('data-name'), video);
        }
    },

    async copyProductLink(btn) {
        const slug = btn.getAttribute('data-slug');
        if (!slug) return;
        const text = location.origin + '/product/' + encodeURIComponent(slug);
        const ariaLabel = btn.getAttribute('aria-label');
        const showCopied = () => {
            btn.classList.add('copied');
            btn.setAttribute('aria-label', 'Link copied');
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.setAttribute('aria-label', ariaLabel);
            }, 2000);
        };
        try {
            await navigator.clipboard.writeText(text);
            showCopied();
        } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); showCopied(); } catch (e2) { /* ignore */ }
            document.body.removeChild(ta);
        }
    },

    // ══════════════════════════════════════════════════════════
    //  SIDE SECTIONS (PORTFOLIO / WHY US / TESTIMONIALS / HOW TO ORDER / FAQ)
    //  Each one renders only when its sheet tab has visible rows.
    // ══════════════════════════════════════════════════════════
    async renderSideSections() {
        await Promise.all([
            this.renderPortfolio(),
            this.renderWhyUs(),
            this.renderTestimonials(),
            this.renderHowTo(),
            this.renderFaq()
        ]);
    },

    starRating(rating) {
        const n = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    },

    async renderPortfolio() {
        const section = document.getElementById('portfolio');
        const grid = document.getElementById('portfolio-grid');
        if (!section || !grid) return;
        const tab = await this.fetchTab(this.TABS.PORTFOLIO);
        if (!tab) return;
        const rows = VFUtils.filterAndSort(tab);
        if (rows.length === 0) return;
        grid.innerHTML = rows.map(row => {
            const url = VFUtils.validateUrl(VFUtils.directImageUrl(row.image_url));
            const caption = String(row.caption || '').trim();
            const label = caption || 'Portfolio piece';
            const wide = String(row.wide || '').trim().toLowerCase() === 'true';
            const img = url
                ? `<button type="button" class="js-lightbox" data-img="${VFUtils.sanitize(url)}" data-name="${VFUtils.sanitize(label)}" aria-label="View ${VFUtils.sanitize(label)}">
                        <img src="${VFUtils.sanitize(url)}" srcset="${VFUtils.sanitize(this.srcVariant(url, 480, 360) + ' 480w, ' + this.srcVariant(url, 960, 720) + ' 960w')}" sizes="(min-width: 768px) 360px, 100vw" alt="${VFUtils.sanitize(label)}" loading="lazy" decoding="async" onerror="if(!this.dataset.retried){this.dataset.retried='true';this.src='${VFUtils.sanitize(url)}';}else{var c=this.closest('.portfolio-item');if(c){c.classList.add('no-image');}var b=this.closest('.js-lightbox');if(b){b.style.display='none';}}">
                    </button>
                    ${caption ? `<span class="portfolio-caption">${VFUtils.sanitize(caption)}</span>` : ''}`
                : `<span class="portfolio-caption only">${VFUtils.sanitize(label)}</span>`;
            return `<div class="portfolio-item${wide ? ' wide' : ''} fade-in">${img}</div>`;
        }).join('');
        section.hidden = false;
        this.observeFadeIns();
    },

    async renderFaq() {
        const section = document.getElementById('faq');
        const list = document.getElementById('faq-grid');
        if (!section || !list) return;
        const tab = await this.fetchTab(this.TABS.FAQ);
        if (!tab) return;
        const rows = VFUtils.filterAndSort(tab)
            .filter(r => String(r.question || '').trim() !== '' && String(r.answer || '').trim() !== '');
        if (rows.length === 0) return;
        list.innerHTML = rows.map(row => `
            <details class="faq-item">
                <summary>${VFUtils.sanitize(row.question)}</summary>
                <p>${VFUtils.sanitize(row.answer)}</p>
            </details>
        `).join('');
        section.hidden = false;
        this.observeFadeIns();
    },

    async renderWhyUs() {
        const section = document.getElementById('why-us');
        const grid = document.getElementById('why-grid');
        if (!section || !grid) return;
        const tab = await this.fetchTab(this.TABS.WHY_US);
        if (!tab) return;
        const rows = VFUtils.filterAndSort(tab);
        if (rows.length === 0) return;
        grid.innerHTML = rows.map(row => `
            <div class="why-card">
                <span class="why-icon">${this.icon(row.icon)}</span>
                <h3>${VFUtils.sanitize(row.title)}</h3>
                <p>${VFUtils.sanitize(row.description)}</p>
            </div>
        `).join('');
        section.hidden = false;
        this.observeFadeIns();
    },

    async renderTestimonials() {
        const section = document.getElementById('testimonials');
        const track = document.getElementById('testimonials-grid');
        if (!section || !track) return;
        const tab = await this.fetchTab(this.TABS.TESTIMONIALS);
        if (!tab) return;
        const rows = VFUtils.filterAndSort(tab);
        if (rows.length === 0) return;

        const card = row => {
            const stars = this.starRating(row.rating);
            const rated = stars.split('☆')[0].length;
            const byline = [row.name, row.source].filter(Boolean).map(s => VFUtils.sanitize(s)).join(' · ');
            return `
                <figure class="testimonial-card">
                    <div class="stars" role="img" aria-label="${rated ? 'Rated ' + rated + ' out of 5 stars' : 'No rating'}">${stars}</div>
                    <blockquote>${VFUtils.sanitize(row.quote)}</blockquote>
                    ${byline ? `<figcaption>&mdash; ${byline}</figcaption>` : ''}
                </figure>
            `;
        };

        track.innerHTML = rows.slice(0, this.TESTIMONIAL_LIMIT).map(card).join('');

        const more = document.getElementById('testimonials-more');
        if (more) {
            if (rows.length > this.TESTIMONIAL_LIMIT) {
                const rest = rows.slice(this.TESTIMONIAL_LIMIT);
                const btn = more.querySelector('.testimonials-more-btn');
                if (btn) {
                    btn.addEventListener('click', () => {
                        track.insertAdjacentHTML('beforeend', rest.map(card).join(''));
                        btn.setAttribute('aria-expanded', 'true');
                        more.hidden = true;
                        this.observeFadeIns();
                    });
                }
                more.hidden = false;
            } else {
                more.hidden = true;
            }
        }

        section.hidden = false;
        this.observeFadeIns();
    },

    async renderHowTo() {
        const section = document.getElementById('how-to-order');
        const list = document.getElementById('howto-grid');
        if (!section || !list) return;

        let rows = [];
        const tab = await this.fetchTab(this.TABS.HOW_TO_ORDER);
        if (tab) {
            rows = VFUtils.filterAndSort(tab);
        }

        if (rows.length === 0) {
            rows = this.DEFAULTS.howto_steps || [];
        }

        list.innerHTML = rows.map((row, i) => `
            <li class="step">
                <span class="step-num">${i + 1}</span>
                <div>
                    <h3>${VFUtils.sanitize(row.title)}</h3>
                    <p>${VFUtils.sanitize(row.description)}</p>
                </div>
            </li>
        `).join('');

        section.hidden = false;
        this.observeFadeIns();
    },

    // ══════════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════════
    async init() {
        this._waNumber = this.DEFAULTS.whatsapp_number;
        this._referral = null;
        this._showRefBanner = false;
        this._products = null;
        this._activeCategory = 'all';
        this._searchQuery = '';
        this._activeOccasion = 'all';
        this._priceRange = 'any';
        this._sort = 'featured';
        this._lastFiltered = null;
        this._productShown = this.PRODUCT_LIMIT;
        this._searchTimer = null;
        this._featuredProducts = null;
        this._featuredIds = null;

        const params = new URLSearchParams(window.location.search);
        if (params.get('clearref')) {
            try {
                localStorage.removeItem('vf_referral');
                localStorage.removeItem('vf_ref_new');
            } catch (e) { /* storage may be unavailable */ }
        }
        const refParam = params.get('ref');
        if (refParam) {
            const cleanRef = String(refParam).replace(/[^a-z0-9_-]/gi, '').toLowerCase().slice(0, 30);
            if (cleanRef) {
                localStorage.setItem('vf_referral', JSON.stringify({ rep_id: cleanRef, arrive_at: Date.now() }));
                this._showRefBanner = true;
            }
        }
        const productParam = params.get('p');

        const navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            }, { passive: true });
        }

        this.observeFadeIns();

        const searchInput = document.getElementById('catalogue-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this._searchTimer);
                this._searchTimer = setTimeout(() => {
                    this._searchQuery = searchInput.value.trim();
                    if (this._products) this.applyProductFilters();
                }, 150);
            });
        }

        const searchClearBtn = document.getElementById('catalogue-search-clear');
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                this._searchQuery = '';
                if (searchInput) searchInput.value = '';
                if (this._products) {
                    this.renderFilterPills();
                    this.applyProductFilters();
                }
                if (searchInput) searchInput.focus();
            });
        }

        const sortSelect = document.getElementById('catalogue-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this._sort = sortSelect.value || 'featured';
                if (this._products) this.applyProductFilters();
            });
        }

        const categorySelect = document.getElementById('catalogue-filter');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                this._setCategory(categorySelect.value || 'all');
            });
        }

        const priceSelect = document.getElementById('catalogue-price');
        if (priceSelect) {
            priceSelect.addEventListener('change', () => {
                this._setPriceRange(priceSelect.value || 'any');
            });
        }

        const occasionBar = document.getElementById('occasion-filters');
        if (occasionBar) {
            occasionBar.addEventListener('click', (e) => {
                const pill = e.target.closest('.pill[data-occasion]');
                if (!pill) return;
                this._setOccasion(pill.getAttribute('data-occasion'));
            });
        }

        const occasionSelect = document.getElementById('occasion-filter');
        if (occasionSelect) {
            occasionSelect.addEventListener('change', () => {
                this._setOccasion(occasionSelect.value || 'all');
            });
        }

        const filterBar = document.getElementById('catalogue-filters');
        if (filterBar) {
            filterBar.addEventListener('click', (e) => {
                const pill = e.target.closest('.pill[data-category]');
                if (!pill) return;
                this._setCategory(pill.getAttribute('data-category'));
            });
            if (typeof filterBar.classList.toggle === 'function') {
                const refreshFilterFades = () => {
                    const max = filterBar.scrollWidth - filterBar.clientWidth;
                    filterBar.classList.toggle('scroll-l', filterBar.scrollLeft > 4);
                    filterBar.classList.toggle('scroll-r', max - filterBar.scrollLeft > 4);
                };
                filterBar.addEventListener('scroll', refreshFilterFades, { passive: true });
                this._refreshFilterFades = refreshFilterFades;
            }
        }

        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.addEventListener('click', (e) => this.handleProductGridClick(e));
        }

        const featuredGrid = document.getElementById('featured-grid');
        if (featuredGrid) {
            featuredGrid.addEventListener('click', (e) => this.handleProductGridClick(e));
        }

        const portfolioGrid = document.getElementById('portfolio-grid');
        if (portfolioGrid) {
            portfolioGrid.addEventListener('click', (e) => this.handleProductGridClick(e));
        }

        const lightboxEl = document.getElementById('lightbox');
        if (lightboxEl) {
            lightboxEl.addEventListener('click', (e) => {
                if (e.target.closest('.lightbox-close') || e.target === lightboxEl) this.closeLightbox();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !lightboxEl.hidden) this.closeLightbox();
            });
        }

        await this.resolveReferral();

        await Promise.all([
            this.applySiteSettings(),
            this.renderProducts(),
            this.renderSideSections()
        ]);

        if (productParam) {
            if (this._products) this.clearProductFilters();
            if (this._lastFiltered) {
                this._productShown = this._lastFiltered.length;
                this.renderProductGrid(this._lastFiltered);
            }
            const target = document.getElementById('product-' + VFUtils.sanitize(VFUtils.slugify(productParam)));
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('highlighted');
                    setTimeout(() => target.classList.remove('highlighted'), 2500);
                }, 400);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => VF.init());