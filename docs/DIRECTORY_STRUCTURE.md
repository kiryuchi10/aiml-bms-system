# 디렉터리 구조 — 폴더/파일 역할 및 해야 할 일

## 프로젝트 루트

```
aiml-bms-system/
├── backend/          # FastAPI 백엔드 (API, WS, 서비스, ML 파이프라인)
├── frontend/         # Vite + React 프론트엔드 (대시보드, 페이지, 컴포넌트)
├── db/               # DB 스키마(SQL), ERD 문서 — 마이그레이션/시드 참고
├── docs/             # 설계/명세/가이드 문서 (본 파일, DATA_LAYOUT_WLTP, SPEC 등)
├── docker-compose.yml
└── .cursorrules
```

---

## Backend (`backend/`)

### `app/main.py`
- **역할**: FastAPI 앱 생성, CORS, 라우터 등록 (`/api`, `/api/v1`, `/ws/bms`, `/ws/bms/db`).
- **할 일**: 새 라우터 추가 시 `include_router` 한 곳에서 등록.

### `app/core/`
- **config.py**: 환경변수 로드 (database_url, data_dir, allow_origins). Pydantic Settings.
- **할 일**: 새 설정 항목은 여기 추가 후 서비스에서 `settings.xxx` 사용.

### `app/db/`
- **session.py**: DB 세션 의존성 (`get_db`).
- **base.py**: SQLAlchemy Base.
- **create_tables.py**, **seed_data.py**: 테이블 생성/시드 스크립트.
- **할 일**: 새 모델 추가 시 base 상속, create_tables에 반영; 시드 필요 시 seed_data에 추가.

