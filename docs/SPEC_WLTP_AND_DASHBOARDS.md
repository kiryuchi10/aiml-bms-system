# WLTP 데이터 기반 대시보드 및 ML 파이프라인 상세 명세

- **데이터 소스**: WLTP_Driving_cycle_reference.zip (B0005/B0006/B0007/B0018.mat, pack_timeseries, cell_timeseries, *_features.parquet).
- **원칙**: 프론트엔드 no mock; 백엔드 API는 유지하면서 대시보드를 실데이터·ML 결과 기반으로 전환.

---

## 1. 데이터 핸들링 — 로딩·이동 로직

### 1.1 파일 배치

| 위치 | 내용 |
|------|------|
| `backend/data/` | B0005.mat ~ B0018.mat, pack_timeseries.parquet, cell_timeseries.parquet, soh_features.parquet, soc_features.parquet, thermal_features.parquet, eis_features.parquet |

- ZIP 압축 해제 후 위 파일들을 `backend/data/`에 복사.
- `DATA_DIR`(기본 `./data`)은 백엔드 실행 디렉터리 기준으로 해석.

### 1.2 로딩 우선순위 (백엔드)

1. **대시보드/WS 현재 스냅샷**
   - `dashboard_service.get_current_snapshot(key, row_index)`:
     - `key`에 대해 **.mat 존재 시** → `nasa_mat_loader` (B0005 등).
     - **없으면** → `parquet_bms_loader` (pack_timeseries 등).
   - 동일 계약 유지: `CurrentDataResponse` (pack + cells).

2. **Analytics SoH 트렌드**
   - 기존: `get_analytics_soh_trend(dataset_key, days)` → 현재 스냅샷 기반 proxy.
   - 확장: `soh_features.parquet`에 cycle/soh_actual/soh_pred 있으면 해당 컬럼으로 `points` 반환 (actual vs ML predicted).

3. **Anomaly 타임라인**
   - `GET /api/v1/analytics/anomaly` → `get_analytics_anomaly_timeline()`:
     - `soh_features.parquet` 존재 시 cycle, anomaly_score(또는 score) 컬럼으로 `{ points: [{ cycle, score }] }` 반환.
     - 없으면 `{ points: [], days: 0 }` (no mock).

4. **DB 적재 (선택)**
   - .mat: `scripts/ingest_nasa_mat_to_mysql.py` → `telemetry_cell`.
   - Parquet: `POST /api/v1/ingest/parquet` 등으로 feature/cycle 테이블 적재 (스텁 확장).

### 1.3 데이터 이동 (파이프라인)

- **Raw** → **Features**: EDA/피처 엔지니어링 결과를 parquet 또는 DB feature_store에 저장.
- **Features** → **Models**: feature_store + 라벨 → 학습 → model_registry, prediction 저장.
- **Models** → **Dashboards**: REST/WS로 예측·SoH·Anomaly 전달; 프론트는 API만 호출.

---

## 2. 백엔드 API (유지·확장)

### 2.1 유지하는 엔드포인트

- **Dashboard**: `GET /api/v1/dashboard/overview`, `cell-grid`, `alarms`, `pack-summary`, `worst-cell`, `active-alarms`.
- **Analytics**: `GET /api/v1/analytics/soc`, `soh`, `thermal`, `thermal-map`, `aging`, `risk`, `soc?hours=`, `soh?days=`, `anomaly`.
- **Cells**: `GET /api/v1/cells/latest`, `timeseries`.
- **Alarms**: `GET /api/v1/alarms`, `GET /api/v1/alarms/{id}`, `POST /api/v1/alarms/{id}/ack`.
- **ML**: `POST /api/v1/ml/train`, `GET /api/v1/ml/runs`, `GET /api/v1/ml/runs/{id}`, `GET /api/v1/ml/datasets`.
- **WebSocket**: `GET /ws/bms?dataset=B0005&hz=1`, `GET /ws/bms/db?vehicle_id=1&interval_ms=500`.

