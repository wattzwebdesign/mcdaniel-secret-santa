// Login page functionality

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('phoneNumber');

    // Only allow numbers in last 4 digits input
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const firstName = document.getElementById('firstName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value;

        setButtonLoading('loginBtn', true);

        try {
            const response = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ firstName, phoneNumber })
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/assignment.html';
            } else {
                showError(data.message || 'Login failed');
                setButtonLoading('loginBtn', false);
            }
        } catch (error) {
            showError('An error occurred during login');
            setButtonLoading('loginBtn', false);
        }
    });
});
