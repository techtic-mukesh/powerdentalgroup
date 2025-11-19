class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerDesktop = document.getElementById('ProductCountDesktop');
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    const existingContainer = document.getElementById('ProductGridContainer');

    // ✅ Save category filter state BEFORE any DOM changes
    let categoryFilterState = null;
    if (window.CategoryFilterManager) {
      categoryFilterState = window.CategoryFilterManager.getCurrentState();
    }

    // Preserve category filter element
    const categoryFilter = existingContainer.querySelector('.category-filter');

    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const newGrid = parsedHTML.getElementById('ProductGridContainer').querySelector('.collection');

    const collectionElement = existingContainer.querySelector('.collection');
    if (collectionElement) {
      // Remove old category filter from collection
      const oldCategory = collectionElement.querySelector('.category-filter');
      if (oldCategory) oldCategory.remove();
      
      // Update the grid content
      collectionElement.innerHTML = newGrid.innerHTML;
      
      // ✅ Re-insert the preserved category filter at the top
      if (categoryFilter) {
        collectionElement.insertAdjacentElement('afterbegin', categoryFilter);
      }
      
      // Remove loading class
      collectionElement.classList.remove('loading');
    }

    // ✅ Restore category filter state AFTER DOM is updated
    if (window.CategoryFilterManager && categoryFilterState) {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        window.CategoryFilterManager.restoreState(categoryFilterState);
      }, 50);
    }

    // ✅ Move active facets to filter container
    setTimeout(() => {
      FacetFiltersForm.moveActiveFacetsToFilterContainer();
    }, 100);
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerDesktop = document.getElementById('ProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
    const loadingSpinners = document.querySelectorAll(
      '.facets-container .loading__spinner, facet-filters-form .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
          ? `.mobile-facets__close-button`
          : `.facets__summary`;
        const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
    
    // ✅ Move active facets to .filter-cr container
    FacetFiltersForm.moveActiveFacetsToFilterContainer();
  }

  static moveActiveFacetsToFilterContainer() {
    const filterContainer = document.querySelector('.filter-cr');
    if (!filterContainer) {
      console.log('Filter container .filter-cr not found');
      return;
    }

    // Clear existing content
    filterContainer.innerHTML = '';

    let hasFilters = false;

    // ✅ Add selected category first
    const selectedCategoryCheckbox = document.querySelector('.category-filter__checkbox:checked');
    if (selectedCategoryCheckbox) {
      const categoryNameSpan = selectedCategoryCheckbox.parentElement.querySelector('.category-filter__name');
      const categoryName = categoryNameSpan ? categoryNameSpan.textContent.trim() : '';
      
      if (categoryName) {
        hasFilters = true;
        const categoryPill = document.createElement('facet-remove');
        categoryPill.innerHTML = `
          <a href="/collections/all" class="active-facets__button active-facets__button--light">
            <span class="active-facets__button-inner button button--tertiary">
              ${categoryName}
              <span class="svg-wrapper">
                <svg class="icon icon-close-small" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 12 12">
                  <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="visually-hidden">Remove category filter</span>
            </span>
          </a>
        `;
        
        const link = categoryPill.querySelector('a');
        link.addEventListener('click', (event) => {
          event.preventDefault();
          // Clear category selection
          if (window.CategoryFilterManager) {
            localStorage.removeItem('categoryFilterState');
          }
          window.location.href = '/collections/all';
        });
        
        filterContainer.appendChild(categoryPill);
      }
    }

    // Get all active facet buttons from desktop view
    const activeFacetsDesktop = document.querySelector('.active-facets-desktop');
    if (activeFacetsDesktop) {
      const allActiveFacets = activeFacetsDesktop.querySelectorAll('facet-remove');

      // Clone and append each active facet
      allActiveFacets.forEach(facet => {
        hasFilters = true;
        const clone = facet.cloneNode(true);
        // Re-bind click events
        const link = clone.querySelector('a');
        if (link) {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const form = document.querySelector('facet-filters-form');
            if (form) form.onActiveFilterClick(event);
          });
        }
        filterContainer.appendChild(clone);
      });
    }

    // Add clear all button if there are any filters
    if (hasFilters) {
      const clearAllWrapper = document.createElement('facet-remove');
      clearAllWrapper.className = 'active-facets__button-wrapper';
      clearAllWrapper.innerHTML = `
        <a href="/collections/all" class="active-facets__button-remove underlined-link">
          <span>Clear all</span>
        </a>
      `;
      
      const clearLink = clearAllWrapper.querySelector('a');
      clearLink.addEventListener('click', (event) => {
        event.preventDefault();
        // Clear category selection
        if (window.CategoryFilterManager) {
          localStorage.removeItem('categoryFilterState');
        }
        window.location.href = '/collections/all';
      });
      
      filterContainer.appendChild(clearAllWrapper);
    }
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

