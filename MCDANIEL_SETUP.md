# 🎄 McDaniel Family Christmas - Secret Santa Setup Guide

Custom setup guide for **mcdanielfamilychristmas.com**

## Quick Domain Setup

### DNS Configuration

Point your domain to your server's IP address:

**A Records:**
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600

Type: A
Name: www
Value: YOUR_SERVER_IP
TTL: 3600
```

**CNAME Record (alternative to www A record):**
```
Type: CNAME
Name: www
Value: mcdanielfamilychristmas.com
TTL: 3600
```

Wait 5-60 minutes for DNS propagation.

### Verify DNS
```bash
# Check if DNS is propagated
dig mcdanielfamilychristmas.com
dig www.mcdanielfamilychristmas.com

# Or use nslookup
nslookup mcdanielfamilychristmas.com
```

## Production Configuration

### Environment Variables (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_USER=u170340_mcdaniel
DB_PASSWORD=9XNErEBZMenXgSow
DB_NAME=s170340_mcdaniel
DB_PORT=3306

# Server Configuration
PORT=3343
NODE_ENV=production
SESSION_SECRET=GENERATE_RANDOM_32_CHAR_KEY

# Admin Authentication
ADMIN_PASSWORD=McDanielAdmin2025!

# Twilio Configuration (get from twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Application Configuration
APP_URL=https://mcdanielfamilychristmas.com
SMS_ENABLED=true
SMS_RATE_LIMIT=10
EXCHANGE_DATE=2025-12-25
```

### Generate Secure Keys

```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste into .env file
```

## Nginx Configuration

Create `/etc/nginx/sites-available/mcdanielfamilychristmas`:

```nginx
server {
    listen 80;
    server_name mcdanielfamilychristmas.com www.mcdanielfamilychristmas.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mcdanielfamilychristmas.com www.mcdanielfamilychristmas.com;

    ssl_certificate /etc/letsencrypt/live/mcdanielfamilychristmas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcdanielfamilychristmas.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://localhost:3343;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/mcdanielfamilychristmas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d mcdanielfamilychristmas.com -d www.mcdanielfamilychristmas.com

# Follow prompts:
# - Enter email for renewal notices
# - Agree to Terms of Service
# - Choose redirect HTTP to HTTPS: Yes

# Certificate will auto-renew
```

## Twilio Setup

### 1. Create Account
- Go to https://www.twilio.com/try-twilio
- Sign up with your email
- Verify your phone number

### 2. Get a Phone Number
- Console → Phone Numbers → Buy a number
- Filter by: SMS capable, United States
- Buy number (about $1/month)

### 3. Configure Webhook
- Console → Phone Numbers → Manage → Active numbers
- Click your number
- Under "Messaging":
  - A MESSAGE COMES IN: Webhook
  - URL: `https://mcdanielfamilychristmas.com/api/webhooks/twilio/status`
  - HTTP POST
- Save

### 4. Get Credentials
- Console → Account → Keys & Credentials
- Copy:
  - Account SID
  - Auth Token
- Add to `.env` file

### 5. Fund Account
- Console → Billing
- Add $20 to start (SMS costs $0.0079 each)

## Family Setup Checklist

### Before Game Day

- [ ] Deploy application to server
- [ ] Configure domain DNS
- [ ] Set up SSL certificate
- [ ] Configure Twilio
- [ ] Test SMS delivery
- [ ] Log in to admin panel
- [ ] Add all family members
- [ ] Set up exclusion rules (spouses, kids/parents, etc.)
- [ ] Validate game is possible
- [ ] Send test SMS to yourself
- [ ] Set EXCHANGE_DATE in .env

### Game Day

- [ ] Send "Game Start" notification
- [ ] Monitor who has picked
- [ ] Send wish list reminders if needed
- [ ] Answer any questions from family

### Recommended Exclusion Rules

Example for a typical family:

**Married Couples:**
- John ↔ Jane (spouse)
- Bob ↔ Alice (spouse)

**Parents/Children:**
- John → Bobby (parent/child)
- Bobby → John (child/parent)

**Siblings (optional):**
- Sally ↔ Bobby (siblings)

