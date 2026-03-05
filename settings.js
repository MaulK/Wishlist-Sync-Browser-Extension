/**
 * Settings Controller - Wishlist Sync Extension
 * Handles the settings page
 */

// DOM Elements
const backBtn = document.getElementById('backBtn');
const notificationsToggle = document.getElementById('notificationsToggle');
const priceDropThreshold = document.getElementById('priceDropThreshold');
const checkInterval = document.getElementById('checkInterval');
const autoCheckToggle = document.getElementById('autoCheckToggle');
const currencySelect = document.getElementById('currencySelect');
const showPriceHistoryToggle = document.getElementById('showPriceHistoryToggle');
const defaultCategory = document.getElementById('defaultCategory');
const autoDetectToggle = document.getElementById('autoDetectToggle');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const importFileInput = document.getElementById('importFileInput');
const importBtn = document.getElementById('importBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const extensionVersion = document.getElementById('extensionVersion');
const storageUsed = document.getElementById('storageUsed');
const totalItems = document.getElementById('totalItems');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const loadingOverlay = document.getElementById('loadingOverlay');
const confirmClearModal = document.getElementById('confirmClearModal');

// State
let currentSettings = null;

/**
 * Initialize settings page
 */
async function init() {
    try {
        // Load settings
        await loadSettings();

        // Load about info
        await loadAboutInfo();

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing settings:', error);
        showToast('Error loading settings', 'error');
    }
}

/**
 * Load settings
 */
async function loadSettings() {
    try {
        const settings = await StorageManager.getSettings();
        currentSettings = settings;

        // Populate settings fields
        notificationsToggle.checked = settings.notifications !== false;
        priceDropThreshold.value = settings.priceDropThreshold || 5;
        checkInterval.value = settings.checkInterval || 6;
        autoCheckToggle.checked = settings.autoCheck !== false;
        currencySelect.value = settings.currency || 'USD';
        showPriceHistoryToggle.checked = settings.showPriceHistory !== false;
        defaultCategory.value = settings.defaultCategory || 'Uncategorized';
        autoDetectToggle.checked = settings.autoDetect !== false;

    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Load about info
 */
async function loadAboutInfo() {
    try {
        // Get extension version
        extensionVersion.textContent = getExtensionVersion();

        // Get storage usage
        const usage = await StorageManager.getStorageUsage();
        storageUsed.textContent = formatBytes(usage.used);

        // Get total items
        const stats = await StorageManager.getStats();
        totalItems.textContent = stats.totalItems;

    } catch (error) {
        console.error('Error loading about info:', error);
    }
}

/**
 * Save settings
 */
async function saveSettings() {
    try {
        showLoading();

        const newSettings = {
            notifications: notificationsToggle.checked,
            priceDropThreshold: parseInt(priceDropThreshold.value) || 5,
            checkInterval: parseInt(checkInterval.value) || 6,
            autoCheck: autoCheckToggle.checked,
            currency: currencySelect.value,
            showPriceHistory: showPriceHistoryToggle.checked,
            defaultCategory: defaultCategory.value,
            autoDetect: autoDetectToggle.checked
        };

        await StorageManager.updateSettings(newSettings);
        currentSettings = newSettings;

        showToast('Settings saved successfully', 'success');

    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Export data
 */
async function exportData(format) {
    try {
        showLoading();

        const response = await chrome.runtime.sendMessage({
            type: 'EXPORT_WISHLIST',
            data: { format }
        });

        if (response.success) {
            showToast(`Exported as ${format.toUpperCase()}`, 'success');
        } else {
            showToast('Failed to export data', 'error');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error exporting data', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Import data
 */
async function importData(file) {
    try {
        showLoading();

        const format = file.name.endsWith('.csv') ? 'csv' : 'json';
        const content = await readFileAsText(file);

        const response = await chrome.runtime.sendMessage({
            type: 'IMPORT_WISHLIST',
            data: { format, content }
        });

        if (response.success) {
            showToast(`Imported ${response.imported} items`, 'success');
            await loadAboutInfo();
        } else {
            showToast('Failed to import data', 'error');
        }
    } catch (error) {
        console.error('Error importing data:', error);
        showToast('Error importing data', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Clear all data
 */
async function clearAllData() {
    try {
        showLoading();

        await StorageManager.clearAll();

        showToast('All data cleared successfully', 'success');
        closeModal(confirmClearModal);

        // Reload about info
        await loadAboutInfo();

    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('Error clearing data', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Show modal
 */
function showModal(modal) {
    modal.classList.remove('hidden');
}

/**
 * Close modal
 */
function closeModal(modal) {
    modal.classList.add('hidden');
}

/**
 * Show loading overlay
 */
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    loadingOverlay.classList.add('hidden');
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
    // Navigation
    backBtn.addEventListener('click', () => {
        chrome.tabs.update({ url: chrome.runtime.getURL('dashboard.html') });
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Export buttons
    exportJsonBtn.addEventListener('click', () => exportData('json'));
    exportCsvBtn.addEventListener('click', () => exportData('csv'));

    // Import button
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importData(file);
    });

    // Clear data button
    clearDataBtn.addEventListener('click', () => showModal(confirmClearModal));

    // Confirm clear modal
    document.querySelector('#confirmClearModal .modal-close').addEventListener('click', () => {
        closeModal(confirmClearModal);
    });

    document.querySelector('#confirmClearModal .cancel-btn').addEventListener('click', () => {
        closeModal(confirmClearModal);
    });

    document.getElementById('confirmClearBtn').addEventListener('click', clearAllData);

    // Toast close
    toastClose.addEventListener('click', () => toast.classList.add('hidden'));

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
