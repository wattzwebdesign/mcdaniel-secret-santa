# Secret Santa Web Application - Complete Project Specification

## 🎯 Project Overview

A comprehensive web-based Secret Santa application with authentication, exclusion rules, wish lists, SMS notifications via Twilio, and MySQL persistence. Hosted on xCloud with a festive Christmas theme.

---

## 🏗️ Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0+
- **Frontend**: Vanilla HTML/CSS/JavaScript (Christmas-themed)
- **SMS Service**: Twilio API
- **Session Management**: express-session with MySQL store
- **Scheduled Jobs**: node-cron
- **Hosting**: xCloud

---

## 📊 Database Schema

### Participants Table
```sql
CREATE TABLE participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    phone_last_four VARCHAR(4) NOT NULL,
    assigned_to_id INT NULL,
    has_picked BOOLEAN DEFAULT FALSE,
    picked_at DATETIME NULL,
    
    -- SMS Notification Preferences
    sms_enabled BOOLEAN DEFAULT TRUE,
    notify_on_assignment BOOLEAN DEFAULT TRUE,
    notify_on_wishlist_update BOOLEAN DEFAULT TRUE,
    notify_on_game_start BOOLEAN DEFAULT TRUE,
    notify_reminders BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_phone (phone_number),
    UNIQUE KEY unique_participant (first_name, phone_last_four),
    FOREIGN KEY (assigned_to_id) REFERENCES participants(id) ON DELETE SET NULL
);
```

### Exclusion Rules Table
```sql
CREATE TABLE exclusion_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    excluded_participant_id INT NOT NULL,
    reason VARCHAR(255) NULL COMMENT 'e.g., spouse, sibling, parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (excluded_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exclusion (participant_id, excluded_participant_id)
);
```

### Wish List Items Table
```sql
CREATE TABLE wish_list_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    link VARCHAR(500) NULL COMMENT 'URL to product page',
    price_range VARCHAR(50) NULL COMMENT 'e.g., $20-30',
    priority INT DEFAULT 2 COMMENT '1=must have, 2=would like, 3=if budget allows',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_participant (participant_id)
);
```

### Wish List Purchases Table
```sql
CREATE TABLE wish_list_purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    wish_list_item_id INT NOT NULL,
    santa_participant_id INT NOT NULL,
    marked_purchased BOOLEAN DEFAULT TRUE,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wish_list_item_id) REFERENCES wish_list_items(id) ON DELETE CASCADE,
    FOREIGN KEY (santa_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_purchase_mark (wish_list_item_id, santa_participant_id)
);
```

### SMS Logs Table
```sql
CREATE TABLE sms_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL COMMENT 'assignment, wishlist_update, reminder, game_start',
    message_body TEXT NOT NULL,
    twilio_sid VARCHAR(100) NULL COMMENT 'Twilio message SID',
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, sent, delivered, failed, undelivered',
    error_message TEXT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_participant (participant_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
);
```

### SMS Queue Table
```sql
CREATE TABLE sms_queue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_body TEXT NOT NULL,
    priority INT DEFAULT 5 COMMENT '1=highest, 10=lowest',
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    INDEX idx_processed (processed, scheduled_for),
    INDEX idx_priority (priority, scheduled_for)
);
```

### Admin Config Table
```sql
CREATE TABLE admin_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    INDEX expires_idx (expires)
);
```

---

## 📁 Project Structure

```
secret-santa/
├── package.json
├── .env
├── .gitignore
├── server.js
├── config/
│   └── database.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── participant.js
│   ├── wishlist.js
│   └── notifications.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── participantController.js
│   ├── wishlistController.js
│   └── notificationController.js
├── services/
│   ├── assignmentService.js
│   ├── exclusionService.js
│   ├── twilioService.js
│   ├── notificationService.js
│   └── smsQueueService.js
├── jobs/
│   ├── smsQueueWorker.js
│   └── scheduledNotifications.js
├── templates/
│   └── smsTemplates.js
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── assignment.html
│   ├── wishlist.html
│   ├── recipient-wishlist.html
│   ├── preferences.html
│   ├── css/
│   │   ├── style.css
│   │   ├── snowfall.css
│   │   └── components.css
│   ├── js/
│   │   ├── main.js
│   │   ├── login.js
│   │   ├── admin.js
│   │   ├── assignment.js
│   │   ├── wishlist.js
│   │   └── preferences.js
│   └── assets/
│       └── images/
└── sql/
    └── schema.sql
```

---

