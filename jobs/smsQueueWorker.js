const cron = require('node-cron');
const smsQueueService = require('../services/smsQueueService');

// Process SMS queue every minute
// Respects rate limits and time restrictions
function startSMSQueueWorker() {
    // Run every minute
    const job = cron.schedule('* * * * *', async () => {
        try {
            const rateLimit = parseInt(process.env.SMS_RATE_LIMIT) || 10;

            console.log('[SMS Queue Worker] Processing queue...');

            const result = await smsQueueService.processQueue(rateLimit);

            if (result.processed > 0) {
                console.log(
                    `[SMS Queue Worker] Processed ${result.processed} messages ` +
                    `(${result.success} success, ${result.failed} failed)`
                );
            }
        } catch (error) {
            console.error('[SMS Queue Worker] Error:', error.message);
        }
    });

    console.log('✅ SMS Queue Worker started (runs every minute)');

    return job;
}

// Cleanup old processed messages daily at 3 AM
function startQueueCleanup() {
    // Run daily at 3:00 AM
    const job = cron.schedule('0 3 * * *', async () => {
        try {
            console.log('[Queue Cleanup] Cleaning old messages...');

            const result = await smsQueueService.cleanupProcessed(30); // Delete messages older than 30 days

            if (result.success) {
                console.log(`[Queue Cleanup] Deleted ${result.deleted} old messages`);
            }
        } catch (error) {
            console.error('[Queue Cleanup] Error:', error.message);
        }
    });

    console.log('✅ Queue Cleanup started (runs daily at 3 AM)');

    return job;
}

module.exports = {
    startSMSQueueWorker,
    startQueueCleanup
};
