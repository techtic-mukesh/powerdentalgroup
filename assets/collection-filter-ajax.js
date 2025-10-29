// Add this JavaScript to your theme (e.g., in a separate JS file or in your theme's main JS)

class CollectionFilterAjax extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    this.selectedCollections = new Set();
    this.setupEventListeners();
    this.loadInitialSelections();
  }

  loadInitialSelections() {
    // Load already checked collections on page load
    this.querySelectorAll('.category-filter__checkbox:checked').forEach(checkbox => {
      const url = checkbox.dataset.url;
      if (url) {
        this.selectedCollections.add(url);
      }
    });
  }

  setupEventListeners() {
    // Handle toggle buttons
    this.querySelectorAll('.category-filter__toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSubcategory(btn);
      });
    });

    // Handle label clicks (for toggling)
    this.querySelectorAll('.category-filter__label').forEach(label => {
      label.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        const li = label.closest('.category-filter__item');
        const childList = li?.querySelector('.category-filter__list');
        
        if (childList) {
          e.preventDefault();
          this.toggleSubcategory(label);
        }
      });
    });

    // Handle checkbox changes with AJAX
    this.querySelectorAll('.category-filter__checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.preventDefault();
        this.handleCheckboxChange(checkbox);
      });
    });
  }

  toggleSubcategory(element) {
    const li = element.closest('.category-filter__item');
    const childList = li.querySelector('.category-filter__list');
    
    if (!childList) return;

    const isOpen = li.classList.contains('open');
    
    if (isOpen) {
      childList.style.display = 'none';
      li.classList.remove('open');
    } else {
      childList.style.display = 'block';
      li.classList.add('open');
    }
  }

  handleCheckboxChange(checkbox) {
    const url = checkbox.dataset.url;
    
    if (!url) return;

    if (checkbox.checked) {
      this.selectedCollections.add(url);
    } else {
      this.selectedCollections.delete(url);
    }

    // Update UI to show loading state
    this.showLoadingState();

    // Fetch filtered products
    this.fetchFilteredProducts();
  }

  showLoadingState() {
    const productGrid = document.getElementById('ProductGridContainer');
    const countContainer = document.getElementById('ProductCount');
    
    if (productGrid) {
      productGrid.querySelector('.collection')?.classList.add('loading');
    }
    
    if (countContainer) {
      countContainer.classList.add('loading');
    }

    // Show loading spinners
    document.querySelectorAll('.facets-container .loading__spinner').forEach(spinner => {
      spinner.classList.remove('hidden');
    });
  }

  hideLoadingState() {
    const productGrid = document.getElementById('ProductGridContainer');
    const countContainer = document.getElementById('ProductCount');
    
    if (productGrid) {
      productGrid.querySelector('.collection')?.classList.remove('loading');
    }
    
    if (countContainer) {
      countContainer.classList.remove('loading');
    }

    // Hide loading spinners
    document.querySelectorAll('.facets-container .loading__spinner').forEach(spinner => {
      spinner.classList.add('hidden');
    });
  }

  async fetchFilteredProducts() {
    try {
      if (this.selectedCollections.size === 0) {
        // If no collections selected, show all or empty state
        this.renderEmptyState();
        return;
      }

      // Get the first selected collection URL to use as base
      const collectionUrls = Array.from(this.selectedCollections);
      
      // Fetch products from all selected collections
      const fetchPromises = collectionUrls.map(url => 
        this.fetchCollectionProducts(url)
      );

      const responses = await Promise.all(fetchPromises);
      
      // Combine and deduplicate products
      this.renderCombinedProducts(responses);
      
      this.hideLoadingState();

    } catch (error) {
      console.error('Error fetching filtered products:', error);
      this.hideLoadingState();
      this.showError();
    }
  }

  async fetchCollectionProducts(collectionUrl) {
    const url = new URL(collectionUrl, window.location.origin);
    
    // Preserve existing query parameters (like filters, sort)
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.forEach((value, key) => {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString());
    const html = await response.text();
    
    return {
      url: collectionUrl,
      html: html
    };
  }

  renderCombinedProducts(responses) {
    if (responses.length === 0) {
      this.renderEmptyState();
      return;
    }

    const parser = new DOMParser();
    const allProducts = new Map(); // Use Map to avoid duplicates by product ID

    // Extract products from all responses
    responses.forEach(({ html }) => {
      const doc = parser.parseFromString(html, 'text/html');
      const productGrid = doc.getElementById('ProductGridContainer');
      
      if (productGrid) {
        // Get all product items
        const products = productGrid.querySelectorAll('.grid__item');
        
        products.forEach(product => {
          // Use product URL or ID as unique identifier
          const productLink = product.querySelector('a[href*="/products/"]');
          if (productLink) {
            const productUrl = productLink.getAttribute('href');
            if (!allProducts.has(productUrl)) {
              allProducts.set(productUrl, product);
            }
          }
        });
      }
    });

    // Render combined products
    const productGridContainer = document.getElementById('ProductGridContainer');
    if (productGridContainer) {
      // Find the product grid wrapper
      const gridWrapper = productGridContainer.querySelector('.collection .grid');
      
      if (gridWrapper) {
        gridWrapper.innerHTML = '';
        
        // Add all unique products
        allProducts.forEach(product => {
          gridWrapper.appendChild(product.cloneNode(true));
        });
      }
    }

    // Update product count
    this.updateProductCount(allProducts.size);
  }

  renderEmptyState() {
    const productGridContainer = document.getElementById('ProductGridContainer');
    if (productGridContainer) {
      const gridWrapper = productGridContainer.querySelector('.collection .grid');
      if (gridWrapper) {
        gridWrapper.innerHTML = `
          <div class="collection__empty">
            <p>No collections selected. Please select at least one collection to view products.</p>
          </div>
        `;
      }
    }
    this.updateProductCount(0);
  }

  showError() {
    const productGridContainer = document.getElementById('ProductGridContainer');
    if (productGridContainer) {
      const gridWrapper = productGridContainer.querySelector('.collection .grid');
      if (gridWrapper) {
        gridWrapper.innerHTML = `
          <div class="collection__error">
            <p>Sorry, there was an error loading products. Please try again.</p>
          </div>
        `;
      }
    }
  }

  updateProductCount(count) {
    const countText = count === 1 ? '1 product' : `${count} products`;
    
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    
    if (countContainer) {
      countContainer.innerHTML = `<h2 class="product-count">${countText}</h2>`;
      countContainer.classList.remove('loading');
    }
    
    if (countContainerDesktop) {
      countContainerDesktop.innerHTML = `<h2 class="product-count">${countText}</h2>`;
      countContainerDesktop.classList.remove('loading');
    }
  }
}

// Register the custom element
customElements.define('collection-filter-ajax', CollectionFilterAjax);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Wrap existing category filter in custom element if not already wrapped
  const existingFilter = document.querySelector('.category-filter');
  if (existingFilter && !existingFilter.closest('collection-filter-ajax')) {
    const wrapper = document.createElement('collection-filter-ajax');
    existingFilter.parentNode.insertBefore(wrapper, existingFilter);
    wrapper.appendChild(existingFilter);
  }
});