// Preferences page functionality

async function loadPreferences() {
    try {
        showElement('loadingPrefs');
        hideElement('preferencesForm');

        const response = await api('/api/notifications/preferences');
        const data = await response.json();

        hideElement('loadingPrefs');

        if (!data.success) {
            showError('Failed to load preferences', 'formError');
            return;
        }

        const prefs = data.preferences;
        document.getElementById('smsEnabled').checked = prefs.smsEnabled;
        document.getElementById('notifyOnGameStart').checked = prefs.notifyOnGameStart;
        document.getElementById('notifyOnAssignment').checked = prefs.notifyOnAssignment;
        document.getElementById('notifyOnWishlistUpdate').checked = prefs.notifyOnWishlistUpdate;
        document.getElementById('notifyReminders').checked = prefs.notifyReminders;

        toggleNotificationTypes(prefs.smsEnabled);
        showElement('preferencesForm');
    } catch (error) {
        hideElement('loadingPrefs');
        showError('An error occurred', 'formError');
    }
}

function toggleNotificationTypes(enabled) {
    const typesDiv = document.getElementById('notificationTypes');
    typesDiv.style.display = enabled ? 'block' : 'none';
}

async function savePreferences(e) {
    e.preventDefault();
    hideError('formError');
    hideElement('formSuccess');

    const preferences = {
        smsEnabled: document.getElementById('smsEnabled').checked,
        notifyOnGameStart: document.getElementById('notifyOnGameStart').checked,
        notifyOnAssignment: document.getElementById('notifyOnAssignment').checked,
        notifyOnWishlistUpdate: document.getElementById('notifyOnWishlistUpdate').checked,
        notifyReminders: document.getElementById('notifyReminders').checked
    };

    try {
        const response = await api('/api/notifications/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences)
        });

        const data = await response.json();

        if (data.success) {
            showElement('formSuccess');
        } else {
            showError(data.message || 'Failed to save preferences', 'formError');
        }
    } catch (error) {
        showError('An error occurred', 'formError');
    }
}

async function sendTestSMS() {
    const btn = document.getElementById('testSmsBtn');
    btn.disabled = true;
    btn.textContent = 'Sending... 📱';

    try {
        const response = await api('/api/notifications/test', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            alert('Test SMS sent! Check your phone.');
        } else {
            alert(data.message || 'Failed to send test SMS');
        }
    } catch (error) {
        alert('An error occurred');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Test SMS 📱';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth().then(loadPreferences);

    document.getElementById('smsEnabled').addEventListener('change', (e) => {
        toggleNotificationTypes(e.target.checked);
    });

    document.getElementById('preferencesForm').addEventListener('submit', savePreferences);
    document.getElementById('testSmsBtn').addEventListener('click', sendTestSMS);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});
