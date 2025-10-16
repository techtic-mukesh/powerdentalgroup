// Fixed version - Works with Shopify AJAX filtering
class AutoCollectionFilter extends HTMLElement {
  constructor() {
    super();
    this.collections = new Map();
    this.selectedCollections = [];
    this.init();
  }

  async init() {
    await this.fetchAllCollections();
    this.injectCollectionFilter();
    this.attachEventListeners();
    this.observeFacetsReload();
  }

  async fetchAllCollections() {
    try {
      const response = await fetch('/collections.json?limit=250');
      const data = await response.json();
      
      data.collections.forEach(collection => {
        this.collections.set(collection.handle, {
          title: collection.title,
          handle: collection.handle,
          count: 0
        });
      });
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  }

  injectCollectionFilter() {
    // Check if filter already exists
    if (document.querySelector('#Details-Collection-Filter')) return;

    const facetsWrapper = document.querySelector('#FacetsWrapperDesktop, .facets-wrapper, .facets__wrapper');
    
    if (!facetsWrapper || this.collections.size === 0) return;

    this.countProductsPerCollection();
    const filterHTML = this.createFilterHTML();
    
    // Insert at the beginning of facets
    const firstFacet = facetsWrapper.querySelector('.js-filter, details');
    if (firstFacet) {
      firstFacet.insertAdjacentHTML('beforebegin', filterHTML);
    } else {
      facetsWrapper.insertAdjacentHTML('afterbegin', filterHTML);
    }

    // Restore selected state
    this.restoreSelectedState();
  }

  countProductsPerCollection() {
    this.collections.forEach(data => data.count = 0);

    const productCards = document.querySelectorAll('[data-product-id][data-collections]');
    
    productCards.forEach(card => {
      const collections = card.dataset.collections.split(',').filter(c => c.trim());
      
      collections.forEach(handle => {
        const collectionData = this.collections.get(handle.trim());
        if (collectionData) {
          collectionData.count++;
        }
      });
    });
  }

  createFilterHTML() {
    const collectionsWithProducts = Array.from(this.collections.entries())
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count);

    if (collectionsWithProducts.length === 0) return '';

    return `
      <details id="Details-Collection-Filter" class="facets__disclosure js-filter" data-index="collection" open>
        <summary class="facets__summary caption-large focus-offset">
          <div>
            <span>
              Collections
              <span class="facets__selected no-js-hidden${this.selectedCollections.length === 0 ? ' hidden' : ''}">(${this.selectedCollections.length})</span>
            </span>
            <svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor">
            </svg>
          </div>
        </summary>
        <div class="facets__display">
          <fieldset class="facets-wrap">
            <legend class="visually-hidden">Collections</legend>
            <ul class="facets__list list-unstyled" role="list">
              ${collectionsWithProducts.map(([handle, data], index) => `
                <li class="list-menu__item facets__item">
                  <label for="Filter-Collection-${index}" class="facet-checkbox${this.selectedCollections.includes(handle) ? ' active' : ''}">
                    <input
                      type="checkbox"
                      name="filter.collection"
                      value="${handle}"
                      id="Filter-Collection-${index}"
                      data-collection-filter="${handle}"
                      ${this.selectedCollections.includes(handle) ? 'checked' : ''}
                    >
                    <svg width="1.6rem" height="1.6rem" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <rect width="16" height="16" stroke="currentColor" fill="none" stroke-width="1"></rect>
                    </svg>
                    <svg class="icon icon-checkmark" width="1.1rem" height="0.7rem" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.5 3.5L2.83333 4.75L4.16667 6L9.5 1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span aria-hidden="true">${data.title} (${data.count})</span>
                    <span class="visually-hidden">${data.title} (${data.count} products)</span>
                  </label>
                </li>
              `).join('')}
            </ul>
          </fieldset>
        </div>
      </details>
    `;
  }

