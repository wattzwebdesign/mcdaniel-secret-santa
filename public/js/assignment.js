// Assignment page functionality

let currentUser = null;

async function loadAssignment() {
    try {
        showElement('loadingState');
        hideElement('notPickedState');
        hideElement('assignmentState');
        hideElement('errorState');

        const authData = await checkAuth();
        currentUser = authData.participant;

        const response = await api('/api/participant/assignment');
        const data = await response.json();

        hideElement('loadingState');

        if (!data.success) {
            document.getElementById('errorMessage').textContent = data.error || 'Failed to load assignment';
            showElement('errorState');
            return;
        }

        if (data.hasPicked) {
            document.getElementById('userName2').textContent = currentUser.firstName;
            document.getElementById('recipientName').textContent = data.assignedTo;
            await loadEventDetails();
            showElement('assignmentState');

            // Re-initialize icons after showing assignment state
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            document.getElementById('userName1').textContent = currentUser.firstName;
            showElement('notPickedState');

            // Re-initialize icons after showing not picked state
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    } catch (error) {
        hideElement('loadingState');
        document.getElementById('errorMessage').textContent = 'An error occurred';
        showElement('errorState');
    }
}

async function loadEventDetails() {
    try {
        const response = await api('/api/participant/event-details');
        const data = await response.json();

        const widget = document.getElementById('eventDetailsWidget');

        if (data.success && data.eventSettings) {
            const settings = data.eventSettings;
            let html = '<div style="font-size: 0.875rem; color: #666; line-height: 1.8;">';

            if (settings.exchange_title) {
                html += `<p style="margin-bottom: 0.75rem; font-weight: 600; color: var(--dark-text); font-size: 0.95rem;">${escapeHtml(settings.exchange_title)}</p>`;
            }

            if (settings.exchange_date) {
                const date = new Date(settings.exchange_date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                html += `<p style="margin-bottom: 0.5rem;"><i data-lucide="calendar-days" style="width: 14px; height: 14px; vertical-align: middle; color: var(--christmas-red);"></i> ${formattedDate}</p>`;
            }

            if (settings.exchange_time) {
                html += `<p style="margin-bottom: 0.5rem;"><i data-lucide="clock" style="width: 14px; height: 14px; vertical-align: middle; color: var(--christmas-red);"></i> ${escapeHtml(settings.exchange_time)}</p>`;
            }

            if (settings.exchange_location) {
                html += `<p style="margin-bottom: 0;"><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle; color: var(--christmas-red);"></i> ${escapeHtml(settings.exchange_location).replace(/\n/g, '<br>')}</p>`;
            }

            html += '</div>';

            // Add calendar button if event date exists
            if (settings.exchange_date) {
                html += '<button id="addToCalendarBtn" class="btn btn-primary btn-sm" style="margin-top: 1rem; width: 100%;" onclick="downloadCalendar()"><i data-lucide="calendar-plus"></i> Add to Calendar</button>';
            }

            widget.innerHTML = html;

            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } else {
            widget.innerHTML = '<p style="font-size: 0.875rem; color: #999; font-style: italic;">Event details coming soon!</p>';
        }
    } catch (error) {
        console.error('Failed to load event details:', error);
        document.getElementById('eventDetailsWidget').innerHTML = '<p style="font-size: 0.875rem; color: #999; font-style: italic;">Event details unavailable</p>';
    }
}

function downloadCalendar() {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = '/api/participant/calendar.ics';
    link.download = 'secret-santa.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function drawAssignment() {
    if (!confirmAction('Are you ready to draw your Secret Santa? This cannot be undone!')) {
        return;
    }

    const drawBtn = document.getElementById('drawBtn');
    drawBtn.disabled = true;
    drawBtn.textContent = 'Drawing... 🎲';

    try {
        const response = await api('/api/participant/draw', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            document.getElementById('recipientName').textContent = data.assignedTo;
            hideElement('notPickedState');
            showElement('assignmentState');
        } else {
            alert(data.error || 'Failed to draw assignment');
            drawBtn.disabled = false;
            drawBtn.textContent = 'Draw Your Secret Santa 🎲';
        }
    } catch (error) {
        alert('An error occurred while drawing');
        drawBtn.disabled = false;
        drawBtn.textContent = 'Draw Your Secret Santa 🎲';
    }
}

// Initialize
loadAssignment();

document.getElementById('drawBtn').addEventListener('click', drawAssignment);
document.getElementById('logoutBtn').addEventListener('click', logout);

// Export function for onclick handler
window.downloadCalendar = downloadCalendar;
