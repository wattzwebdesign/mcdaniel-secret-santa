#!/bin/bash
# Quick database import script

echo "🎄 McDaniel Secret Santa - Database Setup"
echo "=========================================="
echo ""

# Database credentials
DB_USER="u170340_mcdaniel"
DB_NAME="s170340_mcdaniel"
DB_PASS="9XNErEBZMenXgSow"

echo "Importing schema into database: $DB_NAME"
echo ""

# Import schema
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < sql/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema imported successfully!"
    echo ""
    echo "Verifying tables..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"
    echo ""
    echo "✅ Setup complete!"
else
    echo ""
    echo "❌ Import failed. Check the error message above."
    exit 1
fi
