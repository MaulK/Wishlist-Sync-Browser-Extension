/**
 * Content Script - Wishlist Sync Extension
 * Runs on supported shopping sites to detect and extract wishlist items
 */

// Site-specific selectors for item detection
const SITE_SELECTORS = {
    amazon: {
        name: 'Amazon',
        domains: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it', 'amazon.in', 'amazon.com.au', 'amazon.co.jp'],
        isProductPage: () => {
            return window.location.pathname.includes('/dp/') ||
                window.location.pathname.includes('/gp/product/');
        },
        extractItem: () => {
            const title = document.querySelector('#productTitle, #title h1')?.textContent?.trim();
            const priceEl = document.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen');
            const price = priceEl?.textContent?.trim();
            const image = document.querySelector('#landingImage, #imgBlkFront, .a-dynamic-image')?.src;
            const originalPriceEl = document.querySelector('#priceblock_ourprice_row .a-text-strike, .a-price.a-text-price .a-offscreen');
            const originalPrice = originalPriceEl?.textContent?.trim();
            const availability = document.querySelector('#availability, #availability span')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: parsePrice(originalPrice),
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Amazon',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('[data-component-type="s-search-result"], .s-result-item');

            itemElements.forEach(el => {
                const title = el.querySelector('h2 a span, .s-title-instructions-style')?.textContent?.trim();
                const price = el.querySelector('.a-price .a-offscreen, .a-price-whole')?.textContent?.trim();
                const image = el.querySelector('.s-image, .s-product-image-container img')?.src;
                const link = el.querySelector('h2 a')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Amazon'
                    });
                }
            });

            return items;
        }
    },

    ebay: {
        name: 'eBay',
        domains: ['ebay.com', 'ebay.co.uk', 'ebay.ca', 'ebay.de', 'ebay.fr', 'ebay.es', 'ebay.it', 'ebay.com.au'],
        isProductPage: () => {
            return window.location.pathname.includes('/itm/');
        },
        extractItem: () => {
            const title = document.querySelector('.x-item-title-label, .x-item-title__mainTitle')?.textContent?.trim();
            const price = document.querySelector('.x-price-primary, .x-price-amount')?.textContent?.trim();
            const image = document.querySelector('.ux-image-carousel img, .x-image-carousel img')?.src;
            const availability = document.querySelector('.d-availability, .x-availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'eBay',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.s-item, .search-item');

            itemElements.forEach(el => {
                const title = el.querySelector('.s-item__title, .item-title')?.textContent?.trim();
                const price = el.querySelector('.s-item__price, .price')?.textContent?.trim();
                const image = el.querySelector('.s-item__image-img, .item-image')?.src;
                const link = el.querySelector('a.s-item__link, .item-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'eBay'
                    });
                }
            });

            return items;
        }
    },

    walmart: {
        name: 'Walmart',
        domains: ['walmart.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/ip/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-testid="product-title"], .prod-ProductTitle')?.textContent?.trim();
            const price = document.querySelector('[data-testid="price-current"], .price-current')?.textContent?.trim();
            const image = document.querySelector('.prod-HeroImage-container img, [data-testid="product-image"]')?.src;
            const availability = document.querySelector('[data-testid="availability"], .prod-availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Walmart',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.search-result-gridview-item, .product-item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-title-link, .item-title')?.textContent?.trim();
                const price = el.querySelector('.price-main, .price')?.textContent?.trim();
                const image = el.querySelector('.product-image-link img, .item-image')?.src;
                const link = el.querySelector('.product-title-link, .item-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Walmart'
                    });
                }
            });

            return items;
        }
    },

    target: {
        name: 'Target',
        domains: ['target.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/p/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-test="product-title"], .h-text-bs')?.textContent?.trim();
            const price = document.querySelector('[data-test="product-price"], .h-text-xxl')?.textContent?.trim();
            const image = document.querySelector('.styles__StyledImage-sc-1k0k3v4-0 img')?.src;
            const availability = document.querySelector('[data-test="shippingAvailability"], .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Target',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.styles__ProductCardContainer, .product-card');

            itemElements.forEach(el => {
                const title = el.querySelector('[data-test="product-title"], .product-title')?.textContent?.trim();
                const price = el.querySelector('[data-test="product-price"], .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Target'
                    });
                }
            });

            return items;
        }
    },

    bestbuy: {
        name: 'Best Buy',
        domains: ['bestbuy.com', 'bestbuy.ca'],
        isProductPage: () => {
            return window.location.pathname.includes('/site/');
        },
        extractItem: () => {
            const title = document.querySelector('.sku-title, h1.product-title')?.textContent?.trim();
            const price = document.querySelector('.price-current, .price-hero')?.textContent?.trim();
            const image = document.querySelector('.product-image img, .primary-image')?.src;
            const availability = document.querySelector('.availability, .shipping-message')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Best Buy',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.sku-item, .product-item');

            itemElements.forEach(el => {
                const title = el.querySelector('.sku-title, .product-title')?.textContent?.trim();
                const price = el.querySelector('.price-current, .price')?.textContent?.trim();
                const image = el.querySelector('.product-image img')?.src;
                const link = el.querySelector('a.sku-title, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Best Buy'
                    });
                }
            });

            return items;
        }
    },

    etsy: {
        name: 'Etsy',
        domains: ['etsy.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/listing/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-buy-box-listing-title], .wt-text-body-03')?.textContent?.trim();
            const price = document.querySelector('[data-selector="price-current"], .wt-text-title-03')?.textContent?.trim();
            const image = document.querySelector('.wt-max-width-full, .carousel-image')?.src;
            const availability = document.querySelector('.wt-text-body-01, .inventory-quantity')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Etsy',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.wt-grid__item, .listing-card');

            itemElements.forEach(el => {
                const title = el.querySelector('.wt-text-caption, .listing-title')?.textContent?.trim();
                const price = el.querySelector('.wt-text-title-03, .listing-price')?.textContent?.trim();
                const image = el.querySelector('img, .listing-image')?.src;
                const link = el.querySelector('a, .listing-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Etsy'
                    });
                }
            });

            return items;
        }
    },

    aliexpress: {
        name: 'AliExpress',
        domains: ['aliexpress.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/item/') ||
                window.location.pathname.includes('/product/');
        },
        extractItem: () => {
            const title = document.querySelector('.product-title, .title-text')?.textContent?.trim();
            const price = document.querySelector('.product-price-value, .snow-price')?.textContent?.trim();
            const image = document.querySelector('.image-view-item img, .sku-item-image')?.src;
            const availability = document.querySelector('.product-stock, .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'AliExpress',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.list-item, .product-item');

            itemElements.forEach(el => {
                const title = el.querySelector('.item-title, .product-title')?.textContent?.trim();
                const price = el.querySelector('.price-current, .price')?.textContent?.trim();
                const image = el.querySelector('.item-image img, .product-image')?.src;
                const link = el.querySelector('a, .item-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'AliExpress'
                    });
                }
            });

            return items;
        }
    },

    asos: {
        name: 'ASOS',
        domains: ['asos.com', 'asos.de', 'asos.fr'],
        isProductPage: () => {
            return window.location.pathname.includes('/prd/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-id="product-title"], .product-name')?.textContent?.trim();
            const price = document.querySelector('[data-id="current-price"], .current-price')?.textContent?.trim();
            const image = document.querySelector('.product-gallery img, .product-image')?.src;
            const availability = document.querySelector('.stock-level, .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'ASOS',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.product-card, .item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-name, .item-title')?.textContent?.trim();
                const price = el.querySelector('.current-price, .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'ASOS'
                    });
                }
            });

            return items;
        }
    },

    zara: {
        name: 'Zara',
        domains: ['zara.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/p/');
        },
        extractItem: () => {
            const title = document.querySelector('.product-detail-info__name, .product-name')?.textContent?.trim();
            const price = document.querySelector('.price-current, .price')?.textContent?.trim();
            const image = document.querySelector('.media-image__image img, .product-image')?.src;
            const availability = document.querySelector('.stock, .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Zara',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.product-item, .item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-name, .item-title')?.textContent?.trim();
                const price = el.querySelector('.price, .item-price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Zara'
                    });
                }
            });

            return items;
        }
    },

    nike: {
        name: 'Nike',
        domains: ['nike.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/t/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-test="product-title"], .headline-2')?.textContent?.trim();
            const price = document.querySelector('[data-test="product-price"], .product-price')?.textContent?.trim();
            const image = document.querySelector('.css-13w0u5e img, .product-image')?.src;
            const availability = document.querySelector('[data-test="product-availability"], .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Nike',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.product-card, .product-item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-card__title, .product-title')?.textContent?.trim();
                const price = el.querySelector('.product-price, .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Nike'
                    });
                }
            });

            return items;
        }
    },

    tokopedia: {
        name: 'Tokopedia',
        domains: ['tokopedia.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/find/') ||
                window.location.pathname.includes('/p/');
        },
        extractItem: () => {
            const title = document.querySelector('[data-testid="lblPDPDetailProductName"], .product-name')?.textContent?.trim();
            const price = document.querySelector('[data-testid="lblPDPDetailProductPrice"], .price')?.textContent?.trim();
            const image = document.querySelector('[data-testid="PDPMainImage"], .product-image')?.src;
            const availability = document.querySelector('[data-testid="lblPDPDetailProductStock"], .stock')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Tokopedia',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.css-bk6tzz, .product-card');

            itemElements.forEach(el => {
                const title = el.querySelector('.prd_link-product-name, .product-title')?.textContent?.trim();
                const price = el.querySelector('.prd_link-product-price, .price')?.textContent?.trim();
                const image = el.querySelector('.css-1s8795t img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Tokopedia'
                    });
                }
            });

            return items;
        }
    },

    shopee: {
        name: 'Shopee',
        domains: ['shopee.com', 'shopee.co.id', 'shopee.sg', 'shopee.my'],
        isProductPage: () => {
            return window.location.pathname.includes('/product/') ||
                window.location.pathname.includes('/i.');
        },
        extractItem: () => {
            const title = document.querySelector('.shopee-product-detail__product__title, .product-briefing')?.textContent?.trim();
            const price = document.querySelector('.shopee-product-detail__product__price, .price')?.textContent?.trim();
            const image = document.querySelector('[data-testid="PDPMainImage"], .product-image')?.src;
            const availability = document.querySelector('.shopee-product-detail__product__stock, .stock')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Shopee',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.col-xs-2-4, .shopee-search-item-result__item');

            itemElements.forEach(el => {
                const title = el.querySelector('.shopee-search-item-result__item, .item-title')?.textContent?.trim();
                const price = el.querySelector('.shopee-search-item-result__item, .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .item-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Shopee'
                    });
                }
            });

            return items;
        }
    },

    tiktok: {
        name: 'TikTok Shop',
        domains: ['tiktok.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/product/') ||
                window.location.pathname.includes('/item/');
        },
        extractItem: () => {
            const title = document.querySelector('.product-title, .product-name')?.textContent?.trim();
            const price = document.querySelector('.product-price, .price')?.textContent?.trim();
            const image = document.querySelector('.product-image img, .image-container img')?.src;
            const availability = document.querySelector('.stock, .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'TikTok Shop',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.product-card, .item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-title, .item-title')?.textContent?.trim();
                const price = el.querySelector('.product-price, .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'TikTok Shop'
                    });
                }
            });

            return items;
        }
    },

    blibli: {
        name: 'Blibli',
        domains: ['blibli.com'],
        isProductPage: () => {
            return window.location.pathname.includes('/p/') ||
                window.location.pathname.includes('/product/');
        },
        extractItem: () => {
            const title = document.querySelector('.product-name, .product-title')?.textContent?.trim();
            const price = document.querySelector('.product-price, .price')?.textContent?.trim();
            const image = document.querySelector('.product-image img, .image-container img')?.src;
            const availability = document.querySelector('.stock, .availability')?.textContent?.trim();

            if (!title) return null;

            return {
                title,
                url: window.location.href,
                image: image || '',
                price: parsePrice(price),
                originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                site: 'Blibli',
                availability: availability || 'Unknown'
            };
        },
        findWishlistItems: () => {
            const items = [];
            const itemElements = document.querySelectorAll('.product-card, .item');

            itemElements.forEach(el => {
                const title = el.querySelector('.product-name, .item-title')?.textContent?.trim();
                const price = el.querySelector('.product-price, .price')?.textContent?.trim();
                const image = el.querySelector('img, .product-image')?.src;
                const link = el.querySelector('a, .product-link')?.href;

                if (title && link) {
                    items.push({
                        title,
                        url: link,
                        image: image || '',
                        price: parsePrice(price),
                        originalPrice: null,
                currency: extractCurrency(price || (typeof originalPrice !== "undefined" ? originalPrice : "")),
                        site: 'Blibli'
                    });
                }
            });

            return items;
        }
    }
};

