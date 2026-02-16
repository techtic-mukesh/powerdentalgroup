<!-- UPDATED PREDICTIVE SEARCH WITH EXACT SKU MATCHING -->
<div class="header__search-inline">
  <form action="{{ routes.search_url }}" method="get" role="search" class="search-form" autocomplete="off">
    <input
      type="search"
      name="q"
      id="Search-Inline"
      placeholder="{{ settings.header_search_placeholder | default: 'Find products by name or SKU' }}"
      class="search-input"
      value="{{ search.terms | escape }}"
      role="combobox"
      aria-expanded="false"
      aria-owns="PredictiveResults"
      aria-controls="PredictiveResults"
      aria-autocomplete="list"
      aria-haspopup="listbox"
    >
    <button type="submit" class="search-btn search-icon" aria-label="Search">
      {% render 'icon-search' %}
    </button>
    <button type="button" class="search-btn close-icon" aria-label="Clear Search">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 21L12 12M12 12L3 3M12 12L21.0001 3M12 12L3 21.0001" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </form>
</div>
<div id="PredictiveResultsoverlay" bis_skin_checked="1"></div>
<div id="PredictiveResults" class="predictive-search-results"></div>

<style>
.header__search-inline {
    flex-grow: 1;
    position: relative;
    max-width: 453px;
}
.header__search-inline input#Search-Inline {
    width: 100%;
    height: 42px;
    border-radius: 3000px;
    border: 1px solid #DCDCDC;
    background: #FFF;
    padding: 0 50px 0 20px;
    color: #131313;
    font-family: Prompt;
    font-size: 14px;
    font-style: normal;
    font-weight: 300;
    line-height: 14px;
    box-sizing: border-box;
}
.header__search-inline button.search-btn {
    background: unset;
    border: unset;
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
}
.header__search-inline input#Search-Inline::placeholder {
    color: #131313;
    font-family: Prompt;
    font-size: 14px;
    font-style: normal;
    font-weight: 300;
    line-height: 14px;
}
div#PredictiveResults {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: #fff;
    max-width: 900px;
    margin: 0 auto;
    left: 50%;
    transform: translateX(-50%);
    border-radius: unset;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    z-index: 1000;
    display: none;
}
div#PredictiveResults.show {
    display: block;
}
.search-results-container {
    display: flex;
    min-height: 400px;
}
.products-section {
    flex: 1;
    border-right: 1px solid #e5e5e5;
}
.suggestions-section {
    width: 200px;
    background-color: #fafafa;
    padding: 20px;
}
#PredictiveResults .section-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e5e5e5;
    font-weight: 600;
    color: #141132;
    font-size: 19px;
    line-height: 24px;
    box-shadow: unset;
}
.suggestions-section h3 {
    margin: 0 0 10px 0;
    font-weight: 600;
    color: #141132;
    font-size: 14px;
    line-height: 24px;
    padding-bottom: 10px;
    border-bottom: 1px solid #66666647;
}
div#PredictiveResults ul.predictive-list {
    margin: 0;
    height: 350px;
    overflow-y: auto;
    padding: 0;
    background-color: #fff;
}
div#PredictiveResults ul.predictive-list li {
    list-style: none;
    border-bottom: 1px solid #f0f0f0;
}
div#PredictiveResults ul.predictive-list li:last-child {
    border-bottom: none;
}
div#PredictiveResults ul.predictive-list a.predictive-item {
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px 20px;
    transition: background-color 0.2s ease;
}
div#PredictiveResults ul.predictive-list a.predictive-item:hover {
    background-color: #f8f9fa;
}
div#PredictiveResults ul.predictive-list a.predictive-item img {
    width: 75px;
    height: 75px;
    min-width: 60px;
    object-fit: contain;
    border-radius: 8px;
    background-color: #fff;
}
div#PredictiveResults ul.predictive-list a.predictive-item span.product-title {
    color: #141132;
    font-family: Montserrat;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 20px;
    margin: 0 0 5px 0;
    display: block;
}
.predictive-info p.product-price {
    font-variant-numeric: ordinal;
    font-family: Montserrat;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
    margin: 0;
    background: linear-gradient(90deg, #42C5EF 0%, #0033A0 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.product-meta {
    font-size: 12px;
    color: #666;
    margin-top: 2px;
    font-family: Montserrat;
}
div#PredictiveResults ul.predictive-list li.exact-sku-match {
    background-color: #f0f8ff;
    border-left: 3px solid #007acc;
}
div#PredictiveResults ul.predictive-list li.exact-sku-match a.predictive-item {
    background-color: #f0f8ff;
}
div#PredictiveResults ul.predictive-list li.exact-sku-match:hover a.predictive-item {
    background-color: #e6f3ff;
}
.sku-match-indicator {
    font-size: 0.8em;
    color: #007acc;
    font-weight: bold;
    margin-top: 2px;
    display: none;
}
.sku-match-indicator.exact {
    color: #0066cc;
    font-weight: 700;
    display: none;
}
.suggestions-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.suggestions-list li {
    margin-bottom: 12px;
}
.suggestions-list a {
    text-decoration: none;
    transition: color 0.2s ease;
    color: #141132;
    font-family: Prompt;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
}
.suggestions-list a:hover {
    color: #0033A0;
}
.header__search-inline button.search-btn.close-icon svg {
    width: 15px;
    height: 17px;
}
.header__search-inline input[type="search"]::-webkit-search-cancel-button {
    display: none;
}
.header__search-inline button.search-btn.close-icon {
    display: none;
    cursor: pointer;
}
.no-results {
    padding: 40px 20px;
    text-align: center;
    color: #141132;
}
.loading-state {
    padding: 40px 20px;
    text-align: center;
    color: #141132;
}
.view-all-container {
    padding: 15px 20px;
    text-align: center;
    border-top: 1px solid #e5e5e5;
    background-color: #fafafa;
}
.view-all-link {
    color: #0033A0;
    font-family: Montserrat;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: color 0.2s ease;
}
.view-all-link:hover {
    color: #42C5EF;
}
div#PredictiveResultsoverlay {
    position: fixed;
    width: 100%;
    height: 100%;
    display: none;
    left: 0;
    top: 0;
    z-index: -1;
    background: rgba(20, 17, 50, 0.70);
    backdrop-filter: blur(1.5px);
}
.sp-circle {
    border: 3.6px rgba(0, 0, 0, 0.25) solid;
    border-top: 3.6px #0033A0 solid;
    border-radius: 50%;
    -webkit-animation: spCircRot 0.6s infinite linear;
    animation: spCircRot 1s infinite linear;
    width: 32px;
    height: 32px;
    clear: both;
    margin: 20px auto;
    display: flex !important;
}
body.gradient.predictive-show .header--middle-left .header__inline-menu ul.list-menu.list-menu--inline {
    pointer-events: none;
}
@keyframes spCircRot {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(359deg); }
}
@media only screen and (max-width: 990px) {
    .header__search-inline { max-width: 100%; }
}
@media (max-width: 768px) {
    .search-results-container { flex-direction: column; }
    .suggestions-section { width: 100%; border-right: none; border-top: 1px solid #e5e5e5; }
    div#PredictiveResults { max-width: 100%; left: 0; transform: none; margin: 0; }
}
</style>

<script>
// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

// Collapse to lowercase, no spaces/hyphens/underscores
// "Lux Tome" → "luxtome"  |  "luxt" → "luxt"  |  "LUX-TOME" → "luxtome"
function normalizeQuery(q) {
  if (!q) return '';
  return q.toLowerCase().replace(/[-_\s]+/g, '').trim();
}

// Convert raw query → Shopify-friendly spaced version for redirect
// "LUXTOME" → "LUX TOME"  |  "LuxTome" → "Lux Tome"  |  "lux-tome" → "lux tome"
function normalizeForRedirect(q) {
  if (!q) return q;
  let c = q.trim();
  c = c.replace(/[-_]+/g, ' ');
  c = c.replace(/([a-z])([A-Z])/g, '$1 $2');
  if (!/\s/.test(c) && c.length >= 4 && c === c.toUpperCase()) {
    const mid = Math.floor(c.length / 2);
    c = c.slice(0, mid) + ' ' + c.slice(mid);
  }
  return c.replace(/\s+/g, ' ').trim();
}

// Build all Shopify API query variants for parallel firing
// Inserts a space at every position so "luxt" finds "lux tome"
function buildShopifyVariants(rawQuery) {
  const norm = normalizeQuery(rawQuery);
  const variants = new Set();

  variants.add(rawQuery.trim());
  variants.add(norm);

  // Single-space splits at every position
  for (let i = 1; i < norm.length; i++) {
    variants.add(norm.slice(0, i) + ' ' + norm.slice(i));
  }

  // Two-space splits for 3-word products
  if (norm.length >= 6) {
    for (let i = 1; i < norm.length - 1; i++) {
      for (let j = i + 2; j < norm.length; j++) {
        variants.add(norm.slice(0, i) + ' ' + norm.slice(i, j) + ' ' + norm.slice(j));
      }
    }
  }

  return Array.from(variants).slice(0, 20);
}

// ─────────────────────────────────────────────────────────
// PREDICTIVE SEARCH CLASS
// ─────────────────────────────────────────────────────────
class PredictiveSearch {
  constructor() {
    this.input      = document.querySelector('#Search-Inline');
    this.results    = document.querySelector('#PredictiveResults');
    this.overlay    = document.querySelector('#PredictiveResultsoverlay');
    this.searchIcon = document.querySelector('.search-icon');
    this.closeIcon  = document.querySelector('.close-icon');
    this.form       = this.input.closest('form');

    this.debounceTimer  = null;
    this.detailsCache   = new Map();
    this.searchCache    = new Map();
    this.effectiveQuery = null;

    this.input.addEventListener('input', this.onChange.bind(this));
    this.closeIcon.addEventListener('click', this.clearSearch.bind(this));
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    if (this.overlay) {
      this.overlay.addEventListener('click', this.hideResults.bind(this));
    }

    // Intercept Enter / submit — redirect using effectiveQuery
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        const raw = this.input.value.trim();
        if (!raw) return;
        const searchQ = this.effectiveQuery || normalizeForRedirect(raw);
        e.preventDefault();
        e.stopImmediatePropagation();
        window.location.href = `/search?q=${encodeURIComponent(searchQ)}`;
      }, true);
    }
  }

  // ── Input handler ──────────────────────────────────────
  onChange() {
    const raw  = this.input.value.trim();
    const norm = normalizeQuery(raw);

    this.searchIcon.style.display = norm ? 'none' : 'flex';
    this.closeIcon.style.display  = norm ? 'flex'  : 'none';

    clearTimeout(this.debounceTimer);

    if (norm.length < 2) {
      this.hideResults();
      this.effectiveQuery = null;
      return;
    }

    this.showLoading();
    this.debounceTimer = setTimeout(() => this.fetchResults(raw, norm), 200);
  }

  // ── Product details (cached per handle) ───────────────
  async fetchProductDetails(handle) {
    if (this.detailsCache.has(handle)) return this.detailsCache.get(handle);
    try {
      const data = await fetch(`/products/${handle}.js`).then(r => r.json());
      this.detailsCache.set(handle, data);
      return data;
    } catch { return null; }
  }

  // ── Suggest API ────────────────────────────────────────
  async fetchSuggestProducts(tryQuery) {
    const url =
      `/search/suggest.json?q=${encodeURIComponent(tryQuery)}` +
      `&resources[type]=product&resources[limit]=12` +
      `&resources[options][fields]=title,body,product_type,variants.sku,vendor` +
      `&section_id=predictive-search`;
    try {
      const data = await fetch(url).then(r => r.json());
      return data.resources?.results?.products || [];
    } catch { return []; }
  }

  // ── RESTORED FROM OLD: SKU-specific fallback search ───
  async searchBySKU(query) {
    try {
      const data = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(query)}` +
        `&resources[type]=product&resources[limit]=12` +
        `&resources[options][fields]=variants.sku` +
        `&section_id=predictive-search`
      ).then(r => r.json());
      return data.resources?.results?.products || [];
    } catch { return []; }
  }

  // ── Main fetch ─────────────────────────────────────────
  async fetchResults(rawQuery, queryNorm) {
    if (this.searchCache.has(queryNorm)) {
      const c = this.searchCache.get(queryNorm);
      this.effectiveQuery = c.effectiveQuery;
      this.renderResults(c.products, c.collections, c.queries, rawQuery, 0, c.effectiveQuery);
      return;
    }

    const variants = buildShopifyVariants(rawQuery);

    const allResults = await Promise.all(
      variants.map(v => this.fetchSuggestProducts(v).then(p => ({ query: v, products: p })))
    );

    const byId = new Map();
    let bestQuery = rawQuery;
    let bestCount = 0;

    for (const { query, products } of allResults) {
      if (products.length > bestCount) { bestCount = products.length; bestQuery = query; }
      products.forEach(p => { if (p.id && !byId.has(p.id)) byId.set(p.id, p); });
    }

    let products = Array.from(byId.values());

    // RESTORED FROM OLD: SKU fallback if still no results
    if (products.length === 0) {
      for (const v of variants.slice(0, 5)) {
        const skuProducts = await this.searchBySKU(v);
        if (skuProducts.length > 0) {
          products = skuProducts;
          bestQuery = v;
          break;
        }
      }
    }

    if (products.length === 0) {
      this.effectiveQuery = null;
      this.showNoResults();
      return;
    }

    this.effectiveQuery = bestQuery;

    const display = products.slice(0, 6);
    await Promise.all(display.map(async p => {
      const handle = p.url.split('/products/')[1]?.split('?')[0];
      if (handle) p.fullDetails = await this.fetchProductDetails(handle);
    }));

    const [collections, queries] = await Promise.all([
      fetch(`/search/suggest.json?q=${encodeURIComponent(bestQuery)}&resources[type]=collection&resources[limit]=4&section_id=predictive-search`)
        .then(r => r.json()).then(d => d.resources?.results?.collections || []).catch(() => []),
      fetch(`/search/suggest.json?q=${encodeURIComponent(bestQuery)}&resources[type]=query&resources[limit]=4&section_id=predictive-search`)
        .then(r => r.json()).then(d => d.resources?.results?.queries || []).catch(() => [])
    ]);

    this.searchCache.set(queryNorm, { products: display, collections, queries, effectiveQuery: bestQuery });

    // Non-blocking total count update
    this.fetchTotalResultCount(bestQuery).then(count => {
      const link = this.results.querySelector('.view-all-link');
      if (link && count > 0) {
        link.textContent = `View all ${count} result${count !== 1 ? 's' : ''} →`;
      }
    });

    const sorted = this.sortBySKURelevance(display, queryNorm);
    this.renderResults(sorted, collections, queries, rawQuery, 0, bestQuery);
  }

  // ── Sorting / scoring ──────────────────────────────────
  sortBySKURelevance(products, queryNorm) {
    return [...products].sort((a, b) =>
      this.score(b, queryNorm) - this.score(a, queryNorm)
    );
  }

  score(product, queryNorm) {
    const skus = [];
    if (product.fullDetails?.variants) {
      product.fullDetails.variants.forEach(v => { if (v.sku) skus.push(v.sku); });
    } else if (product.variants) {
      product.variants.forEach(v => { if (v.sku) skus.push(v.sku); });
    }

    for (const sku of skus) {
      const skuNorm = normalizeQuery(sku);
      if (skuNorm === queryNorm)          return 10000;
      if (skuNorm.startsWith(queryNorm)) return 9000;
      if (skuNorm.includes(queryNorm))   return 8000;
    }

    const titleNorm = normalizeQuery(product.title || '');
    if (titleNorm === queryNorm)          return 7000;
    if (titleNorm.startsWith(queryNorm)) return 6000;
    if (titleNorm.includes(queryNorm))   return 5000;

    return 0;
  }

  // ── RESTORED FROM OLD: Full fallback total count ───────
  async fetchTotalResultCount(query) {
    try {
      const html = await fetch(`/search?q=${encodeURIComponent(query)}&type=product`).then(r => r.text());
      const doc  = new DOMParser().parseFromString(html, 'text/html');
      const bodyText = doc.body.textContent;

      // Method 1: Regex patterns (4 fallbacks like original)
      const patterns = [
        /(\d+)\s+results?\s+found/i,
        /(\d+)\s+results?/i,
        /found\s+(\d+)/i,
        /showing\s+.*?of\s+(\d+)/i
      ];
      for (const pattern of patterns) {
        const m = bodyText.match(pattern);
        if (m && m[1]) {
          const count = parseInt(m[1]);
          if (count > 0) return count;
        }
      }

      // Method 2: CSS selectors (restored from old code)
      const selectors = [
        '.collection-product-count',
        '.results-count',
        '[data-results-count]',
        '.product-count',
        '.search-results-count',
        'h1.h2',
        '.collection-hero__title'
      ];
      for (const selector of selectors) {
        const el = doc.querySelector(selector);
        if (el) {
          const m = el.textContent.match(/(\d+)/);
          if (m) {
            const count = parseInt(m[0]);
            if (count > 0) return count;
          }
        }
      }

      // Method 3: Count product grid items (restored from old code)
      const productSelectors = [
        '.grid__item.product-card-wrapper',
        '.product-item',
        '[data-product-id]',
        '.product-grid-item',
        '.collection-product-card'
      ];
      for (const selector of productSelectors) {
        const items = doc.querySelectorAll(selector);
        if (items.length > 0) return items.length;
      }

      return 0;
    } catch { return 0; }
  }

  // ── Render ─────────────────────────────────────────────
  renderResults(products, collections, queries, rawQuery, totalCount, effectiveQuery) {
    const viewAllQuery = effectiveQuery || rawQuery;
    const queryNorm    = normalizeQuery(rawQuery);

    if (!products.length && !collections.length && !queries.length) {
      this.showNoResults(); return;
    }

    const productsHtml = products.slice(0, 6).map(product => {
      const price        = product.price;
      const comparePrice = product.compare_at_price ? (product.compare_at_price / 100).toFixed(2) : null;
      const imageUrl     = product.featured_image?.url || '/assets/product-placeholder.svg';

      let productSKU = '', allSKUs = [];
      if (product.fullDetails?.variants) {
        allSKUs    = product.fullDetails.variants.filter(v => v.sku).map(v => v.sku);
        productSKU = product.fullDetails.variants.find(v => v.sku)?.sku || '';
      } else if (product.variants?.length) {
        productSKU = product.variants.find(v => v.sku)?.sku || '';
      }

      const isExactSkuMatch = allSKUs.some(sku => normalizeQuery(sku) === queryNorm);
      const isSkuMatch      = allSKUs.some(sku => normalizeQuery(sku).includes(queryNorm));
      const skuDisplay      = allSKUs.length > 1 ? `${productSKU} (+${allSKUs.length - 1} more)` : productSKU;

      let matchIndicator = '';
      if (isExactSkuMatch)  matchIndicator = '<div class="sku-match-indicator exact">✓ Exact SKU Match</div>';
      else if (isSkuMatch)  matchIndicator = '<div class="sku-match-indicator">✓ SKU Match</div>';

      return `
        <li class="${isExactSkuMatch ? 'exact-sku-match' : ''}">
          <a href="${product.url}" class="predictive-item">
            <img src="${imageUrl}" alt="${product.featured_image?.alt || product.title}" loading="lazy" />
            <div class="predictive-info">
              <span class="product-title">${product.title}</span>
              <p class="product-price">
                $${price}
                ${comparePrice && comparePrice !== price
                  ? `<span class="compare-price" style="text-decoration:line-through;color:#999;margin-left:8px;">$${comparePrice}</span>`
                  : ''}
              </p>
              ${productSKU ? `<div class="product-sku" style="font-size:0.85em;color:#666;margin:4px 0 2px 0;">SKU: ${skuDisplay}</div>` : ''}
              ${matchIndicator}
            </div>
          </a>
        </li>`;
    }).join('');

    const suggestions = [
      ...collections.map(c => ({ title: c.title, url: c.url })),
      ...queries.map(q => ({ title: q.styled_text || q.text, url: `/search?q=${encodeURIComponent(q.text)}` }))
    ];
    if (!suggestions.length) {
      ['new arrivals', 'sale', 'accessories', 'featured'].forEach(term => {
        if (term.includes(rawQuery.toLowerCase())) {
          suggestions.push({ title: term, url: `/search?q=${encodeURIComponent(term)}` });
        }
      });
    }

    const suggestionsHtml = suggestions.length
      ? suggestions.slice(0, 6).map(s => `<li><a href="${s.url}">${s.title}</a></li>`).join('')
      : '<li style="color:#999;font-style:italic;">No suggestions</li>';

    const viewAllText = totalCount > 0
      ? `View all ${totalCount} result${totalCount !== 1 ? 's' : ''} →`
      : 'View all results →';

    this.results.innerHTML = `
      <div class="search-results-container">
        <div class="products-section">
          <div class="section-header">Products</div>
          <ul class="predictive-list">${productsHtml}</ul>
          <div class="view-all-container">
            <a href="/search?q=${encodeURIComponent(viewAllQuery)}" class="view-all-link">${viewAllText}</a>
          </div>
        </div>
        <div class="suggestions-section">
          <h3>Suggestions</h3>
          <ul class="suggestions-list">${suggestionsHtml}</ul>
        </div>
      </div>`;

    this.showResults();
  }

  showLoading() {
    this.results.innerHTML = `<div class="loading-state"><div class="sp sp-circle"></div></div>`;
    this.showResults();
  }
  showNoResults() {
    this.results.innerHTML = '<p class="no-results">No results found for products or SKUs</p>';
    this.showResults();
  }
  showResults() {
    this.results.classList.add('show');
    if (this.overlay) this.overlay.style.display = 'inline-block';
    document.body.classList.add('predictive-show');
  }
  hideResults() {
    this.results.classList.remove('show');
    if (this.overlay) this.overlay.style.display = 'none';
    document.body.classList.remove('predictive-show');
  }
  clearSearch() {
    this.input.value = '';
    this.input.focus();
    this.searchIcon.style.display = 'flex';
    this.closeIcon.style.display  = 'none';
    this.effectiveQuery = null;
    this.hideResults();
    clearTimeout(this.debounceTimer);
  }
  handleOutsideClick(e) {
    const container = document.querySelector('.header__search-inline');
    if (!container.contains(e.target) && !this.results.contains(e.target)) this.hideResults();
  }
}

document.addEventListener('DOMContentLoaded', () => new PredictiveSearch());
</script>