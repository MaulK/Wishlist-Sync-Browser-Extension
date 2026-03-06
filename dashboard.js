/**
 * Dashboard Controller - Wishlist Sync Extension
 * Handles the main dashboard UI and item management
 */

// DOM Elements
const itemsContainer = document.getElementById('itemsContainer');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const siteFilter = document.getElementById('siteFilter');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');
const addNewItemBtn = document.getElementById('addNewItemBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const settingsBtn = document.getElementById('settingsBtn');
const startBrowsingBtn = document.getElementById('startBrowsingBtn');
const addItemModal = document.getElementById('addItemModal');
const exportModal = document.getElementById('exportModal');
const importModal = document.getElementById('importModal');
const addItemForm = document.getElementById('addItemForm');
const importDropzone = document.getElementById('importDropzone');
const importFileInput = document.getElementById('importFileInput');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const loadingOverlay = document.getElementById('loadingOverlay');

// State
let allItems = [];
let filteredItems = [];
let currentPage = 1;
const itemsPerPage = 12;
let currentView = 'grid'; // 'grid' or 'list'

/**
 * Initialize dashboard
 */
async function init() {
    try {
        const settings = await StorageManager.getSettings();
        window.USER_CURRENCY = settings.currency;

        // Load items from storage
        await loadItems();

        // Load stats
        await loadStats();

        // Setup event listeners
        setupEventListeners();

        // Render items
        renderItems();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showToast('Error loading dashboard', 'error');
    }
}

/**
 * Load items from storage
 */
async function loadItems() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_ITEMS' });
        if (response.success) {
            allItems = response.items;
            applyFilters();
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

/**
 * Load statistics
 */
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
        if (response.success) {
            const stats = response.stats;
            document.getElementById('totalItems').textContent = stats.totalItems;
            document.getElementById('totalValue').textContent = formatPrice(stats.totalValue, 'USD');
            document.getElementById('totalSavings').textContent = formatPrice(stats.totalSavings, 'USD');
            document.getElementById('priceDrops').textContent = stats.priceDrops;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Apply filters and sorting
 */
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const site = siteFilter.value;
    const category = categoryFilter.value;
    const sort = sortFilter.value;

    // Filter items
    filteredItems = allItems.filter(item => {
        // Search filter
        if (searchTerm) {
            const matchesSearch =
                item.title.toLowerCase().includes(searchTerm) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm));
            if (!matchesSearch) return false;
        }

        // Site filter
        if (site && item.site !== site) return false;

        // Category filter
        if (category && item.category !== category) return false;

        return true;
    });

    // Sort items
    switch (sort) {
        case 'date-desc':
            filteredItems.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
            break;
        case 'date-asc':
            filteredItems.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate));
            break;
        case 'price-asc':
            filteredItems.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            filteredItems.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'name-asc':
            filteredItems.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredItems.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }

    // Reset to first page
    currentPage = 1;

    // Render items
    renderItems();
}

/**
 * Render items
 */
function renderItems() {
    // Show/hide empty state
    if (filteredItems.length === 0) {
        itemsContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        pagination.classList.add('hidden');
        return;
    }

    itemsContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Calculate pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, endIndex);

    // Update view class
    itemsContainer.className = `items-container items-${currentView}`;

    // Render items
    itemsContainer.innerHTML = pageItems.map(item => renderItem(item)).join('');

    // Update pagination
    updatePagination(totalPages);

    // Add event listeners to item cards
    attachItemEventListeners();
}

/**
 * Render single item
 */
