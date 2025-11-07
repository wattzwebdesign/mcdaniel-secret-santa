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

        document.getElementById('userName').textContent = currentUser.firstName;

        const response = await api('/api/participant/assignment');
        const data = await response.json();

        hideElement('loadingState');

        if (!data.success) {
            document.getElementById('errorMessage').textContent = data.error || 'Failed to load assignment';
            showElement('errorState');
            return;
        }

        if (data.hasPicked) {
            document.getElementById('recipientName').textContent = data.assignedTo;
            showElement('assignmentState');
        } else {
            showElement('notPickedState');
        }
    } catch (error) {
        hideElement('loadingState');
        document.getElementById('errorMessage').textContent = 'An error occurred';
        showElement('errorState');
    }
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