// ✅ The CategoryFilterManager.init() will now call moveActiveFacetsToFilterContainer after restoring state
// No need to call it separately here anymore

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('data-min', 0);
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('data-min'));
    const max = Number(input.getAttribute('data-max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);

// ============================================
// CATEGORY FILTER MANAGER
// ============================================
window.CategoryFilterManager = (function() {
  const STORAGE_KEY = 'categoryFilterState';

  function getCurrentCollectionHandle() {
    const path = window.location.pathname;
    const match = path.match(/\/collections\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { selectedItem: null };
    } catch (e) {
      return { selectedItem: null };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save filter state');
    }
  }

  function findParentHandles(handle) {
    const parents = [];
    const checkbox = document.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);

    if (checkbox) {
      let parent = checkbox.closest('.category-filter__item').parentElement;
      while (parent) {
        if (parent.classList.contains('category-filter__list')) {
          const parentItem = parent.closest('.category-filter__item');
          if (parentItem) {
            const parentCheckbox = parentItem.querySelector(':scope > .category-filter__row .category-filter__checkbox');
            if (parentCheckbox) parents.push(parentCheckbox.dataset.handle);
          }
        }
        parent = parent.parentElement;
      }
    }
    return parents;
  }

  function closeAllItems() {
    document.querySelectorAll('.category-filter__item').forEach(li => {
      li.classList.remove('open');
      const childList = li.querySelector('.category-filter__list');
      if (childList) childList.style.display = 'none';
    });
  }

  function openItemsByHandles(handles) {
    handles.forEach(handle => {
      const checkbox = document.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);
      if (checkbox) {
        const item = checkbox.closest('.category-filter__item');
        if (item) {
          item.classList.add('open');
          const childList = item.querySelector('.category-filter__list');
          if (childList) childList.style.display = 'block';
        }
      }
    });
  }

  function getCurrentState() {
    const openItems = [];
    document.querySelectorAll('.category-filter__item.open').forEach(item => {
      const checkbox = item.querySelector(':scope > .category-filter__row .category-filter__checkbox');
      if (checkbox) openItems.push(checkbox.dataset.handle);
    });

    let selectedHandle = null;
    const selectedCheckbox = document.querySelector('.category-filter__checkbox:checked');
    if (selectedCheckbox) selectedHandle = selectedCheckbox.dataset.handle;

    return { openItems, selectedHandle };
  }

  function restoreState(state) {
    if (!document.querySelector('.category-filter')) return;

    document.querySelectorAll('.category-filter__checkbox').forEach(chk => chk.checked = false);
    closeAllItems();

    if (state && state.selectedHandle) {
      const checkbox = document.querySelector(`.category-filter__checkbox[data-handle="${state.selectedHandle}"]`);
      if (checkbox) checkbox.checked = true;

      if (state.openItems && state.openItems.length > 0) {
        openItemsByHandles(state.openItems);
      } else {
        const parents = findParentHandles(state.selectedHandle);
        openItemsByHandles(parents);
      }
    } else {
      const currentHandle = getCurrentCollectionHandle();
      if (currentHandle) {
        const currentCheckbox = document.querySelector(`.category-filter__checkbox[data-handle="${currentHandle}"]`);
        if (currentCheckbox) currentCheckbox.checked = true;

        const parents = findParentHandles(currentHandle);
        openItemsByHandles(parents);

        saveState({ selectedItem: currentHandle });
      }
    }
  }

function init() {
  if (!document.querySelector('.category-filter')) return;

  // Handle clicks on category filters
  document.addEventListener('click', function(e) {
    // Only handle if click is within category filter
    const categoryFilter = e.target.closest('.category-filter');
    if (!categoryFilter) return;

    // Toggle open/close for items
    const toggleBtn = e.target.closest('.category-filter__toggle');
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation(); // ✅ Stop propagation ONLY for toggle
      const li = toggleBtn.closest('.category-filter__item');
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
      return;
    }

    // Checkbox click
    if (e.target.classList.contains('category-filter__checkbox')) {
      e.stopPropagation(); // ✅ Stop propagation for checkbox
      const checkbox = e.target;

      // Uncheck all others
      document.querySelectorAll('.category-filter__checkbox').forEach(otherChk => {
        if (otherChk !== checkbox) otherChk.checked = false;
      });

      checkbox.checked = true;
      saveState({ selectedItem: checkbox.dataset.handle });

      if (checkbox.dataset.url) {
        const drawer = document.querySelector('menu-drawer');
        if (drawer && typeof drawer.hide === 'function') drawer.hide();
        setTimeout(() => { window.location.href = checkbox.dataset.url; }, 50);
      }
      return;
    }

    // Label click
    const label = e.target.closest('.category-filter__label');
    if (label && e.target.tagName !== 'INPUT') {
      e.stopPropagation(); // ✅ Stop propagation for label
      const li = label.closest('.category-filter__item');
      const childList = li && li.querySelector('.category-filter__list');

      if (!childList) {
        e.preventDefault();
        const checkbox = label.querySelector('.category-filter__checkbox');
        if (checkbox && checkbox.dataset.url) {
          const drawer = document.querySelector('menu-drawer');
          if (drawer && typeof drawer.hide === 'function') drawer.hide();

          document.querySelectorAll('.category-filter__checkbox').forEach(chk => chk.checked = false);
          checkbox.checked = true;
          saveState({ selectedItem: checkbox.dataset.handle });
          window.location.href = checkbox.dataset.url;
        }
        return;
      }

      e.preventDefault();
      const isOpen = li.classList.contains('open');
      if (isOpen) {
        childList.style.display = 'none';
        li.classList.remove('open');
      } else {
        childList.style.display = 'block';
        li.classList.add('open');
      }
    }
  });

  // Restore saved state on initial load
  restoreState(loadState());
  
  // After restoring category state, trigger the filter container update
  setTimeout(() => {
    if (typeof FacetFiltersForm !== 'undefined' && FacetFiltersForm.moveActiveFacetsToFilterContainer) {
      FacetFiltersForm.moveActiveFacetsToFilterContainer();
    }
  }, 100);
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getCurrentState,
    restoreState,
    init
  };
})();