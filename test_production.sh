#!/bin/bash

echo "🚀 --- Ethiopian ID OCR Production Test Guide ---"
echo ""

# 1. Check Database
echo "🔍 Step 1: Checking Database Connection..."
node tests/test_db_conn.js
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Database is not reachable. Ensure PostgreSQL is running on localhost:5432."
    echo "Check your .env for the correct DATABASE_URL."
    exit 1
fi
echo "✅ Database connection verified."
echo ""

# 2. Run Migrations
echo "🐘 Step 2: Running Database Migrations..."
npx prisma migrate dev --name init --skip-generate
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Prisma migration failed. See error output above."
    exit 1
fi
echo "✅ Database schema is up to date."
echo ""

# 3. Start API Server (Background)
echo "🌐 Step 3: Starting API Server..."
npm run server > api_server.log 2>&1 &
API_PID=$!
sleep 3
if ps -p $API_PID > /dev/null; then
    echo "✅ API Server running (PID: $API_PID)"
else
    echo "❌ ERROR: API Server failed to start. Check api_server.log"
    exit 1
fi
echo ""

# 4. Run Credit Logic Test
echo "🪙 Step 4: Running Credit Logic Test..."
node tests/test_credits.js
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Credit logic test failed."
    # Cleanup
    kill $API_PID
    exit 1
fi
echo "✅ Credit logic verified."
echo ""

# 5. Cleanup and Next Steps
echo "✨ --- ALL SYSTEMS READY ---"
echo ""
echo "Next steps:"
echo "1. Keep the API server running (or use 'pm2 start ecosystem.config.cjs')"
echo "2. Start the Telegram bot: cd tg-bot && npm run dev"
echo "3. Re-initialize Admin dashboard: npx create-next-app@latest admin"
echo ""
echo "Stopping background test server (PID: $API_PID)..."
kill $API_PID
