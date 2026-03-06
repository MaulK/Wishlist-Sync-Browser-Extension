/**
 * Background Service Worker - Wishlist Sync Extension
 * Handles background tasks, alarms, and message routing
 */

// Constants
const PRICE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const AVAILABILITY_CHECK_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

/**
 * Initialize background service worker
 */
function init() {
    // Set up alarms for price and availability checks
    setupAlarms();

    // Set up message listeners
    setupMessageListeners();

    // Set up install handler
    setupInstallHandler();

    // Set up context menu (optional)
    setupContextMenu();

    console.log('Wishlist Sync background service worker initialized');
}

/**
 * Set up alarms for periodic tasks
 */
function setupAlarms() {
    // Price check alarm
    chrome.alarms.create('priceCheck', {
        periodInMinutes: PRICE_CHECK_INTERVAL / (60 * 1000)
    });

    // Availability check alarm
    chrome.alarms.create('availabilityCheck', {
        periodInMinutes: AVAILABILITY_CHECK_INTERVAL / (60 * 1000)
    });

    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
        switch (alarm.name) {
            case 'priceCheck':
                checkAllPrices();
                break;
            case 'availabilityCheck':
                checkAllAvailability();
                break;
        }
    });
}

/**
 * Set up message listeners
 */
function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleIncomingMessage(message, sender)
            .then(response => sendResponse(response))
            .catch(error => {
                console.error('Error handling message:', error);
                sendResponse({ error: error.message });
            });

        return true; // Keep message channel open for async response
    });
}

/**
 * Handle incoming messages
 */
async function handleIncomingMessage(message, sender) {
    const { type, data, url, site } = message;

    switch (type) {
        case 'ITEM_DETECTED':
            return handleItemDetected(data, site);

        case 'WISHLIST_ITEMS_FOUND':
            return handleWishlistItemsFound(data);

        case 'ADD_TO_WISHLIST':
            return handleAddToWishlist(data);

        case 'GET_ALL_ITEMS':
            return getAllItems();

        case 'GET_ITEM':
            return getItem(data.id);

        case 'UPDATE_ITEM':
            return updateItem(data);

        case 'DELETE_ITEM':
            return deleteItem(data.id);

        case 'GET_STATS':
            return getStats();

        case 'EXPORT_WISHLIST':
            return exportWishlist(data.format);

        case 'IMPORT_WISHLIST':
            return importWishlist(data);

        case 'CHECK_PRICE':
            return checkPrice(data.itemId);

        case 'CHECK_AVAILABILITY':
            return checkAvailability(data.itemId);

        case 'OPEN_DASHBOARD':
            return openDashboard();

        case 'OPEN_SETTINGS':
            return openSettings();

        default:
            console.warn('Unknown message type:', type);
            return { error: 'Unknown message type' };
    }
}

/**
 * Handle item detected on page
 */
