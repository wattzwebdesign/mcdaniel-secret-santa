# 🎅 START HERE - McDaniel Secret Santa Setup

## ✅ Your Configuration is Ready!

Everything has been configured with your specific settings:

### 📋 Your Details
- **Domain:** mcdanielfamilychristmas.com
- **Database:** s170340_mcdaniel
- **Username:** u170340_mcdaniel
- **Port:** 3343

### 🚀 Quick Start (3 Steps)

```bash
# Step 1: Install dependencies
npm install

# Step 2: Import database schema
./IMPORT_DATABASE.sh
# (or manually: mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql)

# Step 3: Start the application
npm start
```

Then open: **http://localhost:3343**

---

## 📁 Important Files

| File | Description |
|------|-------------|
| **SETUP_CHECKLIST.md** ⭐⭐⭐ | Complete step-by-step checklist |
| **YOUR_CREDENTIALS.md** ⭐ | Your database info & quick commands |
| **QUICKSTART.md** ⭐ | 5-minute local setup guide |
| **MCDANIEL_SETUP.md** ⭐ | Production deployment for your domain |
| **TROUBLESHOOTING.md** | Fix common issues |
| `.env` | Already configured with your settings |
| `generate-secrets.sh` | Generate secure SESSION_SECRET |
| `IMPORT_DATABASE.sh` | Import database schema |
| `README.md` | Complete documentation |
| `DEPLOYMENT.md` | Full production deployment guide |

---

## ✅ What's Already Configured

1. ✅ Database credentials in `.env`
2. ✅ Port 3343 configured
3. ✅ Domain: mcdanielfamilychristmas.com
4. ✅ All documentation updated with your settings
5. ✅ Nginx config ready for port 3343
6. ✅ Admin password: McDanielAdmin2025 (change this!)

---

## 🎯 Next Steps

### For Local Testing
1. Run the 3 commands above
2. Open http://localhost:3343
3. Test the login page
4. Go to http://localhost:3343/admin.html
5. Login with: `McDanielAdmin2025`
6. Add test family members

### For Production Deployment
1. Upload files to your xCloud server
2. Follow **MCDANIEL_SETUP.md**
3. Configure DNS for mcdanielfamilychristmas.com
4. Set up SSL certificate
5. Configure Twilio for SMS

---

## 📖 Documentation Guide

Read in this order:

1. **YOUR_CREDENTIALS.md** - Your specific settings
2. **QUICKSTART.md** - Test locally first
3. **MCDANIEL_SETUP.md** - Deploy to production
4. **README.md** - Full documentation

---

## 🔐 Security Notes

Before going live, update these in `.env`:

```bash
# Generate a strong SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and update SESSION_SECRET in .env

# Change admin password to something secure
ADMIN_PASSWORD=YourSecurePassword2025!
```

---

## 🆘 Need Help?

### Database Issues
- Check: `YOUR_CREDENTIALS.md` for connection commands
- Test: `mysql -u u170340_mcdaniel -p s170340_mcdaniel -e "SELECT 1;"`

### Application Won't Start
- Check: Port 3343 is not in use
- Verify: `.env` file exists with correct settings
- Review: Console error messages

### Documentation
- **YOUR_CREDENTIALS.md** - Quick reference
- **QUICKSTART.md** - Local setup
- **MCDANIEL_SETUP.md** - Production setup
- **README.md** - Complete guide

---

## 🎄 Ready to Launch!

Your Secret Santa app is configured and ready to run:

```bash
npm install && mysql -u u170340_mcdaniel -p s170340_mcdaniel < sql/schema.sql && npm start
```

**Access:**
- Local: http://localhost:3343
- Production: https://mcdanielfamilychristmas.com

**Merry Christmas! 🎅🎁**
