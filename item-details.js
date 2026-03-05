/**
 * Item Details Controller - Wishlist Sync Extension
 * Handles the item details page
 */

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const itemDetails = document.getElementById('itemDetails');
const backBtn = document.getElementById('backBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');
const refreshBtn = document.getElementById('refreshBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const checkPriceBtn = document.getElementById('checkPriceBtn');
const itemImage = document.getElementById('itemImage');
const itemLink = document.getElementById('itemLink');
const itemSiteBadge = document.getElementById('itemSiteBadge');
const itemTitle = document.getElementById('itemTitle');
const itemUrl = document.getElementById('itemUrl');
const itemPrice = document.getElementById('itemPrice');
const itemOriginalPrice = document.getElementById('itemOriginalPrice');
const itemDiscount = document.getElementById('itemDiscount');
const itemAddedDate = document.getElementById('itemAddedDate');
const itemLastChecked = document.getElementById('itemLastChecked');
const itemAvailability = document.getElementById('itemAvailability');
const priceChart = document.getElementById('priceChart');
const priceHistoryEmpty = document.getElementById('priceHistoryEmpty');
const itemNotes = document.getElementById('itemNotes');
const itemTags = document.getElementById('itemTags');
const itemCategory = document.getElementById('itemCategory');
const editNotesBtn = document.getElementById('editNotesBtn');
const editTagsBtn = document.getElementById('editTagsBtn');
const changeCategoryBtn = document.getElementById('changeCategoryBtn');
const editNotesModal = document.getElementById('editNotesModal');
const editTagsModal = document.getElementById('editTagsModal');
const changeCategoryModal = document.getElementById('changeCategoryModal');
const notesInput = document.getElementById('notesInput');
const tagsInput = document.getElementById('tagsInput');
const categorySelect = document.getElementById('categorySelect');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const loadingOverlay = document.getElementById('loadingOverlay');

// State
let currentItem = null;
let itemId = null;
let priceChartInstance = null;

/**
 * Initialize item details page
 */
async function init() {
    try {
        // Get item ID from URL
        itemId = getUrlParameter('id');

        if (!itemId) {
            showError('No item ID provided');
            return;
        }

        // Load item details
        await loadItemDetails();

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing item details:', error);
        showError('Error loading item details');
    }
}

/**
 * Load item details
 */
async function loadItemDetails() {
    try {
        showLoading();

        // Get item from storage
        const response = await chrome.runtime.sendMessage({ type: 'GET_ITEM', data: { id: itemId } });

        if (!response.success || !response.item) {
            showError('Item not found');
            return;
        }

        currentItem = response.item;

        // Render item details
        renderItemDetails();

        // Render price history chart
        renderPriceHistory();

        hideLoading();

    } catch (error) {
        console.error('Error loading item details:', error);
        showError('Error loading item details');
    }
}

/**
 * Render item details
 */
function renderItemDetails() {
    if (!currentItem) return;

    // Set image
    if (currentItem.image) {
        itemImage.src = currentItem.image;
        itemImage.classList.remove('hidden');
    } else {
        itemImage.classList.add('hidden');
    }

    // Set link
    itemLink.href = currentItem.url;

    // Set site badge
    itemSiteBadge.textContent = currentItem.site || 'Unknown';

    // Set title
    itemTitle.textContent = currentItem.title || 'Untitled Item';

    // Set URL
    itemUrl.textContent = currentItem.url;

    // Set price
    itemPrice.textContent = formatPrice(currentItem.price);

    // Set original price
    if (currentItem.originalPrice && currentItem.originalPrice > currentItem.price) {
        itemOriginalPrice.textContent = formatPrice(currentItem.originalPrice);
        itemOriginalPrice.classList.remove('hidden');
    } else {
        itemOriginalPrice.classList.add('hidden');
    }

    // Set discount
    if (currentItem.discount && currentItem.discount > 0) {
        itemDiscount.textContent = `-${currentItem.discount}%`;
        itemDiscount.classList.remove('hidden');
    } else {
        itemDiscount.classList.add('hidden');
    }

    // Set dates
    itemAddedDate.textContent = formatDate(currentItem.addedDate);
    itemLastChecked.textContent = formatDate(currentItem.lastChecked);

    // Set availability
    itemAvailability.textContent = currentItem.availability || 'Unknown';
    if (isInStock(currentItem.availability)) {
        itemAvailability.classList.add('in-stock');
        itemAvailability.classList.remove('out-of-stock');
    } else {
        itemAvailability.classList.add('out-of-stock');
        itemAvailability.classList.remove('in-stock');
    }

    // Set notes
    if (currentItem.notes) {
        itemNotes.textContent = currentItem.notes;
        itemNotes.classList.remove('empty');
    } else {
        itemNotes.textContent = 'No notes added';
        itemNotes.classList.add('empty');
    }

    // Set tags
    if (currentItem.tags && currentItem.tags.length > 0) {
        itemTags.innerHTML = currentItem.tags.map(tag =>
            `<span class="tag">${escapeHtml(tag)}</span>`
        ).join('');
        itemTags.classList.remove('empty');
    } else {
        itemTags.textContent = 'No tags added';
        itemTags.classList.add('empty');
    }

    // Set category
    itemCategory.textContent = currentItem.category || 'Uncategorized';
}

/**
 * Render price history chart
 */
function renderPriceHistory() {
    if (!currentItem || !currentItem.priceHistory || currentItem.priceHistory.length < 2) {
        priceChart.classList.add('hidden');
        priceHistoryEmpty.classList.remove('hidden');
        return;
    }

    priceChart.classList.remove('hidden');
    priceHistoryEmpty.classList.add('hidden');

    const canvas = document.getElementById('priceChartCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 300;

    const data = currentItem.priceHistory;
    const prices = data.map(d => d.price);
    const dates = data.map(d => d.date);

    // Calculate scales
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#667eea';

    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw price label
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatPrice(point.price), x, y - 12);
        ctx.fillStyle = '#667eea';
    });

    // Draw date labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const date = new Date(point.date);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, canvas.height - 15);
    });
}

