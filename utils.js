/**
 * Utility Functions - Wishlist Sync Extension
 * Common utility functions used across the extension
 */

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Convert foreign currency price to USD (estimated rates for dashboard aggregations)
 * @param {number} price - Price value
 * @param {string} currency - Currency code
 * @returns {number} Value in USD
 */
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
 * @param {number} price - Price value
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted price string
 */
function formatPrice(price, currency = null) {
    if (price === null || price === undefined || isNaN(price)) {
        return '$0.00';
    }

    const curr = currency || window.USER_CURRENCY || 'USD';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(d);
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
function formatDateTime(date) {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Parse price string to number
 * @param {string} priceStr - Price string to parse
 * @returns {number|null} Parsed price or null
 */
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
            // Thousands separator (e.g., "1,000", "1,000,000")
            numStr = cleaned.replace(/,/g, '');
        }
    } else if (lastDot !== -1) {
        // Only dot
        const parts = cleaned.split('.');
        // Check if thousands separator (e.g., "1.000", "1.000.000")
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
            numStr = cleaned; // Native parseFloat handles dot as decimal
        }
    } else {
        numStr = cleaned;
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
}

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} currentPrice - Current price
 * @returns {number} Discount percentage
 */
function calculateDiscount(originalPrice, currentPrice) {
    if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
        return 0;
    }

    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
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
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }

    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }

    return clonedObj;
}

/**
 * Check if two objects are equal
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} True if objects are equal
 */
function objectsEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Get URL parameter value
 * @param {string} name - Parameter name
 * @param {string} url - URL string (default: current URL)
 * @returns {string|null} Parameter value or null
 */
function getUrlParameter(name, url = window.location.href) {
    const param = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + param + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);

    if (!results) return null;
    if (!results[2]) return '';

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Set URL parameter
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 * @param {string} url - URL string (default: current URL)
 * @returns {string} New URL with parameter
 */
function setUrlParameter(name, value, url = window.location.href) {
    const regex = new RegExp('([?&])' + name + '=.*?(&|$|#)');
    const separator = url.includes('?') ? '&' : '?';

    if (url.match(regex)) {
        return url.replace(regex, '$1' + name + '=' + encodeURIComponent(value) + '$2');
    }

    return url + separator + name + '=' + encodeURIComponent(value);
}

/**
 * Remove URL parameter
 * @param {string} name - Parameter name
 * @param {string} url - URL string (default: current URL)
 * @returns {string} New URL without parameter
 */
function removeUrlParameter(name, url = window.location.href) {
    const regex = new RegExp('([?&])' + name + '=.*?(&|$|#)');
    const newUrl = url.replace(regex, '$1');

    // Remove trailing ? or &
    return newUrl.replace(/[?&]$/, '');
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get domain from URL
 * @param {string} url - URL string
 * @returns {string|null} Domain or null
 */
function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return null;
    }
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Convert bytes to human readable format
 * @param {number} bytes - Bytes to convert
 * @returns {string} Human readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Convert milliseconds to human readable time
 * @param {number} ms - Milliseconds to convert
 * @returns {string} Human readable time
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after timeout
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(delay * Math.pow(2, i));
            }
        }
    }

    throw lastError;
}

/**
 * Check if running in extension context
 * @returns {boolean} True if in extension context
 */
function isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

/**
 * Get extension version
 * @returns {string|null} Extension version or null
 */
function getExtensionVersion() {
    if (!isExtensionContext()) return null;

    return chrome.runtime.getManifest().version;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        return true;
    } catch {
        return false;
    }
}

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} File extension
 */
function getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if item is in stock
 * @param {string} availability - Availability string
 * @returns {boolean} True if in stock
 */
function isInStock(availability) {
    if (!availability) return false;
    const lower = availability.toLowerCase();
    return !lower.includes('out of stock') &&
        !lower.includes('unavailable') &&
        !lower.includes('sold out');
}

/**
 * Check if price has dropped
 * @param {Object} item - Wishlist item
 * @returns {boolean} True if price has dropped
 */
function hasPriceDropped(item) {
    if (!item.priceHistory || item.priceHistory.length < 2) return false;

    const latest = item.priceHistory[item.priceHistory.length - 1];
    const previous = item.priceHistory[item.priceHistory.length - 2];

    return latest.price < previous.price;
}

/**
 * Get price drop percentage
 * @param {Object} item - Wishlist item
 * @returns {number} Price drop percentage
 */
function getPriceDropPercentage(item) {
    if (!item.priceHistory || item.priceHistory.length < 2) return 0;

    const latest = item.priceHistory[item.priceHistory.length - 1];
    const previous = item.priceHistory[item.priceHistory.length - 2];

    if (previous.price <= latest.price) return 0;

    return Math.round(((previous.price - latest.price) / previous.price) * 100);
}

/**
 * Group items by property
 * @param {Array} items - Items to group
 * @param {string} property - Property to group by
 * @returns {Object} Grouped items
 */
function groupBy(items, property) {
    return items.reduce((groups, item) => {
        const key = item[property] || 'Other';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Sort items by property
 * @param {Array} items - Items to sort
 * @param {string} property - Property to sort by
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted items
 */
function sortBy(items, property, order = 'asc') {
    return [...items].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
    });
}

/**
 * Filter items by property
 * @param {Array} items - Items to filter
 * @param {string} property - Property to filter by
 * @param {*} value - Value to match
 * @returns {Array} Filtered items
 */
function filterBy(items, property, value) {
    return items.filter(item => item[property] === value);
}

/**
 * Search items by text
 * @param {Array} items - Items to search
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} Matching items
 */
function searchItems(items, query, fields = ['title', 'tags', 'notes']) {
    const lowerQuery = query.toLowerCase();

    return items.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (!value) return false;

            if (Array.isArray(value)) {
                return value.some(v => v.toLowerCase().includes(lowerQuery));
            }

            return value.toString().toLowerCase().includes(lowerQuery);
        });
    });
}

/**
 * Export functions for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateId,
        convertToUSD,
        formatPrice,
        formatDate,
        formatDateTime,
        truncateText,
        parsePrice,
        calculateDiscount,
        debounce,
        throttle,
        deepClone,
        objectsEqual,
        getUrlParameter,
        setUrlParameter,
        removeUrlParameter,
        validateEmail,
        validateUrl,
        getDomainFromUrl,
        sanitizeHtml,
        escapeHtml,
        formatBytes,
        formatTime,
        sleep,
        retry,
        isExtensionContext,
        getExtensionVersion,
        copyToClipboard,
        downloadFile,
        readFileAsText,
        getFileExtension,
        isInStock,
        hasPriceDropped,
        getPriceDropPercentage,
        groupBy,
        sortBy,
        filterBy,
        searchItems
    };
}
