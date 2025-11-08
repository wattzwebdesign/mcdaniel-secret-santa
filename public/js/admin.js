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
        loadNonParticipants(),
        loadSMSTemplates(),
        loadSMSStats(),
        loadEventSettings(),
        loadSMSLogs()
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
                <div class="stat-label">Participants</div>
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
        <div class="participant-item" data-participant-id="${p.id}">
            <div class="participant-info">
                <div class="participant-name">${escapeHtml(p.first_name)}
                    <span class="status-badge ${p.has_picked ? 'status-picked' : 'status-not-picked'}">
                        ${p.has_picked ? 'Picked' : 'Not Picked'}
                    </span>
                </div>
                <div class="participant-meta">
                    Last 4: ${p.phone_last_four} | SMS: ${p.sms_enabled ? 'On' : 'Off'}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-secondary" onclick="editParticipant(${p.id})"><i data-lucide="edit-2"></i></button>
                <button class="btn btn-sm btn-danger" onclick="removeParticipant(${p.id})"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('');

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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

async function editParticipant(id) {
    const participant = participants.find(p => p.id === id);
    if (!participant) return;

    // Create inline edit mode for this participant
    const participantItem = document.querySelector(`.participant-item[data-participant-id="${id}"]`);
    if (!participantItem) return;

    const originalContent = participantItem.innerHTML;

    participantItem.innerHTML = `
        <div class="participant-edit-form" style="flex: 1; display: flex; gap: 0.5rem; align-items: center;">
            <input type="text" id="edit_firstName_${id}" value="${escapeHtml(participant.first_name)}" style="flex: 1; padding: 0.5rem; border: 2px solid var(--christmas-green); border-radius: 6px; font-size: 0.95rem;">
            <input type="tel" id="edit_phoneNumber_${id}" value="${participant.phone_number}" placeholder="Phone Number" style="flex: 1; padding: 0.5rem; border: 2px solid var(--christmas-green); border-radius: 6px; font-size: 0.95rem;">
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-success" onclick="saveParticipantEdit(${id})">
                <i data-lucide="check"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="cancelParticipantEdit(${id}, \`${escapeHtml(originalContent).replace(/`/g, '\\`')}\`)">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Focus on first name field
    document.getElementById(`edit_firstName_${id}`).focus();
}

function cancelParticipantEdit(id, originalContent) {
    const participantItem = document.querySelector(`.participant-item[data-participant-id="${id}"]`);
    if (participantItem) {
        participantItem.innerHTML = originalContent;
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

async function saveParticipantEdit(id) {
    const firstName = document.getElementById(`edit_firstName_${id}`).value.trim();
    const phoneNumber = document.getElementById(`edit_phoneNumber_${id}`).value.trim();

    if (!firstName || !phoneNumber) {
        alert('Please provide both first name and phone number');
        return;
    }

    try {
        const response = await api(`/api/admin/participants/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ firstName, phoneNumber })
        });

        const data = await response.json();

        if (data.success) {
            await loadParticipants();
            await loadGameStatus();
        } else {
            alert(data.message || 'Failed to update participant');
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

    // Non-participant manager selector
    document.getElementById('nonParticipantManager').innerHTML = html;

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

// Non-Participants Management
let nonParticipants = [];

async function loadNonParticipants() {
    try {
        const response = await api('/api/admin/non-participants');
        const data = await response.json();

        if (!data.success) return;

        nonParticipants = data.nonParticipants || [];
        renderNonParticipants();
    } catch (error) {
        console.error('Failed to load non-participants:', error);
    }
}

function renderNonParticipants() {
    const container = document.getElementById('nonParticipantsList');
    if (nonParticipants.length === 0) {
        container.innerHTML = '<p class="empty-state">No non-participants added yet.</p>';
        return;
    }

    container.innerHTML = nonParticipants.map(np => `
        <div class="participant-item" data-non-participant-id="${np.id}">
            <div class="participant-info">
                <div class="participant-name">${escapeHtml(np.name)}
                    <span class="badge badge-info" style="margin-left: 0.5rem; font-size: 0.7rem;">Managed by ${escapeHtml(np.managed_by_name)}</span>
                </div>
                ${np.notes ? `<div class="participant-meta">${escapeHtml(np.notes)}</div>` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-sm btn-secondary" onclick="editNonParticipant(${np.id})"><i data-lucide="edit-2"></i></button>
                <button class="btn btn-sm btn-danger" onclick="removeNonParticipant(${np.id})"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('');

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function addNonParticipant(e) {
    e.preventDefault();

    const name = document.getElementById('newNonParticipantName').value.trim();
    const managedByParticipantId = parseInt(document.getElementById('nonParticipantManager').value);
    const notes = document.getElementById('newNonParticipantNotes').value.trim();

    try {
        const response = await api('/api/admin/non-participants', {
            method: 'POST',
            body: JSON.stringify({ name, managedByParticipantId, notes })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('addNonParticipantForm').reset();
            await loadNonParticipants();
        } else {
            alert(data.message || 'Failed to add non-participant');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function editNonParticipant(id) {
    const nonParticipant = nonParticipants.find(np => np.id === id);
    if (!nonParticipant) return;

    const item = document.querySelector(`.participant-item[data-non-participant-id="${id}"]`);
    if (!item) return;

    const originalContent = item.innerHTML;

    item.innerHTML = `
        <div class="participant-edit-form" style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="edit_np_name_${id}" value="${escapeHtml(nonParticipant.name)}" placeholder="Name" style="flex: 1; padding: 0.5rem; border: 2px solid var(--christmas-green); border-radius: 6px; font-size: 0.95rem;">
                <select id="edit_np_manager_${id}" style="flex: 1; padding: 0.5rem; border: 2px solid var(--christmas-green); border-radius: 6px; font-size: 0.95rem;">
                    ${participants.map(p => `<option value="${p.id}" ${p.id === nonParticipant.managed_by_participant_id ? 'selected' : ''}>${escapeHtml(p.first_name)}</option>`).join('')}
                </select>
            </div>
            <input type="text" id="edit_np_notes_${id}" value="${escapeHtml(nonParticipant.notes || '')}" placeholder="Notes (optional)" style="padding: 0.5rem; border: 2px solid var(--christmas-green); border-radius: 6px; font-size: 0.95rem;">
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-success" onclick="saveNonParticipantEdit(${id})">
                <i data-lucide="check"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="cancelNonParticipantEdit(${id}, \`${escapeHtml(originalContent).replace(/`/g, '\\`')}\`)">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    document.getElementById(`edit_np_name_${id}`).focus();
}

function cancelNonParticipantEdit(id, originalContent) {
    const item = document.querySelector(`.participant-item[data-non-participant-id="${id}"]`);
    if (item) {
        item.innerHTML = originalContent;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

async function saveNonParticipantEdit(id) {
    const name = document.getElementById(`edit_np_name_${id}`).value.trim();
    const managedByParticipantId = parseInt(document.getElementById(`edit_np_manager_${id}`).value);
    const notes = document.getElementById(`edit_np_notes_${id}`).value.trim();

    if (!name) {
        alert('Please provide a name');
        return;
    }

    try {
        const response = await api(`/api/admin/non-participants/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, managedByParticipantId, notes })
        });

        const data = await response.json();

        if (data.success) {
            await loadNonParticipants();
        } else {
            alert(data.message || 'Failed to update non-participant');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function removeNonParticipant(id) {
    if (!confirmAction('Remove this non-participant? This will delete their wishlist too.')) return;

    try {
        const response = await api(`/api/admin/non-participants/${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            await loadNonParticipants();
        } else {
            alert(data.message || 'Failed to remove non-participant');
        }
    } catch (error) {
        alert('An error occurred');
    }
}

async function loadSMSTemplates() {
    try {
        // Load preview templates
        const previewResponse = await api('/api/admin/notifications/templates');
        const previewData = await previewResponse.json();

        // Load editable templates
        const editableResponse = await api('/api/admin/settings/sms-templates');
        const editableData = await editableResponse.json();

        if (!previewData.success) return;

        const { templates, smsEnabled } = previewData;
        const editableTemplates = editableData.templates || [];

        const statusBadge = smsEnabled
            ? '<span class="badge badge-success">✓ SMS Enabled</span>'
            : '<span class="badge badge-warning">⚠ SMS Disabled (Preview Only)</span>';

        document.getElementById('smsStatusBadge').innerHTML = statusBadge;

        let html = '';

        Object.keys(templates).forEach((key, index) => {
            const template = templates[key];
            const badgeClass = template.isSingleSegment ? 'badge-success' : 'badge-warning';
            const cardId = `sms-template-${index}`;

            // Find matching editable template
            const editableTemplate = editableTemplates.find(t => t.template_type === template.type);
            const templateId = editableTemplate ? editableTemplate.id : null;
            const templateBody = editableTemplate ? editableTemplate.template_body : '';

            html += `
                <div class="sms-template-card" id="${cardId}" data-template-id="${templateId}">
                    <div class="sms-template-header" onclick="toggleSMSTemplate('${cardId}')">
                        <div class="sms-template-title-area">
                            <h4>${template.name}</h4>
                            <p>${template.description}</p>
                        </div>
                        <div class="sms-template-toggle">
                            <span class="badge ${badgeClass}">
                                ${template.length} chars • ${template.segments} seg
                            </span>
                            <i data-lucide="chevron-down"></i>
                        </div>
                    </div>
                    <div class="sms-template-content">
                        <div class="sms-template-content-inner">
                            <div class="sms-template-preview">${escapeHtml(template.preview)}</div>
                            <div class="sms-template-edit-area">
                                <textarea id="template_text_${templateId}">${escapeHtml(templateBody)}</textarea>
                                <div class="sms-template-actions">
                                    <button class="btn btn-primary btn-sm" onclick="saveTemplateInline('${cardId}', ${templateId})">
                                        <i data-lucide="save"></i> Save
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="cancelTemplateEdit('${cardId}')">
                                        <i data-lucide="x"></i> Cancel
                                    </button>
                                    <span class="sms-template-char-count" id="char_count_${templateId}"></span>
                                </div>
                            </div>
                            <div class="sms-template-footer">
                                <button class="btn btn-secondary btn-sm" onclick="editTemplateInline('${cardId}', ${templateId})">
                                    <i data-lucide="edit"></i> Edit Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        document.getElementById('smsTemplatesContainer').innerHTML = html;

        // Initialize character counters
        editableTemplates.forEach(template => {
            const textarea = document.getElementById(`template_text_${template.id}`);
            if (textarea) {
                updateCharCount(template.id);
                textarea.addEventListener('input', () => updateCharCount(template.id));
            }
        });

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Failed to load SMS templates:', error);
    }
}

function updateCharCount(templateId) {
    const textarea = document.getElementById(`template_text_${templateId}`);
    const counter = document.getElementById(`char_count_${templateId}`);
    if (textarea && counter) {
        const length = textarea.value.length;
        const segments = Math.ceil(length / 160);
        const color = length <= 160 ? '#28a745' : '#ffc107';
        counter.innerHTML = `<span style="color: ${color};">${length} chars • ${segments} segment${segments > 1 ? 's' : ''}</span>`;
    }
}

function editTemplateInline(cardId, templateId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.add('edit-mode');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function cancelTemplateEdit(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.remove('edit-mode');
        // Reload to reset any changes
        const templateId = card.dataset.templateId;
        loadSMSTemplates();
    }
}

async function saveTemplateInline(cardId, templateId) {
    const textarea = document.getElementById(`template_text_${templateId}`);
    if (!textarea) return;

    const templateBody = textarea.value;

    try {
        const response = await api(`/api/admin/settings/sms-templates/${templateId}`, {
            method: 'PUT',
            body: JSON.stringify({ template_body: templateBody })
        });

        const data = await response.json();

        if (data.success) {
            alert('Template saved successfully!');
            const card = document.getElementById(cardId);
            if (card) {
                card.classList.remove('edit-mode');
            }
            // Reload to show updated preview
            await loadSMSTemplates();
        } else {
            alert(data.message || 'Failed to save template');
        }
    } catch (error) {
        alert('An error occurred while saving template');
    }
}

// Toggle SMS template card
function toggleSMSTemplate(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.toggle('expanded');
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
    document.getElementById('addNonParticipantForm').addEventListener('submit', addNonParticipant);
    document.getElementById('refreshStatusBtn').addEventListener('click', loadGameStatus);
    document.getElementById('sendGameStartBtn').addEventListener('click', () => sendNotification('game_start'));
    document.getElementById('sendWishlistReminderBtn').addEventListener('click', () => sendNotification('wishlist_reminder'));
    document.getElementById('sendShoppingReminderBtn').addEventListener('click', () => sendNotification('shopping_reminder'));
    document.getElementById('sendExchangeDayBtn').addEventListener('click', () => sendNotification('exchange_day'));
    document.getElementById('validateGameBtn').addEventListener('click', validateGame);
    document.getElementById('resetAssignmentsBtn').addEventListener('click', resetAssignments);
    document.getElementById('resetAllBtn').addEventListener('click', resetAll);
    document.getElementById('eventSettingsForm').addEventListener('submit', saveEventSettings);
    document.getElementById('refreshLogsBtn').addEventListener('click', refreshSMSLogs);
});

// Load event settings
async function loadEventSettings() {
    try {
        const response = await api('/api/admin/settings/event');
        const data = await response.json();

        if (data.success) {
            const settings = data.settings;
            document.getElementById('exchangeTitle').value = settings.exchange_title || '';
            document.getElementById('exchangeDate').value = settings.exchange_date || '';
            document.getElementById('exchangeTime').value = settings.exchange_time || '';
            document.getElementById('exchangeLocation').value = settings.exchange_location || '';
        }
    } catch (error) {
        console.error('Failed to load event settings:', error);
    }
}

// Save event settings
async function saveEventSettings(e) {
    e.preventDefault();

    const settings = {
        exchange_title: document.getElementById('exchangeTitle').value,
        exchange_date: document.getElementById('exchangeDate').value,
        exchange_time: document.getElementById('exchangeTime').value,
        exchange_location: document.getElementById('exchangeLocation').value
    };

    try {
        const response = await api('/api/admin/settings/event', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        const data = await response.json();

        if (data.success) {
            alert('Event settings saved successfully!');
        } else {
            alert(data.message || 'Failed to save settings');
        }
    } catch (error) {
        alert('An error occurred while saving settings');
    }
}


// Load SMS logs and queue
async function loadSMSLogs() {
    try {
        // Load pending messages (queue)
        const queueResponse = await api('/api/admin/notifications/queue');
        const queueData = await queueResponse.json();

        // Load sent messages (logs)
        const logsResponse = await api('/api/admin/notifications/logs?limit=50');
        const logsData = await logsResponse.json();

        if (queueData.success) {
            renderSMSQueue(queueData.queue || []);
        }

        if (logsData.success) {
            renderSMSSentLogs(logsData.logs || []);
        }
    } catch (error) {
        console.error('Failed to load SMS logs:', error);
    }
}

// Render SMS queue (pending messages)
function renderSMSQueue(queue) {
    const container = document.getElementById('smsQueueList');

    if (queue.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending messages in queue.</p>';
        return;
    }

    let html = '<div class="data-table"><table>';
    html += '<thead><tr>';
    html += '<th>Participant</th>';
    html += '<th>Type</th>';
    html += '<th>Message Preview</th>';
    html += '<th>Priority</th>';
    html += '<th>Scheduled</th>';
    html += '</tr></thead><tbody>';

    queue.forEach(msg => {
        const preview = msg.message_body.substring(0, 60) + (msg.message_body.length > 60 ? '...' : '');
        const scheduledDate = new Date(msg.scheduled_for);
        const formattedDate = scheduledDate.toLocaleString();

        html += '<tr>';
        html += `<td><strong>${escapeHtml(msg.first_name)}</strong></td>`;
        html += `<td><span class="badge badge-info">${escapeHtml(msg.message_type)}</span></td>`;
        html += `<td style="max-width: 300px;">${escapeHtml(preview)}</td>`;
        html += `<td style="text-align: center;"><span class="badge badge-warning">${msg.priority}</span></td>`;
        html += `<td style="font-size: 0.9rem; white-space: nowrap;">${formattedDate}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Render SMS sent logs
function renderSMSSentLogs(logs) {
    const container = document.getElementById('smsSentList');

    if (logs.length === 0) {
        container.innerHTML = '<p class="empty-state">No messages sent yet.</p>';
        return;
    }

    let html = '<div class="data-table"><table>';
    html += '<thead><tr>';
    html += '<th>Participant</th>';
    html += '<th>Type</th>';
    html += '<th>Message Preview</th>';
    html += '<th>Status</th>';
    html += '<th>Sent</th>';
    html += '</tr></thead><tbody>';

    logs.forEach(log => {
        const preview = log.message_body.substring(0, 60) + (log.message_body.length > 60 ? '...' : '');
        const sentDate = new Date(log.sent_at);
        const formattedDate = sentDate.toLocaleString();

        let badgeClass = 'badge-success'; // green for delivered
        let statusText = log.status;

        if (log.status === 'failed') {
            badgeClass = 'badge-danger'; // red for failed
        } else if (log.status === 'sent' || log.status === 'queued') {
            badgeClass = 'badge-warning'; // yellow for pending
        }

        html += '<tr>';
        html += `<td><strong>${escapeHtml(log.first_name)}</strong></td>`;
        html += `<td><span class="badge badge-info">${escapeHtml(log.message_type)}</span></td>`;
        html += `<td style="max-width: 300px;">${escapeHtml(preview)}</td>`;
        html += `<td><span class="badge ${badgeClass}">${escapeHtml(statusText)}</span></td>`;
        html += `<td style="font-size: 0.9rem; white-space: nowrap;">${formattedDate}</td>`;
        html += '</tr>';

        // Show error message if failed
        if (log.status === 'failed' && log.error_message) {
            html += '<tr>';
            html += `<td colspan="5" style="padding: 0.5rem 0.75rem; background: #f8d7da; font-size: 0.85rem; color: #721c24;"><strong>Error:</strong> ${escapeHtml(log.error_message)}</td>`;
            html += '</tr>';
        }
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// Refresh SMS logs
async function refreshSMSLogs() {
    await loadSMSLogs();
}

// Export functions for onclick handlers
window.editParticipant = editParticipant;
window.saveParticipantEdit = saveParticipantEdit;
window.cancelParticipantEdit = cancelParticipantEdit;
window.removeParticipant = removeParticipant;
window.removeExclusion = removeExclusion;
window.editNonParticipant = editNonParticipant;
window.saveNonParticipantEdit = saveNonParticipantEdit;
window.cancelNonParticipantEdit = cancelNonParticipantEdit;
window.removeNonParticipant = removeNonParticipant;
window.refreshSMSLogs = refreshSMSLogs;
window.toggleSMSTemplate = toggleSMSTemplate;
window.editTemplateInline = editTemplateInline;
window.cancelTemplateEdit = cancelTemplateEdit;
window.saveTemplateInline = saveTemplateInline;
