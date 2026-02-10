# AIML-BMS System — 구현 요약 및 To-Do (버전 1)

**문서 버전:** 1  
**기준일:** 2025-02-11  
**프로젝트:** AI/ML Battery Management System with Digital Twin Pipeline

---

## 1. 프로젝트 개요

- **목표:** NASA MAT·Parquet 기반 BMS 대시보드, WebSocket 실시간 모니터링, Raw/Feature/Metric 분리 DB 저장, AI/ML 파이프라인(ingest → raw → feature → metric → alarms → dashboard).
- **스택:** Backend FastAPI + SQLAlchemy + MySQL, Frontend React + Vite + TypeScript, Docker 지원.

---

## 2. 코드 구현 요약 (현재까지)

### 2.1 문서 및 설계

| 항목 | 상태 | 비고 |
|------|------|------|
| `docs/REQUIREMENTS.md` | ✅ | 기능/비기능 요구사항, 비교표 스펙 |
| `docs/DESIGN.md` | ✅ | 파이프라인, 디지털 트윈, UI/UX |
| `docs/TASKS.md` | ✅ | Phase 0~6 태스크 정의 |
| `docs/CURSOR_IMPLEMENTATION_GUIDE.md` | ✅ | 백엔드/프론트 Cursor 프롬프트, 아키텍처 |
| `docs/NEXT_STEPS.md` | ✅ | DB·Backend·Frontend·UI Gallery 체크리스트 |
| `.gitignore` | ⚠️ | Phase 0에서 미완료로 표시됨 (실제 파일은 존재) |

### 2.2 데이터베이스

| 항목 | 상태 | 비고 |
|------|------|------|
| `db/DB_SCHEMA_MYSQL.sql` | ✅ | 메인 스키마 (vehicle, telemetry_*, alarm_event, ml_run 등) |
| `db/DB_SCHEMA_MYSQL_EXTENDED.sql` | ✅ | alarm_evidence, explanations |
| `db/DB_SCHEMA_POSTGRES.sql` | ✅ | Postgres용 스키마 |
| `backend/scripts/setup_mysql.sh` | ✅ | aimlbms 생성 + 메인·확장 스키마 적용 |
| SQLAlchemy 모델 | ✅ | alarm_event, telemetry_bms(TelemetryCell, TelemetryPack), feature_cell, ml_run_bms, vehicle, training_run 등 참조됨 |

### 2.3 Backend (FastAPI)

**라우팅**

- `app/main.py`: CORS, `/api`(api_router), `/api/v1`(v1_router), `/ws/bms`(ws_router), `/ws/bms/db`(ws_db_router) 마운트.
- **API v1:** `/api/v1/telemetry`, `/dashboard`, `/alarms`, `/cells`, `/analytics`, `/ml`, WebSocket(v1-ws).

**엔드포인트 구현 요약**

| 구분 | 엔드포인트/기능 | 구현 내용 |
|------|-----------------|-----------|
| **Dashboard** | GET overview, pack-summary, worst-cell, active-alarms, cell-grid, balancing-status, alarms | DB(vehicle_id) 기반 + dataset_key 폴백, dashboard_service·dashboard_db_service 사용 |
| **Alarms** | GET list, GET /{id}, POST /{id}/ack | alarm_service: list_alarms, get_alarm_by_id, get_evidence_for_alarm, ack_alarm. evidence(rule/model) 포함 |
| **Cells** | cells API | v1/endpoints/cells.py |
| **Telemetry** | telemetry API | v1/endpoints/telemetry.py |
| **Analytics** | SOC, SOH, thermal, thermal-map, aging, risk | analytics_service 연동 (트렌드·맵 등) |
| **ML** | GET datasets, POST train, GET runs, GET runs/{id}, POST infer | feature_cell 기반 데이터셋 목록, BmsMlRun/BmsMlMetric, PyTorch trainer 연동(동기/비동기) |
| **WebSocket** | `/ws/bms` | websocket_bms.py — Parquet/MAT 스트림 |
| **WebSocket** | `/ws/bms/db` | bms_ws.py — DB telemetry_cell 리플레이 |