## 🛣️ API Endpoints

### Authentication Routes
```
POST   /api/auth/login           - Login with first name + phone last 4
POST   /api/auth/logout          - Clear session
GET    /api/auth/status          - Check if logged in
```

### Participant Routes
```
GET    /api/participant/assignment   - Get current assignment
POST   /api/participant/draw         - Draw new assignment
GET    /api/participant/can-pick     - Check if eligible to pick
```

### Wish List Routes
```
GET    /api/wishlist/my-items          - Get logged-in user's wish list
POST   /api/wishlist/items             - Add item to wish list
PUT    /api/wishlist/items/:id         - Update wish list item
DELETE /api/wishlist/items/:id         - Delete wish list item
PATCH  /api/wishlist/items/:id/reorder - Reorder items

GET    /api/wishlist/recipient-items   - Get assigned person's wish list
PATCH  /api/wishlist/mark-purchased/:id - Mark item as purchased
```

### Notification Routes
```
GET    /api/notifications/preferences      - Get user's SMS preferences
PUT    /api/notifications/preferences      - Update SMS preferences
POST   /api/notifications/test             - Send test SMS
GET    /api/notifications/history          - Get SMS history for user
```

### Admin Routes (Protected)
```
POST   /api/admin/login                    - Admin authentication
GET    /api/admin/participants             - List all participants
POST   /api/admin/participants             - Add participant
DELETE /api/admin/participants/:id         - Remove participant
POST   /api/admin/exclusions               - Add exclusion rule
DELETE /api/admin/exclusions/:id           - Remove exclusion rule
GET    /api/admin/exclusions               - List all exclusions
POST   /api/admin/family-group             - Bulk add exclusions
GET    /api/admin/status                   - Game status
POST   /api/admin/reset-assignments        - Reset only assignments
POST   /api/admin/reset-all                - Clear everything
GET    /api/admin/validate                 - Check if game is possible

POST   /api/admin/notifications/send-all   - Trigger notification to all
POST   /api/admin/notifications/reminder   - Send specific reminder
GET    /api/admin/notifications/logs       - View all SMS logs
GET    /api/admin/notifications/stats      - SMS statistics
```

### Webhook Routes
```
POST   /api/webhooks/twilio/status    - Twilio delivery status webhook
```

---

## 🎨 Frontend Pages

### 1. Login Page (index.html)
- **Design**: Festive landing page with animated snow
- **Elements**:
  - Large "Secret Santa 🎅" header
  - Input: First Name
  - Input: Phone Number (auto-formatted)
  - "Enter" button with Christmas styling
  - Small "Admin Setup" link at bottom
  - Error message display area

### 2. Admin Setup Page (admin.html)
- **Authentication**: Password protected
- **Sections**:
  - **Participant Management**: Add, list, delete participants
  - **Exclusion Rules**: Add/remove who can't pick whom, family group quick-add
  - **SMS Notifications**: 
    - Configuration status
    - Send game start announcement
    - Send reminders
    - Test SMS functionality
    - SMS logs and statistics
  - **Game Controls**: Reset assignments, clear all, game status

### 3. Assignment Page (assignment.html)
- **Flow**:
  - Welcome message with participant name
  - If not picked: "Draw Your Secret Santa!" button
  - If picked: Display assignment with festive reveal
  - Navigation buttons:
    - View recipient's wish list
    - Edit my wish list
    - Notification preferences
    - Logout

### 4. My Wish List Page (wishlist.html)
- **Features**:
  - Add item form (name, description, link, price range, priority)
  - Display all items as festive cards
  - Edit/delete items
  - Drag-to-reorder functionality
  - Priority levels: Must Have (⭐), Would Like (⭐⭐), If Budget Allows (⭐⭐⭐)

### 5. Recipient's Wish List Page (recipient-wishlist.html)
- **Features**:
  - Display recipient's wish list sorted by priority
  - Clickable product links
  - Mark items as "purchased" (private to Santa)
  - Festive card layout
  - Back navigation

### 6. Notification Preferences Page (preferences.html)
- **Features**:
  - Toggle SMS notifications on/off
  - Individual toggles for each notification type
  - View SMS history
  - Edit phone number
  - Test notification button

---

## 🎨 Christmas Theme Design

### Color Palette
- Primary: #C41E3A (Christmas Red)
- Secondary: #165B33 (Christmas Green)
- Accent: #FFD700 (Gold)
- Background: #F8F9FA
- Text: #2C3E50