### `app/api/`
- **router.py**: `/api` 하위 라우트 (health, data 등).
- **routes/**: health, data, reference_results, training 등 레거시/공통 API.
- **v1/router.py**: `/api/v1` 하위 — dashboard, alarms, analytics, cells, ingest, features, ml, telemetry.
- **v1/endpoints/**:
  - **dashboard.py**: overview, cell-grid, alarms, pack-summary, worst-cell, active-alarms (DB/parquet).
  - **analytics.py**: soc, soh, thermal, aging, risk, anomaly (SoH/Anomaly는 soh_features.parquet 연동).
  - **alarms.py**: 목록/상세/ack.
  - **cells.py**: latest, timeseries.
  - **ingest.py**: /ingest/mat, /ingest/parquet (DB 적재 스텁).
  - **features.py**: /features/build, /features/query (피처 빌드/조회 스텁).
  - **ml.py**: train, runs, datasets.
  - **telemetry.py**: 팩 텔레메트리.
- **websocket_bms.py**: `/ws/bms` — .mat/parquet 기반 틱 스트리밍.
- **v1/ws_bms.py**: (선택) v1 prefix WS.
- **할 일**: 새 엔드포인트는 v1/endpoints에 추가 후 v1/router.py에 등록. 데이터는 서비스 레이어에서만 처리.

### `app/services/`
- **dashboard_service.py**: 현재 스냅샷 조회 (mat → parquet), overview/cell-grid/WS 페이로드 생성. **할 일**: WLTP pack/cell_timeseries 컬럼 매핑 유지.
- **dashboard_db_service.py**: DB에서 pack summary, worst-cell, active alarms 조회.
- **analytics_service.py**: SOC/SOH/thermal/risk/soh_trend/anomaly_timeline. **할 일**: soh_features.parquet에서 actual/predicted SoH, anomaly_score 읽어 SoH 트렌드/Anomaly API 실데이터화.
- **nasa_mat_loader.py**: .mat 로드, 행 리스트, 스냅샷 (B0005 등). **할 일**: DATA_DIR에 B0005/B0006/B0007/B0018.mat 두면 자동 인식.
- **parquet_bms_loader.py**: parquet 목록, 프레임 로드, row→BMS 스냅샷. **할 일**: pack_timeseries/cell_timeseries/soh_features 등 WLTP 컬럼명 매핑.
- **telemetry_service.py**: DB telemetry_cell 조회.
- **alarm_service.py**: 알람 목록/상세/evidence.
- **할 일**: EDA/피처 엔지니어링 결과를 feature_store 테이블 또는 parquet으로 저장하고, 위 서비스에서 읽도록 연결.

### `app/pipelines/`
- **data_pipeline.py**: 데이터 파이프라인 오케스트레이션.
- **nasa/parse_mat.py**: .mat 파싱 → telemetry_cell 적재 (ingest 스크립트용).
- **할 일**: WLTP → raw → feature → model 학습 파이프라인 정리 (EDA, PCA, clustering, DL/ML 단계).

### `app/ml/`
- **dataset.py**, **models.py**, **trainer.py**: ML 데이터셋/모델/학습.
- **할 일**: regression, classification, optimization, prediction 태스크별로 모델/메트릭 저장; model_registry, prediction_history 테이블 연동.

### `app/schemas/`
- **bms_data.py**: CurrentDataResponse, CellData 등.
- **v1_dashboard.py**: PackTelemetry, CellTelemetry, DashboardOverview, AlarmItem 등.
- **v1_analytics.py**: AnalyticsSoc, AnalyticsSoh 등.
- **할 일**: 새 API 응답/요청 스키마 정의.

### `app/ws/`
- **bms_ws.py**: `/ws/bms/db` — DB 텔레메트리 리플레이.
- **할 일**: 필요 시 vehicle_id/interval_ms로 리플레이 속도 제어.

### `backend/data/` (DATA_DIR)
- **역할**: WLTP_Driving_cycle_reference.zip 압축 해제 위치. .mat, .parquet 배치.
- **필수 파일**: B0005.mat, B0006.mat, B0007.mat, B0018.mat, pack_timeseries.parquet, cell_timeseries.parquet, soh_features.parquet, soc_features.parquet, thermal_features.parquet, eis_features.parquet.
- **할 일**: 실제 데이터 넣고 API/WS가 이 경로만 참조하도록 유지 (no mock).

### `backend/database/`, `backend/scripts/`
- **database/schema_*.sql**: 스키마 참고.
- **scripts/ingest_nasa_mat_to_mysql.py**: .mat → MySQL 적재. **할 일**: WLTP 사용 시 경로/vehicle_id 정리.

---

## Frontend (`frontend/src/`)

### `App.tsx`
- **역할**: 라우트 정의 (Dashboard, Cells, Realtime, Analytics, Battery Doctor, Alarms, ML, Monitoring 등).
- **할 일**: 새 페이지 추가 시 Route 등록; 레이아웃 변경 시 AppShell 하위 구조 유지.

### `layout/`
- **AppShell.tsx**: TopBar + LeftRail + contentCol + TabsBar + pageBody. BmsStreamProvider 래핑.
- **LeftRail.tsx**: 좌측 메뉴 (Dashboard Home, Cells Grid, Realtime, Analytics, Battery Doctor, Alarms, ML Console 등). **할 일**: 새 대시보드 메뉴 추가 시 NavLink 추가.
- **TopBar.tsx**: 연결 상태(WS), Start/Stop, Preferences 등.
- **TabsBar.tsx**: 상단 탭 (Monitoring, Live BMS, Configuration 등).
- **할 일**: 대시보드 fundamentally 변경 시에도 이 레이아웃을 유지하면서 페이지별 콘텐츠만 API 기반으로 전환.

### `pages/`
- **DashboardHome.tsx**, **Dashboard/DashboardHome.tsx**: 홈 요약.
- **CellsGridPage.tsx**: 셀 그리드 (API/WS 데이터).
- **RealtimeMonitorPage.tsx**: 실시간 V/I/SoC 차트 (BmsStreamContext).
- **AnalyticsPage.tsx**: SOC/SOH 트렌드, thermal 등.
- **BatteryDoctorPage.tsx**: 모듈 패널, 셀 그리드, SoH/Anomaly 차트, AI Insights. **no mock**: REST + WS + getAnalyticsSohTrend / getAnalyticsAnomalyTrend.
- **AlarmCenterPage.tsx**: 알람 목록/상세.
- **MLConsolePage.tsx**, **AIModelCenter.tsx**: Ingest / Feature / Train / Predict / Models (API 연동).
- **MonitoringPage.tsx**, **ConfigurationPage.tsx**, **LifetimeLogPage.tsx**, **LearningsBackupPage.tsx**, **TrainingResultsPage.tsx**: 각 기능 페이지.
- **ui_gallery/***: 레이아웃/디자인 참고용 페이지 (데모 라벨 유지).
- **할 일**: 모든 페이지에서 mock 데이터 제거, API/WS만 사용; 데이터 없을 때 "No data" 안내.

### `components/`
- **bms/**: CellCard, CellGrid, RealtimeChart, AlarmPanel, BalancingStatus, CellDetailDrawer 등. **할 일**: props로만 데이터 받아서 표시.
- **charts/**: LineChart, HeatmapGrid 등. **할 일**: Recharts/공통 축·툴팁 규칙 유지.
- **dashboard/**: PackInfoCards, CellTable, AlarmsGridCard, SocGaugeCard 등. **할 일**: API 응답 타입에 맞춰 표시.
- **할 일**: 새 대시보드 블록 추가 시 여기 컴포넌트로 만들고 페이지에서 조합.

### `context/BmsStreamContext.tsx`
- **역할**: WebSocket 연결/해제, payload/window 상태, connect/disconnect. TopBar Start/Stop과 연동.
- **할 일**: WS URL은 env (VITE_BMS_WS_URL); 프록시 사용 시 상대 경로.

### `services/apiV1.ts`
- **역할**: VITE_API_BASE, VITE_BMS_WS_URL 기반 REST/WS URL. dashboard, alarms, analytics, ml, cells 등 모든 v1 API 호출.
- **할 일**: 새 엔드포인트 추가 시 여기 함수 추가; 타입 정의 유지.

### `hooks/`, `lib/`, `shared/`
- **hooks**: useBmsStream, useBmsDbStream 등.
- **lib/api.ts**: 레거시 health/reference 등.
- **shared/utils**: tailwindSafeColors 등.
- **할 일**: 공통 로직은 훅/유틸로 분리; API 호출은 services/apiV1 통일.

### `styles/`, `styles.css`
- **역할**: 전역·페이지별 스타일. pageBody, contentCol, battery-doctor-page 등.
- **할 일**: 새 페이지 레이아웃 격리 시 해당 페이지 전용 클래스 추가.

---

## DB (`db/`)

- **DB_SCHEMA_*.sql**: MySQL/Postgres 스키마. telemetry_pack/cell, alarm_event, feature_store, model_registry 등.
- **ERD_VIEW.md**, **README.md**: ERD 및 설명.
- **할 일**: EDA/feature/model 결과 저장용 테이블 추가 시 스키마와 마이그레이션 정리.

---

## Docs (`docs/`)

- **DATA_LAYOUT_WLTP.md**: WLTP 파일 목록, backend/data 배치, 로딩 순서.
- **DIRECTORY_STRUCTURE.md**: 본 문서 — 폴더/파일 역할 및 할 일.
- **SPEC_WLTP_AND_DASHBOARDS.md**: 데이터 플로우, 백엔드/프론트 워크플로우, DB 로딩, EDA→ML→대시보드 상세 명세.
- **할 일**: 설계 변경 시 위 문서 동기화.
