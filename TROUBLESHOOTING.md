# 🔧 Troubleshooting Guide - McDaniel Secret Santa

## Common Issues and Solutions

---

## Database Issues

### ✅ FIXED: "Column 'config_value' cannot be null"

**Problem:** Error when importing schema
```
ERROR 1048 (23000) at line 148: Column 'config_value' cannot be null
```

**Solution:** This has been fixed in the schema. Re-import using:
```bash
./IMPORT_DATABASE.sh
```

Or manually:
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql
```

---

### Database Connection Failed

**Symptoms:**
- "Database connection failed" error
- Application won't start

**Solutions:**

1. **Verify MySQL is running:**
   ```bash
   sudo systemctl status mysql
   # or
   brew services list  # macOS
   ```

2. **Test connection:**
   ```bash
   mysql -u u170340_mcdaniel -p -e "SELECT 1;"
   # Password: 9XNErEBZMenXgSow
   ```

3. **Check database exists:**
   ```bash
   mysql -u u170340_mcdaniel -p -e "SHOW DATABASES LIKE 's170340_mcdaniel';"
   ```

4. **Verify .env settings:**
   ```bash
   grep DB_ .env
   # Should show:
   # DB_HOST=localhost
   # DB_USER=u170340_mcdaniel
   # DB_PASSWORD=9XNErEBZMenXgSow
   # DB_NAME=s170340_mcdaniel
   # DB_PORT=3306
   ```

---

### Tables Don't Exist

**Problem:** Application errors about missing tables

**Solution:** Import the schema
```bash
./IMPORT_DATABASE.sh
```

**Verify tables exist:**
```bash
mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES;"
# Should show 8 tables
```

---

### Permission Denied

**Problem:** Can't access database

**Solution:** Grant permissions
```bash
mysql -u root -p -e "GRANT ALL PRIVILEGES ON s170340_mcdaniel.* TO 'u170340_mcdaniel'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

---

## Application Issues

### Port Already in Use

**Symptoms:**
- Error: "EADDRINUSE: address already in use :::3343"

**Solutions:**

1. **Check what's using the port:**
   ```bash
   sudo lsof -i :3343
   ```

2. **Kill the process:**
   ```bash
   sudo kill -9 <PID>
   ```

3. **Or use a different port:**
   Edit `.env`:
   ```env
   PORT=3344
   ```

---

### Application Won't Start

**Check the logs for specific errors:**

1. **Missing dependencies:**
   ```bash
   npm install
   ```

2. **Database connection:**
   See "Database Connection Failed" above

3. **Port conflict:**
   See "Port Already in Use" above

4. **Environment file missing:**
   ```bash
   ls -la .env
   # If missing, copy from example:
   cp .env.example .env
   ```

---

### Admin Login Not Working

**Problem:** "Invalid admin password"

**Solutions:**

1. **Check password in .env:**
   ```bash
   grep ADMIN_PASSWORD .env
   ```

2. **Default password is:**
   ```
   McDanielAdmin2025
   ```

3. **No spaces before/after password:**
   ```env
   ADMIN_PASSWORD=McDanielAdmin2025  # Correct
   ADMIN_PASSWORD = McDanielAdmin2025  # Wrong (spaces)
   ```

---

### Participant Can't Login

**Problem:** "Invalid name or phone number"

**Solutions:**

1. **Check exact name:**
   - Must match exactly (case-sensitive)
   - "John" ≠ "john"

2. **Check phone last 4 digits:**
   - Must match database
   - Check in admin panel

3. **Verify participant exists:**
   ```bash
   mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SELECT first_name, phone_last_four FROM participants;"
   ```

---

## SMS Issues

### SMS Not Sending

**Problem:** Text messages not being received

**Solutions:**

1. **Check SMS is enabled:**
   ```bash
   grep SMS_ENABLED .env
   # Should be: SMS_ENABLED=true
   ```

2. **Verify Twilio credentials:**
   ```bash
   grep TWILIO .env
   # Should have real values, not placeholders
   ```

3. **Check Twilio account:**
   - Log in to https://www.twilio.com
   - Check account balance
   - Verify phone number is active

4. **Check SMS logs:**
   - Go to Admin Panel
   - View "SMS Logs"
   - Look for error messages

5. **Time restrictions:**
   - SMS only sent between 9 AM - 9 PM
   - Check server time

---

### Twilio Webhook Not Working

**Problem:** Delivery status not updating

**Solutions:**

1. **Verify webhook URL is accessible:**
   ```bash
   curl https://mcdanielfamilychristmas.com/api/webhooks/twilio/status
   # Should return 200 or 405 (POST required)
   ```

2. **Check Twilio webhook settings:**
   - Console → Phone Numbers → Active Number
   - Webhook URL: `https://mcdanielfamilychristmas.com/api/webhooks/twilio/status`
   - Method: POST

3. **Check application logs:**
   ```bash
   pm2 logs secret-santa
   # or during npm start, watch console
   ```

