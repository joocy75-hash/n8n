# AI Workflow Builder 설정 가이드

> ⚠️ **Node.js 버전 요구사항**: n8n은 Node.js v20.19 ~ v24.x를 요구합니다.
> 현재 Node.js 버전이 호환되지 않으면 `nvm`을 사용하여 버전을 전환하세요:
>
>
```bash
nvm install 20
nvm use 20
```

이 문서는 n8n의 AI Workflow Builder(Ask & Build) 기능을 로컬 개발 환경에서 활성화하는 방법을 설명합니다.

## 환경변수 요구사항

AI Workflow Builder가 작동하려면 다음 환경변수가 필요합니다:

| 환경변수 | 필수 | 설명 |
| :--- | :--- | :--- |
| `N8N_AI_ENABLED` | ✅ | `true`로 설정하면 AI 관련 라이선스 체크를 우회함 |
| `N8N_AI_ANTHROPIC_KEY` | ⭐ | Anthropic Claude API 키 (로컬 AI Builder 서비스 사용 시) |
| `N8N_AI_ASSISTANT_BASE_URL` | ⭐ | n8n AI Assistant 서비스 URL (n8n 클라우드 서비스 사용 시) |

> ⭐ `N8N_AI_ANTHROPIC_KEY` 또는 `N8N_AI_ASSISTANT_BASE_URL` 중 하나 이상 설정해야 합니다.

## 설정 방법

### 방법 1: .env 파일 생성 (권장)

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# N8N AI Workflow Builder Configuration

# Enable AI features (bypasses license check for AI features)
N8N_AI_ENABLED=true

# Option 1: Use Anthropic Claude API directly
N8N_AI_ANTHROPIC_KEY=your_anthropic_api_key_here

# Option 2: Use n8n's AI Assistant cloud service
# N8N_AI_ASSISTANT_BASE_URL=https://assistant.n8n.io

# General n8n settings
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
NODE_ENV=development
GENERIC_TIMEZONE=Asia/Seoul
```

### 방법 2: 환경변수 직접 설정 후 실행

```bash
# macOS/Linux
export N8N_AI_ENABLED=true
export N8N_AI_ANTHROPIC_KEY="your_anthropic_api_key_here"
pnpm run dev

# 또는 한 줄로
N8N_AI_ANTHROPIC_KEY="your_anthropic_api_key_here" pnpm run dev
```

### 방법 3: Docker Compose 사용

현재 `docker-compose.yml`에 이미 필요한 환경변수가 설정되어 있습니다:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_AI_ENABLED=true
      - N8N_AI_ANTHROPIC_KEY=your_anthropic_api_key_here
      - N8N_AI_ASSISTANT_BASE_URL=https://assistant.n8n.io
```

```bash
docker-compose up -d
```

## 개발 서버 실행

로컬에서 개발 모드로 실행하려면:

```bash
# 전체 빌드 후 실행
pnpm run build
pnpm run start

# 또는 개발 모드 (핫 리로드)
cd packages/cli
pnpm run dev
```

## 프론트엔드 확인

AI Workflow Builder가 성공적으로 활성화되면:

1. 브라우저에서 `http://localhost:5678` 접속
2. 워크플로우 에디터에서 오른쪽 하단에 **AI Assistant 버튼** (스파클 아이콘)이 표시됨
3. 버튼을 클릭하면 AI Builder 채팅 패널이 열림

## 트러블슈팅

### AI 버튼이 보이지 않는 경우

1. **환경변수 확인**: 브라우저 개발자 도구에서 Network 탭을 열고 `/rest/settings` 요청의 응답에서 다음을 확인:
   ```json
   {
     "aiBuilder": {
       "enabled": true,
       "setup": true
     }
   }
   ```

2. **서버 재시작**: 환경변수 변경 후 서버를 완전히 재시작해야 합니다.

3. **캐시 클리어**: 브라우저 캐시를 클리어하고 새로고침하세요.

### Failed to connect to LLM Provider: fetch failed

원격 서버에서 AI Workflow Builder 사용 시 이 오류가 발생하면 다음 단계별로 확인하세요:

#### 1단계: API 키 설정 확인

```bash
# 서버의 .env 파일 확인
cat /root/group_e/.env

# 컨테이너 내부 환경변수 확인
docker exec groupe-n8n printenv N8N_AI_ANTHROPIC_KEY

# API 키 형식 확인 (sk-ant-api03-... 형태여야 함)
docker exec groupe-n8n printenv | grep N8N_AI
```

**일반적인 문제:**