**서비스 레이어**

- `dashboard_service`: NASA MAT/Parquet 스냅샷, cell/pack 변환, 알람 유도, WS payload 생성.
- `dashboard_db_service`: get_pack_summary, get_worst_cell, get_active_alarms (DB).
- `alarm_service`: 알람 조회/evidence/ACK.
- `alert_service`: 셀 알람 규칙 평가 (TelemetryCell, AlarmEvent).
- `analytics_service`: SOC/SOH/thermal/aging/risk 트렌드·맵.
- `telemetry_service`: TelemetryCell/TelemetryPack 조회.
- `nasa_mat_loader`, `parquet_bms_loader`: MAT/Parquet 로드.
- `data_pipeline` (pipelines): Parquet → 정규화, train/val split, 슬라이딩 윈도우.
- ML: `app/ml/dataset.py`(BatteryDataset), `models.py`(MLP, Conv1D, build_model), `trainer.py`(run_training, run_training_and_persist).

**스키마(Pydantic)**

- `schemas/v1_dashboard.py`: PackTelemetry, CellTelemetry, DashboardOverview, DashboardCellGrid, AlarmEvidenceItem, AlarmDetail, AlarmAckBody, WsBmsPayload 등.

### 2.4 Frontend (React + Vite + TS)

**레이아웃·라우팅**

- `AppShell`: TopBar, SideNav, Main.
- 라우트: `/bms/home`, `/bms/cells`, `/bms/realtime`, `/bms/analytics`, `/bms/alarms`, `/bms/ml`, `/bms/configuration`, `/bms/lifetime`, `/bms/learnings`, `/bms/training`, `/bms/monitoring`, `/bms/ui`(갤러리) 및 UI 갤러리 서브(3panel-ops, control-room-wall, executive-cards 등 12종).

**페이지**

- DashboardHome, CellsGridPage, RealtimeMonitorPage, AnalyticsPage, AlarmCenterPage, MLConsolePage, ConfigurationPage, LifetimeLogPage, LearningsBackupPage, TrainingResultsPage, MonitoringPage, UIGalleryPage + UI 갤러리 레이아웃 페이지들.

**컴포넌트**

- BMS: AlarmPanel, BalancingStatus, CellCard, CellDetailDrawer, CellGrid, CellsGridSummaryBar, RealtimeChart.
- Dashboard: PackInfoCards, PackOverviewTiles, SocGaugeCard, WorstCellCard, ActiveAlarmsMiniTable, AlarmsGridCard, CellTable, LearningsCard.
- Charts: HeatmapGrid, LineChart.
- 기타: VirtualFuelGauge, LeftRail, TabsBar, TopBar.

**데이터·API**

- `services/apiV1.ts`: VITE_API_BASE / VITE_BMS_WS_URL 기반, dashboard/telemetry/analytics/balancing/alarms 등 타입 및 API 호출.
- `context/BmsStreamContext.tsx`, `hooks/useBmsStream.ts`, `useBmsDbStream.ts`.
- `services/dashboardApi.ts`, `telemetryApi.ts`, `bmsSimulator.ts`.

### 2.5 Docker·설정

- `docker-compose.yml` 존재.
- `backend/.env.example`, `frontend/.env.example` 존재.
- `DOCKER.md` 문서 있음.

---

## 3. 미완료(Undone) 및 수행 예정(To-Do)

### 3.1 Phase 0 (TASKS.md 기준)

- [ ] `.gitignore` 정비 (Python, Node, env, data/raw, artifacts 등).
- [ ] 레포 스캐폴드: `data/raw/`, `scripts/`, `backend/`·`frontend/` 구조 정리(이미 있으나 공식 체크는 미완).