### Visual Effects
- Animated falling snowflakes
- Twinkling lights borders
- Santa hat decorations
- Holly and mistletoe accents
- Present-wrapped item cards
- Smooth transitions

### Typography
- Headers: 'Mountains of Christmas' (Google Fonts)
- Body: 'Poppins' or 'Roboto'

### Component Styling
- Buttons: Festive with hover effects (glow, lift)
- Cards: Wrapped like presents with ribbons
- Inputs: Candy cane borders
- Priority badges: Christmas ornament style
- Price tags: Christmas light bulb style

---

## 📱 SMS Notification Types

### 1. Game Start Notification
**Trigger**: Admin starts game or first participant added
```
🎅 Ho Ho Ho! Secret Santa is ready!

Login at [URL] with your name and last 4 digits of this number to draw your person.

Don't forget to add your wish list! 🎁

Reply STOP to opt out
```

### 2. Assignment Made
**Trigger**: Participant draws their Secret Santa
```
🎄 You've drawn your Secret Santa!

You're shopping for: [Recipient Name]

View their wish list at [URL]

Keep it secret! 🤫

Reply STOP to opt out
```

### 3. Wish List Update
**Trigger**: Recipient adds/updates wish list (sent to their Santa)
```
🎁 Good news!

[Recipient Name] just updated their wish list!

Check it out: [URL]

Reply STOP to opt out
```

### 4. Wish List Reminder
**Trigger**: Participant hasn't added items after 24 hours
```
🎅 Reminder: Your Secret Santa is waiting!

Help them pick the perfect gift by adding to your wish list at [URL]

Reply STOP to opt out
```

### 5. Shopping Reminder
**Trigger**: 7 days before exchange
```
⏰ Just a reminder!

Secret Santa exchange is in 7 days!

Don't forget to shop for [Recipient Name]!

Their wish list: [URL]

Reply STOP to opt out
```

### 6. Exchange Day Reminder
**Trigger**: Day of exchange
```
🎉 Today's the day!

Secret Santa gift exchange is TODAY!

You're giving to: [Recipient Name]

Have fun! 🎅🎁

Reply STOP to opt out
```

---

## 🎲 Secret Santa Assignment Algorithm

### Core Logic (assignmentService.js)
```javascript
/**
 * When a participant draws:
 * 1. Get all participants who haven't been assigned yet
 * 2. Get this participant's exclusion rules
 * 3. Filter out:
 *    - Themselves
 *    - Already assigned people
 *    - People in their exclusion list
 *    - People whose only valid pick would be this participant (prevent deadlock)
 * 4. If no valid options, return error (impossible scenario)
 * 5. Randomly select from remaining valid pool
 * 6. Update database with assignment
 * 7. Trigger SMS notification
 * 8. If recipient has wish list, notify Santa
 * 9. Return assigned person's details
 */
```

### Pre-validation
- Admin page validates that exclusion rules don't make game impossible
- Check before allowing game to start
- Warn if any participant has no valid picks

---

## 🔐 Security Implementation

### Input Validation
- Sanitize all inputs
- Phone number validation (E.164 format)
- First name: 2-50 characters, letters/spaces only
- Validate URLs in wish list items
- SQL injection prevention with parameterized queries

### Authentication
- Session-based auth with MySQL store
- Secure cookies (httpOnly, sameSite: 'strict')
- Session timeout: 24 hours
- Admin password hashing with bcrypt

### Phone Number Privacy
- Store full number for SMS (encrypted recommended)
- Only show last 4 digits in UI
- Never expose full number in API responses (except to owner)

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP
- API endpoints: 100 requests per 15 minutes
- SMS queue: 10 messages per minute

### SMS Compliance
- Respect STOP/START replies (Twilio auto-handles)
- Log all opt-in/opt-out events
- No SMS before 9 AM or after 9 PM
- Include opt-out language in all messages

---

## 📦 Dependencies (package.json)

```json
{
  "name": "secret-santa",
  "version": "1.0.0",
  "description": "Secret Santa web application with SMS notifications",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "express-session": "^1.17.3",
    "express-mysql-session": "^3.0.0",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "twilio": "^4.20.0",
    "node-cron": "^3.0.3",
    "libphonenumber-js": "^1.10.51",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 🌍 Environment Variables (.env)

```env
# Database Configuration
DB_HOST=your-xcloud-mysql-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=secret_santa
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secret-key-change-this-in-production