function renderItem(item) {
    const hasDiscount = item.discount && item.discount > 0;
    const priceDrop = hasPriceDrop(item);

    return `
    <div class="item-card ${priceDrop ? 'price-drop' : ''}" data-id="${item.id}">
      <div class="item-image-container">
        ${item.image ?
            `<img src="${item.image}" alt="${item.title}" class="item-image">` :
            '<div class="item-image placeholder"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>'
        }
        ${priceDrop ? '<span class="price-drop-badge">Price Drop!</span>' : ''}
        ${hasDiscount ? `<span class="discount-badge">-${item.discount}%</span>` : ''}
      </div>
      <div class="item-content">
        <h3 class="item-title" title="${item.title}">${item.title}</h3>
        <div class="item-meta">
          <span class="item-site">${item.site}</span>
          <span class="item-date">${formatDate(item.addedDate)}</span>
        </div>
        <div class="item-price-section">
          <span class="item-price">${formatPrice(item.price, item.currency)}</span>
          ${item.originalPrice && item.originalPrice > item.price ?
            `<span class="item-original-price">${formatPrice(item.originalPrice, item.currency)}</span>` : ''
        }
        </div>
        ${item.tags && item.tags.length > 0 ? `
          <div class="item-tags">
            ${item.tags.slice(0, 3).map(tag => `<span class="item-tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="item-actions">
        <button class="item-action-btn" data-action="view" title="View Details">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="item-action-btn" data-action="edit" title="Edit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="item-action-btn" data-action="delete" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Check if item has price drop
 */
function hasPriceDrop(item) {
    if (!item.priceHistory || item.priceHistory.length < 2) return false;
    const latestPrice = item.priceHistory[item.priceHistory.length - 1].price;
    const previousPrice = item.priceHistory[item.priceHistory.length - 2].price;
    return latestPrice < previousPrice;
}

/**
 * Update pagination
 */
function updatePagination(totalPages) {
    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    pagination.classList.remove('hidden');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Attach event listeners to item cards
 */
function attachItemEventListeners() {
    itemsContainer.querySelectorAll('.item-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemCard = e.target.closest('.item-card');
            const itemId = itemCard.dataset.id;
            const action = btn.dataset.action;

            handleItemAction(action, itemId);
        });
    });
}

/**
 * Handle item action
 */
function handleItemAction(action, itemId) {
    switch (action) {
        case 'view':
            openItemDetails(itemId);
            break;
        case 'edit':
            editItem(itemId);
            break;
        case 'delete':
            deleteItem(itemId);
            break;
    }
}

/**
 * Open item details
 */
function openItemDetails(itemId) {
    chrome.tabs.create({
        url: chrome.runtime.getURL(`item-details.html?id=${itemId}`)
    });
}

/**
 * Edit item
 */
async function editItem(itemId) {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ITEM', data: { id: itemId } });
        if (response.success) {
            const item = response.item;

            // Pre-fill the add form with item data
            document.getElementById('itemUrl').value = item.url;
            document.getElementById('itemTitle').value = item.title;
            document.getElementById('itemPrice').value = item.price || '';
            document.getElementById('itemOriginalPrice').value = item.originalPrice || '';
            document.getElementById('itemImage').value = item.image || '';
            document.getElementById('itemSite').value = item.site || '';
            document.getElementById('itemCategory').value = item.category || 'Uncategorized';
            document.getElementById('itemTags').value = (item.tags || []).join(', ');
            document.getElementById('itemNotes').value = item.notes || '';

            // Store the item ID for update
            addItemForm.dataset.editId = itemId;

            // Change form title
            addItemModal.querySelector('h2').textContent = 'Edit Item';

            // Show modal
            addItemModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error editing item:', error);
        showToast('Error loading item', 'error');
    }
}

/**
 * Delete item
 */
async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        showLoading();
        const response = await chrome.runtime.sendMessage({ type: 'DELETE_ITEM', data: { id: itemId } });

        if (response.success) {
            showToast('Item deleted successfully', 'success');
            await loadItems();
            await loadStats();
            renderItems();
        } else {
            showToast('Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Add new item
 */
async function addNewItem(itemData) {
    try {
        showLoading();

        // Generate ID
        const newItem = {
            ...itemData,
            id: generateId(),
            addedDate: new Date().toISOString().split('T')[0],
            lastChecked: new Date().toISOString().split('T')[0],
            priceHistory: itemData.price ? [{
                date: new Date().toISOString().split('T')[0],
                price: itemData.price
            }] : [],
            availability: 'Unknown'
        };

        const response = await chrome.runtime.sendMessage({ type: 'ADD_TO_WISHLIST', data: newItem });

        if (response.success) {
            showToast('Item added successfully', 'success');
            closeModal(addItemModal);
            resetAddForm();
            await loadItems();
            await loadStats();
            renderItems();
        } else {
            showToast(response.error || 'Failed to add item', 'error');
        }
    } catch (error) {
        console.error('Error adding item:', error);
        showToast('Error adding item', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Update existing item
 */
async function updateItem(itemId, itemData) {
    try {
        showLoading();

        const response = await chrome.runtime.sendMessage({ type: 'UPDATE_ITEM', data: { ...itemData, id: itemId } });

        if (response.success) {
            showToast('Item updated successfully', 'success');
            closeModal(addItemModal);
            resetAddForm();
            await loadItems();
            await loadStats();
            renderItems();
        } else {
            showToast('Failed to update item', 'error');
        }
    } catch (error) {
        console.error('Error updating item:', error);
        showToast('Error updating item', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const itemData = {
        url: document.getElementById('itemUrl').value,
        title: document.getElementById('itemTitle').value,
        price: parseFloat(document.getElementById('itemPrice').value) || 0,
        originalPrice: parseFloat(document.getElementById('itemOriginalPrice').value) || null,
        image: document.getElementById('itemImage').value,
        site: document.getElementById('itemSite').value,
        category: document.getElementById('itemCategory').value,
        tags: document.getElementById('itemTags').value.split(',').map(t => t.trim()).filter(t => t),
        notes: document.getElementById('itemNotes').value
    };

    // Calculate discount
    if (itemData.originalPrice && itemData.originalPrice > itemData.price) {
        itemData.discount = Math.round(((itemData.originalPrice - itemData.price) / itemData.originalPrice) * 100);
    } else {
        itemData.discount = 0;
    }

    const editId = addItemForm.dataset.editId;

    if (editId) {
        await updateItem(editId, itemData);
    } else {
        await addNewItem(itemData);
    }
}

/**
 * Reset add form
 */
function resetAddForm() {
    addItemForm.reset();
    delete addItemForm.dataset.editId;
    addItemModal.querySelector('h2').textContent = 'Add New Item';
}

/**
 * Export wishlist
 */
async function exportWishlist(format) {
    try {
        showLoading();
        const response = await chrome.runtime.sendMessage({ type: 'EXPORT_WISHLIST', data: { format } });

        if (response.success) {
            showToast(`Exported as ${format.toUpperCase()}`, 'success');
            closeModal(exportModal);
        } else {
            showToast('Failed to export wishlist', 'error');
        }
    } catch (error) {
        console.error('Error exporting wishlist:', error);
        showToast('Error exporting wishlist', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Import wishlist
 */
async function importWishlist(file) {
    try {
        showLoading();

        const format = file.name.endsWith('.csv') ? 'csv' : 'json';
        const content = await readFile(file);

        const response = await chrome.runtime.sendMessage({
            type: 'IMPORT_WISHLIST',
            data: { format, content }
        });

        if (response.success) {
            showToast(`Imported ${response.imported} items`, 'success');
            closeModal(importModal);
            await loadItems();
            await loadStats();
            renderItems();
        } else {
            showToast('Failed to import wishlist', 'error');
        }
    } catch (error) {
        console.error('Error importing wishlist:', error);
        showToast('Error importing wishlist', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Read file content
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
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
 * Browse supported sites
 */
function browseSupportedSites() {
    const sites = [
        'https://www.amazon.com',
        'https://www.ebay.com',
        'https://www.walmart.com',
        'https://www.target.com',
        'https://www.bestbuy.com',
        'https://www.etsy.com'
    ];

    chrome.tabs.create({
        url: sites[Math.floor(Math.random() * sites.length)]
    });
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
 * Show loading
 */
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

/**
 * Hide loading
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
    // Search and filters
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    siteFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);

    // View toggle
    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderItems();
    });

    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderItems();
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderItems();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderItems();
        }
    });

    // Header buttons
    addNewItemBtn.addEventListener('click', () => showModal(addItemModal));
    exportBtn.addEventListener('click', () => showModal(exportModal));
    importBtn.addEventListener('click', () => showModal(importModal));
    settingsBtn.addEventListener('click', openSettings);

    // Empty state button
    startBrowsingBtn.addEventListener('click', browseSupportedSites);

    // Modal close buttons
    document.getElementById('closeAddModalBtn').addEventListener('click', () => {
        closeModal(addItemModal);
        resetAddForm();
    });
    document.getElementById('cancelAddBtn').addEventListener('click', () => {
        closeModal(addItemModal);
        resetAddForm();
    });
    document.getElementById('closeExportModalBtn').addEventListener('click', () => closeModal(exportModal));
    document.getElementById('closeImportModalBtn').addEventListener('click', () => closeModal(importModal));

    // Add item form
    addItemForm.addEventListener('submit', handleFormSubmit);

    // Export buttons
    document.getElementById('exportJsonBtn').addEventListener('click', () => exportWishlist('json'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportWishlist('csv'));

    // Import dropzone
    importDropzone.addEventListener('click', () => importFileInput.click());
    importDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        importDropzone.classList.add('dragover');
    });
    importDropzone.addEventListener('dragleave', () => {
        importDropzone.classList.remove('dragover');
    });
    importDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        importDropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) importWishlist(file);
    });
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importWishlist(file);
    });

    // Toast close
    toastClose.addEventListener('click', () => toast.classList.add('hidden'));

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
                if (modal === addItemModal) resetAddForm();
            }
        });
    });
}

/**
 * Debounce function
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

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', init);
