// Sales Rep Tools — share-link generator + commission status
// Reads the same Google Sheet the site uses.

const RepTools = {
    TABS: { SETTINGS: 'Site Settings', REPS: 'Sales Reps', PRODUCTS: 'Products', PAYOUTS: 'Payouts' },
    REP_PAYOUT_LIMIT: 5,
    REP_CREDIT_WINDOW_DAYS: 30,
    _sessionKey: 'vf_rep_session',
    _cache: {},
    _rep: null,
    _productFilters: { query: '', category: 'all', price: 'any', occasion: 'all', sort: 'featured' },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    async fetchTab(tabName) {
        return VFUtils.fetchTab(tabName, VFUtils.SHEET_ID, this._cache);
    },

    findRep(repId, reps) {
        const key = String(repId || '').trim().toLowerCase();
        if (!key) return null;
        return reps.find(r => VFUtils.isActive(r) && String(r.rep_id || '').trim().toLowerCase() === key) || null;
    },

    shareLink(pid, ref) {
        return location.origin + '/product/' + encodeURIComponent(pid) + '?ref=' + encodeURIComponent(ref);
    },

    async login(repId) {
        const errorEl = document.getElementById('rep-error');
        errorEl.classList.add('hidden');
        if (!String(repId || '').trim()) {
            errorEl.textContent = 'Please enter your rep code.';
            errorEl.classList.remove('hidden');
            return;
        }
        const reps = await this.fetchTab(this.TABS.REPS);
        const rep = this.findRep(repId, reps || []);
        if (!rep) {
            errorEl.textContent = 'That rep code was not found. Check with the owner.';
            errorEl.classList.remove('hidden');
            return;
        }
        this._rep = { rep_id: rep.rep_id, name: rep.name, rate: rep.commission_rate };
        sessionStorage.setItem(this._sessionKey, rep.rep_id);
        this.renderDashboard();
    },

    renderDashboard() {
        document.getElementById('rep-login').classList.add('hidden');
        document.getElementById('rep-dashboard').classList.remove('hidden');
        document.body.classList.add('rep-authenticated');
        this.setText('rep-name', this._rep.name);
        const rawRate = String(this._rep.rate || '').trim();
        let rateText = rawRate;
        if (/^\d+(\.\d+)?%?$/.test(rawRate)) {
            rateText = parseFloat(rawRate) + '%';
        } else if (rawRate && !rawRate.endsWith('%')) {
            rateText = rawRate + '%';
        }
        this.setText('rep-rule', `Commission is ${rateText} of the product's catalogue price, excluding delivery.`);
        this.setText('rep-credit', `Any order placed through your links within ${this.REP_CREDIT_WINDOW_DAYS} days of the buyer's first click is credited to you.`);
        const rateStat = document.getElementById('rep-stat-rate');
        if (rateStat) rateStat.textContent = rateText;
        this.loadAndRender();
    },

    async loadAndRender() {
        const [products, payouts, settings] = await Promise.all([
            this.fetchTab(this.TABS.PRODUCTS),
            this.fetchTab(this.TABS.PAYOUTS),
            this.fetchTab(this.TABS.SETTINGS)
        ]);
        (settings || []).forEach(row => {
            if (row.key === 'commission_rule' && row.value) {
                this.setText('rep-rule', row.value);
            } else if (row.key === 'brand_name' && row.value) {
                document.querySelectorAll('.brand-text').forEach(el => (el.textContent = row.value));
            } else if (row.key === 'brand_accent' && row.value) {
                document.querySelectorAll('.brand-accent').forEach(el => (el.textContent = row.value));
            }
        });
        this._repProducts = products === null ? null : VFUtils.filterAndSort(products || []);
        this.populateProductFilters();
        this.renderProductList();
        this._payoutRows = payouts || [];
        this.renderPayouts();
    },

    populateProductFilters() {
        const products = Array.isArray(this._repProducts) ? this._repProducts : [];
        const categories = new Map();
        const occasions = new Map();

        products.forEach(product => {
            const category = String(product.category || '').trim();
            if (category) categories.set(category.toLowerCase(), category);
            String(product.occasion || '').split(',').forEach(value => {
                const occasion = value.trim();
                if (occasion) occasions.set(occasion.toLowerCase(), occasion);
            });
        });

        const categorySelect = document.getElementById('rep-product-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="all">All categories</option>' +
                [...categories.entries()]
                    .sort((a, b) => a[1].localeCompare(b[1]))
                    .map(([value, label]) => `<option value="${VFUtils.sanitize(value)}">${VFUtils.sanitize(label)}</option>`)
                    .join('');
        }

        const occasionSelect = document.getElementById('rep-product-occasion');
        if (occasionSelect) {
            occasionSelect.innerHTML = '<option value="all">All occasions</option>' +
                [...occasions.entries()]
                    .sort((a, b) => a[1].localeCompare(b[1]))
                    .map(([value, label]) => `<option value="${VFUtils.sanitize(value)}">${VFUtils.sanitize(label)}</option>`)
                    .join('');
        }
    },

    getFilteredProducts() {
        const filters = this._productFilters;
        const query = String(filters.query || '').trim().toLowerCase();
        const filtered = (this._repProducts || []).filter(product => {
            if (filters.category !== 'all' && String(product.category || '').trim().toLowerCase() !== filters.category) return false;

            if (filters.occasion !== 'all') {
                const occasions = String(product.occasion || '').toLowerCase().split(',').map(value => value.trim());
                if (!occasions.includes(filters.occasion)) return false;
            }

            if (filters.price !== 'any') {
                const price = VFUtils.priceNumber(product);
                if (price == null) return false;
                if (filters.price === 'under-20000' && !(price < 20000)) return false;
                if (filters.price === '20000-50000' && !(price >= 20000 && price <= 50000)) return false;
                if (filters.price === 'above-50000' && !(price > 50000)) return false;
            }

            if (query) {
                const searchable = [product.name, product.description, product.category, product.material, product.size, product.price]
                    .join(' ').toLowerCase();
                if (!searchable.includes(query)) return false;
            }

            return true;
        });

        if (filters.sort === 'price-asc' || filters.sort === 'price-desc') {
            const direction = filters.sort === 'price-asc' ? 1 : -1;
            filtered.sort((a, b) => {
                const priceA = VFUtils.priceNumber(a);
                const priceB = VFUtils.priceNumber(b);
                if (priceA == null && priceB == null) return 0;
                if (priceA == null) return 1;
                if (priceB == null) return -1;
                return direction * (priceA - priceB);
            });
        } else if (filters.sort === 'name-asc') {
            filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        }

        return filtered;
    },

    clearProductFilters() {
        this._productFilters = { query: '', category: 'all', price: 'any', occasion: 'all', sort: 'featured' };
        const values = {
            'rep-product-search': '',
            'rep-product-category': 'all',
            'rep-product-price': 'any',
            'rep-product-occasion': 'all',
            'rep-product-sort': 'featured'
        };
        Object.entries(values).forEach(([id, value]) => {
            const control = document.getElementById(id);
            if (control) control.value = value;
        });
        this.renderProductList();
    },

    bindProductFilters() {
        const search = document.getElementById('rep-product-search');
        if (search) {
            search.addEventListener('input', () => {
                this._productFilters.query = search.value;
                this.renderProductList();
            });
        }

        [
            ['rep-product-category', 'category'],
            ['rep-product-price', 'price'],
            ['rep-product-occasion', 'occasion'],
            ['rep-product-sort', 'sort']
        ].forEach(([id, filter]) => {
            const control = document.getElementById(id);
            if (control) {
                control.addEventListener('change', () => {
                    this._productFilters[filter] = control.value;
                    this.renderProductList();
                });
            }
        });

        const clear = document.getElementById('rep-product-clear');
        if (clear) clear.addEventListener('click', () => this.clearProductFilters());
    },

    renderProductList() {
        const container = document.getElementById('rep-products');
        const count = document.getElementById('rep-product-count');
        if (!Array.isArray(this._repProducts)) {
            if (count) count.textContent = 'Product count unavailable. Please refresh and try again.';
            container.innerHTML = '<p class="rep-empty">Could not load products right now.</p>';
            return;
        }

        const items = this.getFilteredProducts();
        const total = this._repProducts.length;
        if (count) {
            const totalLabel = total === 1 ? 'product' : 'products';
            const matchLabel = items.length === 1 ? 'product matches' : 'products match';
            count.textContent = `${total} ${totalLabel} in catalogue · ${items.length} ${matchLabel} your filters`;
        }

        if (items.length === 0 && total === 0) {
            container.innerHTML = '<p class="rep-empty">No products available yet.</p>';
            return;
        }
        if (items.length === 0) {
            container.innerHTML = '<p class="rep-empty">No products match your filters.</p>';
            return;
        }
        container.innerHTML = items.map((product, index) => this.repProductCardHTML(product, index)).join('');
    },

    estimatedCommission(p) {
        const rate = parseFloat(String(this._rep && this._rep.rate || '').replace('%', ''));
        if (!Number.isFinite(rate) || rate <= 0) return '';
        const price = VFUtils.priceNumber(p);
        if (price == null || price <= 0) return '';
        return '≈ ₦' + Math.round(price * rate / 100).toLocaleString() + ' commission';
    },

    repProductCardHTML(p, i) {
        const pid = VFUtils.slugify(p.name) || String(p.display_order || (i + 1));
        const link = this.shareLink(pid, this._rep.rep_id);
        const waShare = `https://wa.me/?text=${encodeURIComponent(link)}`;
        const price = VFUtils.priceNumber(p) != null ? VFUtils.formatNaira(p.price) : '';
        const commission = this.estimatedCommission(p);
        const soldOut = VFUtils.isSoldOut(p);
        const stockLabel = soldOut ? (String(p.stock_label || '').trim() || 'Sold Out') : '';
        const img = VFUtils.validateUrl(VFUtils.directImageUrl(p.image_url));
        const initial = String(p.name || '?').trim().charAt(0).toUpperCase();
        const shareBtn = navigator.share
            ? `<button type="button" class="rep-share-btn" data-share="${VFUtils.sanitize(link)}">Share</button>`
            : '';
        return `
            <div class="rep-product${soldOut ? ' is-soldout' : ''}" itemscope itemtype="https://schema.org/Product">
                <div class="rep-product-thumb${img ? '' : ' no-image'}">
                    ${img ? `<img src="${VFUtils.sanitize(img)}" alt="" loading="lazy" decoding="async" onerror="if(!this.dataset.retried){this.dataset.retried='true';this.src='${VFUtils.sanitize(img)}';}else{this.parentNode.classList.add('no-image');}">` : ''}
                    <span class="rep-thumb-initial">${VFUtils.sanitize(initial)}</span>
                    ${soldOut ? `<span class="rep-stock-badge">${VFUtils.sanitize(stockLabel)}</span>` : ''}
                </div>
                <div class="rep-product-info">
                    <h4 itemprop="name">${VFUtils.sanitize(p.name)}</h4>
                    ${price ? `<span class="rep-product-price" itemprop="price" content="${VFUtils.priceNumber(p)}">From ${VFUtils.sanitize(price)}</span>` : ''}
                    <p itemprop="description">${VFUtils.sanitize(p.description)}</p>
                    ${p.sales_caption ? `<p class="rep-caption">${VFUtils.sanitize(p.sales_caption)}</p>` : ''}
                    ${commission ? `<span class="rep-commission">${VFUtils.sanitize(commission)}</span>` : ''}
                </div>
                <div class="rep-product-actions">
                    <button type="button" class="rep-copy-btn" data-copy="${VFUtils.sanitize(link)}" aria-label="Copy share link for ${VFUtils.sanitize(p.name)}">Copy link</button>
                    <a class="rep-share-btn" href="${waShare}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    ${shareBtn}
                </div>
            </div>
        `;
    },

    fallbackCopy(text) {
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(ta);
            }
        });
    },

    copyText(text, btn) {
        const original = btn.textContent;
        const done = () => {
            btn.classList.add('copied');
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.classList.remove('copied');
                btn.textContent = original;
            }, 2000);
        };
        Promise.resolve()
            .then(() => navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
            .then(done)
            .catch(() => this.fallbackCopy(text).then(done))
            .catch(() => {});
    },

    renderPayouts() {
        const rows = this._payoutRows || [];
        this._payouts = rows.filter(r => String(r.rep_id || '').trim().toLowerCase() === String(this._rep.rep_id).toLowerCase());
        this._payoutShown = Math.min(this.REP_PAYOUT_LIMIT, this._payouts.length);
        this.renderPayoutTable();
    },

    payoutRowHTML(r) {
        const naira = n => '₦' + Math.round(n).toLocaleString();
        const amount = parseFloat(r.order_amount) || 0;
        const commission = parseFloat(r.commission) || 0;
        const paid = String(r.status || '').toLowerCase() === 'paid';
        return `
            <tr>
                <td data-label="Product">${VFUtils.sanitize(r.product)}</td>
                <td data-label="Order amount">${VFUtils.sanitize(naira(amount))}</td>
                <td data-label="Commission">${VFUtils.sanitize(naira(commission))}</td>
                <td data-label="Status"><span class="rep-status ${paid ? 'paid' : 'pending'}">${VFUtils.sanitize(paid ? 'Paid' : 'Pending')}</span></td>
                <td data-label="Date">${VFUtils.sanitize(r.date)}</td>
            </tr>
        `;
    },

    renderPayoutTable() {
        const tbody = document.querySelector('#rep-payouts tbody');
        const summary = document.getElementById('rep-payout-summary');
        const table = document.getElementById('rep-payouts');
        const mine = this._payouts || [];
        const naira = n => '₦' + Math.round(n).toLocaleString();
        const setStats = (sales, pending, paid) => {
            const set = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };
            set('rep-stat-sales', String(sales));
            set('rep-stat-pending', naira(pending));
            set('rep-stat-paid', naira(paid));
        };

        if (mine.length === 0) {
            tbody.innerHTML = '';
            table.classList.add('hidden');
            setStats(0, 0, 0);
            summary.textContent = 'No commissions recorded yet. Sales you refer will appear here once the owner confirms them.';
            summary.classList.remove('hidden');
            return;
        }

        const shown = Math.min(this._payoutShown, mine.length);
        let body = mine.slice(0, shown).map(r => this.payoutRowHTML(r)).join('');
        const more = mine.length - shown;
        if (more > 0) {
            body += `<tr class="rep-showall-row"><td colspan="5"><button type="button" class="rep-showall" id="rep-showall-btn">Show all commissions (${more} more)</button></td></tr>`;
        }
        tbody.innerHTML = body;

        let pendingTotal = 0;
        let paidTotal = 0;
        mine.forEach(r => {
            const commission = parseFloat(r.commission) || 0;
            const paid = String(r.status || '').toLowerCase() === 'paid';
            if (paid) paidTotal += commission; else pendingTotal += commission;
        });

        table.classList.remove('hidden');
        setStats(mine.length, pendingTotal, paidTotal);
        summary.classList.remove('hidden');
        const saleLabel = mine.length === 1 ? 'sale' : 'sales';
        summary.textContent = `${mine.length} ${saleLabel} · Pending: ${naira(pendingTotal)} · Paid: ${naira(paidTotal)}`;
    },

    showAllPayouts() {
        this._payoutShown = (this._payouts || []).length;
        this.renderPayoutTable();
    },

    configureResponsivePanels() {
        const filterDetails = document.getElementById('rep-product-filter-details');
        const historyDetails = document.getElementById('rep-commission-history');
        const mobile = window.matchMedia('(max-width: 767px)');
        const syncPanels = () => {
            if (filterDetails) filterDetails.open = !mobile.matches;
            if (historyDetails) historyDetails.open = !mobile.matches;
        };
        syncPanels();
        if (mobile.addEventListener) mobile.addEventListener('change', syncPanels);
        else if (mobile.addListener) mobile.addListener(syncPanels);
    },

    init() {
        this.bindProductFilters();
        this.configureResponsivePanels();
        document.getElementById('rep-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login(document.getElementById('rep-input').value);
        });
        document.getElementById('rep-logout').addEventListener('click', () => {
            sessionStorage.removeItem(this._sessionKey);
            location.reload();
        });
        const historyLink = document.getElementById('rep-history-link');
        if (historyLink) {
            historyLink.addEventListener('click', () => {
                const history = document.getElementById('rep-commission-history');
                if (history) history.open = true;
            });
        }
        document.getElementById('rep-products').addEventListener('click', (e) => {
            const copyBtn = e.target.closest('[data-copy]');
            if (copyBtn) {
                this.copyText(copyBtn.getAttribute('data-copy'), copyBtn);
                return;
            }
            const shareBtn = e.target.closest('[data-share]');
            if (shareBtn) {
                navigator.share({ title: 'Gifts by VF', url: shareBtn.getAttribute('data-share') }).catch(() => {});
                return;
            }
        });
        const payoutsTable = document.getElementById('rep-payouts');
        if (payoutsTable) {
            payoutsTable.addEventListener('click', (e) => {
                if (e.target.closest('#rep-showall-btn')) this.showAllPayouts();
            });
        }
        const saved = sessionStorage.getItem(this._sessionKey);
        if (saved) document.getElementById('rep-input').value = saved;
    }
};

document.addEventListener('DOMContentLoaded', () => RepTools.init());
