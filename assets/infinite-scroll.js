/**
 * InfiniteScroll - Infinite scroll to load more products
 * Features: Scroll to load more products, prevent duplicate loading, state management, error handling
 */
class InfiniteScroll {
  constructor() {
    this.isLoading = false;
    this.hasMorePages = true;
    this.currentPage = 1;
    this.totalPages = 1;
    this.productsPerPage = 16; // Will be refined from initial grid count if possible
    this.scrollThreshold = 200; // Distance from bottom in pixels to trigger loading
    this.initDelay = 500; // Initialization delay to avoid performance issues during page load
    this.retryDelay = 2000; // Retry delay
    this.maxRetries = 3;
    this.retryCount = 0;
    // Always show Load More button and keep auto-loading enabled
    this.showLoadMoreButton = true; // Always show Load More button
    
    // DOM elements
    this.productGrid = null;
    this.paginationElement = null;
    this.loadingIndicator = null;
    this.loadMoreButton = null;
    
    // Event listeners
    this.scrollHandler = this.handleScroll.bind(this);
    this.loadMoreHandler = this.loadMore.bind(this);
    
    // Initialize
    this.init();
  }

  /**
   * Initialize infinite scroll
   */
  init() {
    // Delay initialization to avoid performance issues during page load
    setTimeout(() => {
      this.setupElements();
      this.setupPagination();
      this.setupLoadingIndicator();
      this.addEventListeners();
      this.updateState();
    }, this.initDelay);
  }

  /**
   * Setup DOM element references
   */
  setupElements() {
    this.productGrid = document.getElementById('product-grid');
    this.paginationElement = document.querySelector('.pagination');
    
    if (!this.productGrid) {
      return;
    }

    // Check if infinite scroll is enabled
    const container = document.querySelector('.infinite-scroll-enabled');
    if (!container) {
      return;
    }

    // Initialize productsPerPage from initial grid if available
    const initialItems = this.productGrid.querySelectorAll('li');
    if (initialItems && initialItems.length > 0) {
      this.productsPerPage = Math.max(this.productsPerPage, initialItems.length);
    }

    // Initialize grid dataset page from DOM/URL if missing
    if (!this.productGrid.dataset.page) {
      const paginationWrapper = document.querySelector('.pagination-wrapper');
      if (paginationWrapper?.dataset?.page) {
        this.productGrid.dataset.page = String(parseInt(paginationWrapper.dataset.page) || 1);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const urlPage = urlParams.get('page');
        this.productGrid.dataset.page = String((urlPage ? parseInt(urlPage) : 1) || 1);
      }
    }

    // Extract pagination information
    this.extractPaginationInfo();
  }