- GitHub Secrets에 `N8N_AI_ANTHROPIC_KEY`가 설정되지 않음
- API 키 형식이 잘못됨 (앞뒤 공백, 줄바꿈 문자 포함)
- `.env` 파일이 제대로 생성되지 않음

#### 2단계: 네트워크 연결 확인

```bash
# 호스트에서 DNS 해석 테스트
nslookup api.anthropic.com

# 호스트에서 HTTPS 연결 테스트
curl -sI https://api.anthropic.com

# 컨테이너 내부에서 DNS 해석 테스트
docker exec groupe-n8n nslookup api.anthropic.com

# 컨테이너 내부에서 HTTPS 연결 테스트
docker exec groupe-n8n curl -sI https://api.anthropic.com
```

**일반적인 문제:**

- Docker 기본 DNS가 외부 도메인 해석 실패 → `dns` 설정 필요
- 방화벽이 아웃바운드 HTTPS (443포트) 차단
- IPv6 연결 문제 → `NODE_OPTIONS=--dns-result-order=ipv4first` 필요

#### 3단계: Docker 설정 확인

```yaml
# docker-compose.production.yml에 다음이 포함되어야 함:
dns:
  - 8.8.8.8
  - 8.8.4.4
environment:
  - N8N_AI_ENABLED=true
  - N8N_AI_ANTHROPIC_KEY=${N8N_AI_ANTHROPIC_KEY}
  - NODE_OPTIONS=--dns-result-order=ipv4first
```

#### 4단계: 콘테이너 로그 확인

```bash
# 최근 로그 확인
docker logs groupe-n8n --tail 100

# 실시간 로그 모니터링
docker logs groupe-n8n -f

# AI 관련 오류만 필터링
docker logs groupe-n8n 2>&1 | grep -i "llm\|anthropic\|ai"
```

#### 5단계: 수동 API 테스트

```bash
# 컨테이너 내부에서 Anthropic API 직접 테스트
docker exec groupe-n8n curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $(docker exec groupe-n8n printenv N8N_AI_ANTHROPIC_KEY)" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

응답이 오면 API 키와 네트워크가 정상이며, n8n 내부 문제일 수 있습니다.
`fetch failed` 오류가 나면 네트워크 연결 문제입니다.


#### 6단계: 404 MODEL_NOT_FOUND 오류 확인

`404 {"type":"error","error":{"type":"not_found_error","message":"model: ..."}}`와 같은 오류가 발생하면, n8n 코드 내부에 설정된 모델 이름이 유효하지 않은 경우입니다.

**현재 사용 중인 모델:**
- **Claude Opus 4.5 Thinking** (`claude-opus-4-5-20251101`)
- Extended Thinking 기능이 활성화되어 복잡한 추론 작업에 최적화됨

**해결 방법:**

1. `packages/@n8n/ai-workflow-builder.ee/src/llm-config.ts` 파일에서 모델 설정을 확인합니다.
2. 수정 후 코드를 커밋하고 GitHub에 푸시하여 자동 배포를 트리거하세요.
3. 배포가 완료되면 서버에서 최신 이미지가 실행되면서 문제가 해결됩니다.

## 코드 동작 원리

1. **라이선스 체크** (`packages/cli/src/license.ts`):
   - `N8N_AI_ENABLED=true`이면 `AI_BUILDER`, `AI_ASSISTANT`, `ASK_AI`, `AI_CREDITS` 라이선스가 자동 활성화

2. **프론트엔드 설정** (`packages/cli/src/services/frontend.service.ts`):
   - `aiBuilder.enabled`: 라이선스 기능 활성화 여부
   - `aiBuilder.setup`: API 키 또는 베이스 URL 설정 여부

3. **UI 표시** (`packages/frontend/editor-ui/src/features/ai/assistant/`):
   - `AssistantsHub.vue`: AI Builder 채팅 패널
   - `AskAssistantFloatingButton.vue`: 플로팅 버튼
   - `builder.store.ts`: AI Builder 상태 관리

## 관련 파일

- `packages/cli/src/license.ts` - 라이선스 체크 로직
- `packages/cli/src/services/frontend.service.ts` - 프론트엔드 설정 전송
- `packages/cli/src/services/ai-workflow-builder.service.ts` - AI Builder 서비스
- `packages/@n8n/ai-workflow-builder.ee/` - AI Workflow Builder 코어 패키지
- `packages/@n8n/config/src/configs/ai-builder.config.ts` - AI Builder 설정
- `packages/frontend/editor-ui/src/features/ai/assistant/` - 프론트엔드 컴포넌트

## GitHub Actions CI/CD 자동 배포

수정된 코드를 원격 서버에 자동으로 빌드 및 배포하기 위한 CI/CD 파이프라인이 구축되어 있습니다.

### 워크플로우 파일

- `.github/workflows/deploy-custom-n8n.yml`

### 주요 기능

1. **자동 빌드**: `master` 브랜치에 푸시될 때마다 Node.js 20 환경에서 n8n 소스 코드를 빌드합니다.
2. **Docker 이미지 생성**: 빌드된 코드를 포함한 커스텀 Docker 이미지를 생성합니다.
3. **GHCR 푸시**: 생성된 이미지를 GitHub Container Registry(`ghcr.io`)에 푸시합니다.
4. **원격 배포**: 원격 서버에 SSH로 접속하여 `docker-compose.production.yml` 설정을 바탕으로 최신 이미지를 배포합니다.

### GitHub Secrets 설정

배포가 정상적으로 작동하려면 GitHub 저장소의 **Settings > Secrets and variables > Actions**에 다음 항목을 추가해야 합니다:

| Secret 이름 | 설명 |
| :--- | :--- |
| `N8N_AI_ANTHROPIC_KEY` | Anthropic API 키 |
| `REMOTE_HOST` | 원격 서버 IP 주소 |
| `REMOTE_USER` | 원격 서버 접속 계정 (예: `root`) |
| `REMOTE_PASSWORD` | 원격 서버 접속 비밀번호 |

### 운영 환경 확인 (Docker)

원격 서버에서는 `docker-compose.production.yml`을 사용하여 배포됩니다.

- **이미지**: `ghcr.io/joocy75-hash/n8n:latest`
- **포트**: 5678
- **URL**: `http://141.164.55.245/` (또는 설정된 도메인)

