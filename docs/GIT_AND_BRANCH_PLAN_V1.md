# AIML-BMS System — Git 버전관리 계획 및 브랜치 정의 (버전 1)

**문서 버전:** 1  
**기준일:** 2025-02-11  
**참조:** REQUIREMENTS.md, DESIGN.md, TASKS.md, IMPLEMENTATION_SUMMARY_AND_TODO_V1.md

---

## 1. Git 버전관리 계획

### 1.1 워크플로우

- **기본:** Git Flow 변형. `main` = 배포 가능 상태, `develop` = 통합 개발.
- **기능/단계:** Phase 단위 또는 기능 단위는 `develop`에서 분기한 `feature/*`에서 작업 후 `develop`으로 PR/merge.
- **릴리스:** 배포 전 `develop` → `release/v*` 분기, 버그 수정 후 `release/v*` → `main` + `develop` 반영.
- **긴급 수정:** `main`에서 `fix/hotfix-*` 분기 → 수정 후 `main` + `develop` merge.

### 1.2 커밋 규칙 (권장)

- **형식:** `type(scope): message` (Conventional Commits 스타일).
- **type:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`.
- **scope:** `backend`, `frontend`, `db`, `ml`, `pipeline`, `docs` 등.
- **예:** `feat(backend): add GET /api/v1/alarms/{id} with evidence`, `docs: add GIT_AND_BRANCH_PLAN_V1.md`.

### 1.3 머지 전략

- **feature → develop:** Squash 또는 Merge commit 허용. 충돌 해결은 feature 브랜치에서 수행.
- **release → main:** Merge commit. 태그 `v1.0.0` 등으로 버전 부여.
- **main → develop:** release/hotfix 머지 후 `main`을 `develop`에 반영(또는 먼저 develop 머지한 뒤 main 태그).

### 1.4 보호·정책

- **main:** 직접 push 최소화; PR + 리뷰(가능 시) 후 merge.
- **develop:** 기본 통합 브랜치; feature PR만 허용.
- **태그:** 배포 시점에 `v<major>.<minor>.<patch>` 형식으로 생성.

---

## 2. 브랜치 명칭 리스트

| 구분 | 패턴 | 예시 | 용도 |
|------|------|------|------|
| **영구** | `main` | `main` | 배포 가능 최신 버전 |
| **영구** | `develop` | `develop` | 통합 개발 브랜치 |
| **기능/Phase** | `feature/<name>` | 아래 표 참조 | 단계별·기능별 개발 |
| **릴리스** | `release/v<ver>` | `release/v1.0.0` | 릴리스 전 정리·버그 수정 |
| **수정** | `fix/<name>` | `fix/alarm-ack-404` | 버그 수정(develop 기준) |
| **문서** | `docs/<name>` | `docs/setup-kr` | 문서만 수정 |
| **긴급** | `fix/hotfix-<name>` | `fix/hotfix/security-patch` | main 기준 긴급 패치 |

### 2.1 Phase 대응 feature 브랜치 명칭

| 브랜치명 | 대응 Phase | 요약 |
|----------|------------|------|
| `feature/phase0-setup` | Phase 0 | 프로젝트 셋업·문서·스캐폴드 |
| `feature/phase1-data` | Phase 1 | 데이터 준비·전처리·통합 스키마 |
| `feature/phase2-features` | Phase 2 | Feature/Label 추출·정규화 |
| `feature/phase3-models` | Phase 3 | 모델 학습·비교표·재현성 |
| `feature/phase4-backend` | Phase 4 | Backend API·디지털 트윈 파이프라인 |
| `feature/phase5-frontend` | Phase 5 | Frontend 에너지 대시보드 |
| `feature/phase6-twin-polish` | Phase 6 | 디지털 트윈 통합·마무리 |

### 2.2 세부 기능용 feature 예시 (선택)

- `feature/alarm-evidence` — 알람 evidence 저장/조회/ACK
- `feature/ws-realtime` — WebSocket 실시간 스트림 형식 통일
- `feature/comparison-table-api` — 비교표 전용 API
- `feature/auth-rbac` — JWT·RBAC 로그인/역할
- `feature/dashboard-home-layout` — Dashboard Home 12col·컴포넌트 정합

---

## 3. 브랜치별 목표·Todo·설명·Requirements·Design·Task

각 브랜치에 대해 **목표**, **Todo**, **설명**, **Requirements 참조**, **Design 참조**, **Task 참조**를 정리한다.

---

### 3.1 `main`

| 항목 | 내용 |
|------|------|
| **목표** | 항상 배포 가능한 상태 유지. 태그로 버전 관리. |
| **Todo** | 없음(릴리스 시점에만 반영). |
| **설명** | 프로덕션 브랜치. `release/*` 또는 `fix/hotfix-*` 머지만 허용. |
| **Requirements** | 전체 요구사항 충족 버전만 반영. |
| **Design** | DESIGN.md 아키텍처·API·Shell 준수. |
| **Task** | TASKS.md Definition of Done 충족 시 merge. |

---

### 3.2 `develop`

| 항목 | 내용 |
|------|------|
| **목표** | Phase/기능 통합; 다음 릴리스까지의 누적 개발. |
| **Todo** | Phase 0~6 진행 상황에 따라 IMPLEMENTATION_SUMMARY_AND_TODO_V1.md To-Do 반영. |
| **설명** | 기본 작업 브랜치. `feature/*`, `fix/*`, `docs/*` 머지 대상. |
| **Requirements** | REQUIREMENTS.md — Dashboard Shell, 컴포넌트, Pages, Data Principles. |
| **Design** | DESIGN.md — Data Model, API, Frontend Shell, Data Flow. |
| **Task** | TASKS.md Phase 0~6 순차 진행; task.md Phase 0~4·DoD. |

---

### 3.3 `feature/phase0-setup`

| 항목 | 내용 |
|------|------|
| **목표** | 프로젝트 셋업·문서·스캐폴드 완료. |
| **Todo** | • `.gitignore` 정비 (Python, Node, env, data/raw, artifacts)<br>• `data/raw/`, `scripts/`, `backend/`·`frontend/` 스캐폴드 정리 |
| **설명** | Phase 0. 문서(REQUIREMENTS, DESIGN, TASKS, README)는 이미 있음; 코드 레포 구조·무시 규칙 정리. |
| **Requirements** | Goals/Non-Goals; 레포 구조는 데이터·스크립트·앱 분리 지원. |
| **Design** | Architecture 개요; Backend/Frontend 디렉터리 구조. |
| **Task** | TASKS.md Phase 0 — Project Setup & Documentation. |

---

### 3.4 `feature/phase1-data`

| 항목 | 내용 |
|------|------|
| **목표** | 전처리 후 통합 스키마 정의 및 preprocess 진입점 구현. |
| **Todo** | • 통합 cycle/curve 스키마 정의<br>• `scripts/preprocess.py`: MATR/HUST/CALCE/RWTH/SNL/UL_PUR/HNEI → `data/processed/`<br>• README 데이터 폴더·다운로드 링크<br>• YAML 등 데이터셋 경로·플래그 설정<br>• Train–test split (Random, MATR 등) |
| **설명** | Phase 1. 여러 데이터셋을 하나의 표현으로 맞추고, 학습/평가용 split 제공. |
| **Requirements** | Data Principles (Raw ≠ Feature ≠ Metric); ingest → raw 파이프라인 입력. |
| **Design** | Data Model — Raw 테이블; Ingest: NASA MAT/Parquet → raw. |
| **Task** | TASKS.md Phase 1 — Data Preparation. |

---

### 3.5 `feature/phase2-features`

| 항목 | 내용 |
|------|------|
| **목표** | Feature·Label 추출 및 정규화, Phase 1 출력과 연동. |
| **Todo** | • Feature 추출: incremental capacity, differential capacity, coulombic efficiency 등<br>• Label: cycle life, SoH, cathode aging 등(데이터셋별)<br>• 정규화: log scale, Z-score, smoothing(플러그)<br>• Phase 1 통합 데이터와 연동 |
| **설명** | Phase 2. Raw → Feature 공통 표현; 메트릭·모델 입력 준비. |
| **Requirements** | Feature/Metric 분리; 파이프라인 일관성. |
| **Design** | Features: raw → window/stride → feature_cell; Metrics: feature/raw → metric_aging. |
| **Task** | TASKS.md Phase 2 — Feature & Label Extraction. |

---

### 3.6 `feature/phase3-models`

| 항목 | 내용 |
|------|------|
| **목표** | 비교표(models×datasets, error mean±std) 산출 및 저장·재현성. |
| **Todo** | • Baseline: Dummy regressor<br>• Feature 기반: Variance, Discharge, Full<br>• Linear: Ridge, PCR, PLSR<br>• GP, XGBoost<br>• Seed 10회: RF, MLP, CNN, LSTM, Transformer<br>• 단일 진입점 또는 설정 기반 학습(dataset×model)<br>• 비교표 출력·CSV/JSON/DB·아티팩트(선택)<br>• 고정 시드, requirements.txt 버전 고정 |
| **설명** | Phase 3. 여러 모델·데이터셋 조합에 대한 비교표 생성. |
| **Requirements** | 비교표 스펙(REQUIREMENTS 비교표); Training & Results 페이지 입력. |
| **Design** | ML: ml_run, ml_metric; API /ml/datasets, /ml/train, /ml/runs. |
| **Task** | TASKS.md Phase 3 — Model Training & Comparison Table. |

---

### 3.7 `feature/phase4-backend`

| 항목 | 내용 |
|------|------|
| **목표** | Backend API·디지털 트윈 파이프라인 보강(비교표 API, ingest, 저장, OpenAPI). |
| **Todo** | • 비교표 전용 엔드포인트(모델×데이터셋 mean±std)<br>• 선택: cycle/telemetry ingest, 이벤트 기반 전/후처리(cron/queue)<br>• 선택: runs 메타·대용량 저장 정책<br>• OpenAPI 문서 정리 |
| **설명** | Phase 4. 현재 FastAPI·v1 엔드포인트는 있음; 비교표·ingest·문서 보강. |
| **Requirements** | API로 비교표·설정 제공; 선택적 ingest. |
| **Design** | DESIGN.md §3 API; Storage: runs metadata, large data. |
| **Task** | TASKS.md Phase 4 — Backend API & Digital Twin Pipeline. |

---

### 3.8 `feature/phase5-frontend`

| 항목 | 내용 |
|------|------|
| **목표** | Frontend 에너지 대시보드 완성(모니터링·설정·Lifetime·Learnings·Training·비교표·테마). |
| **Todo** | • Monitoring: Pack 실시간, SoC/SoH, 남은 시간, Learnings, Power, OT, Limiting factor<br>• Configuration: Pack/cell 설정, load/save, 백엔드 read/write<br>• Lifetime Log: 히스토리 사이클·열화 곡선<br>• Learnings Backup: export/backup 연동<br>• Training & Results: 비교표(mean±std), 시각화(메트릭, actual vs predicted, feature importance)<br>• 다크 테마·BMS 레이아웃<br>• 실제 백엔드만 사용(VITE_MOCK 제거 또는 게이트) |
| **설명** | Phase 5. Shell·페이지 골격은 있음; REQUIREMENTS 레이아웃·컴포넌트·페이지 사양 충족. |
| **Requirements** | REQUIREMENTS.md §1–2 전체; Pages 표(Monitoring, Configuration, Lifetime Log, Learnings Backup, Training & Results). |
| **Design** | DESIGN.md §4–5 Frontend Shell, Dashboard Home Layout. |
| **Task** | TASKS.md Phase 5 — Frontend Energy Dashboards. |

---

### 3.9 `feature/phase6-twin-polish`

| 항목 | 내용 |
|------|------|
| **목표** | 디지털 트윈 통합·UX 마무리(Virtual Fuel Gauge, Plot, Config Wizard, Preferences, 도움말). |
| **Todo** | • Virtual Fuel Gauge: 모델/시뮬 SoC/SoH<br>• Generate Plot: 열화 곡선·선택 모델/데이터셋 예측<br>• Config Wizard: Pack/cell 설정 가이드<br>• Preferences: 테마, 단위, 기본 데이터셋/모델<br>• 한계값(min/max, resolution) 도움말·툴팁<br>• 선택: AWS 등 클라우드 |
| **설명** | Phase 6. 대시보드 핵심 기능 위에 사용성·선택 기능 추가. |
| **Requirements** | Shell: Virtual Fuel Gauge, Config Wizard, Expert Mode, Preferences; 도움말. |
| **Design** | Digital Twin; WebSocket stream; Optional cloud. |
| **Task** | TASKS.md Phase 6 — Digital Twin Integration & Polish. |

---

### 3.10 `feature/alarm-evidence` (세부 기능 예)

| 항목 | 내용 |
|------|------|
| **목표** | 알람 목록/상세/ACK 및 evidence 저장·조회 완성. |
| **Todo** | • 알람 생성 시 alarm_evidence INSERT(alert_service/WS)<br>• Frontend AlarmCenter: GET alarms, GET alarms/{id}, POST ack, evidence 패널 |
| **설명** | NEXT_STEPS §2–3. Backend evidence 이미 부분 구현; 생성 시점 INSERT·프론트 연동. |
| **Requirements** | Alarm Center; evidence·recommended_action. |
| **Design** | alarm_event; API /alarms. |
| **Task** | NEXT_STEPS.md §2 Backend, §3 Frontend. |

---

### 3.11 `feature/auth-rbac` (세부 기능 예)

| 항목 | 내용 |
|------|------|
| **목표** | JWT 로그인·RBAC(admin/operator/engineer/ml)로 페이지·액션 제어. |
| **Todo** | • Backend: POST /auth/login, GET /auth/me, JWT 발급·검증<br>• Frontend: 로그인 → token 부착, refresh, 역할별 라우트/버튼 제어 |
| **설명** | REQUIREMENTS §3 Token & Auth. |
| **Requirements** | REQUIREMENTS.md §3 Token & Auth; RBAC. |
| **Design** | DESIGN.md §3 Auth. |
| **Task** | task.md Definition of Done — RBAC + JWT. |

---

### 3.12 `release/v*`

| 항목 | 내용 |
|------|------|
| **목표** | 배포 전 버전 고정·소규모 버그 수정·문서 정리. |
| **Todo** | • 버전 번호·CHANGELOG 정리<br>• 회귀 확인 후 main merge + 태그 |
| **설명** | develop에서 분기; 배포 품질 확보 후 main에 반영. |
| **Requirements** | 해당 버전 범위의 요구사항 충족. |
| **Design** | 변경 없음. |
| **Task** | TASKS.md Definition of Done (해당 버전 MVP). |

---

### 3.13 `fix/*` / `fix/hotfix-*`

| 항목 | 내용 |
|------|------|
| **목표** | 버그 수정. fix는 develop 기준, hotfix는 main 기준. |
| **Todo** | • 원인 수정·테스트<br>• develop 또는 main + develop 반영 |
| **설명** | 범위 최소화; 기능 추가 없음. |
| **Requirements** | 기존 요구사항 유지. |
| **Design** | 기존 설계 유지. |
| **Task** | 해당 이슈/버그만. |

---

### 3.14 `docs/*`

| 항목 | 내용 |
|------|------|
| **목표** | 문서만 수정(설정 가이드, 번역, 스펙 보강). |
| **Todo** | README, docs/*.md 수정만. |
| **설명** | 코드 변경 없음. |
| **Requirements** | 문서가 요구사항/설계와 일치하도록. |
| **Design** | 문서가 DESIGN과 일치하도록. |
| **Task** | TASKS Phase 0 문서 항목 또는 독립 문서 작업. |

---

## 4. 요약 표 — 브랜치 ↔ Phase·문서

| 브랜치 | Phase | 참조 문서 |
|--------|-------|-----------|
| `main` | — | DoD 충족 시만 |
| `develop` | 0~6 | REQUIREMENTS, DESIGN, TASKS, IMPLEMENTATION_SUMMARY_AND_TODO_V1 |
| `feature/phase0-setup` | 0 | TASKS Phase 0 |
| `feature/phase1-data` | 1 | TASKS Phase 1, DESIGN Data Model |
| `feature/phase2-features` | 2 | TASKS Phase 2, DESIGN Data Flow |
| `feature/phase3-models` | 3 | TASKS Phase 3, REQUIREMENTS 비교표 |
| `feature/phase4-backend` | 4 | TASKS Phase 4, DESIGN API |
| `feature/phase5-frontend` | 5 | TASKS Phase 5, REQUIREMENTS §1–2, DESIGN §4–5 |
| `feature/phase6-twin-polish` | 6 | TASKS Phase 6, DESIGN Digital Twin |
| `feature/alarm-evidence` | — | NEXT_STEPS, REQUIREMENTS Alarm Center |
| `feature/auth-rbac` | — | REQUIREMENTS §3, task.md DoD |
| `release/v*` | — | TASKS DoD |
| `fix/*`, `docs/*` | — | 해당 이슈·문서 |

---

*이 문서는 Git 버전관리 계획과 브랜치별 목표·Todo·Requirements·Design·Task 매핑을 담은 버전 1입니다. 운영 규모에 맞게 브랜치 전략을 조정해 사용하면 됩니다.*
