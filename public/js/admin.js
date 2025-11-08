// Admin panel functionality

let participants = [];
let exclusions = [];

// Admin login
async function adminLogin(e) {
    e.preventDefault();
    hideError('loginError');

    const password = document.getElementById('adminPassword').value;

    try {
        const response = await api('/api/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (data.success) {
            hideElement('adminLoginCard');
            showElement('adminPanel');
            await loadAdminData();
        } else {
            showError(data.message || 'Invalid password', 'loginError');
        }
    } catch (error) {
        showError('Login failed', 'loginError');
    }
}

async function loadAdminData() {
    await Promise.all([
        loadGameStatus(),
        loadParticipants(),
        loadExclusions(),
        loadSMSTemplates(),
        loadSMSStats()
    ]);
}

async function loadGameStatus() {
    try {
        const response = await api('/api/admin/status');
        const data = await response.json();

        if (!data.success) return;

        const statusHtml = `
            <div class="stat-card">
                <div class="stat-value">${data.totalParticipants}</div>
                <div class="stat-label">Total Participants</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.pickedCount}</div>
                <div class="stat-label">Have Picked</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.notPickedCount}</div>
                <div class="stat-label">Haven't Picked</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.percentComplete}%</div>
                <div class="stat-label">Complete</div>
            </div>
        `;

        document.getElementById('gameStatus').innerHTML = statusHtml;
    } catch (error) {
        console.error('Failed to load game status:', error);
    }
}

async function loadParticipants() {
    try {
        const response = await api('/api/admin/participants');
        const data = await response.json();

        if (!data.success) return;

        participants = data.participants || [];
        renderParticipants();
        updateParticipantSelectors();
    } catch (error) {
        console.error('Failed to load participants:', error);
    }
}

function renderParticipants() {
    const container = document.getElementById('participantsList');
    if (participants.length === 0) {
        container.innerHTML = '<p class="empty-state">No participants added yet.</p>';
        return;
    }

    container.innerHTML = participants.map(p => `
        <div class="participant-item">
            <div class="participant-info">
                <div class="participant-name">${escapeHtml(p.first_name)}
                    <span class="status-badge ${p.has_picked ? 'status-picked' : 'status-not-picked'}">
                        ${p.has_picked ? '✅ Picked' : '⏳ Not Picked'}
                    </span>
                </div>
                <div class="participant-meta">
                    Last 4: ${p.phone_last_four} | SMS: ${p.sms_enabled ? 'On' : 'Off'}
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeParticipant(${p.id})">Remove</button>
        </div>
    `).join('');
}

