/**
 * Login Controller - Wishlist Sync Extension
 * Handles user authentication (optional cloud sync feature)
 */

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const rememberMe = document.getElementById('rememberMe');
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');
const acceptTerms = document.getElementById('acceptTerms');
const socialBtns = document.querySelectorAll('.social-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastClose = document.getElementById('toastClose');
const loadingOverlay = document.getElementById('loadingOverlay');

// State
let currentUser = null;

/**
 * Initialize login page
 */
async function init() {
    try {
        // Check if user is already logged in
        const user = await getCurrentUser();

        if (user) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
            return;
        }

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing login:', error);
    }
}

/**
 * Get current user from storage
 */
async function getCurrentUser() {
    try {
        const result = await chrome.storage.local.get('currentUser');
        return result.currentUser || null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Handle login
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        showLoading();

        // Simulate login (in production, this would be an API call)
        await sleep(1000);

        // For demo purposes, accept any valid email
        const user = {
            id: generateId(),
            name: email.split('@')[0],
            email: email,
            createdAt: new Date().toISOString()
        };

        // Save user to storage
        await chrome.storage.local.set({ currentUser: user });

        if (rememberMe.checked) {
            await chrome.storage.local.set({ rememberUser: true });
        }

        showToast('Login successful!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Error logging in:', error);
        showToast('Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Handle signup
 */
async function handleSignup(e) {
    e.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;

    if (!name) {
        showToast('Please enter your name', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    if (!acceptTerms.checked) {
        showToast('Please accept the terms of service', 'error');
        return;
    }

    try {
        showLoading();

        // Simulate signup (in production, this would be an API call)
        await sleep(1000);

        const user = {
            id: generateId(),
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        };

        // Save user to storage
        await chrome.storage.local.set({ currentUser: user });

        showToast('Account created successfully!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Error signing up:', error);
        showToast('Signup failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Handle social login
 */
async function handleSocialLogin(provider) {
    try {
        showLoading();

        // Simulate social login (in production, this would use OAuth)
        await sleep(1000);

        const user = {
            id: generateId(),
            name: `${provider} User`,
            email: `user@${provider.toLowerCase()}.com`,
            provider: provider,
            createdAt: new Date().toISOString()
        };

        // Save user to storage
        await chrome.storage.local.set({ currentUser: user });

        showToast(`Logged in with ${provider}!`, 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Error with social login:', error);
        showToast(`${provider} login failed. Please try again.`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Switch tab
 */
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update tab contents
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
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
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Signup form
    signupForm.addEventListener('submit', handleSignup);

    // Social login buttons
    socialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = btn.classList.contains('google') ? 'Google' : 'GitHub';
            handleSocialLogin(provider);
        });
    });

    // Toast close
    toastClose.addEventListener('click', () => toast.classList.add('hidden'));
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
