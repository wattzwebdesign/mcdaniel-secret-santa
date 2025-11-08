// Create random snowfall effect
document.addEventListener('DOMContentLoaded', () => {
    const snowfallContainer = document.querySelector('.snowfall');
    if (!snowfallContainer) return;

    const snowflakeChars = ['❄', '❅', '❆', '✻'];
    const numberOfSnowflakes = 30;

    for (let i = 0; i < numberOfSnowflakes; i++) {
        createSnowflake();
    }

    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];

        // Random starting position
        const startPositionX = Math.random() * 100;
        const endPositionX = startPositionX + (Math.random() * 20 - 10); // Drift left or right

        // Random size
        const size = Math.random() * 10 + 12; // 12-22px

        // Random animation duration (slower = more realistic)
        const duration = Math.random() * 15 + 10; // 10-25 seconds

        // Random delay
        const delay = Math.random() * 5; // 0-5 seconds

        // Random opacity
        const opacity = Math.random() * 0.6 + 0.4; // 0.4-1.0

        snowflake.style.cssText = `
            position: absolute;
            left: ${startPositionX}%;
            top: -10%;
            font-size: ${size}px;
            opacity: ${opacity};
            color: white;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
            pointer-events: none;
            user-select: none;
            animation: snowfallDrop ${duration}s linear ${delay}s infinite;
            --end-x: ${endPositionX}%;
        `;

        snowfallContainer.appendChild(snowflake);
    }
});