  /**
   * Extract pagination information
   */
  extractPaginationInfo() {
    // Try multiple methods to get pagination information
    let currentPage = 1;
    let totalPages = 1;
    
    // Prefer the product grid's own dataset as the source of truth
    if (this.productGrid?.dataset?.page) {
      const gridPage = parseInt(this.productGrid.dataset.page);
      if (!Number.isNaN(gridPage)) {
        currentPage = gridPage;
        console.log('InfiniteScroll: Extracted current page from grid dataset', currentPage);
      }
    }
    
    // Method 1: Get from pagination-wrapper data-page attribute (most reliable)
    const paginationWrapper = document.querySelector('.pagination-wrapper');
    if (paginationWrapper && paginationWrapper.dataset.page) {
      currentPage = parseInt(paginationWrapper.dataset.page) || 1;
      console.log('InfiniteScroll: Extracted current page from data-page', currentPage);
    }
    
    // Method 2: Get from pagination elements
    if (this.paginationElement) {
      const currentPageEl = this.paginationElement.querySelector('.pagination__item--current');
      const allPageItems = this.paginationElement.querySelectorAll('.pagination__item');
      const nextLink = this.paginationElement.querySelector('.pagination .pagination__item--prev, .pagination a[aria-label*="next" i]') || this.paginationElement.querySelector('.pagination__item--prev');
      
      // Only use DOM current page if data-page wasn't found
      if (!this.productGrid?.dataset?.page && currentPageEl) {
        currentPage = parseInt(currentPageEl.textContent) || 1;
        console.log('InfiniteScroll: Extracted current page from DOM', currentPage);
      }
      
      // Get total pages - find the maximum page number
      allPageItems.forEach(item => {
        const pageNum = parseInt(item.textContent);
        if (pageNum && pageNum > totalPages) {
          totalPages = pageNum;
        }
      });

      // If we couldn't determine total pages but a next button exists, infer at least one more page
      if (nextLink) {
        totalPages = Math.max(totalPages, currentPage + 1);
      }
    }
    
    // Method 3: Get current page from URL parameters (fallback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlPage = urlParams.get('page');
    console.log('InfiniteScroll: Extracted pagination info from URL', urlPage);
    if (urlPage && !this.productGrid?.dataset?.page) {
      currentPage = parseInt(urlPage) || 1;
      console.log('InfiniteScroll: Using URL page as fallback', currentPage);
    }
    
    // Method 3: Infer from product count (fallback)
    if (totalPages === 1 && this.productGrid) {
      const productsPerPage = 16; // Default products per page
      const totalProducts = this.productGrid.querySelectorAll('li').length;
      if (totalProducts >= productsPerPage) {
        // If current page product count equals per-page count, there might be more pages
        totalPages = 2; // Assume at least 2 pages
      }
    }

    console.log('InfiniteScroll: Extracted pagination info', currentPage);

    this.currentPage = currentPage;
    this.totalPages = totalPages;

    // Check if there are more pages - prefer the presence of a visible "next" link or <link rel="next">
    let hasNextLink = false;
    if (this.paginationElement) {
      const nextLinkCheck = this.paginationElement.querySelector('.pagination .pagination__item--prev, .pagination a[aria-label*="next" i]') || this.paginationElement.querySelector('.pagination__item--prev');
      hasNextLink = Boolean(nextLinkCheck);
    }
    const headRelNext = document.querySelector('link[rel="next"]');

    const candidateHasMore = Boolean(hasNextLink || headRelNext || (this.currentPage < this.totalPages));
    // Do not downgrade from true to false here; only upgrade to true or keep as is
    this.hasMorePages = this.hasMorePages || candidateHasMore;
    console.log('InfiniteScroll: Checking if there are more pages', this.currentPage, this.totalPages, this.hasMorePages);
    
  }

  /**
   * Setup pagination elements
   */
  setupPagination() {
    if (!this.paginationElement || !this.hasMorePages) return;

    // Hide traditional pagination but keep element for detection
    this.paginationElement.style.display = 'none';
    
    // Create pagination trigger element
    this.createPaginationTrigger();
  }

  /**
   * Create pagination trigger element
   */
  createPaginationTrigger() {
    const trigger = document.createElement('div');
    trigger.id = 'infinite-scroll-trigger';
    trigger.className = 'infinite-scroll-trigger';
    trigger.style.cssText = `
      height: 1px;
      width: 100%;
      position: absolute;
      bottom: ${this.scrollThreshold}px;
      left: 0;
      pointer-events: none;
      visibility: hidden;
      z-index: -1;
    `;
    
    // Ensure parent container has relative positioning
    const parent = this.productGrid.parentNode;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    parent.appendChild(trigger);
    
  }

  /**
   * Setup loading indicator
   */
  setupLoadingIndicator() {
    const loadingHTML = `
      <div id="infinite-scroll-loading" class="infinite-scroll-loading h-9 w-full flex justify-center items-center bg-[#E9E9E9] p-1" aria-hidden="true" style="display: none;">
        <div class="loading-spinner flex items-center gap-2 text-sm uppercase tracking-[1.4px]">
          <div class="text-[#787878]">Loading more...</div>
          <div class="spinner"></div>
        </div>
      </div>
    `;
    
    this.productGrid.insertAdjacentHTML('afterend', loadingHTML);
    this.loadingIndicator = document.getElementById('infinite-scroll-loading');
    
    // Create unified button for both loading and load more
    if (this.hasMorePages) {
      this.createUnifiedButton();
    }
  }

