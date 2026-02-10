# Cursor 붙여넣기용 프롬프트 세트 + 디렉터리 정리 규칙

실무급 통합(RealtimeMonitor / AlarmCenter / ML Console, 실데이터·IF/AE·evidence)용 **단일 참조 문서**입니다.  
SQL·sh·yml·docker 중복 제거 규칙과 Backend/Frontend Cursor 프롬프트를 한 곳에 정리했습니다.

---

## 0. 디렉터리/파일 정리 규칙 (중복 제거)

| 유형 | 권장 위치 (단일) | 비고 |
|------|------------------|------|
| **MySQL 스키마** | `db/DB_SCHEMA_MYSQL.sql` (메인) + `db/DB_SCHEMA_MYSQL_EXTENDED.sql` (alarm_evidence, explanations) | 동일 테이블을 다른 sql 파일에 중복 정의 금지 |
| **DB 셋업 스크립트** | `backend/scripts/setup_mysql.sh` | DB 생성 + 위 두 스키마 적용 한 번에 |
| **시드/로더** | `backend/scripts/seed_data.sh` (또는 `ingest_*.py`) | processed 데이터 적재는 여기서만 |
| **Docker** | repo 루트 `docker-compose.yml` | MySQL+backend+frontend 한 파일. prod용 오버라이드만 별도 허용 |
| **Backend env** | `backend/.env` (from `.env.example`) | 비밀번호·시크릿은 여기만, 커밋 금지 |
| **Frontend env** | `frontend/.env` (from `.env.example`) | `VITE_API_BASE`, `VITE_WS_BASE` |
| **.gitignore** | repo 루트 `.gitignore` | env, artifacts, data_lake, *.pkl, *.parquet 등 일괄 적용 |

- **SQL**: 새 테이블은 기존 메인 스키마에 맞춰 `db/` 아래 한 곳에만 추가. 확장만 필요하면 `DB_SCHEMA_MYSQL_EXTENDED.sql` 사용.
- **sh**: `setup_mysql.sh` 하나로 DB 생성·스키마 적용. 다른 이름의 동일 역할 sh 추가 금지.
- **yml**: `docker-compose.yml` 하나로 통합. 동일 스택을 다루는 `docker-compose.*.mysql.yml` 등은 통합하거나 삭제.

---

## 1. 보안/환경 원칙

- **비밀번호(예: MySQL 12345)**: `.env`에만 저장, 코드에 하드코딩 금지, **절대 커밋 금지**.
- **.gitignore** 필수: `.env`, `.env.*`, `!.env.example`, `artifacts/`, `data_lake/`, `*.pkl`, `*.joblib`, `*.onnx`, `*.parquet`, `node_modules/`, `dist/`, `logs/`.

---

## 2. 아키텍처 요약 (실무형)

- **Data flow**: 실차/시뮬 → WS `ws://.../ws/bms` (data_update) → Backend 저장 → 규칙/IF·AE 알람 → alarms + alarm_evidence + explanations → API/WS → Dashboard.
- **Frontend**: Home REST polling, Realtime WS + sliding window, Alarms 필터/ACK/evidence 패널, ML Console dataset→train→runs→metrics→SHAP.
- **실데이터 전제**: mock 기본 비활성, VITE_WS_BASE/ws/bms, VITE_API_BASE/api/v1 고정.

---

## 3. API/WS 스펙 요약

- **WS** `ws://{host}:{port}/ws/bms`:  
  `{ type: "data_update", timestamp, pack: { voltage, current, temperature_avg, soc, mode }, cells: [...], alarms: [...] }`
- **REST** `/api/v1`:  
  `dashboard/overview`, `telemetry/pack/latest`, `alarms` (list/detail/ack), `ml/datasets`, `ml/train`, `ml/runs`, `ml/runs/{id}/metrics`, `xai/runs/{id}/explain`.

(상세 요청/응답 JSON은 기존 스펙 문서 또는 CURSOR_IMPLEMENTATION_GUIDE.md 참조.)

---

## 4. Backend Cursor 프롬프트 — “한 방 생성”

(아래 블록 전체를 Cursor에 붙여넣기.)