### 2.2 확장 (데이터 소스만 실데이터)

- **SoH trend**: soh_features.parquet에서 actual/predicted 두 라인 지원 (기존 `points` 형식 유지).
- **Anomaly**: `GET /api/v1/analytics/anomaly` 이미 추가됨; soh_features.parquet 기반.
- **Ingest/Features**: `/ingest/parquet`, `/features/build`, `/features/query` — WLTP 파이프라인과 연동해 구현.

---

## 3. 백엔드 워크플로우

1. **로딩**
   - 앱 기동 시 `DATA_DIR`에서 .mat/parquet 스캔 (필수 아님; 요청 시 로드).
   - WS 연결 시 dataset 키로 mat 또는 parquet 선택 후 row 인덱스 루프.

2. **요청 처리**
   - Route → Endpoint (thin) → Service (비즈니스·로딩).
   - Service: `nasa_mat_loader` / `parquet_bms_loader` / `dashboard_db_service` 호출.
   - 스키마(Pydantic)로 응답 고정.

3. **EDA / Feature / ML (할 일)**
   - **EDA**: notebook 또는 스크립트로 raw → 통계·시각화; 결과는 문서/parquet으로 보관.
   - **Feature engineering**: cycle/soh/soc/thermal/eis 피처 테이블 또는 parquet 생성 → `soh_features.parquet` 등.
   - **PCA/Clustering**: feature_store 또는 parquet 기반; 결과(클러스터 라벨 등) 저장 후 API로 노출 가능.
   - **DL/ML**: Regression(SoH, RUL), Classification(고장/정상), Optimization(충방전 프로파일), Prediction(잔량 수명) — trainer/dataset 연동, model_registry·prediction_history 테이블 저장.
   - **Serving**: 기존 `/api/v1/analytics/*`, `/api/v1/ml/*` 유지; 내부만 실데이터·모델 결과로 채움.

4. **DB 로딩**
   - MySQL: telemetry_pack/cell, alarm_event, feature_store_cycle, model_registry, prediction_soh, qa_run 등.
   - Raw 테이블은 append-only; feature/model 테이블은 버전·run_id 관리.

---

## 4. 프론트엔드 워크플로우

1. **진입**
   - AppShell (TopBar + LeftRail + TabsBar + pageBody).
   - LeftRail에서 페이지 선택 → Route → 해당 Page 컴포넌트.

2. **데이터 취득**
   - **실시간**: BmsStreamContext (Start 시 WS 연결) → payload로 pack/cells/alarms 사용.
   - **REST**: `apiV1` — getDashboardOverview, getDashboardCellGrid, getDashboardAlarms, getAnalyticsSohTrend, getAnalyticsAnomalyTrend 등.
   - **no mock**: 모든 숫자·차트는 API/WS 응답만 사용; 없으면 "No data" 또는 로딩 표시.

3. **페이지별**
   - **Dashboard Home**: overview + 최근 알람 + quick links.
   - **Cells Grid**: cell-grid API 또는 WS cells.
   - **Realtime Monitor**: WS window → V/I/SoC 라인 차트.
   - **Analytics**: soc/soh trend, thermal map (API).
   - **Battery Doctor**: overview/cell-grid/alarms + SoH trend(actual/pred) + Anomaly 차트 + AI Insights; 전부 API/WS.
   - **Alarm Center**: alarms API.
   - **ML Console**: ingest/features/train/predict/models API.

4. **대시보드 레이아웃**
   - 기존: 상단 탭 + 좌측 메뉴 + 본문(pageBody). 스타일: contentCol min-height:0, pageBody flex:1 overflow:auto.
   - **Fundamentally change**: 페이지 내부 블록(카드, 그리드, 차트)을 실데이터·ML 결과로 재구성하되, 레이아웃 구조(AppShell, LeftRail, TopBar)와 API 계약은 유지.

---

## 5. 데이터베이스 로딩

