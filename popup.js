/**
 * Popup Controller - Wishlist Sync Extension
 * Handles the extension popup UI and user interactions
 */

// DOM Elements
const pageStatus = document.getElementById('pageStatus');
const addItemSection = document.getElementById('addItemSection');
const itemPreview = document.getElementById('itemPreview');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewPrice = document.getElementById('previewPrice');
const previewOriginalPrice = document.getElementById('previewOriginalPrice');
const addToWishlistBtn = document.getElementById('addToWishlistBtn');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const viewAllBtn = document.getElementById('viewAllBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const recentItemsList = document.getElementById('recentItemsList');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');

// State
let currentItem = null;
let currentTab = null;

/**
 * Initialize the popup
 */
async function init() {
    console.log('Popup init: Starting...');

    try {
        // Check if DOM is ready
        if (!document || !document.readyState) {
            console.error('Popup: DOM not ready');
            return;
        }

        // Get current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Popup: Current tab:', tabs);
        currentTab = tabs[0];

        // Load wishlist data
        console.log('Popup: Loading wishlist data...');
        await loadWishlistData();

        // Check if current page is a supported shopping site
        console.log('Popup: Checking current page...');
        await checkCurrentPage();

        // Setup event listeners
        console.log('Popup: Setting up event listeners...');
        setupEventListeners();

        console.log('Popup: Initialization complete');

    } catch (error) {
        console.error('Error initializing popup:', error);
        showToast('Error loading extension', 'error');
    }
}

/**
 * Load wishlist data from storage
 */
async function loadWishlistData() {
    try {
        const data = await StorageManager.getAllItems();
        updateStats(data);
        renderRecentItems(data);
    } catch (error) {
        console.error('Error loading wishlist data:', error);
    }
}

/**
 * Check if current page is a supported shopping site
 */
async function checkCurrentPage() {
    if (!currentTab || !currentTab.url) {
        updatePageStatus('not-supported', 'Not a shopping site');
        return;
    }

    const url = currentTab.url;
    const site = detectShoppingSite(url);

    if (!site) {
        updatePageStatus('not-supported', 'Not a supported site');
        return;
    }

    updatePageStatus('detecting', `Detected: ${site.name}`);

    // Try to extract item data from the page
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: extractItemData,
        });

        if (results && results[0] && results[0].result) {
            currentItem = results[0].result;
            displayItemPreview(currentItem);
            updatePageStatus('found', 'Item detected!');
        } else {
            updatePageStatus('not-found', 'No item found on this page');
        }
    } catch (error) {
        console.error('Error extracting item data:', error);
        updatePageStatus('error', 'Could not detect item');
    }
}

/**
 * Detect shopping site from URL
 */
function detectShoppingSite(url) {
    const sites = {
        'amazon.com': { name: 'Amazon', domain: 'amazon.com' },
        'amazon.co.uk': { name: 'Amazon UK', domain: 'amazon.co.uk' },
        'amazon.ca': { name: 'Amazon Canada', domain: 'amazon.ca' },
        'amazon.de': { name: 'Amazon Germany', domain: 'amazon.de' },
        'amazon.fr': { name: 'Amazon France', domain: 'amazon.fr' },
        'amazon.es': { name: 'Amazon Spain', domain: 'amazon.es' },
        'amazon.it': { name: 'Amazon Italy', domain: 'amazon.it' },
        'amazon.in': { name: 'Amazon India', domain: 'amazon.in' },
        'amazon.com.au': { name: 'Amazon Australia', domain: 'amazon.com.au' },
        'amazon.co.jp': { name: 'Amazon Japan', domain: 'amazon.co.jp' },
        'ebay.com': { name: 'eBay', domain: 'ebay.com' },
        'ebay.co.uk': { name: 'eBay UK', domain: 'ebay.co.uk' },
        'ebay.ca': { name: 'eBay Canada', domain: 'ebay.ca' },
        'ebay.de': { name: 'eBay Germany', domain: 'ebay.de' },
        'ebay.fr': { name: 'eBay France', domain: 'ebay.fr' },
        'ebay.es': { name: 'eBay Spain', domain: 'ebay.es' },
        'ebay.it': { name: 'eBay Italy', domain: 'ebay.it' },
        'ebay.com.au': { name: 'eBay Australia', domain: 'ebay.com.au' },
        'walmart.com': { name: 'Walmart', domain: 'walmart.com' },
        'target.com': { name: 'Target', domain: 'target.com' },
        'bestbuy.com': { name: 'Best Buy', domain: 'bestbuy.com' },
        'bestbuy.ca': { name: 'Best Buy Canada', domain: 'bestbuy.ca' },
        'etsy.com': { name: 'Etsy', domain: 'etsy.com' },
        'aliexpress.com': { name: 'AliExpress', domain: 'aliexpress.com' },
        'asos.com': { name: 'ASOS', domain: 'asos.com' },
        'asos.de': { name: 'ASOS Germany', domain: 'asos.de' },
        'asos.fr': { name: 'ASOS France', domain: 'asos.fr' },
        'zara.com': { name: 'Zara', domain: 'zara.com' },
        'nike.com': { name: 'Nike', domain: 'nike.com' },
        'tokopedia.com': { name: 'Tokopedia', domain: 'tokopedia.com' },
        'shopee.com': { name: 'Shopee', domain: 'shopee.com' },
        'shopee.co.id': { name: 'Shopee Indonesia', domain: 'shopee.co.id' },
        'shopee.sg': { name: 'Shopee Singapore', domain: 'shopee.sg' },
        'shopee.my': { name: 'Shopee Malaysia', domain: 'shopee.my' },
        'tiktok.com': { name: 'TikTok Shop', domain: 'tiktok.com' },
        'blibli.com': { name: 'Blibli', domain: 'blibli.com' }
    };

    for (const [domain, site] of Object.entries(sites)) {
        if (url.includes(domain)) {
            return site;
        }
    }

    return null;
}

