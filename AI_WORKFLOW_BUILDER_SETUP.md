# AI Workflow Builder 설정 가이드

> ⚠️ **Node.js 버전 요구사항**: n8n은 Node.js v20.19 ~ v24.x를 요구합니다.
> 현재 Node.js 버전이 호환되지 않으면 `nvm`을 사용하여 버전을 전환하세요:
>
> ```bash
> nvm install 20
> nvm use 20
> ```

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
N8N_AI_ENABLED=true N8N_AI_ANTHROPIC_KEY="your_key" pnpm run dev
```

### 방법 3: Docker Compose 사용

현재 `docker-compose.yml`에 이미 필요한 환경변수가 설정되어 있습니다:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_AI_ENABLED=true
      - N8N_AI_ANTHROPIC_KEY=your_key_here
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
- **URL**: `http://n8n.deepsignal.shop/`