# Admin Authentication
ADMIN_PASSWORD=your-secure-admin-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application Configuration
APP_URL=https://your-secret-santa.com
SMS_ENABLED=true
SMS_RATE_LIMIT=10
EXCHANGE_DATE=2025-12-25

# Optional: Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

---

## 🔄 User Flow

### Participant Flow
```
1. Receive SMS: "Game is ready!"
2. Click link → Login page
3. Enter first name + phone number
4. Login → Assignment page
5. Click "Draw Secret Santa" button
6. See reveal animation
7. Receive SMS: "You drew [Name]!"
8. Click "View Their Wish List"
9. Browse recipient's items
10. Mark items as purchased (optional)
11. Click "Edit My Wish List"
12. Add gift ideas with priorities
13. Recipient's Santa receives SMS: "Wish list updated!"
14. Receive reminder SMS 7 days before exchange
15. Receive "Today's the day!" SMS on exchange day
```

### Admin Flow
```
1. Navigate to /admin.html
2. Enter admin password
3. Add all participants (name + full phone number)
4. Set up exclusion rules (families, couples)
5. Test SMS functionality
6. Click "Send Game Start Notification"
7. Monitor SMS logs and statistics
8. Check game status (who has picked)
9. Send reminders as needed
10. After exchange: Reset for next year
```

---

## 🧪 Testing Requirements

### Functional Tests
- [ ] Participant can login with correct credentials
- [ ] Participant cannot login with wrong credentials
- [ ] Exclusion rules prevent invalid picks
- [ ] Each person can only be picked once
- [ ] Participant can view assignment after picking
- [ ] Assignment algorithm handles edge cases
- [ ] Admin can add/remove participants
- [ ] Admin can add/remove exclusions
- [ ] Reset functionality works correctly
- [ ] Game validates before allowing picks

### Wish List Tests
- [ ] Participant can add/edit/delete wish list items
- [ ] Santa can only view their recipient's list
- [ ] Purchase marking is private to Santa
- [ ] Item links validate and open correctly
- [ ] Priority sorting works correctly

### SMS Tests
- [ ] Twilio credentials validate correctly
- [ ] Test SMS sends successfully
- [ ] Phone number validation works
- [ ] Game start notification sends to all
- [ ] Assignment notification triggers
- [ ] Wish list update notifies Santa only
- [ ] Reminders schedule correctly
- [ ] Opt-out preferences respected
- [ ] SMS queue processes in order
- [ ] Rate limiting prevents throttling
- [ ] Delivery status updates correctly
- [ ] Failed messages retry appropriately
- [ ] No SMS sent outside 9 AM - 9 PM

### UI/UX Tests
- [ ] Christmas animations work smoothly
- [ ] Mobile responsive design
- [ ] All forms validate properly
- [ ] Error messages display correctly
- [ ] Loading states show appropriately
- [ ] Navigation flows logically

---

## 🚀 Deployment on xCloud

### Prerequisites
1. xCloud account with Node.js support
2. MySQL database created
3. Twilio account with phone number
4. Domain name configured (optional)

### Deployment Steps
1. Upload all files to xCloud server
2. Install dependencies: `npm install`
3. Configure .env file with production values
4. Run database schema: `mysql < sql/schema.sql`
5. Test database connection
6. Verify Twilio credentials
7. Start application: `npm start`
8. Configure process manager (PM2 recommended)
9. Set up Nginx reverse proxy (optional)
10. Configure SSL certificate
11. Test all functionality
12. Monitor logs for errors

### Post-Deployment
- Set up automated backups for database
- Monitor SMS usage and costs
- Configure log rotation
- Set up uptime monitoring
- Test webhook endpoint accessibility

---

## 💰 Cost Estimates

### Twilio SMS (US/Canada)
- Cost per SMS: $0.0079
- Example: 20 participants × 4 messages = 80 SMS = **$0.63**
- Example: 50 participants × 5 messages = 250 SMS = **$1.98**

### Optimization
- Use SMS queue to batch sends
- Respect user preferences
- Monitor failed sends
- Set daily/weekly limits in admin

---

## 🎯 Core Features Summary

### MVP Features
✅ Phone-based authentication (first name + last 4 digits)
✅ Exclusion rules (family members, etc.)
✅ Random Secret Santa assignment
✅ One person picked per participant
✅ Assignment persistence
✅ Christmas-themed UI
✅ MySQL database
✅ Admin management panel

### Enhanced Features
✅ Wish list integration
✅ Priority levels for wish items
✅ Product links
✅ Santa purchase tracking
✅ SMS notifications via Twilio
✅ Game start announcements
✅ Wish list update alerts
✅ Shopping reminders
✅ Exchange day reminders
✅ Notification preferences
✅ SMS delivery tracking