/**
 * Extract item data from the page (executed in content script context)
 */
function extractItemData() {
    // This function is executed in the page context
    const url = window.location.href;
    const hostname = window.location.hostname;

    let item = null;

    // Amazon extraction
    if (hostname.includes('amazon')) {
        const title = document.querySelector('#productTitle, #title h1')?.textContent?.trim();
        const price = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen')?.textContent?.trim();
        const image = document.querySelector('#landingImage, #imgBlkFront, .a-dynamic-image')?.src;
        const originalPrice = document.querySelector('#priceblock_ourprice_row .a-text-strike, .a-price.a-text-price .a-offscreen')?.textContent?.trim();

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: parsePrice(originalPrice),
                site: 'Amazon'
            };
        }
    }
    // eBay extraction
    else if (hostname.includes('ebay')) {
        const title = document.querySelector('.x-item-title-label, .x-item-title__mainTitle')?.textContent?.trim();
        const price = document.querySelector('.x-price-primary, .x-price-amount')?.textContent?.trim();
        const image = document.querySelector('.ux-image-carousel img, .x-image-carousel img')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'eBay'
            };
        }
    }
    // Walmart extraction
    else if (hostname.includes('walmart')) {
        const title = document.querySelector('[data-testid="product-title"], .prod-ProductTitle')?.textContent?.trim();
        const price = document.querySelector('[data-testid="price-current"], .price-current')?.textContent?.trim();
        const image = document.querySelector('.prod-HeroImage-container img, [data-testid="product-image"]')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Walmart'
            };
        }
    }
    // Target extraction
    else if (hostname.includes('target')) {
        const title = document.querySelector('[data-test="product-title"], .h-text-bs')?.textContent?.trim();
        const price = document.querySelector('[data-test="product-price"], .h-text-xxl')?.textContent?.trim();
        const image = document.querySelector('.styles__StyledImage-sc-1k0k3v4-0 img')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Target'
            };
        }
    }
    // Best Buy extraction
    else if (hostname.includes('bestbuy')) {
        const title = document.querySelector('.sku-title, h1.product-title')?.textContent?.trim();
        const price = document.querySelector('.price-current, .price-hero')?.textContent?.trim();
        const image = document.querySelector('.product-image img, .primary-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Best Buy'
            };
        }
    }
    // Etsy extraction
    else if (hostname.includes('etsy')) {
        const title = document.querySelector('[data-buy-box-listing-title], .wt-text-body-03')?.textContent?.trim();
        const price = document.querySelector('[data-selector="price-current"], .wt-text-title-03')?.textContent?.trim();
        const image = document.querySelector('.wt-max-width-full, .carousel-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Etsy'
            };
        }
    }
    // AliExpress extraction
    else if (hostname.includes('aliexpress')) {
        const title = document.querySelector('.product-title, .title-text')?.textContent?.trim();
        const price = document.querySelector('.product-price-value, .snow-price')?.textContent?.trim();
        const image = document.querySelector('.image-view-item img, .sku-item-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'AliExpress'
            };
        }
    }
    // ASOS extraction
    else if (hostname.includes('asos')) {
        const title = document.querySelector('[data-id="product-title"], .product-name')?.textContent?.trim();
        const price = document.querySelector('[data-id="current-price"], .current-price')?.textContent?.trim();
        const image = document.querySelector('.product-gallery img, .product-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'ASOS'
            };
        }
    }
    // Zara extraction
    else if (hostname.includes('zara')) {
        const title = document.querySelector('.product-detail-info__name, .product-name')?.textContent?.trim();
        const price = document.querySelector('.price-current, .price')?.textContent?.trim();
        const image = document.querySelector('.media-image__image img, .product-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Zara'
            };
        }
    }
    // Nike extraction
    else if (hostname.includes('nike')) {
        const title = document.querySelector('[data-test="product-title"], .headline-2')?.textContent?.trim();
        const price = document.querySelector('[data-test="product-price"], .product-price')?.textContent?.trim();
        const image = document.querySelector('.css-13w0u5e img, .product-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Nike'
            };
        }
    }
    // Tokopedia extraction
    else if (hostname.includes('tokopedia')) {
        const title = document.querySelector('[data-testid="lblPDPDetailProductName"], .product-name')?.textContent?.trim();
        const price = document.querySelector('[data-testid="lblPDPDetailProductPrice"], .price')?.textContent?.trim();
        const image = document.querySelector('[data-testid="PDPMainImage"], .product-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Tokopedia'
            };
        }
    }
    // Shopee extraction
    else if (hostname.includes('shopee')) {
        const title = document.querySelector('.shopee-product-detail__product__title, .product-briefing')?.textContent?.trim();
        const price = document.querySelector('.shopee-product-detail__product__price, .price')?.textContent?.trim();
        const image = document.querySelector('.shopee-product-detail__product__image img, .product-image')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Shopee'
            };
        }
    }
    // TikTok extraction
    else if (hostname.includes('tiktok')) {
        const title = document.querySelector('.product-title, .product-name')?.textContent?.trim();
        const price = document.querySelector('.product-price, .price')?.textContent?.trim();
        const image = document.querySelector('.product-image img, .image-container img')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'TikTok Shop'
            };
        }
    }
    // Blibli extraction
    else if (hostname.includes('blibli')) {
        const title = document.querySelector('.product-name, .product-title')?.textContent?.trim();
        const price = document.querySelector('.product-price, .price')?.textContent?.trim();
        const image = document.querySelector('.product-image img, .image-container img')?.src;

        if (title) {
            item = {
                title,
                url,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                site: 'Blibli'
            };
        }
    }

    return item;
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr) {
    if (!priceStr) return null;

    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = priceStr.replace(/[^\d.,]/g, '');

    // Handle different decimal separators
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    let numStr;
    if (hasComma && hasDot) {
        // If both, assume last one is decimal separator
        numStr = cleaned.replace(/[.,]/g, (match, offset) => {
            return offset === cleaned.lastIndexOf(match) ? '.' : '';
        });
    } else if (hasComma) {
        // Check if comma is decimal or thousands separator
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            numStr = cleaned.replace(',', '.');
        } else {
            numStr = cleaned.replace(/,/g, '');
        }
    } else {
        numStr = cleaned;
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
}

