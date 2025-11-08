// SMS message templates with character count optimization

function getGameStartMessage(appUrl) {
    return `🎅 Ho Ho Ho! Secret Santa is ready!

Login at ${appUrl} with your name and last 4 digits of this number to draw your person.

Don't forget to add your wish list! 🎁`;
}

function getAssignmentMessage(recipientName, appUrl) {
    return `🎄 You've drawn your Secret Santa!

You're shopping for: ${recipientName}

View their wish list at ${appUrl}/recipient-wishlist.html

Keep it secret! 🤫`;
}

function getWishListUpdateMessage(recipientName, appUrl) {
    return `🎁 Good news!

${recipientName} just updated their wish list!

Check it out: ${appUrl}/recipient-wishlist.html`;
}

function getWishListReminderMessage(appUrl) {
    return `🎅 Reminder: Your Secret Santa is waiting!

Help them pick the perfect gift by adding to your wish list at ${appUrl}/wishlist.html`;
}

function getShoppingReminderMessage(recipientName, daysRemaining, appUrl) {
    return `⏰ Just a reminder!

Secret Santa exchange is in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}!

Don't forget to shop for ${recipientName}!

Their wish list: ${appUrl}/recipient-wishlist.html`;
}

function getExchangeDayMessage(recipientName) {
    return `🎉 Today's the day!

Secret Santa gift exchange is TODAY!

You're giving to: ${recipientName}

Have fun! 🎅🎁`;
}

function getTestMessage(firstName) {
    return `🧪 Test Message

Hi ${firstName}! This is a test message from your Secret Santa app.

If you received this, SMS notifications are working! ✅`;
}

// Get message by type
function getMessage(type, data = {}) {
    const appUrl = data.appUrl || process.env.APP_URL || 'http://localhost:3000';

    switch (type) {
        case 'game_start':
            return getGameStartMessage(appUrl);

        case 'assignment':
            if (!data.recipientName) {
                throw new Error('recipientName is required for assignment message');
            }
            return getAssignmentMessage(data.recipientName, appUrl);

        case 'wishlist_update':
            if (!data.recipientName) {
                throw new Error('recipientName is required for wishlist_update message');
            }
            return getWishListUpdateMessage(data.recipientName, appUrl);

        case 'wishlist_reminder':
            return getWishListReminderMessage(appUrl);

        case 'shopping_reminder':
            if (!data.recipientName) {
                throw new Error('recipientName is required for shopping_reminder message');
            }
            return getShoppingReminderMessage(
                data.recipientName,
                data.daysRemaining || 7,
                appUrl
            );

        case 'exchange_day':
            if (!data.recipientName) {
                throw new Error('recipientName is required for exchange_day message');
            }
            return getExchangeDayMessage(data.recipientName);

        case 'test':
            return getTestMessage(data.firstName || 'there');

        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}

// Validate message length (Twilio recommends under 160 characters for single SMS)
function validateMessageLength(message) {
    return {
        length: message.length,
        segments: Math.ceil(message.length / 160),
        isSingleSegment: message.length <= 160
    };
}

module.exports = {
    getMessage,
    validateMessageLength,
    getGameStartMessage,
    getAssignmentMessage,
    getWishListUpdateMessage,
    getWishListReminderMessage,
    getShoppingReminderMessage,
    getExchangeDayMessage,
    getTestMessage
};