---

## 📝 Implementation Notes

### Critical Considerations
1. **Phone Number Handling**: Store in E.164 format (+1XXXXXXXXXX)
2. **Assignment Logic**: Must handle edge cases and prevent deadlocks
3. **SMS Timing**: Respect time zones and quiet hours (9 AM - 9 PM)
4. **Rate Limiting**: Both API and SMS need proper throttling
5. **Session Security**: Use secure cookies and proper timeout
6. **Database Indexes**: Add indexes for frequently queried fields
7. **Error Handling**: Graceful fallbacks for all failure scenarios
8. **Mobile First**: Design for mobile screens primarily

### Best Practices
- Use prepared statements for all database queries
- Log all SMS attempts and results
- Validate all inputs on both client and server
- Keep messages under 160 characters when possible
- Use transaction for assignment creation
- Implement proper error boundaries in frontend
- Add loading states for all async operations
- Provide clear user feedback for all actions

---

## 🔧 Scheduled Jobs

### SMS Queue Processor
- Runs: Every minute
- Purpose: Process pending SMS from queue
- Rate: 10 messages per minute maximum

### Wish List Reminder
- Runs: Daily at 10 AM
- Purpose: Remind participants without wish lists
- Condition: 24+ hours after picking, no items added

### Shopping Reminder
- Runs: Daily at 10 AM
- Purpose: Send 7-day countdown reminder
- Condition: Exactly 7 days before exchange date

### Exchange Day Reminder
- Runs: At 9 AM on exchange date
- Purpose: Send "today's the day!" message
- Condition: On configured exchange date

---

## 🎁 Future Enhancements (Optional)

- Anonymous messaging between Santa and recipient
- Budget setter for gift price range
- Gift receipt photo upload
- Export assignments to CSV
- Multi-event support (multiple games)
- Email fallback if SMS fails
- Gift idea suggestions
- Integration with wishlists from retailers
- Mobile app (React Native)
- Social media sharing

---

## 📞 Support & Documentation

### For Users
- Login help: Use first name and last 4 digits of phone
- Forgot assignment: Login again to view
- SMS not received: Check preferences page
- Can't pick anyone: Contact admin (likely exclusion issue)

### For Admin
- Game won't start: Validate exclusion rules first
- SMS not sending: Check Twilio credentials and balance
- Participant can't login: Verify phone number and name match exactly
- Reset game: Use "Reset Assignments" to keep participants

---

## 🔍 Troubleshooting Guide

### Common Issues

**SMS Not Sending**
- Check Twilio account balance
- Verify phone numbers are in E.164 format
- Check SMS logs for error messages
- Ensure webhook URL is accessible

**Assignment Failed**
- Run game validation endpoint
- Check for circular exclusion rules
- Verify enough participants for exclusions
- Check database logs

**Login Not Working**
- Verify exact name match (case-sensitive)
- Check phone number last 4 digits
- Ensure participant exists in database
- Check session configuration

**Wish List Not Showing**
- Verify assignment exists
- Check database foreign key relationships
- Ensure user is logged in
- Check API endpoint responses

---

## ✅ Pre-Launch Checklist

### Technical
- [ ] All database tables created
- [ ] Environment variables configured
- [ ] Twilio credentials tested
- [ ] Database connection verified
- [ ] All API endpoints tested
- [ ] SMS queue worker running
- [ ] Scheduled jobs configured
- [ ] Admin password set
- [ ] SSL certificate installed
- [ ] Backup system configured

### Content
- [ ] Admin account created
- [ ] Test participants added
- [ ] Exclusion rules tested
- [ ] SMS templates reviewed
- [ ] Error messages verified
- [ ] Help documentation available

### Functionality
- [ ] Login flow tested
- [ ] Assignment algorithm validated
- [ ] Wish list features working
- [ ] SMS notifications sending
- [ ] Admin panel accessible
- [ ] Mobile responsiveness verified
- [ ] All forms validating
- [ ] Navigation working correctly

---

## 📄 License & Credits

This is a custom Secret Santa application built for personal/organizational use.

**Technologies Used:**
- Node.js & Express
- MySQL
- Twilio API
- Google Fonts (Mountains of Christmas)

---

**Project Start Date**: November 2025  
**Target Launch**: December 2025  
**Built for**: xCloud hosting environment

---

END OF SPECIFICATION
