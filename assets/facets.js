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

 // Replace this function in your FacetFiltersForm class

static moveActiveFacetsToFilterContainer() {
  const filterContainer = document.querySelector('.filter-cr');
  if (!filterContainer) {
    console.log('Filter container .filter-cr not found');
    return;
  }

  // Clear existing content
  filterContainer.innerHTML = '';

  let hasFilters = false;

  // Get URL data to determine what's actually filtered
  const path = window.location.pathname;
  const match = path.match(/\/collections\/([^\/]+)(?:\/(.+))?/);
  
  if (match) {
    const parentHandle = match[1];
    const subcategoriesStr = match[2];
    
    // Add parent collection pill
    const parentCheckbox = document.querySelector(`.category-filter__checkbox[data-handle="${parentHandle}"]`);
    if (parentCheckbox) {
      const parentNameSpan = parentCheckbox.parentElement.querySelector('.category-filter__name');
      const parentName = parentNameSpan ? parentNameSpan.textContent.trim() : parentHandle;
      
      hasFilters = true;
      const parentPill = document.createElement('facet-remove');
      parentPill.innerHTML = `
        <a href="/collections/all" class="active-facets__button active-facets__button--light">
          <span class="active-facets__button-inner button button--tertiary">
            ${parentName}
            <span class="svg-wrapper">
              <svg class="icon icon-close-small" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 12 12">
                <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </span>
            <span class="visually-hidden">Remove category filter</span>
          </span>
        </a>
      `;
      
      const link = parentPill.querySelector('a');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (window.CategoryFilterManager) {
          localStorage.removeItem('categoryFilterState');
        }
        window.location.href = '/collections/all';
      });
      
      filterContainer.appendChild(parentPill);
    }
    
    // Add subcategory pills if they exist
    if (subcategoriesStr) {
      const subcategoryHandles = subcategoriesStr.split(',').map(s => s.trim());
      
      subcategoryHandles.forEach(handle => {
        // Find this subcategory within the parent's tree
        const parentItem = parentCheckbox?.closest('.category-filter__item');
        if (parentItem) {
          const subCheckbox = parentItem.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);
          if (subCheckbox) {
            const subNameSpan = subCheckbox.parentElement.querySelector('.category-filter__name');
            const subName = subNameSpan ? subNameSpan.textContent.trim() : handle;
            
            hasFilters = true;
            const subPill = document.createElement('facet-remove');
            subPill.innerHTML = `
              <a href="/collections/${parentHandle}" class="active-facets__button active-facets__button--light">
                <span class="active-facets__button-inner button button--tertiary">
                  ${subName}
                  <span class="svg-wrapper">
                    <svg class="icon icon-close-small" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 12 12">
                      <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="visually-hidden">Remove ${subName} filter</span>
                </span>
              </a>
            `;
            
            const link = subPill.querySelector('a');
            link.addEventListener('click', (event) => {
              event.preventDefault();
              
              // Remove this subcategory from the URL
              const remainingSubcategories = subcategoryHandles.filter(h => h !== handle);
              
              let newUrl;
              if (remainingSubcategories.length === 0) {
                newUrl = `/collections/${parentHandle}`;
              } else {
                newUrl = `/collections/${parentHandle}/${remainingSubcategories.join(',')}`;
              }
              
              if (window.CategoryFilterManager) {
                localStorage.setItem('categoryFilterState', JSON.stringify({
                  selectedItems: [parentHandle, ...remainingSubcategories],
                  openItems: [parentHandle]
                }));
              }
              
              window.location.href = newUrl;
            });
            
            filterContainer.appendChild(subPill);
          }
        }
      });
    }
  }

  // Get all active facet buttons from desktop view (for other filters like price, etc)
  const activeFacetsDesktop = document.querySelector('.active-facets-desktop');
  if (activeFacetsDesktop) {
    const allActiveFacets = activeFacetsDesktop.querySelectorAll('facet-remove');

    // Clone and append each active facet (skip category-related ones as we've handled them above)
    allActiveFacets.forEach(facet => {
      const link = facet.querySelector('a');
      if (link && !link.textContent.includes('Category')) {
        hasFilters = true;
        const clone = facet.cloneNode(true);
        // Re-bind click events
        const cloneLink = clone.querySelector('a');
        if (cloneLink) {
          cloneLink.addEventListener('click', (event) => {
            event.preventDefault();
            const form = document.querySelector('facet-filters-form');
            if (form) form.onActiveFilterClick(event);
          });
        }
        filterContainer.appendChild(clone);
      }
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
// ============================================
// MULTI-SELECT CATEGORY FILTER MANAGER
// ============================================
window.CategoryFilterManager = (function() {
  const STORAGE_KEY = 'categoryFilterState';

  function getCurrentCollectionHandle() {
    const path = window.location.pathname;
    const match = path.match(/\/collections\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  // Parse URL to get parent and selected subcategories
  function parseURLCategories() {
    const path = window.location.pathname;
    // Match pattern: /collections/parent/cat1,cat2,cat3
    const match = path.match(/\/collections\/([^\/]+)(?:\/(.+))?/);
    
    if (match) {
      const parent = match[1];
      const subcategories = match[2] ? match[2].split(',').map(s => s.trim()) : [];
      return { parent, subcategories };
    }
    return { parent: null, subcategories: [] };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { selectedItems: [], openItems: [] };
    } catch (e) {
      return { selectedItems: [], openItems: [] };
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save filter state');
    }
  }

  function findParentHandles(handle, checkboxElement = null) {
    const parents = [];
    // Use the provided checkbox element or find it
    const checkbox = checkboxElement || document.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);

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

  // Get the actual parent of the clicked checkbox (DOM hierarchy based)
  function getDirectParentHandle(checkboxElement) {
    if (!checkboxElement) return null;
    
    let parent = checkboxElement.closest('.category-filter__item').parentElement;
    while (parent) {
      if (parent.classList.contains('category-filter__list')) {
        const parentItem = parent.closest('.category-filter__item');
        if (parentItem) {
          const parentCheckbox = parentItem.querySelector(':scope > .category-filter__row .category-filter__checkbox');
          if (parentCheckbox) {
            // Check if this is a level-0 parent
            if (parentItem.classList.contains('category-filter__item--level-0')) {
              return parentCheckbox.dataset.handle;
            }
            // Otherwise, continue looking for level-0 parent
            return getDirectParentHandle(parentCheckbox);
          }
        }
      }
      parent = parent.parentElement;
    }
    return null;
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

  function isLevel0Category(handle) {
    const checkbox = document.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);
    if (checkbox) {
      const item = checkbox.closest('.category-filter__item');
      return item && item.classList.contains('category-filter__item--level-0');
    }
    return false;
  }

  function getCurrentState() {
    const openItems = [];
    document.querySelectorAll('.category-filter__item.open').forEach(item => {
      const checkbox = item.querySelector(':scope > .category-filter__row .category-filter__checkbox');
      if (checkbox) openItems.push(checkbox.dataset.handle);
    });

    const selectedItems = [];
    document.querySelectorAll('.category-filter__checkbox:checked').forEach(chk => {
      selectedItems.push(chk.dataset.handle);
    });

    return { openItems, selectedItems };
  }

  function restoreState(state) {
    if (!document.querySelector('.category-filter')) return;

    // Uncheck all first
    document.querySelectorAll('.category-filter__checkbox').forEach(chk => chk.checked = false);
    closeAllItems();

    // Parse URL to get parent and subcategories
    const urlData = parseURLCategories();
    
    if (urlData.parent) {
      // Find the checkbox for this parent handle
      const parentCheckbox = document.querySelector(`.category-filter__checkbox[data-handle="${urlData.parent}"]`);
      
      if (parentCheckbox) {
        // Check parent (level-0)
        parentCheckbox.checked = true;
        
        // Check all subcategories
        urlData.subcategories.forEach(handle => {
          // Find subcategory checkbox WITHIN this parent's tree only
          const parentItem = parentCheckbox.closest('.category-filter__item');
          if (parentItem) {
            const subCheckbox = parentItem.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);
            if (subCheckbox) subCheckbox.checked = true;
          }
        });

        // Open parent items
        const allParents = new Set();
        allParents.add(urlData.parent); // Open the main parent
        
        // Get the parent item to open its tree
        const parentItem = parentCheckbox.closest('.category-filter__item');
        if (parentItem) {
          parentItem.classList.add('open');
          const childList = parentItem.querySelector(':scope > .category-filter__list');
          if (childList) childList.style.display = 'block';
        }
        
        // Open parent items for all subcategories within this tree
        urlData.subcategories.forEach(handle => {
          const parentItem = parentCheckbox.closest('.category-filter__item');
          if (parentItem) {
            const subCheckbox = parentItem.querySelector(`.category-filter__checkbox[data-handle="${handle}"]`);
            if (subCheckbox) {
              const parents = findParentHandles(handle, subCheckbox);
              parents.forEach(p => allParents.add(p));
            }
          }
        });

        openItemsByHandles(Array.from(allParents));
      }
    }
  }

  function generateMultiSelectURL(selectedHandles, clickedCheckbox) {
    if (selectedHandles.length === 0) {
      return '/collections/all';
    }

    // Get the clicked checkbox element to find its actual parent
    let clickedHandle = clickedCheckbox ? clickedCheckbox.dataset.handle : selectedHandles[0];

    // If clicked item is level-0, redirect to just that collection
    if (clickedCheckbox && isLevel0Category(clickedHandle)) {
      return `/collections/${clickedHandle}`;
    }

    // Find the ACTUAL parent from DOM hierarchy (not just searching all checkboxes)
    let parentHandle = null;
    
    if (clickedCheckbox) {
      // Get direct parent from the clicked checkbox's DOM position
      parentHandle = getDirectParentHandle(clickedCheckbox);
    }

    // Fallback: try to find parent from URL or first selected item
    if (!parentHandle) {
      const urlData = parseURLCategories();
      parentHandle = urlData.parent;
    }

    if (!parentHandle) {
      // Last fallback
      return `/collections/${selectedHandles[0]}`;
    }

    // Get all currently checked subcategories under this specific parent
    const subcategories = [];
    const parentItem = document.querySelector(`.category-filter__checkbox[data-handle="${parentHandle}"]`)?.closest('.category-filter__item');
    
    if (parentItem) {
      // Find all checked subcategories within this parent's tree only
      const checkedInThisTree = parentItem.querySelectorAll('.category-filter__checkbox:checked');
      checkedInThisTree.forEach(chk => {
        const handle = chk.dataset.handle;
        // Don't include the parent itself or other level-0 categories
        if (handle !== parentHandle && !isLevel0Category(handle)) {
          subcategories.push(handle);
        }
      });
    }

    if (subcategories.length === 0) {
      return `/collections/${parentHandle}`;
    } else if (subcategories.length === 1) {
      return `/collections/${parentHandle}/${subcategories[0]}`;
    } else {
      return `/collections/${parentHandle}/${subcategories.join(',')}`;
    }
  }

  function navigateToMultiSelect(clickedCheckbox) {
    const state = getCurrentState();
    const url = generateMultiSelectURL(state.selectedItems, clickedCheckbox);
    
    saveState(state);
    
    const drawer = document.querySelector('menu-drawer');
    if (drawer && typeof drawer.hide === 'function') drawer.hide();
    
    setTimeout(() => { window.location.href = url; }, 50);
  }

  function init() {
    if (!document.querySelector('.category-filter')) return;

    // Handle clicks on category filters
    document.addEventListener('click', function(e) {
      const categoryFilter = e.target.closest('.category-filter');
      if (!categoryFilter) return;

      // Toggle open/close for items
      const toggleBtn = e.target.closest('.category-filter__toggle');
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const li = toggleBtn.closest('.category-filter__item');
        if (!li) return;
        
        const childList = li.querySelector('.category-filter__list');
        if (!childList) return;

        const isOpen = li.classList.contains('open');
        li.classList.toggle('open');
        childList.style.display = isOpen ? 'none' : 'block';
        return;
      }

      // Checkbox click
      if (e.target.classList.contains('category-filter__checkbox')) {
        e.stopPropagation();
        
        const clickedCheckbox = e.target;
        const clickedHandle = clickedCheckbox.dataset.handle;

        // If it's a level-0 category, clear all subcategories and navigate
        if (isLevel0Category(clickedHandle)) {
          // Uncheck all others
          document.querySelectorAll('.category-filter__checkbox').forEach(chk => {
            if (chk !== clickedCheckbox) chk.checked = false;
          });
          clickedCheckbox.checked = true;
          
          setTimeout(() => {
            navigateToMultiSelect(clickedCheckbox);
          }, 100);
          return;
        }

        // For subcategories: allow multi-select within the same parent tree
        // Find the actual parent and keep it checked
        const actualParentHandle = getDirectParentHandle(clickedCheckbox);
        if (actualParentHandle) {
          const parentCheckbox = document.querySelector(`.category-filter__checkbox[data-handle="${actualParentHandle}"]`);
          if (parentCheckbox) {
            parentCheckbox.checked = true;
          }

          // Uncheck all level-0 categories except the actual parent
          document.querySelectorAll('.category-filter__checkbox').forEach(chk => {
            if (isLevel0Category(chk.dataset.handle) && chk.dataset.handle !== actualParentHandle) {
              chk.checked = false;
            }
          });
        }

        setTimeout(() => {
          navigateToMultiSelect(clickedCheckbox);
        }, 200);
        return;
      }

      // Label click
      const label = e.target.closest('.category-filter__label');
      if (label) {
        e.preventDefault();
        e.stopPropagation();
        
        const checkbox = label.querySelector('.category-filter__checkbox');
        if (checkbox) {
          const clickedHandle = checkbox.dataset.handle;
          
          // If it's level-0, clear everything and select only this
          if (isLevel0Category(clickedHandle)) {
            document.querySelectorAll('.category-filter__checkbox').forEach(chk => {
              chk.checked = false;
            });
            checkbox.checked = true;
            
            setTimeout(() => {
              navigateToMultiSelect(checkbox);
            }, 100);
            return;
          }

          // For subcategories
          checkbox.checked = !checkbox.checked;
          
          // Find actual parent and keep it checked
          const actualParentHandle = getDirectParentHandle(checkbox);
          if (actualParentHandle) {
            const parentCheckbox = document.querySelector(`.category-filter__checkbox[data-handle="${actualParentHandle}"]`);
            if (parentCheckbox) {
              parentCheckbox.checked = true;
            }

            // Uncheck all other level-0 categories
            document.querySelectorAll('.category-filter__checkbox').forEach(chk => {
              if (isLevel0Category(chk.dataset.handle) && chk.dataset.handle !== actualParentHandle) {
                chk.checked = false;
              }
            });
          }

          setTimeout(() => {
            navigateToMultiSelect(checkbox);
          }, 200);
        }
      }
    }, true);

    // Restore saved state on initial load
    restoreState(loadState());
    
    // Update filter container after restoring state
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
    init,
    generateMultiSelectURL
  };
})();