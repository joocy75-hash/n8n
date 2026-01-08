#!/bin/bash

# n8n AI Workflow Builder 개발 서버 시작 스크립트
# Usage: ./start-n8n-ai.sh

set -e

echo "🚀 Starting n8n with AI Workflow Builder enabled..."

# AI Workflow Builder 환경변수 설정
export N8N_AI_ENABLED=true

# Anthropic API 키 (직접 AI 서비스 사용)
# 아래 줄의 주석을 해제하고 실제 API 키로 교체하세요
# export N8N_AI_ANTHROPIC_KEY="your-anthropic-api-key-here"

# n8n AI Assistant 클라우드 서비스 URL
# Anthropic API 키 대신 n8n 클라우드 서비스를 사용하려면 아래 줄 사용
export N8N_AI_ASSISTANT_BASE_URL="https://assistant.n8n.io"

# 현재 docker-compose.yml에 설정된 Anthropic 키 사용 (테스트용)
export N8N_AI_ANTHROPIC_KEY="${N8N_AI_ANTHROPIC_KEY}"

# 일반 n8n 설정
export N8N_HOST=localhost
export N8N_PORT=5678
export N8N_PROTOCOL=http
export NODE_ENV=development
export GENERIC_TIMEZONE=Asia/Seoul

echo "📋 Environment Variables Set:"
echo "   N8N_AI_ENABLED=$N8N_AI_ENABLED"
echo "   N8N_AI_ASSISTANT_BASE_URL=$N8N_AI_ASSISTANT_BASE_URL"
echo "   N8N_AI_ANTHROPIC_KEY=${N8N_AI_ANTHROPIC_KEY:0:20}..."
echo ""

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# 빌드 상태 확인
if [ ! -d "packages/cli/dist" ] || [ ! -f "packages/cli/dist/index.js" ]; then
    echo "⚙️  Building n8n... (this may take a few minutes)"
    pnpm run build
fi

echo "🌐 Starting n8n server on http://localhost:$N8N_PORT"
echo "   AI Workflow Builder should be available in the workflow editor."
echo ""

# n8n 시작
cd packages/cli
pnpm run start