## 운영 환경 동기화 및 유지보수 가이드

현재 로컬 개발 환경, GitHub 저장소, 원격 서버는 모두 최신 상태로 동기화되어 있습니다. 다른 작업자가 코드를 수정하거나 환경을 변경할 때 다음 사항을 반드시 준수해야 합니다.

### 1. 환경 동기화 구조

- **로컬 (Local)**: `master` 브랜치에서 작업 후 GitHub로 푸시합니다.
- **GitHub**: `master` 브랜치에 푸시되면 GitHub Actions가 자동으로 실행되어 커스텀 Docker 이미지를 빌드하고 GHCR(`ghcr.io`)에 푸시합니다.
- **원격 서버 (Remote)**: GitHub Actions의 `deploy` 단계가 성공하면 원격 서버에 접속하여 최신 이미지를 풀(pull)하고 컨테이너를 재시작합니다.

### 2. 주요 설정 파일 및 주의사항

#### Docker Compose (`docker-compose.production.yml`)

- **`N8N_SECURE_COOKIE=false`**: 현재 HTTPS가 아닌 IP 주소로 접속 중이므로, 이 설정이 `true`이거나 누락되면 로그인이 불가능합니다. 도메인 및 SSL(HTTPS) 적용 전까지는 `false`를 유지해야 합니다.
- **`NODE_OPTIONS=--dns-result-order=ipv4first`**: 원격 서버의 IPv6 연결 문제를 방지하기 위해 필수적인 설정입니다. 삭제 시 LLM 연결 오류(`fetch failed`)가 발생할 수 있습니다.
- **`dns` 설정**: 컨테이너 내부에서 Anthropic API 도메인 해석을 위해 Google DNS(`8.8.8.8`)를 명시적으로 사용합니다.

#### GitHub Secrets

CI/CD 파이프라인이 정상 작동하려면 다음 Secrets가 GitHub에 등록되어 있어야 합니다:

- `N8N_AI_ANTHROPIC_KEY`: AI 기능을 위한 API 키
- `REMOTE_HOST`: 원격 서버 IP (`141.164.55.245`)
- `REMOTE_USER`: 접속 계정 (`root`)
- `REMOTE_PASSWORD`: 접속 비밀번호

### 3. 코드 수정 시 프로세스

1. 로컬에서 코드 수정 및 테스트
2. `git commit` (필요 시 `--no-verify`로 lint 체크 우회 가능)
3. `git push origin master`
4. GitHub Actions의 **Actions** 탭에서 빌드 및 배포 상태 모니터링
5. 배포 실패 시, 서버에 직접 접속하여 `docker compose pull && docker compose up -d`로 수동 배포 가능

### 4. 서버 수동 관리 (필요 시)

서버의 n8n 설정 경로는 `/root/group_e/`입니다.

```bash
cd /root/group_e/
# 설정 변경 후 반영
docker compose -f docker-compose.production.yml up -d
# 로그 확인
docker logs groupe-n8n --tail 100 -f
```

이 가이드를 준수하여 운영 환경의 일관성을 유지해 주시기 바랍니다.