```
You are generating a production-style backend for an AI-enabled BMS dashboard.
Stack: FastAPI + SQLAlchemy + MySQL (DB: aimlbms) + WebSocket at /ws/bms.
Real data only (no mock). Single canonical layout; avoid duplicate files.

Hard constraints:
- DB: aimlbms. MySQL password only in .env (e.g. 12345); never in code.
- WebSocket: ws://{host}:{port}/ws/bms
- REST prefix: /api/v1
- Full alarm router: list/detail/ack + evidence (rule + model). model_anomaly from real IsolationForest + AutoEncoder.
- Store evidence in alarm_evidence, XAI in explanations. One schema location: db/ or backend/sql/; one setup script.

Create under backend/:
- app/main.py, core/config.py, core/database.py
- models: base, telemetry, alarms (Alarm, AlarmEvidence), ml (ModelRun), explanations
- schemas: telemetry, alarms, ml, xai
- routers: health, dashboard, telemetry, alarms (FULL: list, get detail, ack), ml, xai; WebSocket /ws/bms
- services: feature_builder, alarm_rule_engine, anomaly_iforest, anomaly_autoencoder, telemetry_service, alarm_service, ml_service; ingestion/parquet_loader (CLI); ws_broadcaster
- scripts: setup_mysql.sh (create DB + apply single schema file), seed_data.sh, run_dev.sh
- sql/mysql_schema.sql (full schema: users, packs, modules, cells, telemetry_pack/cell, alarms, alarm_evidence, alarm_ack, explanations, datasets, model_runs, model_artifacts, risk_scores)
- requirements.txt, .env.example, Dockerfile, README.md

WebSocket /ws/bms: accept data_update; persist telemetry; run rule + IF/AE; write alarms + alarm_evidence; broadcast to clients.
Alarms: GET list (filters), GET /{id} (alarm + evidence + recommended_action), POST /{id}/ack.
ML: GET datasets, POST train, GET runs, GET runs/{id}/metrics. XAI: POST xai/runs/{id}/explain (or 501 + TODO).
Use UUID for alarm id. No secrets in code. Return JSON matching frontend expectations.
```

---

## 5. Frontend Cursor 프롬프트 — “REAL 연동/정리”

(아래 블록 전체를 Cursor에 붙여넣기.)

```
You are refactoring/finishing the frontend (React + Vite + TS) for the BMS dashboard with REAL backend only. No mock by default.

Constraints:
- REST: import.meta.env.VITE_API_BASE (e.g. http://localhost:8000)
- WS: import.meta.env.VITE_WS_BASE (e.g. ws://localhost:8000), path /ws/bms
- All API in src/services/* (apiClient, telemetryApi, alarmApi, mlApi, xaiApi). No fetch in pages.
- Types in src/types/* (telemetry, alarms, ml). UI primitives in src/components/ui/*.

Pages:
1) HomeDashboard — GET /api/v1/dashboard/overview (poll), show pack, worst-cell, alarms.
2) RealtimeMonitor — WS VITE_WS_BASE/ws/bms; message type "data_update" with pack/cells/alarms; sliding window charts; REST fallback button GET telemetry/pack/latest.
3) AlarmCenter — GET /api/v1/alarms (list), GET /api/v1/alarms/{id} (detail + evidence + recommended_action), POST ack; evidence panel for rule + model (IF/AE).
4) MLConsole — GET ml/datasets, POST ml/train, GET ml/runs, GET ml/runs/{id}/metrics; charts (loss, pred vs true, feature importance); optional XAI explain.

Routes: /dashboard, /dashboard/realtime, /dashboard/alarms, /dashboard/ml (and cells, analytics). Windows-HMI style (bms.css). Remove mock paths; default real API/WS. Verify imports compile.
```

---

## 6. 실행 순서 (실데이터 기준)

1. MySQL 기동 후: `./backend/scripts/setup_mysql.sh` (DB 생성 + 스키마 적용)
2. `backend`: `cp .env.example .env` → `pip install -r requirements.txt` → `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
3. `frontend`: `cp .env.example .env` → `npm i` → `npm run dev`
4. (선택) processed 데이터: `data_lake/processed`에 배치 후 `backend/scripts/seed_data.sh` 실행

---

## 7. Cursor 공통 룰 (3줄)

- Always create files in the specified paths and export default components.
- Keep API calls isolated in `src/services/*`; do not call fetch directly in pages.
- Add TODO for backend-dependent parts; MOCK only when explicitly requested (default: real backend).

이 문서는 `CURSOR_IMPLEMENTATION_GUIDE.md`와 함께 사용하세요. 현재 repo는 vehicle/alarm_event 기반이면 Guide의 “Current state”를 따르고, 실무급 packs/alarms(UUID) 스키마로 갈 경우 위 Backend 프롬프트로 새 트리 생성 후 Frontend 프롬프트로 연동하면 됩니다.
