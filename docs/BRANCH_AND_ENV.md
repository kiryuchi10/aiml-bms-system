# 브랜치 및 환경 설정 요약

## 이번 변경사항 커밋용 Git 브랜치

다음 브랜치에 커밋하는 것을 권장합니다.

- **`feat/frontend-aim-model-center-and-env`**  
  (AIModelCenter 실연동 UI + env 통일 + DB 계정 정리)

또는 기존 계획에 맞춰 대시보드 v2 통합 전체를 한 브랜치로 갈 경우:

- **`feat/frontend-shell-dashboard-v2`**

### 커밋 예시

```text
feat(frontend): add AIModelCenter with real API and safe Tailwind colors
feat(frontend): ML Console route renders AIModelCenter
chore(env): unify VITE_API_BASE / VITE_BMS_WS_URL, backend bms/aimlbms
chore(docker): DB user bms, root password root12345
```

## 환경 변수 요약

| 구분 | 키 | 설명 |
|------|----|------|
| Frontend | `VITE_API_BASE` | 기본 `http://localhost:8000/api/v1` (프록시 사용 시 비워둠) |
| Frontend | `VITE_BMS_WS_URL` | 기본 `ws://localhost:8000/ws/bms` |
| Backend | `DATABASE_URL` | 로컬: `bms:12345@localhost:3306/aimlbms`, Docker: `@db:3306/aimlbms` |
| Backend | `ALLOW_ORIGINS` | 콤마 구분 복수 허용 (예: `http://localhost:5173,https://app.example.com`) |

## Backend .env 파일

- **로컬 실행**: `.env` 또는 `.env.dev` (복사 후 사용)
- **Docker Compose**: `backend` 서비스는 `environment`로 직접 주입되며, 필요 시 `env_file: .env.docker` 지정 가능
