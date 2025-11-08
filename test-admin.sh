#!/bin/bash
# Test admin authentication

echo "🔐 Testing Admin Authentication"
echo "================================"
echo ""

# Check .env file
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
    ADMIN_PASS=$(grep "^ADMIN_PASSWORD=" .env | cut -d'=' -f2)
    echo "   Admin password in .env: $ADMIN_PASS"
else
    echo "   ❌ .env file not found!"
    exit 1
fi
echo ""

# Check if server is running
echo "2. Checking if server is running..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3343/api/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Server is running on port 3343"
else
    echo "   ❌ Server not responding on port 3343"
    echo "   Start the server with: npm start"
    exit 1
fi
echo ""

# Check database connection
echo "3. Checking database..."
mysql -u u170340_mcdaniel -p9XNErEBZMenXgSow s170340_mcdaniel -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
    exit 1
fi
echo ""

# Check sessions table
echo "4. Checking sessions table..."
SESSIONS=$(mysql -u u170340_mcdaniel -p9XNErEBZMenXgSow s170340_mcdaniel -e "SHOW TABLES LIKE 'sessions';" 2>/dev/null | grep sessions)
if [ -n "$SESSIONS" ]; then
    echo "   ✅ Sessions table exists"
else
    echo "   ❌ Sessions table not found"
    echo "   Run: ./IMPORT_DATABASE.sh"
    exit 1
fi
echo ""

# Test admin login
echo "5. Testing admin login API..."
echo "   Attempting login with password: $ADMIN_PASS"

RESPONSE=$(curl -s -X POST http://localhost:3343/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$ADMIN_PASS\"}" \
  -c /tmp/admin-cookies.txt)

echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "\"success\":true"; then
    echo "   ✅ Admin login successful!"
else
    echo "   ❌ Admin login failed"
    echo "   Check your ADMIN_PASSWORD in .env"
fi
echo ""

# Test admin access
echo "6. Testing admin access..."
STATUS_RESPONSE=$(curl -s http://localhost:3343/api/admin/status \
  -b /tmp/admin-cookies.txt)

if echo "$STATUS_RESPONSE" | grep -q "\"success\":true"; then
    echo "   ✅ Admin access working!"
else
    echo "   ❌ Admin access denied"
    echo "   Response: $STATUS_RESPONSE"
fi
echo ""

# Cleanup
rm -f /tmp/admin-cookies.txt

echo "================================"
echo "Test complete!"
echo ""
echo "Summary:"
echo "  1. .env file: ✅"
echo "  2. Server running: Check above"
echo "  3. Database: Check above"
echo "  4. Sessions table: Check above"
echo "  5. Admin login: Check above"
echo "  6. Admin access: Check above"
echo ""
echo "If all checks pass ✅, admin login should work!"
echo "If any fail ❌, fix those issues first."
echo ""
echo "To login:"
echo "  1. Go to http://localhost:3343/admin.html"
echo "  2. Enter password: $ADMIN_PASS"
echo "  3. Click Login"
