# 🎅 Quick Start Guide - Secret Santa Application

Get up and running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- MySQL 8.0+ installed and running
- Twilio account (optional for development)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE secret_santa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Use the database
USE secret_santa;

# Exit MySQL
EXIT;

# Import schema
mysql -u root -p secret_santa < sql/schema.sql
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Minimum required settings for local development:**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=secret_santa
DB_PORT=3306

# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=my-super-secret-key-for-development

# Admin
ADMIN_PASSWORD=admin123

# Twilio (can disable for testing)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
APP_URL=http://localhost:3000
SMS_ENABLED=false
SMS_RATE_LIMIT=10
EXCHANGE_DATE=2025-12-25
```

**Note:** Set `SMS_ENABLED=false` for testing without Twilio.

### 4. Start the Application

```bash
npm start
```

You should see:
```
✅ Database connected successfully
⚠️  Twilio not configured: Twilio credentials not configured
   SMS notifications will be disabled
✅ SMS Queue Worker started (runs every minute)
✅ Queue Cleanup started (runs daily at 3 AM)
✅ Wish List Reminders started (runs daily at 10 AM)
✅ Shopping Reminders started (runs daily at 10 AM)
✅ Exchange Day Reminder started (runs daily at 9 AM)

🎅 ================================================
   Secret Santa Application Started!
   ================================================
   🌐 Server: http://localhost:3000
   📊 Environment: development
   📱 SMS: Disabled
   ================================================
```

### 5. Access the Application

Open your browser and go to:
- **User Interface:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin.html

## First Time Setup

### Admin Setup

1. Go to http://localhost:3000/admin.html
2. Login with password: `admin123` (or whatever you set in `.env`)
3. Add participants:
   - Name: `John`, Phone: `+15551234567`
   - Name: `Jane`, Phone: `+15551234568`
   - Name: `Bob`, Phone: `+15551234569`
   - Name: `Alice`, Phone: `+15551234570`

4. Set up exclusion rules (optional):
   - John cannot pick Jane (spouse)
   - Jane cannot pick John (spouse)

5. Validate the game:
   - Click "Validate Game" button
   - Should show: "Game is valid! ✅"

### Participant Login

1. Go to http://localhost:3000
2. Login as a participant:
   - First Name: `John`
   - Phone Number: `(555) 123-4567`
   - Click "Enter"

3. Draw your Secret Santa:
   - Click "Draw Your Secret Santa 🎲"
   - You'll see who you're shopping for!

4. Add wish list items:
   - Click "Edit My Wish List"
   - Add some items with descriptions, links, and priorities

5. View recipient's wish list:
   - Click "View Their Wish List"
   - See items they've added
   - Mark items as purchased

## Testing Checklist

After setup, verify these features work:

- [ ] Admin login works
- [ ] Can add participants
- [ ] Can add exclusion rules
- [ ] Game validation works
- [ ] Participant login works
- [ ] Can draw Secret Santa
- [ ] Can only draw once
- [ ] Can add wish list items
- [ ] Can edit/delete wish list items
- [ ] Can view recipient's wish list
- [ ] Can mark items as purchased
- [ ] Notification preferences save
- [ ] Game status shows correctly in admin

## Enable SMS (Optional)

### 1. Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get a phone number ($1/month)
3. Find your Account SID and Auth Token in the console

### 2. Update .env

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
SMS_ENABLED=true
```

### 3. Restart Application

```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

You should now see:
```
✅ Twilio connected: Your Account Name
📱 SMS: Enabled
```

### 4. Test SMS

1. Go to Admin Panel
2. Add yourself as a participant with your real phone number
3. Login as that participant
4. Go to Preferences
5. Click "Send Test SMS 📱"
6. You should receive a text message!

## Development Tips

### Hot Reload

For development with auto-restart on file changes:

```bash
npm install -g nodemon
npm run dev
```

### View Logs

Application logs show in the console. Look for:
- `✅` Success messages
- `⚠️` Warnings
- `❌` Errors

### Database Management

```bash
# View all participants
mysql -u root -p secret_santa -e "SELECT * FROM participants;"

# View assignments
mysql -u root -p secret_santa -e "SELECT p.first_name, r.first_name as assigned_to FROM participants p LEFT JOIN participants r ON p.assigned_to_id = r.id;"

# Reset everything (careful!)
mysql -u root -p secret_santa < sql/schema.sql
```

### Common Issues

**Port Already in Use**
```bash
# Change PORT in .env to 3001 or another port
PORT=3001
```

**Database Connection Failed**
```bash
# Verify MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # macOS
```

**Admin Password Not Working**
```bash
# Make sure there are no extra spaces in .env
ADMIN_PASSWORD=admin123  # No quotes needed
```

## Next Steps

1. **Read the README.md** for complete documentation
2. **Review DEPLOYMENT.md** for production deployment
3. **Check SECRET_SANTA_PROJECT_SPEC.md** for detailed specifications
4. **Customize the theme** in `public/css/style.css`
5. **Modify SMS messages** in `templates/smsTemplates.js`

## Support

If you run into issues:
1. Check the console for error messages
2. Verify database connection
3. Review the logs
4. Check that all environment variables are set correctly

## Development Workflow

```bash
# 1. Make changes to code
# 2. Restart server (if not using nodemon)
# 3. Test in browser
# 4. Check console for errors
# 5. Repeat!
```

## Project Structure Quick Reference

```
├── server.js              # Main entry point
├── config/                # Database connection
├── middleware/            # Auth & validation
├── routes/                # API routes
├── controllers/           # Request handlers
├── services/              # Business logic
├── jobs/                  # Scheduled tasks
├── templates/             # SMS messages
├── public/
│   ├── *.html            # Frontend pages
│   ├── css/              # Styles
│   └── js/               # Client-side logic
└── sql/
    └── schema.sql        # Database schema
```

## Helpful Commands

```bash
# Install dependencies
npm install

# Start application
npm start

# Start with auto-reload (development)
npm run dev

# View package scripts
npm run

# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

---

**You're all set! Happy coding! 🎅🎄**

**Questions?** Check the full documentation in README.md
