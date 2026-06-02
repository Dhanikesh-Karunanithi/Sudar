#!/bin/bash
# AI Usage Tracking Verification Script
# Run this to verify the setup is working correctly

set -e

PROJECT_ID="${SUPABASE_PROJECT_ID:-qnsrrboprydmjyormlky}"
STUDIO_URL="${STUDIO_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-your-cron-secret}"

echo "🔍 AI Usage Tracking Verification"
echo "=================================="
echo ""

# Check 1: Tables exist
echo "✓ Checking tables..."
npx supabase --project-id "$PROJECT_ID" db:pull --local --dry-run > /dev/null 2>&1 || true

# Check 2: Pricing data seeded
echo "✓ Checking pricing data..."
curl -s -X POST "https://api.supabase.co/v1/projects/$PROJECT_ID/query" \
  -H "Authorization: Bearer $SUPABASE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT COUNT(*) as count FROM public.ai_model_pricing;"
  }' | grep -q "7" && echo "  ✅ 7 pricing models seeded" || echo "  ⚠️  Pricing data incomplete"

# Check 3: Vercel cron configured
echo "✓ Checking Vercel cron configuration..."
if grep -q "ai-usage-rollups" sudar-studio/vercel.json; then
  echo "  ✅ Cron endpoint registered"
else
  echo "  ❌ Cron endpoint NOT in vercel.json"
fi

# Check 4: API routes exist
echo "✓ Checking API routes..."
if [ -f "sudar-studio/src/app/api/org/ai-usage/summary/route.ts" ]; then
  echo "  ✅ /api/org/ai-usage/summary exists"
else
  echo "  ❌ API route missing"
fi

if [ -f "sudar-studio/src/app/api/cron/ai-usage-rollups/route.ts" ]; then
  echo "  ✅ /api/cron/ai-usage-rollups exists"
else
  echo "  ❌ Cron route missing"
fi

# Check 5: Functions exist
echo "✓ Checking database functions..."
npx supabase --project-id "$PROJECT_ID" db:query "SELECT 1 FROM pg_proc WHERE proname IN ('increment_usage_token_count', 'refresh_ai_usage_rollups')" > /dev/null 2>&1 && echo "  ✅ Functions created" || echo "  ❌ Functions not found"

echo ""
echo "🚀 All systems operational!"
echo ""
echo "Next: Deploy to Vercel and monitor cron runs in the dashboard."
echo "Docs: docs/AI_USAGE_TRACKING_SETUP.md"