  attachEventListeners() {
    document.addEventListener('change', (e) => {
      if (e.target.matches('[data-collection-filter]')) {
        e.stopPropagation(); // Prevent Shopify's default handling
        this.handleFilterChange();
      }
    });

    // Handle active filter removal
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-remove-collection]')) {
        e.preventDefault();
        const handle = e.target.closest('[data-remove-collection]').dataset.removeCollection;
        const checkbox = document.querySelector(`[data-collection-filter="${handle}"]`);
        if (checkbox) {
          checkbox.checked = false;
          this.handleFilterChange();
        }
      }
    });
  }

  observeFacetsReload() {
    // Watch for Shopify AJAX filter updates
    const facetsContainer = document.querySelector('#ProductGridContainer, .collection, main');
    if (!facetsContainer) return;

    const observer = new MutationObserver(() => {
      // Re-inject filter if it's been removed
      if (!document.querySelector('#Details-Collection-Filter')) {
        this.injectCollectionFilter();
      }
    });

    observer.observe(facetsContainer, {
      childList: true,
      subtree: true
    });
  }

  handleFilterChange() {
    this.selectedCollections = Array.from(
      document.querySelectorAll('[data-collection-filter]:checked')
    ).map(cb => cb.value);

    const selectedCount = document.querySelector('#Details-Collection-Filter .facets__selected');
    if (selectedCount) {
      selectedCount.textContent = `(${this.selectedCollections.length})`;
      selectedCount.classList.toggle('hidden', this.selectedCollections.length === 0);
    }

    this.filterProducts(this.selectedCollections);
    this.updateActiveFilters(this.selectedCollections);
  }

  restoreSelectedState() {
    this.selectedCollections.forEach(handle => {
      const checkbox = document.querySelector(`[data-collection-filter="${handle}"]`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.closest('.facet-checkbox')?.classList.add('active');
      }
    });

    if (this.selectedCollections.length > 0) {
      this.filterProducts(this.selectedCollections);
      this.updateActiveFilters(this.selectedCollections);
    }
  }

  filterProducts(selectedCollections) {
    const productCards = document.querySelectorAll('[data-product-id][data-collections]');
    let visibleCount = 0;

    productCards.forEach(card => {
      const cardCollections = card.dataset.collections.split(',').filter(c => c.trim()).map(c => c.trim());
      
      if (selectedCollections.length === 0) {
        card.closest('.grid__item, li')?.style.setProperty('display', '', 'important');
        visibleCount++;
      } else {
        const shouldShow = selectedCollections.some(col => cardCollections.includes(col));
        const gridItem = card.closest('.grid__item, li');
        
        if (gridItem) {
          if (shouldShow) {
            gridItem.style.setProperty('display', '', 'important');
            visibleCount++;
          } else {
            gridItem.style.setProperty('display', 'none', 'important');
          }
        }
      }
    });

    this.updateProductCount(visibleCount);
  }

  updateProductCount(count) {
    const countContainers = document.querySelectorAll('#ProductCount, #ProductCountDesktop, .facets__summary span:first-child');
    const totalProducts = document.querySelectorAll('[data-product-id]').length;
    
    countContainers.forEach(container => {
      if (container.id === 'ProductCount' || container.id === 'ProductCountDesktop') {
        const originalText = container.textContent;
        const newText = originalText.replace(/\d+/, count);
        container.textContent = newText;
      }
    });
  }

  updateActiveFilters(selectedCollections) {
    const activeContainer = document.querySelector('.active-facets') || 
                           document.querySelector('.active-facets-vertical-filter');
    
    if (!activeContainer) return;

    // Remove old collection pills
    activeContainer.querySelectorAll('[data-collection-pill]').forEach(el => el.remove());

    // Add new pills
    selectedCollections.forEach(handle => {
      const collection = this.collections.get(handle);
      if (!collection) return;

      const pill = document.createElement('facet-remove');
      pill.setAttribute('data-collection-pill', handle);
      pill.classList.add('active-facets__button-wrapper');
      pill.innerHTML = `
        <a href="#" class="active-facets__button active-facets__button--light" data-remove-collection="${handle}">
          <span class="active-facets__button-inner button button--tertiary">
            ${collection.title}
            <svg aria-hidden="true" focusable="false" class="icon icon-remove" viewBox="0 0 10 10">
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" fill="none" stroke-width="1.3"/>
            </svg>
            <span class="visually-hidden">Remove filter</span>
          </span>
        </a>
      `;

      const insertBefore = activeContainer.querySelector('.active-facets__button--clear-all') ||
                          activeContainer.querySelector('facet-remove:last-child');
      
      if (insertBefore) {
        insertBefore.before(pill);
      } else {
        activeContainer.appendChild(pill);
      }
    });

    // Show/hide clear all button
    const clearAll = activeContainer.querySelector('.active-facets__button--clear-all');
    if (clearAll && selectedCollections.length > 0) {
      clearAll.classList.remove('hidden');
      
      // Add event listener to clear all
      const clearLink = clearAll.querySelector('a');
      if (clearLink) {
        clearLink.addEventListener('click', (e) => {
          document.querySelectorAll('[data-collection-filter]:checked').forEach(cb => {
            cb.checked = false;
          });
          this.handleFilterChange();
        });
      }
    }
  }
}

// Initialize
if (!customElements.get('auto-collection-filter')) {
  customElements.define('auto-collection-filter', AutoCollectionFilter);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFilter);
} else {
  initFilter();
}

function initFilter() {
  if (document.querySelector('.collection, .search, [data-section-type="collection-template"]')) {
    const filter = document.createElement('auto-collection-filter');
    document.body.appendChild(filter);
  }
} 