/**
 * Check current price
 */
async function checkCurrentPrice() {
    try {
        showLoading();

        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_PRICE',
            data: { itemId }
        });

        if (response.success && response.item) {
            currentItem = response.item;
            renderItemDetails();
            renderPriceHistory();
            showToast('Price updated successfully', 'success');
        } else {
            showToast('Failed to update price', 'error');
        }
    } catch (error) {
        console.error('Error checking price:', error);
        showToast('Error checking price', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Edit item
 */
function editItem() {
    // Redirect to dashboard with edit mode
    chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html')
    });
}

/**
 * Delete item
 */
async function deleteItem() {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        showLoading();

        const response = await chrome.runtime.sendMessage({
            type: 'DELETE_ITEM',
            data: { id: itemId }
        });

        if (response.success) {
            showToast('Item deleted successfully', 'success');
            // Redirect to dashboard
            setTimeout(() => {
                chrome.tabs.update({ url: chrome.runtime.getURL('dashboard.html') });
            }, 1000);
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
 * Save notes
 */
async function saveNotes() {
    try {
        showLoading();

        const notes = notesInput.value.trim();
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_ITEM',
            data: {
                id: itemId,
                notes
            }
        });

        if (response.success) {
            currentItem = response.item;
            renderItemDetails();
            closeModal(editNotesModal);
            showToast('Notes saved successfully', 'success');
        } else {
            showToast('Failed to save notes', 'error');
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        showToast('Error saving notes', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Save tags
 */
async function saveTags() {
    try {
        showLoading();

        const tags = tagsInput.value
            .split(',')
            .map(t => t.trim())
            .filter(t => t);

        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_ITEM',
            data: {
                id: itemId,
                tags
            }
        });

        if (response.success) {
            currentItem = response.item;
            renderItemDetails();
            closeModal(editTagsModal);
            showToast('Tags saved successfully', 'success');
        } else {
            showToast('Failed to save tags', 'error');
        }
    } catch (error) {
        console.error('Error saving tags:', error);
        showToast('Error saving tags', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Save category
 */
async function saveCategory() {
    try {
        showLoading();

        const category = categorySelect.value;
        const response = await chrome.runtime.sendMessage({
            type: 'UPDATE_ITEM',
            data: {
                id: itemId,
                category
            }
        });

        if (response.success) {
            currentItem = response.item;
            renderItemDetails();
            closeModal(changeCategoryModal);
            showToast('Category saved successfully', 'success');
        } else {
            showToast('Failed to save category', 'error');
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Error saving category', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Show loading state
 */
function showLoading() {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    itemDetails.classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    itemDetails.classList.remove('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    itemDetails.classList.add('hidden');
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
function showLoadingOverlay() {
    loadingOverlay.classList.remove('hidden');
}

/**
 * Hide loading overlay
 */
function hideLoadingOverlay() {
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
    backToDashboardBtn.addEventListener('click', () => {
        chrome.tabs.update({ url: chrome.runtime.getURL('dashboard.html') });
    });

    // Actions
    refreshBtn.addEventListener('click', () => {
        loadItemDetails();
    });
    editBtn.addEventListener('click', editItem);
    deleteBtn.addEventListener('click', deleteItem);
    checkPriceBtn.addEventListener('click', checkCurrentPrice);

    // Edit notes
    editNotesBtn.addEventListener('click', () => {
        notesInput.value = currentItem.notes || '';
        showModal(editNotesModal);
    });

    document.querySelector('#editNotesModal .modal-close').addEventListener('click', () => {
        closeModal(editNotesModal);
    });

    document.querySelector('#editNotesModal .cancel-btn').addEventListener('click', () => {
        closeModal(editNotesModal);
    });

    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);

    // Edit tags
    editTagsBtn.addEventListener('click', () => {
        tagsInput.value = (currentItem.tags || []).join(', ');
        showModal(editTagsModal);
    });

    document.querySelector('#editTagsModal .modal-close').addEventListener('click', () => {
        closeModal(editTagsModal);
    });

    document.querySelector('#editTagsModal .cancel-btn').addEventListener('click', () => {
        closeModal(editTagsModal);
    });

    document.getElementById('saveTagsBtn').addEventListener('click', saveTags);

    // Change category
    changeCategoryBtn.addEventListener('click', () => {
        categorySelect.value = currentItem.category || 'Uncategorized';
        showModal(changeCategoryModal);
    });

    document.querySelector('#changeCategoryModal .modal-close').addEventListener('click', () => {
        closeModal(changeCategoryModal);
    });

    document.querySelector('#changeCategoryModal .cancel-btn').addEventListener('click', () => {
        closeModal(changeCategoryModal);
    });

    document.getElementById('saveCategoryBtn').addEventListener('click', saveCategory);

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

    // Handle window resize for chart
    window.addEventListener('resize', () => {
        if (currentItem) {
            renderPriceHistory();
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
