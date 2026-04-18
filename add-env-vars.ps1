#!/usr/bin/env pwsh
# Script para adicionar variáveis de ambiente na Vercel

Write-Host "🚀 Adicionando variáveis de ambiente na Vercel..." -ForegroundColor Cyan

# Mercado Pago
Write-Host "`n📦 Mercado Pago..." -ForegroundColor Yellow
vercel env add NEXT_PUBLIC_MP_PUBLIC_KEY production --yes <<< "APP_USR-864010ed-8214-4e1c-bf47-442d798621a5"
vercel env add MP_ACCESS_TOKEN production --yes <<< "APP_USR-1269114691632418-041815-0dc0772f2a195ff134d0af3d7cb5015d-379528177"
vercel env add MP_WEBHOOK_SECRET production --yes <<< "chefbox_mp_webhook_2026_secure_key_xyz123"

# Supabase
Write-Host "`n🗄️ Supabase..." -ForegroundColor Yellow
vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZXZkdHhpZ2p4ZHRxZmhmYnRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY0NTk3OSwiZXhwIjoyMDkwMjIxOTc5fQ.85W0cQpvrM5Ts8CMXPQcQL_DmV4RFl3WeXE6eoZEZu0"

# OpenAI
Write-Host "`n🤖 OpenAI..." -ForegroundColor Yellow
vercel env add AI_API_URL production --yes <<< "https://api.openai.com/v1"
vercel env add AI_MODEL_BASE production --yes <<< "gpt-5.4-nano"
vercel env add AI_MODEL_PREMIUM production --yes <<< "gpt-5.4"
vercel env add AI_MAX_OUTPUT_TOKENS_MEAL_PLAN production --yes <<< "4000"
vercel env add AI_CACHE_TTL_SECONDS production --yes <<< "900"

# Yampi
Write-Host "`n💳 Yampi..." -ForegroundColor Yellow
vercel env add YAMPI_API_TOKEN production --yes <<< "fxmTQW7vFfW8fXLHkonh3NHlQp4wJSC32TCVWsCg"
vercel env add YAMPI_API_URL production --yes <<< "https://api.yampi.io"
vercel env add YAMPI_WEBHOOK_SECRET production --yes <<< "wh_ztJ48M2ICg9wuBU7M8X3TZVdsTlNlfRULKc7F"
vercel env add YAMPI_ALIAS production --yes <<< "hub-digital2"

Write-Host "`n✅ Variáveis adicionadas com sucesso!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANTE: Após o deploy, adicione:" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_APP_URL=<URL_DA_VERCEL>" -ForegroundColor Cyan
Write-Host "   NEXT_PUBLIC_SITE_URL=<URL_DA_VERCEL>" -ForegroundColor Cyan
