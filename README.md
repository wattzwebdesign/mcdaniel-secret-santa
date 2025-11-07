# 🎅 Secret Santa Web Application

A comprehensive web-based Secret Santa application with authentication, exclusion rules, wish lists, SMS notifications via Twilio, and MySQL persistence. Features a festive Christmas-themed UI with animated snowfall and mobile-responsive design.

## ✨ Features

### Core Functionality
- **Phone-Based Authentication** - Login with first name + last 4 digits of phone number
- **Smart Assignment Algorithm** - Random assignment with deadlock prevention
- **Exclusion Rules** - Prevent family members/couples from picking each other
- **Wish Lists** - Participants can create prioritized gift lists
- **SMS Notifications** - Automated reminders and updates via Twilio
- **Admin Panel** - Complete game management and monitoring
- **Christmas Theme** - Festive UI with animations and snowfall

### User Features
- ✅ Draw Secret Santa assignment with one click
- ✅ View assigned person's wish list
- ✅ Add/edit/delete wish list items with priorities
- ✅ Mark items as purchased (private to Santa)
- ✅ Manage SMS notification preferences
- ✅ View SMS history

### Admin Features
- ✅ Add/remove participants
- ✅ Create exclusion rules
- ✅ Bulk family group exclusions
- ✅ Validate game is possible
- ✅ Send notifications (game start, reminders, exchange day)
- ✅ View game status and SMS statistics
- ✅ Reset assignments or clear all data

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Twilio account (for SMS)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd mcdaniel-secret-santa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   - Create a MySQL database named `secret_santa`
   - Run the schema:
   ```bash
   mysql -u your_user -p secret_santa < sql/schema.sql
   ```

4. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your configuration:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=secret_santa
   DB_PORT=3306

   # Server
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-random-secret-key

   # Admin
   ADMIN_PASSWORD=your-secure-admin-password

   # Twilio
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890

   # App
   APP_URL=http://localhost:3000
   SMS_ENABLED=true
   SMS_RATE_LIMIT=10
   EXCHANGE_DATE=2025-12-25
   ```

5. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - User login: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

## 📁 Project Structure

```
secret-santa/
├── config/
│   └── database.js          # Database connection and utilities
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation rules
├── routes/
│   ├── admin.js             # Admin API routes
│   ├── auth.js              # Authentication routes
│   ├── participant.js       # Participant routes
│   ├── wishlist.js          # Wish list routes
│   └── notifications.js     # Notification routes
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   ├── participantController.js
│   ├── wishlistController.js
│   └── notificationController.js
├── services/
│   ├── assignmentService.js # Assignment algorithm
│   ├── exclusionService.js  # Exclusion rule logic
│   ├── twilioService.js     # SMS sending
│   ├── notificationService.js
│   └── smsQueueService.js   # SMS queue management
├── jobs/
│   ├── smsQueueWorker.js    # Process SMS queue
│   └── scheduledNotifications.js
├── templates/
│   └── smsTemplates.js      # SMS message templates
├── public/
│   ├── index.html           # Login page
│   ├── admin.html           # Admin panel
│   ├── assignment.html      # Assignment page
│   ├── wishlist.html        # My wish list
│   ├── recipient-wishlist.html
│   ├── preferences.html     # Notification settings
│   ├── css/
│   │   ├── style.css
│   │   ├── snowfall.css
│   │   └── components.css
│   └── js/
│       ├── main.js
│       ├── login.js
│       ├── admin.js
│       ├── assignment.js
│       ├── wishlist.js
│       └── preferences.js
├── sql/
│   └── schema.sql           # Database schema
├── server.js                # Main application entry
├── package.json
└── .env.example
```

## 🎯 Usage Guide

### For Participants

1. **Login**
   - Go to the homepage
   - Enter your first name and phone number
   - You'll be logged in automatically

2. **Draw Your Secret Santa**
   - Click "Draw Your Secret Santa" button
   - You'll see who you're shopping for
   - This can only be done once!

3. **View Their Wish List**
   - Click "View Their Wish List"
   - See all items they've added
   - Mark items as purchased (only you can see this)

4. **Add Your Own Wish List**
   - Click "Edit My Wish List"
   - Add items with descriptions, links, prices, and priorities
   - Your Secret Santa will receive an SMS notification

5. **Manage Notifications**
   - Click "Notification Settings"
   - Toggle SMS notifications on/off
   - Choose which types of messages to receive

### For Administrators

1. **Access Admin Panel**
   - Go to `/admin.html`
   - Enter admin password

2. **Add Participants**
   - Enter first name and full phone number
   - Participants will receive SMS when game starts

3. **Set Up Exclusion Rules**
   - Select two people who can't pick each other
   - Use family group quick-add for bulk exclusions

4. **Start the Game**
   - Validate game is possible
   - Send "Game Start" notification
   - Participants can then login and draw

5. **Monitor Progress**
   - View who has picked and who hasn't
   - Check SMS statistics
   - Send reminders as needed

6. **Send Notifications**
   - Game Start: When ready to begin
   - Wish List Reminder: For those without items
   - Shopping Reminder: Days before exchange
   - Exchange Day: Morning of the event

## 📱 SMS Notifications

### Notification Types

1. **Game Start** - "Ho Ho Ho! Secret Santa is ready!"
2. **Assignment Made** - "You've drawn your Secret Santa!"
3. **Wish List Update** - Recipient updated their list
4. **Wish List Reminder** - No items added after 24 hours
5. **Shopping Reminder** - 7 days before exchange
6. **Exchange Day** - Morning of exchange

### SMS Compliance

- All messages include "Reply STOP to opt out"
- Only sent between 9 AM - 9 PM
- Rate limited to 10 messages per minute
- Respects user opt-out preferences
- Delivery status tracked via Twilio webhook

## 🔒 Security Features

- **Session-based authentication** with secure cookies
- **Password hashing** for admin access
- **SQL injection prevention** with parameterized queries
- **Input validation** on all endpoints
- **Rate limiting** on login and API endpoints
- **Phone number privacy** - only last 4 digits shown
- **XSS protection** with proper escaping

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Participant login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Participant
- `GET /api/participant/assignment` - Get assignment
- `POST /api/participant/draw` - Draw Secret Santa
- `GET /api/participant/can-pick` - Check eligibility

### Wish List
- `GET /api/wishlist/my-items` - Get my items
- `POST /api/wishlist/items` - Add item
- `PUT /api/wishlist/items/:id` - Update item
- `DELETE /api/wishlist/items/:id` - Delete item
- `GET /api/wishlist/recipient-items` - Get recipient's list
- `PATCH /api/wishlist/mark-purchased/:id` - Mark purchased

### Notifications
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/test` - Send test SMS
- `GET /api/notifications/history` - Get SMS history

