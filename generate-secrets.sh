#!/bin/bash
# Generate secure secrets for Secret Santa application

echo "🔐 Secret Santa - Generating Secure Keys"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Generating SESSION_SECRET (32 bytes)..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ SESSION_SECRET: $SESSION_SECRET"
echo ""

echo "Generating ENCRYPTION_KEY (32 bytes)..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo ""

echo "========================================"
echo "📋 Copy these values to your .env file:"
echo "========================================"
echo ""
echo "SESSION_SECRET=$SESSION_SECRET"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "========================================"
echo "⚠️  IMPORTANT:"
echo "1. Copy the values above to your .env file"
echo "2. Keep these secrets private"
echo "3. Never commit them to git"
echo "4. Use different secrets for dev/production"
echo "========================================"