/**
 * Update page status display
 */
function updatePageStatus(status, message) {
    const icons = {
        'not-supported': '🔒',
        'detecting': '🔍',
        'found': '✅',
        'not-found': '❓',
        'error': '⚠️'
    };

    pageStatus.innerHTML = `
    <span class="status-icon">${icons[status] || '🔍'}</span>
    <span class="status-text">${message}</span>
  `;

    // Show/hide add item section
    if (status === 'found' && currentItem) {
        addItemSection.classList.remove('hidden');
    } else {
        addItemSection.classList.add('hidden');
    }
}

/**
 * Display item preview
 */
function displayItemPreview(item) {
    previewTitle.textContent = item.title || 'Unknown Item';
    previewPrice.textContent = formatPrice(item.price);

    if (item.image) {
        previewImage.src = item.image;
        previewImage.classList.remove('hidden');
    } else {
        previewImage.classList.add('hidden');
    }

    if (item.originalPrice && item.originalPrice > item.price) {
        previewOriginalPrice.textContent = formatPrice(item.originalPrice);
        previewOriginalPrice.classList.remove('hidden');
    } else {
        previewOriginalPrice.classList.add('hidden');
    }
}

/**
 * Update statistics display
 */
function updateStats(items) {
    const totalItems = items.length;
    const totalSavings = items.reduce((sum, item) => {
        if (item.originalPrice && item.originalPrice > item.price) {
            return sum + (item.originalPrice - item.price);
        }
        return sum;
    }, 0);

    const priceDrops = items.filter(item => item.priceHistory && item.priceHistory.length > 1).length;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalSavings').textContent = formatPrice(totalSavings);
    document.getElementById('priceDrops').textContent = priceDrops;
}