async function addParticipant(e) {
    e.preventDefault();

    const firstName = document.getElementById('newFirstName').value.trim();
    const phoneNumber = document.getElementById('newPhoneNumber').value;

    try {
        const response = await api('/api/admin/participants', {
            method: 'POST',
            body: JSON.stringify({ firstName, phoneNumber })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('addParticipantForm').reset();
            await loadParticipants();
            await loadGameStatus();
        } else {
            alert(data.message || 'Failed to add participant');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function removeParticipant(id) {
    if (!confirmAction('Remove this participant? This will delete all their data.')) return;

    try {
        const response = await api(`/api/admin/participants/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            await loadParticipants();
            await loadGameStatus();
        } else {
            alert(data.message || 'Failed to remove participant');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function loadExclusions() {
    try {
        const response = await api('/api/admin/exclusions');
        const data = await response.json();

        if (!data.success) return;

        exclusions = data.exclusions || [];
        renderExclusions();
    } catch (error) {
        console.error('Failed to load exclusions:', error);
    }
}

function renderExclusions() {
    const container = document.getElementById('exclusionsList');
    if (exclusions.length === 0) {
        container.innerHTML = '<p class="empty-state">No exclusion rules yet.</p>';
        return;
    }

    container.innerHTML = exclusions.map(e => `
        <div class="exclusion-item">
            <div class="exclusion-info">
                <div class="exclusion-text">
                    ${escapeHtml(e.participant_name)} → ❌ → ${escapeHtml(e.excluded_name)}
                    ${e.reason ? `<span style="color: #666;">(${escapeHtml(e.reason)})</span>` : ''}
                </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="removeExclusion(${e.id})">Remove</button>
        </div>
    `).join('');
}

async function addExclusion(e) {
    e.preventDefault();

    const participantId = parseInt(document.getElementById('exclusionParticipant').value);
    const excludedParticipantId = parseInt(document.getElementById('exclusionExcluded').value);
    const reason = document.getElementById('exclusionReason').value;

    if (participantId === excludedParticipantId) {
        alert('Cannot exclude self');
        return;
    }

    try {
        const response = await api('/api/admin/exclusions', {
            method: 'POST',
            body: JSON.stringify({ participantId, excludedParticipantId, reason })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('addExclusionForm').reset();
            await loadExclusions();
        } else {
            alert(data.message || 'Failed to add exclusion');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function removeExclusion(id) {
    if (!confirmAction('Remove this exclusion rule?')) return;

    try {
        const response = await api(`/api/admin/exclusions/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            await loadExclusions();
        } else {
            alert(data.message || 'Failed to remove exclusion');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

function updateParticipantSelectors() {
    const html = `<option value="">Select...</option>` +
        participants.map(p => `<option value="${p.id}">${escapeHtml(p.first_name)}</option>`).join('');

    document.getElementById('exclusionParticipant').innerHTML = html;
    document.getElementById('exclusionExcluded').innerHTML = html;

    // Family group selector
    const familyHtml = participants.map(p => `
        <label class="family-checkbox-label">
            <input type="checkbox" name="familyMember" value="${p.id}">
            ${escapeHtml(p.first_name)}
        </label>
    `).join('');
    document.getElementById('familyGroupSelector').innerHTML = familyHtml;
}

async function addFamilyGroup(e) {
    e.preventDefault();

    const checkboxes = document.querySelectorAll('input[name="familyMember"]:checked');
    const participantIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const reason = document.getElementById('familyReason').value;

    if (participantIds.length < 2) {
        alert('Select at least 2 people for a family group');
        return;
    }

    try {
        const response = await api('/api/admin/family-group', {
            method: 'POST',
            body: JSON.stringify({ participantIds, reason })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Added ${data.added} exclusion rules`);
            document.getElementById('addFamilyGroupForm').reset();
            await loadExclusions();
        } else {
            alert(data.message || 'Failed to add family group');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function loadSMSTemplates() {
    try {
        const response = await api('/api/admin/notifications/templates');
        const data = await response.json();

        if (!data.success) return;

        const { templates, smsEnabled } = data;

        const statusBadge = smsEnabled
            ? '<span style="color: #28a745; font-weight: bold;">✓ SMS Enabled</span>'
            : '<span style="color: #ffc107; font-weight: bold;">⚠ SMS Disabled (Preview Only)</span>';

        let html = `<div style="margin-bottom: 1rem;">${statusBadge}</div>`;

        Object.keys(templates).forEach(key => {
            const template = templates[key];
            const segmentColor = template.isSingleSegment ? '#28a745' : '#ffc107';

            html += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--christmas-gold);">${template.name}</h4>
                    <p style="margin: 0 0 0.5rem 0; color: rgba(255,255,255,0.7); font-size: 0.9rem;">${template.description}</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin-bottom: 0.5rem;">
${escapeHtml(template.preview)}</div>
                    <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                        <span style="color: ${segmentColor};">
                            ${template.length} characters • ${template.segments} SMS segment${template.segments > 1 ? 's' : ''}
                        </span>
                        ${!template.isSingleSegment ? ' <span style="color: #ffc107;">⚠ Multi-segment (costs more)</span>' : ''}
                    </div>
                </div>
            `;
        });

        document.getElementById('smsTemplatesContainer').innerHTML = html;
    } catch (error) {
        console.error('Failed to load SMS templates:', error);
    }
}

async function loadSMSStats() {
    try {
        const response = await api('/api/admin/notifications/stats');
        const data = await response.json();

        if (!data.success) return;

        const stats = data.queueStats;
        const statsHtml = `
            <div class="stat-card">
                <div class="stat-value">${stats.pending || 0}</div>
                <div class="stat-label">Pending SMS</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.processed || 0}</div>
                <div class="stat-label">Sent SMS</div>
            </div>
        `;

        document.getElementById('smsStats').innerHTML = statsHtml;
    } catch (error) {
        console.error('Failed to load SMS stats:', error);
    }
}

async function sendNotification(type) {
    if (!confirmAction(`Send ${type} notification to all eligible participants?`)) return;

    try {
        const response = await api('/api/admin/notifications/send-all', {
            method: 'POST',
            body: JSON.stringify({ type })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Queued ${data.queued} notifications`);
            await loadSMSStats();
        } else {
            alert(data.message || 'Failed to send notifications');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function validateGame() {
    try {
        const response = await api('/api/admin/validate');
        const data = await response.json();

        if (data.possible) {
            alert(data.warning || 'Game is valid! ✅');
        } else {
            alert('Game validation failed: ' + data.reason);
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function resetAssignments() {
    if (!confirmAction('Reset all assignments? Participants and exclusions will be kept.')) return;

    try {
        const response = await api('/api/admin/reset-assignments', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            alert('Assignments reset successfully');
            await loadAdminData();
        } else {
            alert(data.message || 'Failed to reset');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function resetAll() {
    if (!confirmAction('⚠️ WARNING: Delete ALL data? This cannot be undone!')) return;
    if (!confirmAction('Are you ABSOLUTELY sure? All participants, assignments, and wish lists will be deleted.')) return;

    try {
        const response = await api('/api/admin/reset-all', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            alert('All data cleared successfully');
            await loadAdminData();
        } else {
            alert(data.message || 'Failed to reset');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminLoginForm').addEventListener('submit', adminLogin);
    document.getElementById('adminLogoutBtn').addEventListener('click', logout);
    document.getElementById('addParticipantForm').addEventListener('submit', addParticipant);
    document.getElementById('addExclusionForm').addEventListener('submit', addExclusion);
    document.getElementById('addFamilyGroupForm').addEventListener('submit', addFamilyGroup);
    document.getElementById('refreshStatusBtn').addEventListener('click', loadGameStatus);
    document.getElementById('sendGameStartBtn').addEventListener('click', () => sendNotification('game_start'));
    document.getElementById('sendWishlistReminderBtn').addEventListener('click', () => sendNotification('wishlist_reminder'));
    document.getElementById('sendShoppingReminderBtn').addEventListener('click', () => sendNotification('shopping_reminder'));
    document.getElementById('sendExchangeDayBtn').addEventListener('click', () => sendNotification('exchange_day'));
    document.getElementById('validateGameBtn').addEventListener('click', validateGame);
    document.getElementById('resetAssignmentsBtn').addEventListener('click', resetAssignments);
    document.getElementById('resetAllBtn').addEventListener('click', resetAll);
});

// Export functions for onclick handlers
window.removeParticipant = removeParticipant;
window.removeExclusion = removeExclusion;
