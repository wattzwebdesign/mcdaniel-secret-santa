// Main utility functions for Secret Santa application

// API Helper
async function api(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    return response;
}

// Check authentication status
async function checkAuth() {
    try {
        const response = await api('/api/auth/status');
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = '/';
            return false;
        }

        return data;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
        return false;
    }
}

// Logout function
async function logout() {
    try {
        await api('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/';
    }
}

// Show/Hide elements
function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// Show error message
function showError(message, elementId = 'errorMessage') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Hide error message
function hideError(elementId = 'errorMessage') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// Show success message
function showSuccess(message, elementId = 'successMessage') {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 3000);
    }
}

// Format phone number as user types
function formatPhoneNumber(input) {
    const cleaned = input.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (!match) return input;

    const part1 = match[1] ? `(${match[1]}` : '';
    const part2 = match[2] ? `) ${match[2]}` : match[1] ? ')' : '';
    const part3 = match[3] ? `-${match[3]}` : '';

    return part1 + part2 + part3;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Confirm action
function confirmAction(message) {
    return confirm(message);
}

// Loading state for buttons
function setButtonLoading(buttonId, loading = true) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    if (loading) {
        btn.disabled = true;
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline-block';
    } else {
        btn.disabled = false;
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
    }
}

// Debounce function
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

// Export functions globally
window.api = api;
window.checkAuth = checkAuth;
window.logout = logout;
window.showElement = showElement;
window.hideElement = hideElement;
window.showError = showError;
window.hideError = hideError;
window.showSuccess = showSuccess;
window.formatPhoneNumber = formatPhoneNumber;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.confirmAction = confirmAction;
window.setButtonLoading = setButtonLoading;
window.debounce = debounce;