/**
 * Render recent items list
 */
function renderRecentItems(items) {
    const recentItems = items.slice(0, 5); // Show last 5 items

    if (recentItems.length === 0) {
        recentItemsList.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <p>No items in your wishlist yet</p>
        <p class="hint">Browse supported shopping sites to add items</p>
      </div>
    `;
        return;
    }

    recentItemsList.innerHTML = recentItems.map(item => `
    <div class="item-card" data-id="${item.id}">
      ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : '<div class="item-image placeholder"></div>'}
      <div class="item-info">
        <h3 class="item-title">${truncateText(item.title, 40)}</h3>
        <div class="item-meta">
          <span class="item-price">${formatPrice(item.price)}</span>
          <span class="item-site">${item.site}</span>
        </div>
      </div>
      <button class="item-action-btn" data-action="view" title="View Details">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>
  `).join('');

    // Add click handlers for item actions
    recentItemsList.querySelectorAll('.item-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemCard = e.target.closest('.item-card');
            const itemId = itemCard.dataset.id;
            openItemDetails(itemId);
        });
    });
}

/**
 * Add current item to wishlist
 */
async function addToWishlist() {
    if (!currentItem) return;

    try {
        // Check if item already exists
        const existingItem = await StorageManager.getItemByUrl(currentItem.url);

        if (existingItem) {
            showToast('Item already in wishlist!', 'warning');
            return;
        }

        // Create new item
        const newItem = {
            id: generateId(),
            title: currentItem.title,
            url: currentItem.url,
            image: currentItem.image || '',
            price: currentItem.price || 0,
            originalPrice: currentItem.originalPrice || null,
            discount: currentItem.originalPrice && currentItem.price
                ? Math.round(((currentItem.originalPrice - currentItem.price) / currentItem.originalPrice) * 100)
                : 0,
            site: currentItem.site,
            category: 'Uncategorized',
            tags: [],
            addedDate: new Date().toISOString().split('T')[0],
            lastChecked: new Date().toISOString().split('T')[0],
            priceHistory: currentItem.price ? [{
                date: new Date().toISOString().split('T')[0],
                price: currentItem.price
            }] : [],
            availability: 'In Stock',
            notes: ''
        };

        await StorageManager.addItem(newItem);

        showToast('Item added to wishlist!', 'success');

        // Refresh data
        await loadWishlistData();

        // Update button state
        addToWishlistBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      Added!
    `;
        addToWishlistBtn.disabled = true;

    } catch (error) {
        console.error('Error adding item to wishlist:', error);
        showToast('Failed to add item', 'error');
    }
}

/**
 * Open item details page
 */
function openItemDetails(itemId) {
    chrome.tabs.create({
        url: chrome.runtime.getURL(`item-details.html?id=${itemId}`)
    });
}

/**
 * Open dashboard
 */
function openDashboard() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html')
    });
}

/**
 * Open settings
 */
function openSettings() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('settings.html')
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    addToWishlistBtn.addEventListener('click', addToWishlist);
    refreshBtn.addEventListener('click', () => {
        checkCurrentPage();
        loadWishlistData();
    });
    settingsBtn.addEventListener('click', openSettings);
    viewAllBtn.addEventListener('click', openDashboard);
    openDashboardBtn.addEventListener('click', openDashboard);
    toastClose.addEventListener('click', () => {
        toast.classList.add('hidden');
    });
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', init);
