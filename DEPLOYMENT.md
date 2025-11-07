# 🚀 Deployment Guide - Secret Santa Application

Complete guide for deploying the Secret Santa application to production.

## Prerequisites

- xCloud hosting account (or similar Node.js hosting)
- MySQL 8.0+ database
- Twilio account with phone number
- Domain name (optional but recommended)
- SSH access to server

## Step 1: Server Setup

### 1.1 Install Node.js
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.2 Install MySQL
```bash
sudo apt-get install mysql-server
sudo mysql_secure_installation
```

### 1.3 Create Database
```bash
mysql -u root -p

CREATE DATABASE secret_santa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'secret_santa_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON secret_santa.* TO 'secret_santa_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 2: Application Deployment

### 2.1 Upload Files
```bash
# Clone or upload your code to server
cd /var/www
sudo mkdir secret-santa
sudo chown $USER:$USER secret-santa
cd secret-santa

# Upload files via git, scp, or FTP
# If using git:
git clone <your-repo-url> .
```

### 2.2 Install Dependencies
```bash
npm install --production
```

### 2.3 Configure Environment
```bash
# Create production .env file
nano .env
```

Add the following (replace with your actual values):
```env
# Database Configuration
DB_HOST=localhost
DB_USER=secret_santa_user
DB_PASSWORD=your_secure_password
DB_NAME=secret_santa
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=generate-a-long-random-secret-key-here

# Admin Authentication
ADMIN_PASSWORD=your-secure-admin-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Application Configuration
APP_URL=https://mcdanielfamilychristmas.com
SMS_ENABLED=true
SMS_RATE_LIMIT=10
EXCHANGE_DATE=2025-12-25
```

**Security Tips:**
- Generate SESSION_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Use a strong ADMIN_PASSWORD (min 12 characters, mixed case, numbers, symbols)
- Never commit `.env` to git

### 2.4 Initialize Database
```bash
mysql -u secret_santa_user -p secret_santa < sql/schema.sql
```

### 2.5 Test Application
```bash
# Start in test mode
npm start

# In another terminal, test the connection
curl http://localhost:3000/api/health
```

If successful, you should see: `{"status":"ok","timestamp":"...","smsEnabled":true}`

## Step 3: Process Manager (PM2)

### 3.1 Install PM2
```bash
sudo npm install -g pm2
```

### 3.2 Start Application
```bash
# Start with PM2
pm2 start server.js --name secret-santa

# Save PM2 configuration
pm2 save

# Set up auto-start on boot
pm2 startup
# Follow the command it outputs
```

### 3.3 Monitor Application
```bash
# View logs
pm2 logs secret-santa

# View status
pm2 status

# Restart application
pm2 restart secret-santa
```

## Step 4: Nginx Reverse Proxy (Optional but Recommended)

### 4.1 Install Nginx
```bash
sudo apt-get install nginx
```

### 4.2 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/secret-santa
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name mcdanielfamilychristmas.com www.mcdanielfamilychristmas.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mcdanielfamilychristmas.com www.mcdanielfamilychristmas.com;

    # SSL Configuration (add after getting certificate)
    ssl_certificate /etc/letsencrypt/live/mcdanielfamilychristmas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcdanielfamilychristmas.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeout for long-running requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 4.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/secret-santa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: SSL Certificate (Let's Encrypt)

### 5.1 Install Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx
```

### 5.2 Obtain Certificate
```bash
sudo certbot --nginx -d mcdanielfamilychristmas.com -d www.mcdanielfamilychristmas.com
```

Follow the prompts. Certbot will automatically configure Nginx.

### 5.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Renewal will happen automatically via cron
```

## Step 6: Firewall Configuration

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 7: Twilio Webhook Setup

### 7.1 Configure Webhook URL
1. Log in to Twilio Console
2. Go to Phone Numbers → Active Numbers
3. Select your Secret Santa phone number
4. Under "Messaging", set "A MESSAGE COMES IN" webhook to:
   ```
   https://mcdanielfamilychristmas.com/api/webhooks/twilio/status
   ```
5. Method: HTTP POST
6. Save

### 7.2 Test Webhook
```bash
# Send a test SMS from admin panel
# Check logs to verify webhook is working:
pm2 logs secret-santa
```

## Step 8: Database Backups

### 8.1 Create Backup Script
```bash
nano ~/backup-secret-santa.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/secret-santa"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u secret_santa_user -p'your_password' secret_santa \
  | gzip > $BACKUP_DIR/secret_santa_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: secret_santa_$DATE.sql.gz"
