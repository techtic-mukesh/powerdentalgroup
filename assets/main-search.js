// ============================================
// Part 1: main-search.js - Enhanced Search Form
// ============================================
class MainSearch extends SearchForm {
  constructor() {
    super();
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    this.input.addEventListener('focus', this.onInputFocus.bind(this));
    
    allSearchForms.forEach((form) => {
      form.addEventListener('submit', this.onFormSubmit.bind(this));
      if (allSearchForms.length >= 2) {
        form.addEventListener('reset', this.onFormReset.bind(this));
      }
    });
    
    if (allSearchForms.length >= 2) {
      this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
    }
  }

  onFormSubmit(event) {
    const form = event.target;
    const prefixInput = form.querySelector('input[name="options[prefix]"]');
    
    // Remove prefix parameter for exact matching
    if (prefixInput) {
      prefixInput.value = 'none';
    }
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync('', this.input);
    }
  }

  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: 'smooth' });
    }
  }

  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}

customElements.define('main-search', MainSearch);


// ============================================
// Part 2: Predictive Search SKU Sorting
// ============================================
// Add to your existing PredictiveSearch class (from document 1)
// Modify the renderResults method to sort by SKU relevance

if (typeof PredictiveSearch !== 'undefined') {
  const originalRenderResults = PredictiveSearch.prototype.renderResults;
  
  PredictiveSearch.prototype.renderResults = function(products, collections, queries, originalQuery, totalCount) {
    // Sort products by SKU relevance before rendering
    const sortedProducts = this.sortProductsBySKURelevance(products, originalQuery);
    
    // Call original render with sorted products
    originalRenderResults.call(this, sortedProducts, collections, queries, originalQuery, totalCount);
  };
  
  PredictiveSearch.prototype.sortProductsBySKURelevance = function(products, query) {
    const queryLower = query.toLowerCase().trim();
    
    return products.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryLower);
      const scoreB = this.calculateRelevanceScore(b, queryLower);
      return scoreB - scoreA;
    });
  };
  
  PredictiveSearch.prototype.calculateRelevanceScore = function(product, query) {
    let score = 0;
    
    // Get all SKUs from product
    const skus = [];
    if (product.fullDetails && product.fullDetails.variants) {
      product.fullDetails.variants.forEach(v => {
        if (v.sku) skus.push(v.sku.toLowerCase());
      });
    } else if (product.variants) {
      product.variants.forEach(v => {
        if (v.sku) skus.push(v.sku.toLowerCase());
      });
    }
    
    const title = (product.title || '').toLowerCase();
    
    // Scoring logic - Exact SKU match gets highest priority
    for (const sku of skus) {
      if (sku === query) {
        return 10000; // Exact SKU match - TOP PRIORITY
      }
      if (sku.startsWith(query)) {
        score = Math.max(score, 9000); // SKU starts with query
      }
      if (sku.includes(query)) {
        score = Math.max(score, 8000); // SKU contains query
      }
    }
    
    // Title matching (lower priority than SKU)
    if (title === query) {
      score = Math.max(score, 7000);
    } else if (title.startsWith(query)) {
      score = Math.max(score, 6000);
    } else if (title.includes(query)) {
      score = Math.max(score, 5000);
    }
    
    return score;
  };
}


// ============================================
// Part 3: Search Results Page Sorting
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Only run on search results pages
  if (!window.location.pathname.includes('/search')) return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q')?.trim().toLowerCase();
  
  if (!searchQuery) return;
  
  // Wait for products to load (in case of async loading)
  const sortProducts = () => {
    const productGrid = document.querySelector('#product-grid ul.product-grid, .collection-product-grid');
    if (!productGrid) return;
    
    const products = Array.from(productGrid.querySelectorAll('.grid__item'));
    if (products.length === 0) return;
    
    // Calculate relevance score for each product
    products.forEach(product => {
      const score = calculateProductScore(product, searchQuery);
      product.dataset.relevanceScore = score;
      
      if (score >= 10000) {
        product.classList.add('exact-sku-match');
      }
    });
    
    // Sort by relevance score
    products.sort((a, b) => {
      const scoreA = parseInt(a.dataset.relevanceScore || '0');
      const scoreB = parseInt(b.dataset.relevanceScore || '0');
      return scoreB - scoreA;
    });
    
    // Re-append in sorted order
    products.forEach(product => {
      productGrid.appendChild(product);
    });
    
    // Add visual styling for exact matches
    addExactMatchStyling();
  };
  
  function calculateProductScore(productElement, query) {
    let score = 0;
    
    // Get SKU from various possible locations
    const skuSelectors = [
      '.product-sku',
      '[data-sku]',
      '.variant-sku',
      '.card__information .sku'
    ];
    
    let sku = '';
    for (const selector of skuSelectors) {
      const element = productElement.querySelector(selector);
      if (element) {
        sku = element.textContent
          .replace(/SKU:?/gi, '')
          .replace(/\(.*\)/g, '') // Remove variant count
          .trim()
          .toLowerCase();
        break;
      }
    }
    
    // Get title
    const titleElement = productElement.querySelector(
      '.card__heading a, .card-information__text a, .card__information h3 a'
    );
    const title = titleElement ? titleElement.textContent.trim().toLowerCase() : '';
    
    // Exact SKU match = highest priority
    if (sku === query) {
      return 10000;
    }
    
    // SKU starts with query
    if (sku.startsWith(query)) {
      score = 9000;
    }
    // SKU contains query
    else if (sku.includes(query)) {
      score = 8000;
    }
    // Title exact match
    else if (title === query) {
      score = 7000;
    }
    // Title starts with query
    else if (title.startsWith(query)) {
      score = 6000;
    }
    // Title contains query
    else if (title.includes(query)) {
      score = 5000;
    }
    
    return score;
  }
  
  function addExactMatchStyling() {
    if (document.getElementById('exact-sku-match-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'exact-sku-match-styles';
    style.textContent = `
      .exact-sku-match {
        position: relative;
      }
      .exact-sku-match::after {
        content: "✓ Exact SKU Match";
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #007acc 0%, #005a9e 100%);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        letter-spacing: 0.3px;
        display: none;
      }
      
      @media (max-width: 768px) {
        .exact-sku-match::after {
          font-size: 10px;
          padding: 4px 8px;
          top: 8px;
          right: 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Run sorting immediately and after a short delay (for async content)
  sortProducts();
  setTimeout(sortProducts, 500);
  setTimeout(sortProducts, 1500);
});


// ============================================