### 3.2 Phase 1 — 데이터 준비

- [ ] 전처리 후 통합 스키마 정의(cycle/curve).
- [ ] `scripts/preprocess.py`: MATR/HUST/CALCE/RWTH/SNL/UL_PUR/HNEI 변환, `data/processed/` 출력.
- [ ] 데이터셋 폴더 레이아웃·다운로드 링크 README 정리.
- [ ] YAML 등 설정으로 데이터셋 경로·플래그 관리.
- [ ] Train–test split: Random 및 MATR 등 데이터셋별.

### 3.3 Phase 2 — Feature·Label 추출

- [ ] Feature 추출: incremental capacity, differential capacity, coulombic efficiency 등.
- [ ] Label 추출: cycle life, SoH, cathode aging 등(데이터셋별).
- [ ] 정규화: log scale, Z-score, smoothing(모델용 플러그).
- [ ] Phase 1 통합 데이터 표현과 연동.

### 3.4 Phase 3 — 모델 학습·비교표

- [ ] Baseline: Dummy regressor.
- [ ] Feature 기반: Variance, Discharge, Full 모델.
- [ ] Linear: Ridge, PCR, PLSR.
- [ ] Gaussian process, XGBoost.
- [ ] Seed 10회: Random forest, MLP, CNN, LSTM, Transformer.
- [ ] 단일 진입점 또는 설정 기반 학습(dataset × model).
- [ ] 비교표 출력: models × datasets, error mean ± std, CSV/JSON/DB 저장, 아티팩트(체크포인트·플롯) 선택 저장.
- [ ] 재현성: 고정 시드, requirements.txt 버전 고정.

### 3.5 Phase 4 — Backend API·디지털 트윈 (보강)

- [x] FastAPI health, config 수준 구현됨.
- [x] 데이터셋/모델 목록, 학습 트리거, runs API 구현됨.
- [ ] 비교표 전용 엔드포인트(모델×데이터셋 mean±std) 명시적 제공.
- [ ] 선택: cycle/telemetry ingest 엔드포인트, 이벤트 기반 전/후처리(cron/queue).
- [ ] 선택: runs 메타(SQLite/Postgres), 대용량(Parquet/S3).
- [ ] OpenAPI 문서 정리.

### 3.6 Phase 5 — Frontend 에너지 대시보드 (보강)

- [x] Shell·라우팅·모니터링/설정/Lifetime/Learnings/Training 페이지 골격 구현.
- [ ] Monitoring: Pack 실시간, SoC/SoH, 남은 시간, Learnings, Power, OT 경고, Limiting factor 완성.
- [ ] Configuration: Pack/cell 설정, load/save, 백엔드 read/write 연동 확인.
- [ ] Lifetime Log: 실제 히스토리 사이클·열화 곡선 연동.
- [ ] Learnings Backup: 학습 파라미터 export/backup 연동.
- [ ] Training & Results: 데이터셋/모델 선택, 학습 실행, **비교표**(models×datasets, mean±std), 시각화(메트릭, actual vs predicted, feature importance).
- [ ] 다크 테마, BMS 스타일 레이아웃 통일.
- [ ] 프론트엔드가 실제 백엔드만 사용하도록 정리(모의 제거 또는 VITE_MOCK 게이트).

### 3.7 Phase 6 — 디지털 트윈·마무리

- [ ] Virtual Fuel Gauge: 모델/시뮬 데이터 기반 SoC/SoH.
- [ ] Generate Plot: 열화 곡선, 선택 모델/데이터셋 예측.
- [ ] Config Wizard: Pack/cell 설정 가이드.
- [ ] Preferences: 테마, 단위, 기본 데이터셋/모델.
- [ ] 한계값(min/max, resolution) 도움말·툴팁.
- [ ] 선택: AWS 등 클라우드(ingest, storage, SageMaker).