```

### 8.2 Make Executable and Schedule
```bash
chmod +x ~/backup-secret-santa.sh

# Add to crontab (daily at 3 AM)
crontab -e

# Add this line:
0 3 * * * /home/your_user/backup-secret-santa.sh >> /var/log/secret-santa-backup.log 2>&1
```

## Step 9: Monitoring and Logs

### 9.1 Log Rotation
```bash
sudo nano /etc/logrotate.d/secret-santa
```

Add:
```
/var/www/secret-santa/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9.2 Uptime Monitoring
Use a service like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor: `https://mcdanielfamilychristmas.com/api/health`

## Step 10: Testing Checklist

- [ ] Application starts without errors
- [ ] Can access homepage at `https://mcdanielfamilychristmas.com`
- [ ] Can access admin panel at `https://mcdanielfamilychristmas.com/admin.html`
- [ ] Can log in as admin
- [ ] Can add a test participant
- [ ] Test SMS sends successfully
- [ ] Twilio webhook receives delivery status
- [ ] Can login as participant
- [ ] Can draw assignment
- [ ] Can add wish list items
- [ ] Recipient's wish list displays correctly
- [ ] Notification preferences save correctly
- [ ] Scheduled jobs are running (check PM2 logs)
- [ ] SSL certificate is valid
- [ ] Database backups are working

## Maintenance

### Daily Tasks
- Check PM2 status: `pm2 status`
- Review logs: `pm2 logs secret-santa --lines 100`
- Check SMS statistics in admin panel

### Weekly Tasks
- Review error logs
- Check SMS costs in Twilio dashboard
- Verify backup files exist

### Before Game Starts
1. Add all participants
2. Set up exclusion rules
3. Validate game: Admin Panel → "Validate Game"
4. Send test SMS to yourself
5. Send "Game Start" notification

### During Game
1. Monitor who has picked in admin panel
2. Send reminders as needed
3. Check SMS delivery logs

### After Game
1. Optionally reset assignments for next year
2. Review what worked well
3. Back up data before reset

## Troubleshooting

### Application Won't Start
```bash
pm2 logs secret-santa
# Check for error messages

# Verify database connection
mysql -u secret_santa_user -p secret_santa

# Check environment variables
pm2 env 0
```

### SMS Not Sending
1. Check Twilio balance
2. Verify credentials in `.env`
3. Check SMS logs: Admin Panel → SMS Logs
4. Test with: Admin Panel → Send Test SMS

### Database Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check connections
mysql -u secret_santa_user -p -e "SHOW PROCESSLIST;"

# Verify tables exist
mysql -u secret_santa_user -p secret_santa -e "SHOW TABLES;"
```

### High Memory Usage
```bash
# Check processes
pm2 monit

# Restart if needed
pm2 restart secret-santa
```

## Security Best Practices

1. **Keep Software Updated**
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   npm audit fix
   ```

2. **Strong Passwords**
   - Use different passwords for database and admin
   - Store passwords in password manager
   - Rotate passwords periodically

3. **Firewall Rules**
   - Only open necessary ports
   - Use fail2ban to prevent brute force

4. **Regular Backups**
   - Test restore process
   - Store backups off-server

5. **Monitor Logs**
   - Watch for suspicious activity
   - Set up alerts for errors

## Cost Estimates

### Twilio SMS (US/Canada)
- $0.0079 per SMS
- 20 participants × 5 messages = 100 SMS = **$0.79**
- 50 participants × 6 messages = 300 SMS = **$2.37**

### Server Hosting
- Basic VPS: $5-20/month
- Database: Included or +$5/month
- Domain: $10-15/year

### Total: ~$10-30/month + SMS costs

## Support

If you encounter issues:
1. Check logs: `pm2 logs secret-santa`
2. Review this deployment guide
3. Check `README.md` for application-specific help
4. Review `SECRET_SANTA_PROJECT_SPEC.md` for feature details

---

**Good luck with your deployment! 🎅🚀**