Use "Family Group Quick-Add" in admin for large families!

## McDaniel Family Specific Settings

### Exchange Date
Update in `.env`:
```env
EXCHANGE_DATE=2025-12-25  # Christmas Day
# OR
EXCHANGE_DATE=2025-12-24  # Christmas Eve
```

### Budget (optional field in wish list items)
Suggest family members use price ranges like:
- Under $25
- $25-$50
- $50-$100

### SMS Reminders Schedule
Automatically sent:
- **Day 0**: Game start notification
- **Day 1**: Wish list reminder (if empty)
- **Day -7**: Shopping reminder (7 days before exchange)
- **Day -3**: Another reminder (3 days before)
- **Day -1**: Final reminder (1 day before)
- **Day 0**: "Today's the day!" (exchange day at 9 AM)

## Family Communication Template

Send this to your family after setup:

---

**🎅 McDaniel Family Secret Santa is Ready! 🎄**

We're doing Secret Santa this year! Here's how it works:

**Step 1: Draw Your Person**
1. Go to https://mcdanielfamilychristmas.com
2. Enter your first name and phone number
3. Click "Draw Your Secret Santa"
4. Keep it secret! 🤫

**Step 2: Add Your Wish List**
1. After drawing, click "Edit My Wish List"
2. Add 3-5 gift ideas with:
   - Item name
   - Description
   - Link (optional)
   - Price range
   - Priority (Must Have, Would Like, or Budget Allows)

**Step 3: Shop!**
1. Click "View Their Wish List" to see what they want
2. You can mark items as "purchased" so you remember
3. Only YOU can see what you've marked

**Important Dates:**
- Draw by: [SET DATE]
- Add wish list by: [SET DATE]
- Exchange: December 25th

**SMS Notifications:**
You'll receive text reminders! You can turn them off in "Notification Settings"

**Questions?**
Contact [YOUR NAME] at [YOUR PHONE]

Happy Holidays! 🎁

---

## Monitoring & Maintenance

### Daily Checks
```bash
# Check application status
pm2 status

# View recent logs
pm2 logs secret-santa --lines 50

# Check who has picked
# Go to: https://mcdanielfamilychristmas.com/admin.html
# View "Game Status"
```

### Weekly Checks
- Review SMS logs in admin panel
- Check Twilio balance
- Verify all family members have picked
- Send reminders if needed

### After Christmas
```bash
# Backup data before reset
mysqldump -u secret_santa_user -p secret_santa > mcdaniel_christmas_2025_backup.sql

# Optional: Reset for next year
# Admin Panel → "Reset Assignments" (keeps participants)
# OR
# Admin Panel → "Clear All Data" (fresh start)
```

## Family Member Quick Reference

**Login:** https://mcdanielfamilychristmas.com
**Admin:** https://mcdanielfamilychristmas.com/admin.html

**Forgot who you drew?**
Just log in again - it will show you!

**Can't login?**
- Check your name is spelled correctly
- Make sure you're using the last 4 digits of your phone
- Contact the admin if still having trouble

**Want to change your wish list?**
Log in anytime and click "Edit My Wish List"

**Don't want SMS notifications?**
Log in → "Notification Settings" → Turn off what you don't want

## Support Contacts

**Technical Issues:**
- Check: README.md
- Check: DEPLOYMENT.md
- Check: https://mcdanielfamilychristmas.com/api/health

**Family Questions:**
Admin: [YOUR NAME]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

## Backup Commands

```bash
# Daily backup (add to crontab)
mysqldump -u secret_santa_user -p secret_santa | gzip > ~/backups/mcdaniel_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip < ~/backups/mcdaniel_20251225.sql.gz | mysql -u secret_santa_user -p secret_santa
```

## Cost Estimate for McDaniel Family

Assuming 20 family members:
- Server hosting: $10-20/month
- Domain: $12/year (~$1/month)
- Twilio phone number: $1/month
- SMS (20 people × 5 messages): $0.79 total
- **Total: ~$13-22/month during December**

Can cancel Twilio after Christmas to save money!

---

**Merry Christmas, McDaniel Family! 🎅🎄🎁**