### Admin
- `GET /api/admin/participants` - List participants
- `POST /api/admin/participants` - Add participant
- `DELETE /api/admin/participants/:id` - Remove participant
- `GET /api/admin/exclusions` - List exclusions
- `POST /api/admin/exclusions` - Add exclusion
- `DELETE /api/admin/exclusions/:id` - Remove exclusion
- `POST /api/admin/family-group` - Bulk exclusions
- `GET /api/admin/status` - Game status
- `POST /api/admin/reset-assignments` - Reset assignments
- `POST /api/admin/reset-all` - Clear all data
- `GET /api/admin/validate` - Validate game
- `POST /api/admin/notifications/send-all` - Send notification
- `GET /api/admin/notifications/logs` - SMS logs
- `GET /api/admin/notifications/stats` - SMS statistics

## 🎨 Customization

### Christmas Theme Colors
Edit `public/css/style.css`:
```css
:root {
    --christmas-red: #C41E3A;
    --christmas-green: #165B33;
    --christmas-gold: #FFD700;
}
```

### SMS Message Templates
Edit `templates/smsTemplates.js` to customize messages.

### Exchange Date
Set `EXCHANGE_DATE` in `.env` file.

## 🐛 Troubleshooting

### SMS Not Sending
- Check Twilio credentials in `.env`
- Verify phone numbers are in E.164 format (+1XXXXXXXXXX)
- Check SMS logs in admin panel
- Ensure `SMS_ENABLED=true`

### Login Not Working
- Verify name matches exactly (case-sensitive)
- Check phone number last 4 digits
- Ensure participant exists in database

### Assignment Failed
- Run game validation in admin panel
- Check for circular exclusion rules
- Verify enough participants for exclusions

### Database Connection Failed
- Check MySQL is running
- Verify database credentials in `.env`
- Ensure `secret_santa` database exists

## 📊 Database Schema

8 tables:
- `participants` - User data and SMS preferences
- `exclusion_rules` - Who can't pick whom
- `wish_list_items` - Gift ideas
- `wish_list_purchases` - Purchase tracking
- `sms_logs` - SMS delivery tracking
- `sms_queue` - Pending messages
- `admin_config` - Configuration
- `sessions` - Session store

See `sql/schema.sql` for full schema.

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET`
- [ ] Hash admin password with bcrypt
- [ ] Enable HTTPS
- [ ] Set up SSL certificate
- [ ] Configure firewall
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up uptime monitoring
- [ ] Test Twilio webhook accessibility

### Recommended Hosting
- **Server**: xCloud, DigitalOcean, AWS EC2
- **Database**: MySQL 8.0+ on same server or RDS
- **Process Manager**: PM2 for auto-restart
- **Reverse Proxy**: Nginx for SSL termination

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📝 License

This project is provided as-is for personal use.

## 🎄 Credits

- Built with Node.js, Express, and MySQL
- SMS via Twilio API
- Christmas fonts from Google Fonts
- Icons and emojis from Unicode

## 📧 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the project specification in `SECRET_SANTA_PROJECT_SPEC.md`
3. Check database logs and SMS logs in admin panel

---

**Happy Holidays! 🎅🎁🎄**
