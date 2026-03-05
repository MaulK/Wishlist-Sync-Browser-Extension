/**
 * Storage Manager - Wishlist Sync Extension
 * Handles all storage operations using Chrome Storage API
 */

const STORAGE_KEYS = {
    WISHLIST: 'wishlist',
    SETTINGS: 'settings',
    DETECTED_ITEM: 'detectedItem',
    DETECTED_WISHLIST_ITEMS: 'detectedWishlistItems',
    USER_PREFERENCES: 'userPreferences'
};

/**
 * Storage Manager Class
 */
class StorageManager {
    /**
     * Get all items from wishlist
     * @returns {Promise<Array>} Array of wishlist items
     */
    static async getAllItems() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.WISHLIST);
            return result[STORAGE_KEYS.WISHLIST] || [];
        } catch (error) {
            console.error('Error getting all items:', error);
            throw error;
        }
    }

    /**
     * Get single item by ID
     * @param {string} id - Item ID
     * @returns {Promise<Object|null>} Item object or null
     */
    static async getItem(id) {
        try {
            const items = await this.getAllItems();
            return items.find(item => item.id === id) || null;
        } catch (error) {
            console.error('Error getting item:', error);
            throw error;
        }
    }

    /**
     * Get item by URL
     * @param {string} url - Item URL
     * @returns {Promise<Object|null>} Item object or null
     */
    static async getItemByUrl(url) {
        try {
            const items = await this.getAllItems();
            return items.find(item => item.url === url) || null;
        } catch (error) {
            console.error('Error getting item by URL:', error);
            throw error;
        }
    }

    /**
     * Add new item to wishlist
     * @param {Object} item - Item to add
     * @returns {Promise<Object>} Added item
     */
    static async addItem(item) {
        try {
            const items = await this.getAllItems();

            // Check for duplicate URL
            if (items.some(i => i.url === item.url)) {
                throw new Error('Item with this URL already exists');
            }

            // Add new item at the beginning
            items.unshift(item);

            await chrome.storage.local.set({ [STORAGE_KEYS.WISHLIST]: items });

            return item;
        } catch (error) {
            console.error('Error adding item:', error);
            throw error;
        }
    }

    /**
     * Update existing item
     * @param {Object} item - Item with updated data
     * @returns {Promise<Object>} Updated item
     */
    static async updateItem(item) {
        try {
            const items = await this.getAllItems();
            const index = items.findIndex(i => i.id === item.id);

            if (index === -1) {
                throw new Error('Item not found');
            }

            // Update item while preserving original structure
            items[index] = { ...items[index], ...item };

            await chrome.storage.local.set({ [STORAGE_KEYS.WISHLIST]: items });

            return items[index];
        } catch (error) {
            console.error('Error updating item:', error);
            throw error;
        }
    }

    /**
     * Delete item from wishlist
     * @param {string} id - Item ID to delete
     * @returns {Promise<boolean>} True if successful
     */
    static async deleteItem(id) {
        try {
            const items = await this.getAllItems();
            const filteredItems = items.filter(item => item.id !== id);

            await chrome.storage.local.set({ [STORAGE_KEYS.WISHLIST]: filteredItems });

            return true;
        } catch (error) {
            console.error('Error deleting item:', error);
            throw error;
        }
    }

    /**
     * Delete multiple items
     * @param {Array<string>} ids - Array of item IDs to delete
     * @returns {Promise<number>} Number of deleted items
     */
    static async deleteItems(ids) {
        try {
            const items = await this.getAllItems();
            const filteredItems = items.filter(item => !ids.includes(item.id));

            await chrome.storage.local.set({ [STORAGE_KEYS.WISHLIST]: filteredItems });

            return items.length - filteredItems.length;
        } catch (error) {
            console.error('Error deleting items:', error);
            throw error;
        }
    }

    /**
     * Clear all items from wishlist
     * @returns {Promise<boolean>} True if successful
     */
    static async clearAllItems() {
        try {
            await chrome.storage.local.set({ [STORAGE_KEYS.WISHLIST]: [] });
            return true;
        } catch (error) {
            console.error('Error clearing items:', error);
            throw error;
        }
    }

    /**
     * Add price history entry for item
     * @param {string} id - Item ID
     * @param {number} price - Current price
     * @returns {Promise<Object>} Updated item
     */
    static async addPriceHistory(id, price) {
        try {
            const item = await this.getItem(id);
            if (!item) {
                throw new Error('Item not found');
            }

            const priceEntry = {
                date: new Date().toISOString().split('T')[0],
                price: price
            };

            // Initialize price history if it doesn't exist
            if (!item.priceHistory) {
                item.priceHistory = [];
            }

            // Add new price entry
            item.priceHistory.push(priceEntry);

            // Limit price history to last 100 entries
            if (item.priceHistory.length > 100) {
                item.priceHistory = item.priceHistory.slice(-100);
            }

            // Update last checked date
            item.lastChecked = priceEntry.date;

            return await this.updateItem(item);
        } catch (error) {
            console.error('Error adding price history:', error);
            throw error;
        }
    }

    /**
     * Get items by site
     * @param {string} site - Site name
     * @returns {Promise<Array>} Array of items from the site
     */
    static async getItemsBySite(site) {
        try {
            const items = await this.getAllItems();
            return items.filter(item => item.site === site);
        } catch (error) {
            console.error('Error getting items by site:', error);
            throw error;
        }
    }

    /**
     * Get items by category
     * @param {string} category - Category name
     * @returns {Promise<Array>} Array of items in the category
     */
    static async getItemsByCategory(category) {
        try {
            const items = await this.getAllItems();
            return items.filter(item => item.category === category);
        } catch (error) {
            console.error('Error getting items by category:', error);
            throw error;
        }
    }

    /**
     * Get items with price drops
     * @returns {Promise<Array>} Array of items with price drops
     */
    static async getItemsWithPriceDrops() {
        try {
            const items = await this.getAllItems();
            return items.filter(item => {
                if (!item.priceHistory || item.priceHistory.length < 2) return false;

                const latest = item.priceHistory[item.priceHistory.length - 1];
                const previous = item.priceHistory[item.priceHistory.length - 2];

                return latest.price < previous.price;
            });
        } catch (error) {
            console.error('Error getting items with price drops:', error);
            throw error;
        }
    }

    /**
     * Get items that are out of stock
     * @returns {Promise<Array>} Array of out of stock items
     */
    static async getOutOfStockItems() {
        try {
            const items = await this.getAllItems();
            return items.filter(item => {
                if (!item.availability) return false;
                const lower = item.availability.toLowerCase();
                return lower.includes('out of stock') ||
                    lower.includes('unavailable') ||
                    lower.includes('sold out');
            });
        } catch (error) {
            console.error('Error getting out of stock items:', error);
            throw error;
        }
    }

    /**
     * Get statistics
     * @returns {Promise<Object>} Statistics object
     */
    static async getStats() {
        try {
            const items = await this.getAllItems();

            const totalItems = items.length;
            const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
            const totalSavings = items.reduce((sum, item) => {
                if (item.originalPrice && item.originalPrice > item.price) {
                    return sum + (item.originalPrice - item.price);
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

            // Count out of stock items
            const outOfStock = items.filter(item => {
                if (!item.availability) return false;
                const lower = item.availability.toLowerCase();
                return lower.includes('out of stock') ||
                    lower.includes('unavailable');
            }).length;

            return {
                totalItems,
                totalValue,
                totalSavings,
                itemsBySite,
                itemsByCategory,
                priceDrops,
                outOfStock
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    /**
     * Get settings
     * @returns {Promise<Object>} Settings object
     */
    static async getSettings() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
            return result[STORAGE_KEYS.SETTINGS] || this.getDefaultSettings();
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * Update settings
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated settings
     */
    static async updateSettings(settings) {
        try {
            const currentSettings = await this.getSettings();
            const newSettings = { ...currentSettings, ...settings };

            await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: newSettings });

            return newSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    static getDefaultSettings() {
        return {
            notifications: true,
            priceDropThreshold: 5,
            checkInterval: 6,
            defaultCategory: 'Uncategorized',
            autoDetectItems: true,
            showPriceHistory: true,
            currency: 'USD'
        };
    }

    /**
     * Get detected item (from current page)
     * @returns {Promise<Object|null>} Detected item or null
     */
    static async getDetectedItem() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.DETECTED_ITEM);
            return result[STORAGE_KEYS.DETECTED_ITEM] || null;
        } catch (error) {
            console.error('Error getting detected item:', error);
            return null;
        }
    }

    /**
     * Set detected item
     * @param {Object} item - Detected item
     * @returns {Promise<boolean>} True if successful
     */
    static async setDetectedItem(item) {
        try {
            await chrome.storage.local.set({ [STORAGE_KEYS.DETECTED_ITEM]: item });
            return true;
        } catch (error) {
            console.error('Error setting detected item:', error);
            throw error;
        }
    }

    /**
     * Clear detected item
     * @returns {Promise<boolean>} True if successful
     */
    static async clearDetectedItem() {
        try {
            await chrome.storage.local.remove(STORAGE_KEYS.DETECTED_ITEM);
            return true;
        } catch (error) {
            console.error('Error clearing detected item:', error);
            throw error;
        }
    }

    /**
     * Get detected wishlist items (from listing pages)
     * @returns {Promise<Array>} Array of detected items
     */
    static async getDetectedWishlistItems() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.DETECTED_WISHLIST_ITEMS);
            return result[STORAGE_KEYS.DETECTED_WISHLIST_ITEMS] || [];
        } catch (error) {
            console.error('Error getting detected wishlist items:', error);
            return [];
        }
    }

    /**
     * Set detected wishlist items
     * @param {Array} items - Detected items
     * @returns {Promise<boolean>} True if successful
     */
    static async setDetectedWishlistItems(items) {
        try {
            await chrome.storage.local.set({ [STORAGE_KEYS.DETECTED_WISHLIST_ITEMS]: items });
            return true;
        } catch (error) {
            console.error('Error setting detected wishlist items:', error);
            throw error;
        }
    }

    /**
     * Clear detected wishlist items
     * @returns {Promise<boolean>} True if successful
     */
    static async clearDetectedWishlistItems() {
        try {
            await chrome.storage.local.remove(STORAGE_KEYS.DETECTED_WISHLIST_ITEMS);
            return true;
        } catch (error) {
            console.error('Error clearing detected wishlist items:', error);
            throw error;
        }
    }

    /**
     * Export wishlist data
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {Promise<string>} Exported data
     */
    static async exportWishlist(format = 'json') {
        try {
            const items = await this.getAllItems();

            if (format === 'json') {
                return JSON.stringify(items, null, 2);
            } else if (format === 'csv') {
                return this.convertToCSV(items);
            }

            throw new Error('Unsupported format');
        } catch (error) {
            console.error('Error exporting wishlist:', error);
            throw error;
        }
    }

    /**
     * Import wishlist data
     * @param {string} data - Data to import
     * @param {string} format - Import format ('json' or 'csv')
     * @returns {Promise<Object>} Import result
     */
    static async importWishlist(data, format = 'json') {
        try {
            let items;

            if (format === 'json') {
                items = JSON.parse(data);
            } else if (format === 'csv') {
                items = this.convertFromCSV(data);
            } else {
                throw new Error('Unsupported format');
            }

            if (!Array.isArray(items)) {
                throw new Error('Invalid data format');
            }

            const existingItems = await this.getAllItems();
            const existingUrls = new Set(existingItems.map(i => i.url));

            let imported = 0;
            let duplicates = 0;
            let errors = 0;

            for (const item of items) {
                try {
                    // Skip duplicates
                    if (existingUrls.has(item.url)) {
                        duplicates++;
                        continue;
                    }

                    // Ensure item has required fields
                    const newItem = {
                        id: item.id || generateId(),
                        title: item.title || 'Untitled Item',
                        url: item.url,
                        image: item.image || '',
                        price: item.price || 0,
                        originalPrice: item.originalPrice || null,
                        discount: item.discount || 0,
                        site: item.site || 'Unknown',
                        category: item.category || 'Uncategorized',
                        tags: item.tags || [],
                        addedDate: item.addedDate || new Date().toISOString().split('T')[0],
                        lastChecked: item.lastChecked || new Date().toISOString().split('T')[0],
                        priceHistory: item.priceHistory || [],
                        availability: item.availability || 'Unknown',
                        notes: item.notes || ''
                    };

                    await this.addItem(newItem);
                    imported++;
                    existingUrls.add(newItem.url);
                } catch (error) {
                    console.error('Error importing item:', error);
                    errors++;
                }
            }

            return {
                success: true,
                imported,
                duplicates,
                errors
            };
        } catch (error) {
            console.error('Error importing wishlist:', error);
            throw error;
        }
    }

    /**
     * Convert items to CSV
     * @param {Array} items - Items to convert
     * @returns {string} CSV string
     */
    static convertToCSV(items) {
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
     * @param {string} csv - CSV string
     * @returns {Array} Array of items
     */
    static convertFromCSV(csv) {
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
     * Get storage usage
     * @returns {Promise<Object>} Storage usage info
     */
    static async getStorageUsage() {
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            const quota = chrome.storage.local.QUOTA_BYTES;

            return {
                used: usage,
                quota: quota,
                percentage: (usage / quota) * 100,
                available: quota - usage
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return {
                used: 0,
                quota: chrome.storage.local.QUOTA_BYTES,
                percentage: 0,
                available: chrome.storage.local.QUOTA_BYTES
            };
        }
    }

    /**
     * Clear all storage data
     * @returns {Promise<boolean>} True if successful
     */
    static async clearAll() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }
}

// Helper function for generating IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
