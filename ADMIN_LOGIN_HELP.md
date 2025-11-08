# 🔐 Admin Panel Login Help

## "Admin Access Required" Error

If you're getting **"Admin access required"** when trying to add participants, it means you need to login to the admin panel first.

---

## ✅ How to Login to Admin Panel

### Step 1: Go to Admin Page
Open your browser and go to:
- **Local:** http://localhost:3343/admin.html
- **Production:** https://mcdanielfamilychristmas.com/admin.html

### Step 2: Enter Admin Password
You should see a login screen asking for the admin password.

**Default password:** `McDanielAdmin2025`

(This is set in your `.env` file as `ADMIN_PASSWORD`)

### Step 3: Click Login
After entering the password, click the login button.

### Step 4: You Should See the Admin Panel
Once logged in, you'll see:
- Game Status
- Participant Management
- Exclusion Rules
- SMS Notifications
- Game Controls

Now you can add participants!

---

## 🔍 Troubleshooting Admin Login

### Problem: "Invalid admin password"

**Check your password in .env file:**
```bash
grep ADMIN_PASSWORD .env
```

Should show:
```
ADMIN_PASSWORD=McDanielAdmin2025
```

**Common issues:**
1. Extra spaces before/after password
2. Wrong case (passwords are case-sensitive)
3. Wrong password entirely

**Fix:**
Edit `.env` and make sure it looks like this (no spaces):
```env
ADMIN_PASSWORD=McDanielAdmin2025
```

Then restart the application:
```bash
# If using npm start
# Press Ctrl+C to stop
npm start

# If using PM2
pm2 restart secret-santa
```

---

### Problem: Login page doesn't show

**Symptoms:**
- You go to `/admin.html` but it doesn't show a login form
- You see blank page or errors

**Solutions:**

1. **Check browser console for errors:**
   - Press F12
   - Go to Console tab
   - Look for red error messages

2. **Verify files exist:**
   ```bash
   ls -la public/admin.html
   ls -la public/js/admin.js
   ```

3. **Try hard refresh:**
   - Chrome/Firefox: Ctrl+Shift+R (Windows/Linux)
   - Chrome/Firefox: Cmd+Shift+R (Mac)
   - Safari: Cmd+Option+R

4. **Clear browser cache:**
   - Settings → Privacy → Clear browsing data
   - Check "Cached images and files"

---

### Problem: Login button doesn't work

**Check browser console:**
- F12 → Console tab
- Look for JavaScript errors

**Check server is running:**
```bash
curl http://localhost:3343/api/health
# Should return: {"status":"ok",...}
```

**Check logs:**
```bash
# If using npm start, check terminal
# If using PM2:
pm2 logs secret-santa
```

---

### Problem: Gets logged out immediately

**Symptoms:**
- Can login but immediately need to login again
- Admin panel doesn't stay loaded

**Possible causes:**

1. **SESSION_SECRET not set properly**

   Check your `.env`:
   ```bash
   grep SESSION_SECRET .env
   ```

   If it says `CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_BEFORE_PRODUCTION`, you need to generate a real secret:

   ```bash
   ./generate-secrets.sh
   ```

   Copy the `SESSION_SECRET` output and update your `.env` file.

2. **Sessions table not created**

   ```bash
   mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES LIKE 'sessions';"
   ```

   If no result, reimport database:
   ```bash
   ./IMPORT_DATABASE.sh
   ```

3. **Restart application after changing .env:**
   ```bash
   npm start
   # or
   pm2 restart secret-santa
   ```

---

## 🎯 Complete Admin Login Test

Run through these steps to verify everything works:

```bash
# 1. Verify admin password in .env
grep ADMIN_PASSWORD .env

# 2. Start application (if not running)
npm start

# 3. In another terminal, test health
curl http://localhost:3343/api/health

# 4. Open browser
# Go to: http://localhost:3343/admin.html

# 5. Should see login form with password field

# 6. Enter password: McDanielAdmin2025

# 7. Click Login

# 8. Should see admin panel with sections:
#    - Game Status
#    - Participants
#    - Exclusion Rules
#    - SMS Notifications
#    - Game Controls
```

---

## ✅ Success! Now You Can Add Participants

Once logged in, you should see the "Participants" section with a form:

```
First Name: [___________]
Phone Number: [___________]
[Add Participant]
```

Fill in the form:
- **First Name:** John
- **Phone Number:** (555) 123-4567

Click "Add Participant" - it should work now!

---

## 🔐 Security Notes

### Change Default Password

Before going to production, change the admin password:

1. Edit `.env`:
   ```env
   ADMIN_PASSWORD=YourSecurePassword2025!
   ```

2. Restart application:
   ```bash
   pm2 restart secret-santa
   ```

3. Test new password works

### Password Requirements

The admin password:
- Can be any string
- Is case-sensitive
- Should be strong in production
- Recommended: 12+ characters, mixed case, numbers, symbols

---

## 📝 Quick Reference

| What | Value |
|------|-------|
| **Admin URL (local)** | http://localhost:3343/admin.html |
| **Admin URL (prod)** | https://mcdanielfamilychristmas.com/admin.html |
| **Default Password** | McDanielAdmin2025 |
| **Where to change** | `.env` file → `ADMIN_PASSWORD` |
| **After changing** | Restart application |

---

## 🆘 Still Not Working?

### Check These:

1. **Is the server running?**
   ```bash
   pm2 status
   # or check terminal if using npm start
   ```

2. **Is the database connected?**
   ```bash
   mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SELECT 1;"
   ```

3. **Any errors in logs?**
   ```bash
   pm2 logs secret-santa --lines 50
   ```

4. **Is sessions table created?**
   ```bash
   mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SHOW TABLES;"
   ```

5. **Browser console errors?**
   - F12 → Console tab
   - Screenshot any errors

### Get More Help

Check these docs:
- **TROUBLESHOOTING.md** - Common issues
- **YOUR_CREDENTIALS.md** - Your settings
- **START_HERE.md** - Quick start

---

## 💡 Tips

1. **Keep the admin panel open** - Once logged in, keep that browser tab open
2. **Use incognito mode** - To test without cache issues
3. **Check password carefully** - No extra spaces
4. **Restart after .env changes** - Always restart the app

---

**After logging in successfully, you should be able to:**
✅ Add participants
✅ Create exclusion rules
✅ Send notifications
✅ View game status
✅ Manage the entire Secret Santa game

**Good luck! 🎅**