/**
 * Get current site configuration
 */
function getCurrentSite() {
    const hostname = window.location.hostname.toLowerCase();

    for (const [key, site] of Object.entries(SITE_SELECTORS)) {
        if (site.domains.some(domain => hostname.includes(domain))) {
            return { key, ...site };
        }
    }

    return null;
}

/**
 * Parse price string to number
 */
function extractCurrency(priceStr) {
        if (!priceStr) return '';
        const s = priceStr.toUpperCase();
        if (s.includes('€') || s.includes('EUR')) return 'EUR';
        if (s.includes('£') || s.includes('GBP')) return 'GBP';
        if (s.includes('RP') || s.includes('IDR')) return 'IDR';
        if (s.includes('RM') || s.includes('MYR')) return 'MYR';
        if (s.includes('¥') || s.includes('JPY') || s.includes('RMB') || s.includes('CNY')) return 'JPY'; // assuming JPY for ¥
        if (s.includes('₹') || s.includes('INR')) return 'INR';
        if (s.includes('S$') || s.includes('SGD')) return 'SGD';
        if (s.includes('C$') || s.includes('CAD')) return 'CAD';
        if (s.includes('A$') || s.includes('AUD')) return 'AUD';
        if (s.includes('HK$') || s.includes('HKD')) return 'HKD';
        if (s.includes('CA$')) return 'CAD';
        if (s.includes('AU$')) return 'AUD';
        if (s.includes('US$') || s.includes('USD')) return 'USD';
        if (s.includes('$')) return 'USD';
        return '';
}

