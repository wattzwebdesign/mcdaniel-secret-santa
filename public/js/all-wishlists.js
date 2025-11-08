// All wishlists page functionality

let allWishlists = [];

async function loadAllWishlists() {
    try {
        showElement('loadingState');
        hideElement('wishlistsContent');
        hideElement('errorState');

        // Check authentication
        await checkAuth();

        // Fetch all wishlists
        const response = await api('/api/wishlist/all-wishlists');
        const data = await response.json();

        hideElement('loadingState');

        if (!data.success) {
            document.getElementById('errorMessage').textContent = data.message || 'Failed to load wishlists';
            showElement('errorState');
            return;
        }

        allWishlists = data.wishlists || [];
        renderWishlists();
        renderSummary();
        showElement('wishlistsContent');

        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        hideElement('loadingState');
        console.error('Failed to load wishlists:', error);
        document.getElementById('errorMessage').textContent = 'An error occurred while loading wishlists';
        showElement('errorState');
    }
}

function renderSummary() {
    const totalPeople = allWishlists.length;
    const totalItems = allWishlists.reduce((sum, person) => sum + person.items.length, 0);
    const peopleWithWishlists = allWishlists.filter(person => person.items.length > 0).length;

    const html = `
        <div style="font-size: 0.875rem; color: #666; line-height: 1.8;">
            <p style="margin-bottom: 0.5rem;"><strong>${totalPeople}</strong> Total People</p>
            <p style="margin-bottom: 0.5rem;"><strong>${peopleWithWishlists}</strong> Have Wishlists</p>
            <p><strong>${totalItems}</strong> Total Items</p>
        </div>
    `;

    document.getElementById('summaryStats').innerHTML = html;
}

function renderWishlists() {
    const container = document.getElementById('wishlistsContainer');

    if (allWishlists.length === 0) {
        container.innerHTML = '<p class="empty-state">No wishlists found.</p>';
        return;
    }

    let html = '';

    allWishlists.forEach((person, index) => {
        const cardId = `wishlist-card-${index}`;
        const hasItems = person.items.length > 0;
        const itemLabel = person.items.length === 1 ? 'item' : 'items';

        html += `
            <div class="sms-template-card" id="${cardId}">
                <div class="sms-template-header" onclick="toggleWishlist('${cardId}')">
                    <div class="sms-template-title-area">
                        <h4>${escapeHtml(person.name)}</h4>
                        ${person.type === 'non-participant' ? `<p style="color: #666; font-size: 0.8rem;">Managed by ${escapeHtml(person.managed_by_name)}</p>` : ''}
                    </div>
                    <div class="sms-template-toggle">
                        <span class="badge ${hasItems ? 'badge-success' : 'badge-warning'}">
                            ${person.items.length} ${itemLabel}
                        </span>
                        <i data-lucide="chevron-down"></i>
                    </div>
                </div>
                <div class="sms-template-content">
                    <div class="sms-template-content-inner">
                        ${renderWishlistItems(person.items)}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderWishlistItems(items) {
    if (items.length === 0) {
        return '<p class="empty-state" style="padding: 1.5rem; margin: 0;">No items added yet.</p>';
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

    items.forEach(item => {
        const priorityLabels = {
            1: { text: 'Must Have', color: '#dc3545', icon: 'star' },
            2: { text: 'Would Like', color: '#ffc107', icon: 'star' },
            3: { text: 'If Budget Allows', color: '#28a745', icon: 'star' }
        };

        const priority = priorityLabels[item.priority] || priorityLabels[2];

        html += `
            <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${priority.color};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h5 style="margin: 0; color: var(--dark-text); font-size: 1rem; flex: 1;">${escapeHtml(item.item_name)}</h5>
                    <span style="background: ${priority.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; margin-left: 0.5rem;">
                        <i data-lucide="${priority.icon}" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${priority.text}
                    </span>
                </div>

                ${item.description ? `<p style="margin: 0.5rem 0; color: #666; font-size: 0.875rem; line-height: 1.5;">${escapeHtml(item.description)}</p>` : ''}

                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; align-items: center;">
                    ${item.price_range ? `<span style="background: var(--christmas-green); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i data-lucide="dollar-sign" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${escapeHtml(item.price_range)}</span>` : ''}
                    ${item.link ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" style="color: var(--christmas-red); text-decoration: none; font-size: 0.875rem; font-weight: 500;"><i data-lucide="external-link" style="width: 14px; height: 14px; vertical-align: middle;"></i> View Item</a>` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

function toggleWishlist(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.toggle('expanded');
        // Re-initialize icons after toggle
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Initialize
loadAllWishlists();

document.getElementById('logoutBtn').addEventListener('click', logout);

// Export function for onclick handler
window.toggleWishlist = toggleWishlist;