---

## 📋 인수인계 (2026-01-11)

### 최근 주요 변경 사항

#### 1. AI 모델 업그레이드: Claude Opus 4.5 Thinking

**변경일**: 2026-01-11

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 모델 | `claude-sonnet-4-5-20250514` | `claude-opus-4-5-20251101` |
| Extended Thinking | 비활성화 | 활성화 (budget: 10,000 tokens) |
| MAX_OUTPUT_TOKENS | 16,000 | 32,000 |

**관련 파일:**
- `packages/@n8n/ai-workflow-builder.ee/src/llm-config.ts` - `anthropicOpus45Thinking` 함수 추가
- `packages/@n8n/ai-workflow-builder.ee/src/ai-workflow-builder-agent.service.ts` - 모델 함수 변경
- `packages/@n8n/ai-workflow-builder.ee/src/constants.ts` - 토큰 제한 증가
- `packages/cli/src/modules/chat-hub/chat-hub.constants.ts` - 모델 메타데이터 추가

**Extended Thinking 설정:**
```typescript
// llm-config.ts
thinking: {
  type: 'enabled',
  budget_tokens: 10000,
}
// 헤더: 'anthropic-beta': 'thinking-2025-04-30,prompt-caching-2024-07-31'
// temperature: 1 (thinking 모드 필수)
```

#### 2. 도메인 설정: ai-n8n.shop

**변경일**: 2026-01-11

| 항목 | 설정 값 |
|------|---------|
| 도메인 | `ai-n8n.shop` |
| DNS A 레코드 | `@` → `141.164.55.245` |
| DNS A 레코드 | `www` → `141.164.55.245` |
| 포트 매핑 | `80:5678` |

**접속 URL**: http://ai-n8n.shop

**관련 파일:**
- `docker-compose.production.yml` - 포트 80:5678 매핑 추가
- `nginx/ai-n8n.shop.conf` - nginx 설정 파일 (서버에 nginx 미설치로 현재 미사용)

#### 3. 배포 스크립트 개선

**변경일**: 2026-01-11

`.github/workflows/deploy-custom-n8n.yml`에 다음 기능 추가:

1. **포트 80 충돌 자동 해결**
   - 배포 전 포트 80 사용 여부 확인
   - nginx 서비스 자동 중지
   - 다른 Docker 컨테이너 자동 중지

2. **nginx 설정 자동 적용** (선택적)
   - nginx가 설치된 경우 자동으로 리버스 프록시 설정
   - `sites-available`, `sites-enabled` 디렉토리 자동 생성

3. **도메인 접속 테스트**
   - 배포 완료 후 도메인 접속 자동 테스트

4. **컨테이너 내 curl 미존재 처리**
   - curl이 없는 경우 네트워크 테스트 스킵

### 현재 운영 환경 상태

```
┌─────────────────────────────────────────────────────────────┐
│                    운영 환경 현황                            │
├─────────────────────────────────────────────────────────────┤
│ 서버 IP        : 141.164.55.245                             │
│ 도메인         : ai-n8n.shop                                │
│ 컨테이너       : groupe-n8n                                 │
│ 포트           : 80 (외부) → 5678 (내부)                    │
│ AI 모델        : Claude Opus 4.5 Thinking                   │
│ Extended Think : 활성화 (10K tokens budget)                 │
│ HTTPS          : 미적용 (N8N_SECURE_COOKIE=false 필수)      │
└─────────────────────────────────────────────────────────────┘
```

### 향후 작업 권장 사항

1. **HTTPS 적용**
   - Let's Encrypt 인증서 발급
   - nginx 또는 Traefik 리버스 프록시 설정
   - `N8N_SECURE_COOKIE=true`로 변경

2. **Extended Thinking 토큰 조정**
   - 현재 10,000 tokens로 설정
   - 복잡한 워크플로우 생성 시 증가 고려 (최대 100,000)
   - 비용과 성능 간 트레이드오프 고려

3. **모니터링 추가**
   - API 사용량 모니터링
   - 컨테이너 헬스체크 강화

### 주의사항

> ⚠️ **중요**: Extended Thinking 모드에서는 `temperature`가 반드시 `1`이어야 합니다.
> 다른 값을 설정하면 API 오류가 발생합니다.

> ⚠️ **중요**: 포트 80이 이미 사용 중인 경우 배포 스크립트가 자동으로 해제합니다.
> 다른 서비스가 포트 80을 사용해야 한다면 docker-compose.production.yml에서 포트를 변경하세요.

### 문의

작업 관련 문의는 GitHub Issues 또는 프로젝트 담당자에게 연락하세요.
