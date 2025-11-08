# 🔐 McDaniel Secret Santa - Your Credentials

## Quick Reference

### Database Connection
```
Database Name:  s170340_mcdaniel
Username:       u170340_mcdaniel
Password:       9XNErEBZMenXgSow
Host:           localhost
Port:           3306
```

### Application Settings
```
Application Port: 3343
Domain:          mcdanielfamilychristmas.com
```

### Access URLs
```
User Interface:  https://mcdanielfamilychristmas.com
Admin Panel:     https://mcdanielfamilychristmas.com/admin.html
Health Check:    https://mcdanielfamilychristmas.com/api/health
```

### Local Development
```
User Interface:  http://localhost:3343
Admin Panel:     http://localhost:3343/admin.html
Health Check:    http://localhost:3343/api/health
```

---

## Database Setup Commands

### Connect to Database
```bash
mysql -u u170340_mcdaniel -p
# Password: 9XNErEBZMenXgSow
```

### Import Schema
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql
# Password: 9XNErEBZMenXgSow
```

### View Tables
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES;"
```

---

## .env Configuration

Your `.env` file has been created with these settings:

```env
# Database
DB_HOST=localhost
DB_USER=u170340_mcdaniel
DB_PASSWORD=9XNErEBZMenXgSow
DB_NAME=s170340_mcdaniel
DB_PORT=3306

# Server
PORT=3343
NODE_ENV=development
SESSION_SECRET=your-super-secret-key-change-this-in-production

# Admin
ADMIN_PASSWORD=McDanielAdmin2025

# Twilio (update when ready)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# App
APP_URL=https://mcdanielfamilychristmas.com
SMS_ENABLED=false
EXCHANGE_DATE=2025-12-25
```

---

## Important Notes

### Before First Run
1. **Generate SESSION_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and update `SESSION_SECRET` in `.env`

2. **Set Admin Password**
   Current: `McDanielAdmin2025`
   Change to something secure!

3. **Import Database Schema**
   ```bash
   mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Application**
   ```bash
   npm start
   ```

---

## Nginx Configuration

Your Nginx config should proxy to port **3343**:

```nginx
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
```

---

## PM2 Configuration

Start with PM2:
```bash
pm2 start server.js --name secret-santa

# View logs
pm2 logs secret-santa

# Restart
pm2 restart secret-santa

# Status
pm2 status
```

---

## Firewall Rules

Make sure port 3343 is NOT exposed directly. Only Nginx (80/443) should be accessible:

```bash
# Allow Nginx
sudo ufw allow 'Nginx Full'

# Allow SSH
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable
```

Application runs on port 3343 internally, Nginx proxies from 443 → 3343.

---

## Testing Checklist

### Database Connection
```bash
# Test connection
mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SELECT 1;"
```

### Application
```bash
# Start app
npm start

# Should see:
# ✅ Database connected successfully
# 🌐 Server: http://localhost:3343
```

### Access
- Open browser: http://localhost:3343
- Should see login page with snowfall
- Admin: http://localhost:3343/admin.html

---

## Backup Commands

### Backup Database
```bash
mysqldump -u u170340_mcdaniel -p s170340_mcdaniel > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel < backup_20251201.sql
```

---

## Troubleshooting

### Can't Connect to Database
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u u170340_mcdaniel -p -e "SELECT 1;"
```

### Port Already in Use
```bash
# Check what's using port 3343
sudo lsof -i :3343

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Make sure database user has correct permissions
mysql -u root -p -e "GRANT ALL PRIVILEGES ON s170340_mcdaniel.* TO 'u170340_mcdaniel'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

---

## Security Reminders

🔒 **IMPORTANT:**
1. Never commit `.env` to git (already in .gitignore)
2. Change `SESSION_SECRET` before production
3. Change `ADMIN_PASSWORD` to something secure
4. Keep database password secure
5. Use HTTPS in production (not HTTP)

---

## Next Steps

1. ✅ Database credentials configured
2. ✅ Port 3343 configured
3. ✅ .env file created
4. ⏳ Generate SESSION_SECRET
5. ⏳ Import database schema
6. ⏳ Install dependencies (npm install)
7. ⏳ Test locally (npm start)
8. ⏳ Deploy to production server
9. ⏳ Configure Twilio
10. ⏳ Launch! 🎅

---

**Your application is configured and ready to run!**

```bash
# Quick start:
npm install
mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql
npm start
# Open: http://localhost:3343
```