function parsePrice(priceStr) {
    if (!priceStr) return null;

    // Remove currency symbols and non-numeric characters except decimal point and comma
    const cleaned = priceStr.replace(/[^\d.,]/g, '');

    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    let numStr;
    if (lastComma !== -1 && lastDot !== -1) {
        // Both exist, the last one is the decimal
        const lastPunct = Math.max(lastComma, lastDot);
        numStr = cleaned.replace(/[.,]/g, (match, offset) => {
            return offset === lastPunct ? '.' : '';
        });
    } else if (lastComma !== -1) {
        // Only comma
        const parts = cleaned.split(',');
        // If there's only one comma and the part after it is not 3 digits, it's likely a decimal
        if (parts.length === 2 && parts[1].length !== 3) {
            numStr = cleaned.replace(',', '.');
        } else {
            // Thousands separator
            numStr = cleaned.replace(/,/g, '');
        }
    } else if (lastDot !== -1) {
        // Only dot
        const parts = cleaned.split('.');
        // Check if thousands separator
        let isThousands = parts.length > 1;
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].length !== 3) {
                isThousands = false;
                break;
            }
        }
        if (isThousands) {
            numStr = cleaned.replace(/\./g, '');
        } else {
            numStr = cleaned;
        }
    } else {
        numStr = cleaned;
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
}

