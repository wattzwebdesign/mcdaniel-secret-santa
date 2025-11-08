# ✅ Setup Checklist - McDaniel Secret Santa

Complete these steps in order to get your Secret Santa application running.

---

## 📋 Pre-Deployment Checklist

### Step 1: Generate Secure Keys ⏳

```bash
./generate-secrets.sh
```

Copy the generated values and update your `.env` file:
- [ ] Replace `SESSION_SECRET` with generated value
- [ ] Replace `ENCRYPTION_KEY` with generated value

---

### Step 2: Configure Admin Password ⏳

Edit `.env` and change:
```env
ADMIN_PASSWORD=McDanielAdmin2025
```

To something secure:
```env
ADMIN_PASSWORD=YourSecurePassword2025!
```

- [ ] Admin password changed to something secure
- [ ] Password saved in your password manager

---

### Step 3: Install Dependencies ⏳

```bash
npm install
```

- [ ] All dependencies installed successfully
- [ ] No error messages

---

### Step 4: Import Database Schema ⏳

```bash
./IMPORT_DATABASE.sh
```

Or manually:
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql
```

**Verify tables created:**
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES;"
```

Should show 8 tables:
- [ ] admin_config
- [ ] exclusion_rules
- [ ] participants
- [ ] sessions
- [ ] sms_logs
- [ ] sms_queue
- [ ] wish_list_items
- [ ] wish_list_purchases

---

### Step 5: Test Locally ⏳

```bash
npm start
```

**Check console output:**
- [ ] "✅ Database connected successfully"
- [ ] "🌐 Server: http://localhost:3343"
- [ ] No error messages

**Test in browser:**
- [ ] Open http://localhost:3343
- [ ] Login page loads with snowfall animation
- [ ] Admin page accessible at http://localhost:3343/admin.html

---

### Step 6: Test Admin Panel ⏳

1. Go to http://localhost:3343/admin.html
2. Login with your admin password

- [ ] Can login to admin panel
- [ ] Can add a test participant
- [ ] Can create exclusion rules
- [ ] Game status shows correctly

---

## 🚀 Production Deployment Checklist

### Step 7: Server Setup ⏳

**Upload files to server:**
- [ ] All files uploaded to `/var/www/secret-santa` (or your path)
- [ ] `.env` file uploaded with production settings
- [ ] File permissions correct

**Update .env for production:**
```env
NODE_ENV=production
APP_URL=https://mcdanielfamilychristmas.com
```

- [ ] NODE_ENV set to production
- [ ] APP_URL set to your domain

---

### Step 8: Database Setup on Server ⏳

```bash
./IMPORT_DATABASE.sh
```

- [ ] Database schema imported
- [ ] All 8 tables created
- [ ] No errors

---

### Step 9: DNS Configuration ⏳

**Point domain to server:**
- [ ] A record: mcdanielfamilychristmas.com → YOUR_SERVER_IP
- [ ] A record: www.mcdanielfamilychristmas.com → YOUR_SERVER_IP
- [ ] DNS propagated (check with: `dig mcdanielfamilychristmas.com`)

---

### Step 10: Nginx Setup ⏳

**Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/secret-santa
```

Use config from `MCDANIEL_SETUP.md` (port 3343)

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/secret-santa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Nginx config created
- [ ] Config test passes
- [ ] Nginx reloaded

---

### Step 11: SSL Certificate ⏳

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d mcdanielfamilychristmas.com -d www.mcdanielfamilychristmas.com
```

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS works (https://mcdanielfamilychristmas.com)
- [ ] HTTP redirects to HTTPS

---

### Step 12: PM2 Setup ⏳

```bash
npm install -g pm2
pm2 start server.js --name secret-santa
pm2 save
pm2 startup
```

Follow the command it outputs to enable auto-start.

- [ ] PM2 installed
- [ ] Application running under PM2
- [ ] Auto-start on reboot configured

---

### Step 13: Firewall Configuration ⏳

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

- [ ] Firewall configured
- [ ] Only necessary ports open (80, 443, 22)
- [ ] Port 3343 NOT exposed (internal only)

---

### Step 14: Production Testing ⏳

**Test the application:**
- [ ] https://mcdanielfamilychristmas.com loads
- [ ] SSL certificate is valid (green lock)
- [ ] Login page displays correctly
- [ ] Admin panel accessible
- [ ] Can login to admin panel
- [ ] Can add participants
- [ ] Mobile layout works

**Test API endpoints:**
```bash
curl https://mcdanielfamilychristmas.com/api/health
# Should return: {"status":"ok",...}
```

- [ ] Health check responds
- [ ] No errors in PM2 logs

---

## 📱 Twilio SMS Setup (Optional but Recommended)

### Step 15: Twilio Account ⏳

1. Go to https://www.twilio.com/try-twilio
2. Sign up for account
3. Verify your phone number

- [ ] Twilio account created
- [ ] Phone number verified

---

### Step 16: Get Phone Number ⏳

1. Console → Phone Numbers → Buy a number
2. Select SMS-capable number
3. Purchase (~$1/month)

- [ ] Phone number purchased
- [ ] Number is SMS-capable

---

### Step 17: Configure Twilio in .env ⏳

From Twilio Console:
1. Get Account SID
2. Get Auth Token
3. Note your phone number

Update `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
SMS_ENABLED=true
```

- [ ] Account SID added
- [ ] Auth Token added
- [ ] Phone number added (+1 format)
- [ ] SMS_ENABLED set to true

---

### Step 18: Configure Webhook ⏳

In Twilio Console:
1. Phone Numbers → Manage → Active numbers
2. Click your number
3. Under "Messaging":
   - A MESSAGE COMES IN: Webhook
   - URL: `https://mcdanielfamilychristmas.com/api/webhooks/twilio/status`
   - Method: POST
4. Save

- [ ] Webhook URL configured
- [ ] Method set to POST
- [ ] Changes saved

---

### Step 19: Test SMS ⏳

1. Restart application: `pm2 restart secret-santa`
2. Login to admin panel
3. Add yourself as a participant (with real phone)
4. Login as that participant
5. Go to Preferences
6. Click "Send Test SMS"

- [ ] Test SMS received
- [ ] Delivery status shows in admin logs
- [ ] No errors in PM2 logs

---

### Step 20: Fund Twilio Account ⏳

Add money to Twilio account:
- Recommended: $20 to start
- Cost: $0.0079 per SMS
- 20 people × 5 messages = ~$0.79

- [ ] Twilio account funded
- [ ] Balance sufficient for family size

---

## 🎄 Family Setup Checklist

### Step 21: Add All Participants ⏳

In admin panel:
- [ ] All family members added
- [ ] Phone numbers correct
- [ ] Names spelled correctly

---

### Step 22: Set Up Exclusion Rules ⏳

Create rules for:
- [ ] Married couples (can't pick each other)
- [ ] Parents/children (optional)
- [ ] Siblings (optional)

Use "Family Group Quick-Add" for large families!

---

### Step 23: Validate Game ⏳

In admin panel:
- [ ] Click "Validate Game"
- [ ] Shows "Game is valid! ✅"
- [ ] No warnings about impossible scenarios

---

### Step 24: Set Exchange Date ⏳

In `.env`:
```env
EXCHANGE_DATE=2025-12-25
```

- [ ] Exchange date set
- [ ] Application restarted to pick up change

---

### Step 25: Send Game Start Notification ⏳

In admin panel:
- [ ] Click "Send Game Start Notification"
- [ ] All participants receive SMS
- [ ] Check SMS logs for delivery status

---

## 📊 Post-Launch Checklist

### Monitoring ⏳

Set up monitoring:
- [ ] UptimeRobot or similar configured
- [ ] Monitoring https://mcdanielfamilychristmas.com/api/health
- [ ] Alert email configured

---

### Backups ⏳

```bash
# Create backup script
./backup-secret-santa.sh
```

- [ ] Daily database backups scheduled
- [ ] Tested restore process
- [ ] Backups stored off-server

---

### Documentation ⏳

- [ ] Family members receive instructions
- [ ] Your contact info shared for support
- [ ] Deadline dates communicated

---

## 🎯 Launch Day!

### Final Checks ⏳

- [ ] Application running smoothly
- [ ] All family members can login
- [ ] Everyone can draw their person
- [ ] Wish lists working
- [ ] SMS notifications sending
- [ ] No errors in logs

---

### Monitor Progress ⏳

In admin panel, regularly check:
- [ ] Who has picked
- [ ] Who needs reminders
- [ ] SMS delivery status
- [ ] Any errors or issues

---

## 🎁 Christmas Day!

### Exchange Day ⏳

- [ ] "Exchange Day" reminder sent automatically
- [ ] Everyone knows their person
- [ ] Gifts exchanged successfully
- [ ] Happy family! 🎅

---

## 🔄 Post-Christmas

### After the Holiday ⏳

- [ ] Backup database (memories!)
- [ ] Optional: Reset for next year
  - Admin Panel → "Reset Assignments" (keeps participants)
  - OR "Clear All Data" (fresh start)

---

## 📈 Summary

**Total Steps:** 25+ checkboxes
**Estimated Time:**
- Local setup: 15 minutes
- Production deployment: 1-2 hours
- Family setup: 30 minutes

**When complete:**
✅ Fully functional Secret Santa app
✅ SMS notifications working
✅ Secure and professional
✅ Ready for family to use

---

## 🆘 If You Get Stuck

1. Check **TROUBLESHOOTING.md**
2. Review **YOUR_CREDENTIALS.md**
3. Verify each checkbox above
4. Check PM2 logs: `pm2 logs secret-santa`
5. Test database: `mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES;"`

**Most common issues:**
- Missing SESSION_SECRET generation
- Database not imported
- Wrong admin password
- Twilio credentials not set

---

**Ready to begin? Start with Step 1! 🎄**
