/**
 * Cart Hover Preview Component
 * Shows a preview of cart items when hovering over the cart icon on desktop
 */

class CartHoverPreview {
  constructor() {
    this.cartIcon = document.getElementById('cart-icon-bubble');
    this.hoverPreview = document.getElementById('cart-hover-preview');
    this.hoverTimeout = null;
    this.isHovering = false;
    
    if (this.cartIcon && this.hoverPreview) {
      this.init();
    }
  }

  init() {
    // Only enable on desktop (min-width: 990px)
    if (window.innerWidth < 990) {
      return;
    }

    // Make cart icon container relative for absolute positioning
    const iconWrapper = this.cartIcon.parentElement;
    if (iconWrapper) {
      iconWrapper.style.position = 'relative';
    }

    // Show preview on mouse enter cart icon
    this.cartIcon.addEventListener('mouseenter', () => {
      this.showPreview();
    });

    // Keep preview open when hovering over it
    this.hoverPreview.addEventListener('mouseenter', () => {
      this.isHovering = true;
      clearTimeout(this.hoverTimeout);
    });

    // Hide preview when mouse leaves
    this.cartIcon.addEventListener('mouseleave', () => {
      this.scheduleHide();
    });

    this.hoverPreview.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.scheduleHide();
    });

    // Handle "VIEW MY CART" button click to open cart drawer
    this.setupCartDrawerButton();

    // Update preview when cart is updated
    this.listenToCartUpdates();

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  showPreview() {
    clearTimeout(this.hoverTimeout);
    this.isHovering = true;
    
    // Small delay before showing to prevent accidental triggers
    this.hoverTimeout = setTimeout(() => {
      if (this.isHovering) {
        this.hoverPreview.classList.add('active');
      }
    }, 200);
  }

  scheduleHide() {
    clearTimeout(this.hoverTimeout);
    
    // Delay hiding to allow moving mouse to preview
    this.hoverTimeout = setTimeout(() => {
      if (!this.isHovering) {
        this.hidePreview();
      }
    }, 300);
  }

  hidePreview() {
    this.hoverPreview.classList.remove('active');
    this.isHovering = false;
  }

  setupCartDrawerButton() {
    // Add click handler for "VIEW MY CART" button
    const viewCartButton = this.hoverPreview.querySelector('[data-open-cart-drawer]');
    if (viewCartButton) {
      viewCartButton.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Hide the hover preview
        this.hidePreview();
        
        // Open the cart drawer
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer) {
          cartDrawer.open();
        }
      });
    }
  }

  async updatePreview() {
    try {
      // Fetch updated cart data
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Fetch the updated HTML
      const htmlResponse = await fetch(window.location.href);
      const html = await htmlResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Update the preview content
      const newPreview = doc.getElementById('cart-hover-preview');
      if (newPreview) {
        const newItems = newPreview.querySelector('.cart-hover-preview__items');
        const newFooter = newPreview.querySelector('.cart-hover-preview__footer');
        
        const currentItems = this.hoverPreview.querySelector('.cart-hover-preview__items');
        const currentFooter = this.hoverPreview.querySelector('.cart-hover-preview__footer');
        
        if (newItems && currentItems) {
          currentItems.innerHTML = newItems.innerHTML;
        }
        
        if (newFooter && currentFooter) {
          currentFooter.innerHTML = newFooter.innerHTML;
        } else if (newFooter && !currentFooter) {
          const container = this.hoverPreview.querySelector('.cart-hover-preview__container');
          container.appendChild(newFooter.cloneNode(true));
        } else if (!newFooter && currentFooter) {
          currentFooter.remove();
        }
        
        // Re-setup the cart drawer button after content update
        this.setupCartDrawerButton();
      }
      
      // Update cart count bubble
      this.updateCartBubble(cart.item_count);
    } catch (error) {
      console.error('Error updating cart preview:', error);
    }
  }

  updateCartBubble(itemCount) {
    const cartBubble = this.cartIcon.querySelector('.cart-count-bubble');
    
    if (itemCount > 0) {
      if (cartBubble) {
        const countSpan = cartBubble.querySelector('span[aria-hidden="true"]');
        if (countSpan && itemCount < 100) {
          countSpan.textContent = itemCount;
        }
      } else {
        // Create bubble if it doesn't exist
        const bubble = document.createElement('div');
        bubble.className = 'cart-count-bubble';
        if (itemCount < 100) {
          bubble.innerHTML = `<span aria-hidden="true">${itemCount}</span>`;
        }
        this.cartIcon.appendChild(bubble);
      }
    } else {
      if (cartBubble) {
        cartBubble.remove();
      }
    }
  }

  listenToCartUpdates() {
    // Listen for Shopify's pub/sub cart update events
    if (typeof subscribe !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        this.updatePreview();
      });
    }

    // Listen for custom cart update events
    document.addEventListener('cart:updated', () => {
      this.updatePreview();
    });

    // Listen for Shopify cart changes
    if (window.Shopify && window.Shopify.onCartUpdate) {
      const originalUpdate = window.Shopify.onCartUpdate;
      window.Shopify.onCartUpdate = (cart) => {
        if (originalUpdate) {
          originalUpdate(cart);
        }
        this.updatePreview();
      };
    }
  }

  handleResize() {
    // Hide and disable on mobile
    if (window.innerWidth < 990) {
      this.hidePreview();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CartHoverPreview();
  });
} else {
  new CartHoverPreview();
}

