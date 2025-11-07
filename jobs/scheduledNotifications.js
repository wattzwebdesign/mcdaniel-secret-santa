const cron = require('node-cron');
const notificationService = require('../services/notificationService');

// Send wish list reminders daily at 10 AM
// Reminds participants who picked but haven't added wish list items
function startWishListReminders() {
    // Run daily at 10:00 AM
    const job = cron.schedule('0 10 * * *', async () => {
        try {
            console.log('[Wish List Reminders] Sending reminders...');

            const result = await notificationService.notifyWishListReminders();

            if (result.success) {
                console.log(
                    `[Wish List Reminders] Queued ${result.queued} reminders ` +
                    `(${result.total} eligible)`
                );
            } else {
                console.error('[Wish List Reminders] Error:', result.error);
            }
        } catch (error) {
            console.error('[Wish List Reminders] Error:', error.message);
        }
    });

    console.log('✅ Wish List Reminders started (runs daily at 10 AM)');

    return job;
}

// Send shopping reminder X days before exchange
// Checks exchange date from environment variable
function startShoppingReminders() {
    // Run daily at 10:00 AM
    const job = cron.schedule('0 10 * * *', async () => {
        try {
            const exchangeDateStr = process.env.EXCHANGE_DATE;

            if (!exchangeDateStr) {
                console.log('[Shopping Reminders] EXCHANGE_DATE not configured');
                return;
            }

            const exchangeDate = new Date(exchangeDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            exchangeDate.setHours(0, 0, 0, 0);

            const daysUntilExchange = Math.ceil(
                (exchangeDate - today) / (1000 * 60 * 60 * 24)
            );

            // Send reminder 7 days before exchange
            if (daysUntilExchange === 7) {
                console.log('[Shopping Reminders] Sending 7-day reminders...');

                const result = await notificationService.notifyShoppingReminder(7);

                if (result.success) {
                    console.log(
                        `[Shopping Reminders] Queued ${result.queued} reminders ` +
                        `(${result.total} eligible)`
                    );
                } else {
                    console.error('[Shopping Reminders] Error:', result.error);
                }
            }

            // Send reminder 3 days before exchange
            if (daysUntilExchange === 3) {
                console.log('[Shopping Reminders] Sending 3-day reminders...');

                const result = await notificationService.notifyShoppingReminder(3);

                if (result.success) {
                    console.log(
                        `[Shopping Reminders] Queued ${result.queued} reminders ` +
                        `(${result.total} eligible)`
                    );
                }
            }

            // Send reminder 1 day before exchange
            if (daysUntilExchange === 1) {
                console.log('[Shopping Reminders] Sending final day reminders...');

                const result = await notificationService.notifyShoppingReminder(1);

                if (result.success) {
                    console.log(
                        `[Shopping Reminders] Queued ${result.queued} reminders ` +
                        `(${result.total} eligible)`
                    );
                }
            }
        } catch (error) {
            console.error('[Shopping Reminders] Error:', error.message);
        }
    });

    console.log('✅ Shopping Reminders started (runs daily at 10 AM)');

    return job;
}

// Send exchange day reminder on the day of exchange
function startExchangeDayReminder() {
    // Run daily at 9:00 AM
    const job = cron.schedule('0 9 * * *', async () => {
        try {
            const exchangeDateStr = process.env.EXCHANGE_DATE;

            if (!exchangeDateStr) {
                console.log('[Exchange Day Reminder] EXCHANGE_DATE not configured');
                return;
            }

            const exchangeDate = new Date(exchangeDateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            exchangeDate.setHours(0, 0, 0, 0);

            // Send reminder on exchange day
            if (today.getTime() === exchangeDate.getTime()) {
                console.log('[Exchange Day Reminder] Sending today\'s the day reminders...');

                const result = await notificationService.notifyExchangeDay();

                if (result.success) {
                    console.log(
                        `[Exchange Day Reminder] Queued ${result.queued} reminders ` +
                        `(${result.total} eligible)`
                    );
                } else {
                    console.error('[Exchange Day Reminder] Error:', result.error);
                }
            }
        } catch (error) {
            console.error('[Exchange Day Reminder] Error:', error.message);
        }
    });

    console.log('✅ Exchange Day Reminder started (runs daily at 9 AM)');

    return job;
}

// Start all scheduled notification jobs
function startAllNotificationJobs() {
    const jobs = {
        wishListReminders: startWishListReminders(),
        shoppingReminders: startShoppingReminders(),
        exchangeDayReminder: startExchangeDayReminder()
    };

    return jobs;
}

module.exports = {
    startWishListReminders,
    startShoppingReminders,
    startExchangeDayReminder,
    startAllNotificationJobs
};
