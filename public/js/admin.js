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
        loadSMSStats(),
        loadEventSettings(),
        loadEditableSMSTemplates(),
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

// Load editable SMS templates
async function loadEditableSMSTemplates() {
    try {
        const response = await api('/api/admin/settings/sms-templates');
        const data = await response.json();

        if (!data.success) return;

        const container = document.getElementById('smsTemplateEditor');
        let html = '<p style="margin-bottom: 1rem; color: rgba(255,255,255,0.7);">Edit your SMS templates below. Available variables: {appUrl}, {recipientName}, {firstName}, {daysRemaining}, {eventTitle}, {eventTime}, {eventLocation}</p>';

        data.templates.forEach(template => {
            html += `
                <div style="margin-bottom: 2rem; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h4 style="margin: 0 0 0.5rem 0; color: var(--christmas-gold);">${escapeHtml(template.template_name)}</h4>
                    <p style="margin: 0 0 0.5rem 0; color: rgba(255,255,255,0.7); font-size: 0.9rem;">${escapeHtml(template.description)}</p>
                    <form onsubmit="saveTemplate(event, ${template.id}); return false;">
                        <textarea
                            id="template_${template.id}"
                            rows="6"
                            style="width: 100%; padding: 0.75rem; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.2); font-family: monospace; resize: vertical;"
                        >${escapeHtml(template.template_body)}</textarea>
                        <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                            <button type="submit" class="btn btn-primary btn-sm">Save Template</button>
                            <span id="chars_${template.id}" style="color: rgba(255,255,255,0.6); font-size: 0.85rem; align-self: center;"></span>
                        </div>
                    </form>
                </div>
            `;
        });

        container.innerHTML = html;

        // Add character counters
        data.templates.forEach(template => {
            const textarea = document.getElementById(`template_${template.id}`);
            const charCounter = document.getElementById(`chars_${template.id}`);

            function updateCharCount() {
                const length = textarea.value.length;
                const segments = Math.ceil(length / 160);
                const color = length <= 160 ? '#28a745' : '#ffc107';
                charCounter.innerHTML = `<span style="color: ${color};">${length} chars • ${segments} segment${segments > 1 ? 's' : ''}</span>`;
            }

            textarea.addEventListener('input', updateCharCount);
            updateCharCount();
        });
    } catch (error) {
        console.error('Failed to load editable SMS templates:', error);
    }
}

// Save SMS template
async function saveTemplate(e, templateId) {
    e.preventDefault();

    const templateBody = document.getElementById(`template_${templateId}`).value;

    try {
        const response = await api(`/api/admin/settings/sms-templates/${templateId}`, {
            method: 'PUT',
            body: JSON.stringify({ template_body: templateBody })
        });

        const data = await response.json();

        if (data.success) {
            alert('Template saved successfully!');
            await loadSMSTemplates(); // Reload preview
        } else {
            alert(data.message || 'Failed to save template');
        }
    } catch (error) {
        alert('An error occurred while saving template');
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
window.removeParticipant = removeParticipant;
window.removeExclusion = removeExclusion;
window.saveTemplate = saveTemplate;
window.refreshSMSLogs = refreshSMSLogs;