  /**
   * Create unified button for both loading and load more
   */
  createUnifiedButton() {
    const buttonHTML = `
      <div id="infinite-scroll-unified-button" class="infinite-scroll-unified-btn h-9 w-full flex justify-center items-center bg-[#E9E9E9] p-1 cursor-pointer" style="display: flex;">
        <div class="flex items-center gap-2 text-sm uppercase tracking-[1.4px]">
          <div class="text-[#787878]">Load More</div>
        </div>
      </div>
    `;
    
    this.productGrid.insertAdjacentHTML('afterend', buttonHTML);
    this.loadMoreButton = document.getElementById('infinite-scroll-unified-button');
    
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener('click', this.loadMoreHandler);
    }
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    if (!this.hasMorePages) return;

    // Scroll listener
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // Window resize listener
    window.addEventListener('resize', this.debounce(() => {
      this.updateState();
    }, 250));
  }

  /**
   * Handle scroll event
   */
  handleScroll() {
    if (this.isLoading || !this.hasMorePages) return;

    const trigger = document.getElementById('infinite-scroll-trigger');
    let shouldLoad = false;
    
    if (trigger) {
      // Method 1: Use trigger element
      const rect = trigger.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      shouldLoad = rect.top <= windowHeight;
      
      // Add debug info (development mode only)
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('myshopify')) {
      }
    } else {
      // Method 2: Fallback - detect scroll to bottom
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Trigger loading when scrolled within 200px of bottom
      shouldLoad = (scrollTop + windowHeight) >= (documentHeight - this.scrollThreshold);
      
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('myshopify')) {
      }
    }
    
    if (shouldLoad) {
      this.loadMore();
    }
  }

  /**
   * Load more products
   */
  async loadMore() {
    if (this.isLoading || !this.hasMorePages) return;

    this.isLoading = true;
    this.retryCount = 0;
    
    try {
      this.showLoading();
      await this.fetchNextPage();
      
      // Always keep auto-loading enabled - no limit on scroll-triggered loads
    } catch (error) {
      console.error('InfiniteScroll: Loading failed', error);
      this.handleError(error);
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  /**
   * Fetch next page products
   */
  async fetchNextPage() {
    const nextPage = this.currentPage + 1;
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('page', nextPage);
    
    // Add section_id parameter for AJAX request
    const sectionId = this.productGrid.dataset.id;
    if (sectionId) {
      currentUrl.searchParams.set('section_id', sectionId);
    }


    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    this.processNewProducts(html, nextPage);
  }

  /**
   * Process newly fetched product HTML
   */
  processNewProducts(html, pageNumber) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get new product list
    const newProductGrid = doc.getElementById('product-grid');
    if (!newProductGrid) {
      throw new Error('Cannot find product grid');
    }

    const newProducts = newProductGrid.querySelectorAll('li');
    
    if (newProducts.length === 0) {
      this.hasMorePages = false;
      return;
    }

    // Append new products to existing grid
    this.appendProducts(newProducts);
    
    // Update pagination info
    this.currentPage = pageNumber;
    
    // Update the data-page attribute to reflect current page
    const paginationWrapper = document.querySelector('.pagination-wrapper');
    if (paginationWrapper) {
      paginationWrapper.dataset.page = pageNumber.toString();
      console.log('InfiniteScroll: Updated data-page to', pageNumber);
    }

    // Persist page number on product grid as well
    if (this.productGrid) {
      this.productGrid.dataset.page = pageNumber.toString();
      console.log('InfiniteScroll: Updated grid dataset.page to', pageNumber);
    }

    // Replace/refresh local pagination element from fetched document to get accurate next link/parts
    const newPagination = doc.querySelector('.pagination');
    if (newPagination) {
      this.paginationElement = newPagination;
    }

    // Determine hasMorePages using fetched document's pagination, head rel=next, or by productsPerPage heuristic
    let docHasNext = false;
    if (newPagination) {
      const nextLinkCheck = newPagination.querySelector('.pagination .pagination__item--prev, .pagination a[aria-label*="next" i]') || newPagination.querySelector('.pagination__item--prev');
      docHasNext = Boolean(nextLinkCheck);
    }
    const docHeadRelNext = doc.querySelector('link[rel="next"]');

    // If the new page returns exactly one full page of products, assume there might be more
    const perPage = this.productsPerPage || 16;
    const inferredHasMore = Boolean(docHasNext || docHeadRelNext || newProducts.length >= perPage);
    this.hasMorePages = inferredHasMore;
    this.totalPages = inferredHasMore ? Math.max(this.totalPages, pageNumber + 1) : Math.max(this.totalPages, pageNumber);

    // Re-extract pagination info to sync current state with DOM hints (non-destructive). This will not downgrade hasMorePages.
    this.extractPaginationInfo();
    
    // Update state
    this.updateState();
    
    // Dispatch custom event
    this.dispatchLoadMoreEvent(newProducts);
  }

  /**
   * Append products to grid
   */
  appendProducts(newProducts) {
    const newProductElements = [];
    
    newProducts.forEach((product, index) => {
      // Add fade-in animation class
      product.classList.add('infinite-scroll-product-fade-in');
      
      // Set animation delay
      product.style.setProperty('--animation-delay', `${index * 0.1}s`);
      
      // Fix images for high-resolution screens (iPhone XR, etc.) before appending
      this.fixProductImages(product);
      
      // Append to existing grid
      this.productGrid.appendChild(product);
      newProductElements.push(product);
    });

    // Update lazy loading images for newly added products only
    this.updateLazyImagesForProducts(newProductElements);
    
    // Update currency display
    this.updateCurrency();
    
    // Re-initialize scroll animation trigger
    if (typeof initializeScrollAnimationTrigger === 'function') {
      initializeScrollAnimationTrigger();
    }
  }

  /**
   * Fix product images before appending to DOM
   * Ensures high-resolution screens (iPhone XR, etc.) load correct image quality
   */
  fixProductImages(product) {
    const images = product.querySelectorAll('img');
    images.forEach(img => {
      // For dynamically loaded products, change loading to eager to prevent blur
      // on high-resolution devices
      if (img.hasAttribute('loading')) {
        img.setAttribute('loading', 'eager');
      }
      
      // Ensure srcset and sizes are properly set
      if (img.hasAttribute('data-srcset') && !img.hasAttribute('srcset')) {
        img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.removeAttribute('data-srcset');
      }
      
      if (img.hasAttribute('data-sizes') && !img.hasAttribute('sizes')) {
        img.setAttribute('sizes', img.getAttribute('data-sizes'));
        img.removeAttribute('data-sizes');
      }
    });
  }

  /**
   * Update lazy loading images for specific products
   */
  updateLazyImagesForProducts(products) {
    products.forEach(product => {
      const images = product.querySelectorAll('img');
      images.forEach(img => {
        // Handle data-src lazy loading
        if (img.dataset.src && !img.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        
        // Handle data-srcset for responsive images
        if (img.dataset.srcset && !img.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
        
        // Ensure browser picks the right image from srcset
        // Critical for high-DPI screens like iPhone XR (2x pixel ratio)
        if (img.srcset && (!img.currentSrc || img.currentSrc === '')) {
          // Trigger srcset re-evaluation by toggling a property
          const currentSrcset = img.srcset;
          img.removeAttribute('srcset');
          
          // Force reflow
          void img.offsetWidth;
          
          // Restore srcset
          img.srcset = currentSrcset;
        }
      });
    });
  }

  /**
   * Update lazy loading images (legacy method, kept for compatibility)
   */
  updateLazyImages() {
    const lazyImages = this.productGrid.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      if (img.dataset.src && !img.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      
      if (img.dataset.srcset && !img.srcset) {
        img.srcset = img.dataset.srcset;
        img.removeAttribute('data-srcset');
      }
    });
  }

  /**
   * Update currency display
   */
  updateCurrency() {
    // If currency update function exists, call it
    if (typeof window.Shopify && window.Shopify.formatMoney) {
      const priceElements = this.productGrid.querySelectorAll('.price');
      priceElements.forEach(element => {
        const price = element.dataset.price;
        if (price) {
          element.textContent = window.Shopify.formatMoney(price);
        }
      });
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.setAttribute('aria-hidden', 'false');
      this.loadingIndicator.style.display = 'flex';
    }
    
    // Hide Load More button when showing loading
    if (this.loadMoreButton) {
      this.loadMoreButton.style.display = 'none';
    }
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.setAttribute('aria-hidden', 'true');
      this.loadingIndicator.style.display = 'none';
    }
    
    // Always show Load More button when there are more pages
    if (this.loadMoreButton && this.hasMorePages) {
      this.loadMoreButton.style.display = 'flex';
    }
  }

  /**
   * Show unified button (Load More)
   */
  showUnifiedButton() {
    if (this.loadMoreButton && !this.isLoading) {
      this.loadMoreButton.style.display = 'flex';
    }
  }

  /**
   * Handle error
   */
  handleError(error) {
    
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      setTimeout(() => {
        this.loadMore();
      }, this.retryDelay);
    } else {
      this.showError('Loading failed, please try again later');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorHTML = `
      <div class="infinite-scroll-error" style="
        text-align: center;
        padding: 2rem;
        color: rgba(var(--color-foreground), 0.7);
        font-size: 1.4rem;
      ">
        ${message}
        <button onclick="window.infiniteScroll?.loadMore()" style="
          margin-top: 1rem;
          padding: 0.8rem 1.6rem;
          background: rgb(var(--color-button));
          color: rgb(var(--color-button-text));
          border: none;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 1.3rem;
        ">Retry</button>
      </div>
    `;
    
    this.productGrid.insertAdjacentHTML('afterend', errorHTML);
  }

  /**
   * Update state
   */
  updateState() {
    console.log('InfiniteScroll: Updating state', this.hasMorePages);
    if (!this.hasMorePages) {
      this.removeEventListeners();
      this.hideLoading();
      this.hideLoadMoreButton();
    } else if (this.loadMoreButton && !this.isLoading) {
      // Always show Load More button when there are more pages and not loading
      this.loadMoreButton.style.display = 'flex';
    }
  }

  /**
   * Hide load more button
   */
  hideLoadMoreButton() {
    if (this.loadMoreButton) {
      this.loadMoreButton.style.display = 'none';
    }
  }

  /**
   * Show completion message
   */
  showCompleteMessage() {
    const existingComplete = document.querySelector('.infinite-scroll-complete');
    if (existingComplete) return;

    const completeHTML = `
      <div class="infinite-scroll-complete">
        All products displayed
      </div>
    `;
    
    this.productGrid.insertAdjacentHTML('afterend', completeHTML);
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  /**
   * Dispatch custom event
   */
  dispatchLoadMoreEvent(newProducts) {
    const event = new CustomEvent('infiniteScroll:loaded', {
      detail: {
        products: newProducts,
        currentPage: this.currentPage,
        hasMorePages: this.hasMorePages
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Destroy instance
   */
  destroy() {
    this.removeEventListeners();
    
    // Clean up DOM elements
    const trigger = document.getElementById('infinite-scroll-trigger');
    if (trigger) trigger.remove();
    
    if (this.loadingIndicator) {
      this.loadingIndicator.remove();
    }
    
    if (this.loadMoreButton) {
      this.loadMoreButton.removeEventListener('click', this.loadMoreHandler);
      this.loadMoreButton.remove();
    }
    
    // Clean up error and completion messages
    const errorElement = document.querySelector('.infinite-scroll-error');
    if (errorElement) errorElement.remove();
    
    const completeElement = document.querySelector('.infinite-scroll-complete');
    if (completeElement) completeElement.remove();
    
    // Reset state
    this.isLoading = false;
    this.hasMorePages = true;
    this.currentPage = 1;
    this.retryCount = 0;
  }
}

// Initialize after page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if infinite scroll is enabled
  const container = document.querySelector('.infinite-scroll-enabled');
  if (container) {
    window.infiniteScroll = new InfiniteScroll();
  }
});

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InfiniteScroll;
}
