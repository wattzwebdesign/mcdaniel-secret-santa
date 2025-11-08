require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./config/database');
const twilioService = require('./services/twilioService');

// Import routes
const authRoutes = require('./routes/auth');
const participantRoutes = require('./routes/participant');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// Import jobs
const { startSMSQueueWorker, startQueueCleanup } = require('./jobs/smsQueueWorker');
const { startAllNotificationJobs } = require('./jobs/scheduledNotifications');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====

// Trust proxy (required for Cloudflare/Nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for development, enable in production with proper config
}));

// CORS
app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);

// Session configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
    createDatabaseTable: false, // We created it in schema.sql
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

app.use(session({
    key: 'secret_santa_session',
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.mcdanielfamilychristmas.com' : undefined
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ===== API ROUTES =====

app.use('/api/auth', authRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Twilio webhook for SMS delivery status
app.post('/api/webhooks/twilio/status', express.urlencoded({ extended: false }), async (req, res) => {
    try {
        const { MessageSid, MessageStatus, ErrorMessage } = req.body;

        console.log(`[Twilio Webhook] SID: ${MessageSid}, Status: ${MessageStatus}`);

        await twilioService.updateSMSStatus(
            MessageSid,
            MessageStatus,
            ErrorMessage || null
        );

        res.sendStatus(200);
    } catch (error) {
        console.error('[Twilio Webhook] Error:', error.message);
        res.sendStatus(500);
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        smsEnabled: twilioService.isSmsEnabled()
    });
});

// ===== HTML ROUTES =====

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/assignment.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'assignment.html'));
});

app.get('/wishlist.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'wishlist.html'));
});

app.get('/recipient-wishlist.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recipient-wishlist.html'));
});

app.get('/preferences.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'preferences.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message
    });
});

// ===== START SERVER =====

async function startServer() {
    try {
        // Test database connection
        const dbConnected = await db.testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Validate Twilio configuration (warning only)
        const twilioValidation = await twilioService.validateTwilioConfig();
        if (twilioValidation.valid) {
            console.log(`✅ Twilio connected: ${twilioValidation.accountName}`);
        } else {
            console.warn(`⚠️  Twilio not configured: ${twilioValidation.message}`);
            console.warn('   SMS notifications will be disabled');
        }

        // Start scheduled jobs
        if (process.env.NODE_ENV !== 'test') {
            startSMSQueueWorker();
            startQueueCleanup();
            startAllNotificationJobs();
        }

        // Start HTTP server
        app.listen(PORT, () => {
            console.log('');
            console.log('🎅 ================================================');
            console.log('   Secret Santa Application Started!');
            console.log('   ================================================');
            console.log(`   🌐 Server: http://localhost:${PORT}`);
            console.log(`   📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   📱 SMS: ${twilioService.isSmsEnabled() ? 'Enabled' : 'Disabled'}`);
            console.log('   ================================================');
            console.log('');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

module.exports = app; // For testing