---

## Frontend Issues

### Page Won't Load

**Problem:** Blank page or 404 error

**Solutions:**

1. **Verify server is running:**
   ```bash
   curl http://localhost:3343/api/health
   # Should return: {"status":"ok",...}
   ```

2. **Check correct URL:**
   - Local: http://localhost:3343 (not 3000!)
   - Production: https://mcdanielfamilychristmas.com

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux)
   - Or: Cmd+Shift+R (Mac)

---

### Snowfall Not Animating

**Problem:** Christmas effects not showing

**Solutions:**

1. **Check browser console:**
   - F12 → Console tab
   - Look for JavaScript errors

2. **CSS files loaded:**
   - F12 → Network tab
   - Verify snowfall.css loads

3. **Try different browser:**
   - Chrome, Firefox, Safari all supported

---

### Mobile Display Issues

**Problem:** Layout broken on phone

**Solutions:**

1. **Hard refresh on mobile:**
   - Clear browser cache
   - Force reload

2. **Check viewport:**
   - App is designed mobile-first
   - Should work on all screen sizes

3. **Report specific issues:**
   - Which page?
   - What's broken?
   - Screenshot helps!

---

## Production Deployment Issues

### SSL Certificate Error

**Problem:** "Your connection is not private"

**Solutions:**

1. **Verify certificate exists:**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate:**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

3. **Check Nginx config:**
   ```bash
   sudo nginx -t
   ```

---

### Domain Not Resolving

**Problem:** Site doesn't load at mcdanielfamilychristmas.com

**Solutions:**

1. **Check DNS propagation:**
   ```bash
   dig mcdanielfamilychristmas.com
   nslookup mcdanielfamilychristmas.com
   ```

2. **Verify A records:**
   - Points to your server IP
   - Both @ and www records

3. **Wait for propagation:**
   - DNS can take 5-60 minutes
   - Sometimes up to 24-48 hours

---

### Nginx 502 Bad Gateway

**Problem:** Nginx shows error page

**Solutions:**

1. **Check application is running:**
   ```bash
   pm2 status
   # Should show "online"
   ```

2. **Verify port:**
   ```bash
   sudo lsof -i :3343
   # Should show node process
   ```

3. **Check Nginx config:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **View application logs:**
   ```bash
   pm2 logs secret-santa
   ```

---

## Performance Issues

### Application Running Slow

**Solutions:**

1. **Check server resources:**
   ```bash
   htop
   # or
   top
   ```

2. **Restart application:**
   ```bash
   pm2 restart secret-santa
   ```

3. **Check database:**
   ```bash
   mysql -u u170340_mcdaniel -p -e "SHOW PROCESSLIST;"
   ```

---

### High Memory Usage

**Solutions:**

1. **Restart PM2:**
   ```bash
   pm2 restart secret-santa
   ```

2. **Check for memory leaks:**
   ```bash
   pm2 monit
   ```

3. **Increase server memory:**
   - Upgrade VPS if needed

---

## Quick Diagnostics

### Run These Commands to Diagnose Issues

```bash
# 1. Check application status
pm2 status

# 2. Check recent logs
pm2 logs secret-santa --lines 50

# 3. Test database
mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SELECT COUNT(*) FROM participants;"

# 4. Test API
curl http://localhost:3343/api/health

# 5. Check port
sudo lsof -i :3343

# 6. View environment
grep -v "PASSWORD\|SECRET\|TOKEN" .env
```

---

## Getting Help

### Before Asking for Help

Collect this information:

1. **Error message:**
   - Exact text of error
   - Screenshot if helpful

2. **What you were doing:**
   - Which page?
   - What action?

3. **Environment:**
   - Local or production?
   - Browser (if frontend issue)
   - Operating system

4. **Logs:**
   ```bash
   pm2 logs secret-santa --lines 100
   ```

### Check Documentation

1. **START_HERE.md** - Quick overview
2. **YOUR_CREDENTIALS.md** - Your settings
3. **QUICKSTART.md** - Local setup
4. **README.md** - Complete guide
5. **This file** - Common issues

---

## Emergency Reset

### If Everything is Broken

**Start fresh (caution: deletes all data):**

```bash
# 1. Stop application
pm2 stop secret-santa

# 2. Drop and recreate database
mysql -u u170340_mcdaniel -p -e "DROP DATABASE s170340_mcdaniel;"
mysql -u u170340_mcdaniel -p -e "CREATE DATABASE s170340_mcdaniel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Import schema
./IMPORT_DATABASE.sh

# 4. Restart application
pm2 restart secret-santa
```

---

## Still Stuck?

1. Review error messages carefully
2. Check all documentation files
3. Search for specific error messages
4. Verify all credentials are correct
5. Try a fresh database import

**Most issues are:**
- Wrong credentials
- Database not imported
- Port conflicts
- Missing dependencies

Run through the checklist above! 🎄