### 3.8 NEXT_STEPS.md 기준 (우선 실행)

- [ ] **DB:** MySQL 기동 후 `backend/scripts/setup_mysql.sh`로 aimlbms + 확장 스키마 적용.
- [ ] **Backend:** 알람 생성 시점(alert_service 또는 WS)에서 `alarm_evidence` INSERT 연동 확인/보강.
- [ ] **Frontend:** AlarmCenter — GET /api/v1/alarms, GET /api/v1/alarms/{id}, POST ack 호출 및 evidence 패널 표시.
- [ ] **Frontend:** RealtimeMonitor — `VITE_WS_BASE/ws/bms` 연결, 메시지 형식 `data_update` (pack/cells/alarms) 준수.
- [ ] **Frontend:** MLConsole — GET datasets, POST train, GET runs, GET runs/{id}/metrics 실제 API만 사용.
- [ ] **API 호출:** 페이지에서 직접 fetch 금지, `src/services/*` 통일.
- [ ] **UI Gallery:** Part 1 레이아웃 7개 추가 시 라우트·공통 컴포넌트 정리(이미 Part 2 5개+인덱스 적용됨).
- [ ] **데이터 파이프라인:** processed.zip → data_lake/processed, parquet→DB 적재 스크립트 실행, WS 시뮬레이터로 Realtime 검증.

### 3.9 task.md·요구사항 기준

- [ ] DB 스키마 SQL(Postgres/MySQL) in `db/` — 있으나 Alembic 마이그레이션은 미확인.
- [ ] NASA MAT ingest 실행 시 대시보드에 pack+cells 표시(“No pack data” 없음).
- [ ] Dashboard Home 레이아웃이 REQUIREMENTS(Shell + 12col + 컴포넌트)와 일치.
- [ ] Realtime Monitor: WS 연결, Pack V/I/SOC/Temp 차트(mock 또는 DB).
- [ ] Analytics: SOC/SOH 트렌드·thermal/aging 엔드포인트 데이터 또는 스텁.
- [ ] **RBAC + JWT:** 로그인 → 토큰 → API 호출, 역할(admin/operator/engineer/ml)에 따른 페이지/액션 제어.

### 3.10 Definition of Done (MVP, TASKS.md)

- [ ] Raw data(최소 1개 데이터셋) → `scripts/preprocess.py` → 통합 데이터.
- [ ] 학습 결과 비교표: models×datasets, seed-sensitive error mean±std.
- [ ] Backend가 비교표·설정 제공.
- [ ] Frontend: Monitoring, Configuration, Lifetime Log, Learnings Backup, Training & Results + 비교표·핵심 시각화.
- [ ] README·docs에 설정, 데이터 준비, 참고 자료 기술.

---

## 4. 참고 문서

| 문서 | 용도 |
|------|------|
| `docs/REQUIREMENTS.md` | 기능/비기능 요구사항 |
| `docs/DESIGN.md` | 아키텍처·데이터 모델·API·Shell |
| `docs/TASKS.md` | Phase 0~6 태스크 |
| `docs/NEXT_STEPS.md` | DB·Backend·Frontend·갤러리 실행 순서 |
| `docs/CURSOR_IMPLEMENTATION_GUIDE.md` | 현재 상태·아키텍처·Cursor 프롬프트 |
| `docs/CURSOR_PROMPTS_SPEC.md` | Backend/Frontend 붙여넣기용 프롬프트 |
| `docs/IDEAS_BACKEND_FRONTEND.md` | 파이프라인·PyTorch·프론트 아이디어 |
| `db/DB_SCHEMA_MYSQL_EXTENDED.sql` | alarm_evidence, explanations |

---

*이 문서는 현재 코드베이스와 docs(TASKS, NEXT_STEPS, task, REQUIREMENTS, DESIGN 등)를 기준으로 작성된 버전 1 요약입니다. 진행에 따라 업데이트하는 것을 권장합니다.*
