// Wishlist page functionality

let currentItems = [];

async function loadWishList() {
    try {
        showElement('loadingItems');
        hideElement('emptyState');
        hideElement('itemsList');

        const response = await api('/api/wishlist/my-items');
        const data = await response.json();

        hideElement('loadingItems');

        if (!data.success) {
            showError('Failed to load wish list', 'formError');
            return;
        }

        currentItems = data.items || [];

        if (currentItems.length === 0) {
            showElement('emptyState');
        } else {
            renderItems(currentItems);
            showElement('itemsList');
        }
    } catch (error) {
        hideElement('loadingItems');
        showError('An error occurred', 'formError');
    }
}

function renderItems(items) {
    const container = document.getElementById('itemsList');
    container.innerHTML = items.map(item => `
        <div class="wish-item" data-id="${item.id}">
            <div class="wish-item-header">
                <h3>${escapeHtml(item.item_name)}</h3>
                <span class="priority-badge priority-${item.priority}">${getPriorityLabel(item.priority)}</span>
            </div>
            ${item.description ? `<p class="wish-item-description">${escapeHtml(item.description)}</p>` : ''}
            <div class="wish-item-footer">
                ${item.price_range ? `<span class="price-tag">💰 ${escapeHtml(item.price_range)}</span>` : ''}
                ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" class="btn btn-sm btn-secondary">View Link 🔗</a>` : ''}
                <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">Edit ✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete 🗑️</button>
            </div>
        </div>
    `).join('');
}

function getPriorityLabel(priority) {
    const labels = {1: '⭐ Must Have', 2: '⭐⭐ Would Like', 3: '⭐⭐⭐ Budget Allows'};
    return labels[priority] || '';
}

async function addItem(e) {
    e.preventDefault();
    hideError('formError');

    const itemData = {
        itemName: document.getElementById('itemName').value,
        description: document.getElementById('description').value,
        link: document.getElementById('link').value,
        priceRange: document.getElementById('priceRange').value,
        priority: parseInt(document.getElementById('priority').value)
    };

    try {
        const response = await api('/api/wishlist/items', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('addItemForm').reset();
            await loadWishList();
        } else {
            showError(data.message || 'Failed to add item', 'formError');
        }
    } catch (error) {
        showError('An error occurred', 'formError');
    }
}

function editItem(itemId) {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.item_name;
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editLink').value = item.link || '';
    document.getElementById('editPriceRange').value = item.price_range || '';
    document.getElementById('editPriority').value = item.priority;

    showElement('editModal');
}

async function updateItem(e) {
    e.preventDefault();
    hideError('editFormError');

    const itemId = document.getElementById('editItemId').value;
    const itemData = {
        itemName: document.getElementById('editItemName').value,
        description: document.getElementById('editDescription').value,
        link: document.getElementById('editLink').value,
        priceRange: document.getElementById('editPriceRange').value,
        priority: parseInt(document.getElementById('editPriority').value)
    };

    try {
        const response = await api(`/api/wishlist/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (data.success) {
            hideElement('editModal');
            await loadWishList();
        } else {
            showError(data.message || 'Failed to update item', 'editFormError');
        }
    } catch (error) {
        showError('An error occurred', 'editFormError');
    }
}

async function deleteItem(itemId) {
    if (!confirmAction('Are you sure you want to delete this item?')) return;

    try {
        const response = await api(`/api/wishlist/items/${itemId}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            await loadWishList();
        } else {
            showError(data.message || 'Failed to delete item', 'formError');
        }
    } catch (error) {
        showError('An error occurred', 'formError');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth().then(loadWishList);

    document.getElementById('addItemForm').addEventListener('submit', addItem);
    document.getElementById('editItemForm').addEventListener('submit', updateItem);
    document.getElementById('closeModal').addEventListener('click', () => hideElement('editModal'));
    document.getElementById('cancelEdit').addEventListener('click', () => hideElement('editModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// Export functions globally for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