async function handleItemDetected(item, site) {
    try {
        // Store detected item in temporary storage for popup
        await chrome.storage.local.set({
            'detectedItem': item
        });

        // Check if item is already in wishlist
        const existingItem = await getItemByUrl(item.url);

        return {
            success: true,
            item,
            alreadyInWishlist: !!existingItem,
            existingItemId: existingItem?.id
        };
    } catch (error) {
        console.error('Error handling detected item:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle wishlist items found on page
 */
async function handleWishlistItemsFound(data) {
    try {
        const { items } = data;

        // Store detected items in temporary storage
        await chrome.storage.local.set({
            'detectedWishlistItems': items
        });

        return {
            success: true,
            count: items.length
        };
    } catch (error) {
        console.error('Error handling wishlist items found:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle add to wishlist request
 */
async function handleAddToWishlist(item) {
    try {
        // Check if item already exists
        const existingItem = await getItemByUrl(item.url);

        if (existingItem) {
            return {
                success: false,
                error: 'Item already in wishlist',
                itemId: existingItem.id
            };
        }

        // Create new item
        const newItem = {
            id: generateId(),
            title: item.title,
            url: item.url,
            image: item.image || '',
            price: item.price || 0,
            originalPrice: item.originalPrice || null,
            discount: item.originalPrice && item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0,
            currency: item.currency || 'USD',
            site: item.site,
            category: 'Uncategorized',
            tags: [],
            addedDate: new Date().toISOString().split('T')[0],
            lastChecked: new Date().toISOString().split('T')[0],
            priceHistory: item.price ? [{
                date: new Date().toISOString().split('T')[0],
                price: item.price
            }] : [],
            availability: item.availability || 'Unknown',
            notes: ''
        };

        await addItem(newItem);

        // Show notification
        showNotification('Item Added', `"${truncateText(item.title, 30)}" has been added to your wishlist`);

        return {
            success: true,
            itemId: newItem.id
        };
    } catch (error) {
        console.error('Error adding item to wishlist:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all items from storage
 */
async function getAllItems() {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        return { success: true, items };
    } catch (error) {
        console.error('Error getting all items:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get single item by ID
 */
async function getItem(id) {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        const item = items.find(i => i.id === id);

        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        return { success: true, item };
    } catch (error) {
        console.error('Error getting item:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get item by URL
 */
async function getItemByUrl(url) {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        const item = items.find(i => i.url === url);
        return item || null;
    } catch (error) {
        console.error('Error getting item by URL:', error);
        return null;
    }
}

/**
 * Update item
 */
async function updateItem(item) {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        const index = items.findIndex(i => i.id === item.id);

        if (index === -1) {
            return { success: false, error: 'Item not found' };
        }

        items[index] = { ...items[index], ...item };
        await chrome.storage.local.set({ wishlist: items });

        return { success: true, item: items[index] };
    } catch (error) {
        console.error('Error updating item:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete item
 */
async function deleteItem(id) {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        const filteredItems = items.filter(i => i.id !== id);

        await chrome.storage.local.set({ wishlist: filteredItems });

        return { success: true };
    } catch (error) {
        console.error('Error deleting item:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add new item to wishlist
 */
async function addItem(item) {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];
        items.unshift(item); // Add to beginning of array

        await chrome.storage.local.set({ wishlist: items });

        return { success: true, item };
    } catch (error) {
        console.error('Error adding item:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get statistics
 */
async function getStats() {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];

        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + convertToUSD(item.price || 0, item.currency), 0);
        const totalSavings = items.reduce((sum, item) => {
            if (item.originalPrice && item.originalPrice > item.price) {
                return sum + convertToUSD(item.originalPrice - item.price, item.currency);
            }
            return sum;
        }, 0);

        // Count items by site
        const itemsBySite = {};
        items.forEach(item => {
            const site = item.site || 'Unknown';
            itemsBySite[site] = (itemsBySite[site] || 0) + 1;
        });

        // Count items by category
        const itemsByCategory = {};
        items.forEach(item => {
            const category = item.category || 'Uncategorized';
            itemsByCategory[category] = (itemsByCategory[category] || 0) + 1;
        });

        // Count price drops
        const priceDrops = items.filter(item =>
            item.priceHistory && item.priceHistory.length > 1
        ).length;

        return {
            success: true,
            stats: {
                totalItems,
                totalValue,
                totalSavings,
                itemsBySite,
                itemsByCategory,
                priceDrops
            }
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Export wishlist
 */
async function exportWishlist(format = 'json') {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];

        let data;
        let mimeType;
        let extension;

        switch (format) {
            case 'json':
                data = JSON.stringify(items, null, 2);
                mimeType = 'application/json';
                extension = 'json';
                break;

            case 'csv':
                data = convertToCSV(items);
                mimeType = 'text/csv';
                extension = 'csv';
                break;

            default:
                return { success: false, error: 'Unsupported format' };
        }

        // Create blob and download
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const filename = `wishlist-export-${new Date().toISOString().split('T')[0]}.${extension}`;

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        });

        return { success: true, filename };
    } catch (error) {
        console.error('Error exporting wishlist:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Import wishlist
 */
async function importWishlist(data) {
    try {
        const { format, content } = data;
        let items;

        switch (format) {
            case 'json':
                items = JSON.parse(content);
                break;

            case 'csv':
                items = convertFromCSV(content);
                break;

            default:
                return { success: false, error: 'Unsupported format' };
        }

        if (!Array.isArray(items)) {
            return { success: false, error: 'Invalid data format' };
        }

        // Get existing items
        const result = await chrome.storage.local.get('wishlist');
        const existingItems = result.wishlist || [];

        // Merge items, avoiding duplicates by URL
        const existingUrls = new Set(existingItems.map(i => i.url));
        const newItems = items.filter(item => !existingUrls.has(item.url));

        // Add new items with generated IDs
        const itemsWithIds = newItems.map(item => ({
            ...item,
            id: item.id || generateId(),
            addedDate: item.addedDate || new Date().toISOString().split('T')[0],
            lastChecked: new Date().toISOString().split('T')[0]
        }));

        const updatedItems = [...itemsWithIds, ...existingItems];
        await chrome.storage.local.set({ wishlist: updatedItems });

        return {
            success: true,
            imported: itemsWithIds.length,
            duplicates: items.length - itemsWithIds.length
        };
    } catch (error) {
        console.error('Error importing wishlist:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check price for all items
 */
async function checkAllPrices() {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];

        const priceDrops = [];

        for (const item of items) {
            const updated = await checkPriceInternal(item);
            if (updated && updated.hasPriceDrop) {
                priceDrops.push(updated);
            }
        }

        // Notify user about price drops
        if (priceDrops.length > 0) {
            const message = priceDrops.length === 1
                ? `"${truncateText(priceDrops[0].title, 30)}" is now ${formatPrice(priceDrops[0].price, priceDrops[0].currency)}!`
                : `${priceDrops.length} items have dropped in price!`;

            showNotification('Price Drop Alert', message);
        }

        return { success: true, priceDrops: priceDrops.length };
    } catch (error) {
        console.error('Error checking all prices:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check price for single item
 */
async function checkPrice(itemId) {
    try {
        const { item } = await getItem(itemId);
        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        const updated = await checkPriceInternal(item);

        return {
            success: true,
            item: updated
        };
    } catch (error) {
        console.error('Error checking price:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Internal price check function
 */
async function checkPriceInternal(item) {
    try {
        // Fetch current price from the URL
        const response = await fetch(item.url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let currentPrice = null;

        // Try to extract price based on site
        if (item.site === 'Amazon') {
            const priceEl = doc.querySelector('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen');
            currentPrice = parsePrice(priceEl?.textContent);
        } else if (item.site === 'eBay') {
            const priceEl = doc.querySelector('.x-price-primary, .x-price-amount');
            currentPrice = parsePrice(priceEl?.textContent);
        }
        // Add more site-specific price extraction as needed

        if (currentPrice === null) {
            return null;
        }

        // Check if price has changed
        const hasPriceDrop = currentPrice < item.price;
        const lastPrice = item.price;

        // Update item
        const updatedItem = {
            ...item,
            price: currentPrice,
            lastChecked: new Date().toISOString().split('T')[0],
            priceHistory: [
                ...item.priceHistory,
                {
                    date: new Date().toISOString().split('T')[0],
                    price: currentPrice
                }
            ]
        };

        // Recalculate discount if original price exists
        if (updatedItem.originalPrice) {
            updatedItem.discount = Math.round(
                ((updatedItem.originalPrice - currentPrice) / updatedItem.originalPrice) * 100
            );
        }

        await updateItem(updatedItem);

        return {
            ...updatedItem,
            hasPriceDrop,
            lastPrice
        };
    } catch (error) {
        console.error('Error checking price for item:', item.id, error);
        return null;
    }
}

/**
 * Check availability for all items
 */
async function checkAllAvailability() {
    try {
        const result = await chrome.storage.local.get('wishlist');
        const items = result.wishlist || [];

        const backInStock = [];

        for (const item of items) {
            const updated = await checkAvailabilityInternal(item);
            if (updated && updated.isBackInStock) {
                backInStock.push(updated);
            }
        }

        // Notify user about items back in stock
        if (backInStock.length > 0) {
            const message = backInStock.length === 1
                ? `"${truncateText(backInStock[0].title, 30)}" is back in stock!`
                : `${backInStock.length} items are back in stock!`;

            showNotification('Back in Stock Alert', message);
        }

        return { success: true, backInStock: backInStock.length };
    } catch (error) {
        console.error('Error checking all availability:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check availability for single item
 */
async function checkAvailability(itemId) {
    try {
        const { item } = await getItem(itemId);
        if (!item) {
            return { success: false, error: 'Item not found' };
        }

        const updated = await checkAvailabilityInternal(item);

        return {
            success: true,
            item: updated
        };
    } catch (error) {
        console.error('Error checking availability:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Internal availability check function
 */
async function checkAvailabilityInternal(item) {
    try {
        // Fetch current availability from the URL
        const response = await fetch(item.url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        let currentAvailability = 'Unknown';

        // Try to extract availability based on site
        if (item.site === 'Amazon') {
            const availabilityEl = doc.querySelector('#availability, #availability span');
            currentAvailability = availabilityEl?.textContent?.trim() || 'Unknown';
        } else if (item.site === 'eBay') {
            const availabilityEl = doc.querySelector('.d-availability, .x-availability');
            currentAvailability = availabilityEl?.textContent?.trim() || 'Unknown';
        }
        // Add more site-specific availability extraction as needed

        // Check if item is now in stock
        const wasOutOfStock = item.availability &&
            (item.availability.toLowerCase().includes('out of stock') ||
                item.availability.toLowerCase().includes('unavailable'));
        const isBackInStock = wasOutOfStock &&
            !currentAvailability.toLowerCase().includes('out of stock') &&
            !currentAvailability.toLowerCase().includes('unavailable');

        // Update item
        const updatedItem = {
            ...item,
            availability: currentAvailability,
            lastChecked: new Date().toISOString().split('T')[0]
        };

        await updateItem(updatedItem);

        return {
            ...updatedItem,
            isBackInStock
        };
    } catch (error) {
        console.error('Error checking availability for item:', item.id, error);
        return null;
    }
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
 * Show notification
 */
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message,
        priority: 2
    });
}

/**
 * Setup context menu
 */
function setupContextMenu() {
    // Context menu functionality disabled for Manifest V3 compatibility
    // Can be re-enabled with proper Manifest V3 implementation
}

/**
 * Setup install handler
 */
function setupInstallHandler() {
    chrome.runtime.onInstalled.addListener((details) => {
        if (details.reason === 'install') {
            // Initialize storage
            chrome.storage.local.set({
                wishlist: [],
                settings: {
                    notifications: true,
                    priceDropThreshold: 5,
                    checkInterval: 6
                }
            });

            // Open welcome page
            chrome.tabs.create({
                url: chrome.runtime.getURL('dashboard.html')
            });
        } else if (details.reason === 'update') {
            // Handle update
            console.log('Extension updated to version:', chrome.runtime.getManifest().version);
        }
    });
}

/**
 * Convert items to CSV
 */
function convertToCSV(items) {
    if (items.length === 0) return '';

    const headers = Object.keys(items[0]);
    const csvRows = [headers.join(',')];

    for (const item of items) {
        const values = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) {
                return '';
            }
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Convert CSV to items
 */
function convertFromCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').replace(/""/g, '"'));
    const items = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const item = {};

        headers.forEach((header, index) => {
            let value = values[index] || '';
            value = value.replace(/^"|"$/g, '').replace(/""/g, '"');

            // Try to parse as JSON for object fields
            if (value.startsWith('{') || value.startsWith('[')) {
                try {
                    item[header] = JSON.parse(value);
                } catch {
                    item[header] = value;
                }
            } else {
                item[header] = value;
            }
        });

        items.push(item);
    }

    return items;
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr) {
    if (!priceStr) return null;

    const cleaned = priceStr.replace(/[^\d.,]/g, '');
    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let numStr;
    if (lastComma !== -1 && lastDot !== -1) {
        const lastPunct = Math.max(lastComma, lastDot);
        numStr = cleaned.replace(/[.,]/g, (match, offset) => {
            return offset === lastPunct ? '.' : '';
        });
    } else if (lastComma !== -1) {
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length !== 3) {
            numStr = cleaned.replace(',', '.');
        } else {
            numStr = cleaned.replace(/,/g, '');
        }
    } else if (lastDot !== -1) {
        const parts = cleaned.split('.');
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

function convertToUSD(price, currency) {
    if (!price) return 0;
    const rates = {
        'USD': 1.0,
        'EUR': 1.09,
        'GBP': 1.28,
        'IDR': 0.000064,
        'MYR': 0.21,
        'JPY': 0.0067,
        'INR': 0.012,
        'SGD': 0.75,
        'CAD': 0.74,
        'AUD': 0.65,
        'HKD': 0.13
    };
    const rate = rates[currency && currency.toUpperCase()] || 1.0;
    return price * rate;
}

/**
 * Format price for display
 */
function formatPrice(price, currency = null) {
    if (price === null || price === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(price);
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize the service worker
init();
