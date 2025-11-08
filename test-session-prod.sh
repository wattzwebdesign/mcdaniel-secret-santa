#!/bin/bash
# Test admin session on production server

echo "🔐 Testing Production Admin Session"
echo "===================================="
echo ""

DOMAIN="https://mcdanielfamilychristmas.com"
COOKIE_FILE="/tmp/prod-admin-cookies.txt"

# Clean up old cookies
rm -f $COOKIE_FILE

echo "1. Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$DOMAIN/api/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"McDanielAdmin2025"}' \
  -c $COOKIE_FILE \
  -w "\nHTTP_CODE:%{http_code}")

echo "Login Response: $LOGIN_RESPONSE"
echo ""

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
echo "HTTP Status Code: $HTTP_CODE"
echo ""

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
    exit 1
fi

echo ""
echo "2. Checking cookies saved..."
if [ -f $COOKIE_FILE ]; then
    echo "Cookie file contents:"
    cat $COOKIE_FILE
    echo ""
else
    echo "❌ No cookie file created!"
    exit 1
fi

echo ""
echo "3. Testing admin endpoint with cookies..."
STATUS_RESPONSE=$(curl -s "$DOMAIN/api/admin/status" \
  -b $COOKIE_FILE \
  -w "\nHTTP_CODE:%{http_code}")

echo "Status Response: $STATUS_RESPONSE"
echo ""

if echo "$STATUS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Admin session working!"
else
    echo "❌ Admin session NOT working - 'Admin access required' error"
    echo ""
    echo "This means cookies are not being sent or recognized."
fi

echo ""
echo "4. Testing with verbose output..."
echo "Attempting to add a test participant..."
ADD_RESPONSE=$(curl -v -X POST "$DOMAIN/api/admin/participants" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"TestUser","phoneNumber":"5551234567"}' \
  -b $COOKIE_FILE \
  2>&1)

echo "$ADD_RESPONSE"

# Cleanup
rm -f $COOKIE_FILE

echo ""
echo "===================================="
echo "Test complete!"