/**
 * Check if current page is a product page
 */
function isProductPage() {
    const site = getCurrentSite();
    return site && site.isProductPage();
}

/**
 * Extract item data from current page
 */
function extractItemData() {
    const site = getCurrentSite();
    if (!site) return null;

    return site.extractItem();
}

/**
 * Find all wishlist items on current page
 */
function findWishlistItems() {
    const site = getCurrentSite();
    if (!site) return [];

    return site.findWishlistItems();
}

/**
 * Send message to background script
 */
function sendMessage(type, data = {}) {
    chrome.runtime.sendMessage({
        type,
        data,
        url: window.location.href,
        site: getCurrentSite()?.name
    });
}

/**
 * Initialize content script
 */
function init() {
    const site = getCurrentSite();

    if (!site) return;

    // Check if we're on a product page
    if (isProductPage()) {
        // Extract item data
        const item = extractItemData();

        if (item) {
            // Send item data to background script
            sendMessage('ITEM_DETECTED', item);

            // Add visual indicator that item can be added
            addAddToWishlistButton(item);
        }
    }

    // Also check for wishlist items on listing pages
    const wishlistItems = findWishlistItems();
    if (wishlistItems.length > 0) {
        sendMessage('WISHLIST_ITEMS_FOUND', { items: wishlistItems });
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'EXTRACT_ITEM') {
            const item = extractItemData();
            sendResponse({ item });
        } else if (message.type === 'FIND_WISHLIST_ITEMS') {
            const items = findWishlistItems();
            sendResponse({ items });
        }

        return true; // Keep message channel open for async response
    });
}

/**
 * Add "Add to Wishlist" button to page
 */
function addAddToWishlistButton(item) {
    // Check if button already exists
    if (document.getElementById('wishlist-sync-btn')) return;

    const button = document.createElement('button');
    button.id = 'wishlist-sync-btn';
    button.className = 'wishlist-sync-button';
    button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
    Add to Wishlist
  `;

    button.addEventListener('click', () => {
        sendMessage('ADD_TO_WISHLIST', item);
        button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      Added!
    `;
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        Add to Wishlist
      `;
            button.disabled = false;
        }, 2000);
    });

    // Add button to page
    document.body.appendChild(button);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
    .wishlist-sync-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }
    
    .wishlist-sync-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    
    .wishlist-sync-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .wishlist-sync-button svg {
      flex-shrink: 0;
    }
  `;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Also initialize after a short delay for dynamic content
setTimeout(init, 1000);