- **Raw**: `telemetry_cell` (및 pack 등) — ingest 스크립트 또는 API로 .mat/parquet → INSERT.
- **Feature**: feature_store_cycle (또는 parquet 파일) — EDA/피처 스크립트 또는 `/features/build` 결과.
- **Model**: model_registry (run_id, model_key, metrics, path), prediction_soh (battery_id, cycle, y_true, y_pred).
- **QA**: qa_run, qa_outlier, qa_summary — 품질/이상치 실행 결과.
- 대시보드 API는 DB가 있으면 DB 우선, 없으면 parquet/.mat 폴백 (기존 동작 유지).

---

## 6. EDA → Feature → PCA/Clustering → DL/ML

### 6.1 EDA
- 목적: 분포, 결측, 이상치, 상관관계 파악.
- 산출: 통계 요약, 시각화; 컬럼 매핑 정리 (parquet_bms_loader 등에 반영).

### 6.2 Feature engineering
- 입력: raw (mat/parquet), cycle/시간 기준.
- 출력: soh_features.parquet (cycle, soh_actual, soh_pred, anomaly_score), soc_features, thermal_features, eis_features.
- 저장: `backend/data/*.parquet` 또는 DB feature_store.

### 6.3 PCA / Clustering
- 입력: feature 테이블 또는 parquet.
- 출력: 차원 축소 결과, 클러스터 라벨 (예: EIS 클러스터 C1/C2).
- 서빙: GET /api/v1/analytics/... 또는 새 엔드포인트로 클러스터/요약 반환; AI Insights 등에 표시.

### 6.4 Deep Learning + ML
- **Regression**: SoH, RUL 예측 → soh_pred, rul 값 저장; SoH trend 차트에 predicted 라인.
- **Classification**: 정상/고장, 이상치 클래스 → 알람 또는 AI Insights.
- **Optimization**: 충방전 프로파일 최적화 → 결과 API (선택).
- **Prediction**: 잔량/수명 예측 → prediction_soh 등 테이블 + API.
- 학습/평가: train/val/test 분리, 메트릭 저장, model_registry 업데이트; 기존 `/api/v1/ml/*` 유지.

---

## 7. 대시보드 상세 (API 유지, 데이터만 실데이터)

- **모니터링/홈**: Pack 카드, Active Alarms, Learnings, SoH 요약 — dashboard/overview, alarms, pack-summary.
- **Cells Grid**: 셀 전압/SoC/온도 — cell-grid 또는 WS cells.
- **Realtime**: V, I, SoC 시계열 — WS.
- **Analytics**: SOC/SOH 트렌드, Thermal map — analytics/soc, soh, thermal-map.
- **Battery Doctor**: M1 패널, 셀 그리드(E1–E12), SoH Actual vs ML, Anomaly Score, AI Insights — overview, cell-grid, alarms, analytics/soh, analytics/anomaly; 값은 전부 API/WS.
- **Alarm Center**: 목록/상세/ack — alarms API.
- **ML Console**: Ingest / Build Features / Train / Predict / Models — ingest, features, ml API.

모든 UI는 **no mock**; 데이터 없으면 빈 상태 메시지 또는 로딩만 표시.

---

## 8. 체크리스트

- [ ] WLTP zip 압축 해제 → backend/data에 .mat, *_timeseries.parquet, *_features.parquet 배치.
- [ ] 백엔드 SoH trend에서 soh_features.parquet actual/predicted 반환 (선택).
- [ ] 백엔드 anomaly 타임라인: soh_features.parquet 기반 (구현됨).
- [ ] 프론트: 모든 페이지 mock 제거, API/WS만 사용 (BatteryDoctor SoH/Anomaly 반영됨).
- [ ] EDA/Feature/PCA/Clustering/DL·ML 파이프라인 정리 후 feature·model 결과를 API로 노출.
- [ ] 대시보드 레이아웃은 AppShell/LeftRail/TopBar 유지, 페이지 내용만 실데이터·ML 기반으로 전환.
