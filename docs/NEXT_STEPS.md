# Next Steps — AI/ML BMS Suite

실행 순서와 Cursor/Claude 활용 방법을 정리한 체크리스트입니다.

---

## 1. DB 준비 (즉시)

- [ ] MySQL 기동 (로컬 또는 `docker compose up -d db`)
- [ ] 확장 스키마 적용  
  **Windows**: `bash backend/scripts/setup_mysql.sh` (Git Bash 등)  
  **Linux/macOS**: `./backend/scripts/setup_mysql.sh`  
  → `aimlbms` 생성 + 메인 스키마 + `alarm_evidence`, `explanations` 적용
- [ ] `backend/.env` 설정 (`.env.example` 복사 후 `DATABASE_URL` 또는 `MYSQL_*` 확인)

---

## 2. Backend — Alarm Router + Evidence (Cursor)

**목표**: 알람 목록/상세/ACK + evidence 저장/조회.

- [ ] `docs/CURSOR_IMPLEMENTATION_GUIDE.md` §4 **Backend Cursor prompt** 복사 → Cursor에 붙여넣기
- [ ] 생성/수정 예상:
  - `app/models/` — `AlarmEvidence` 모델 (테이블 `alarm_evidence` 매핑)
  - `app/api/v1/endpoints/alarms.py` (신규) — GET list, GET `/{id}`, POST `/{id}/ack`
  - `app/schemas/` — alarm 응답 스키마 (evidence, recommended_action 포함)
  - 알람 생성 시점(alert_service 또는 WS)에서 `alarm_evidence` 행 INSERT

**선택**: IF/AE 이상탐지 + model_anomaly 알람 생성 + evidence 저장은 동일 가이드의 “Model anomaly” 섹션 또는 `docs/CURSOR_PROMPTS_SPEC.md` Backend 프롬프트로 진행.

---

## 3. Frontend — Real API/WS (Cursor)

**목표**: Realtime / AlarmCenter / ML Console이 실제 백엔드만 사용.

- [ ] `docs/CURSOR_IMPLEMENTATION_GUIDE.md` §5 **Frontend Cursor prompt** 복사 → Cursor에 붙여넣기
- [ ] 확인 사항:
  - **AlarmCenter**: `GET /api/v1/alarms`, `GET /api/v1/alarms/{id}`, `POST /api/v1/alarms/{id}/ack` 호출, evidence 패널 표시
  - **RealtimeMonitor**: `VITE_WS_BASE/ws/bms` 연결, 메시지 형식 `data_update` (pack/cells/alarms)
  - **MLConsole**: `GET /api/v1/ml/datasets`, `POST /api/v1/ml/train`, `GET /api/v1/ml/runs`, `GET /api/v1/ml/runs/{id}/metrics`
- [ ] API 호출은 `src/services/*`에만 두기 (페이지에서 직접 fetch 금지)

---

## 4. UI Gallery — Part 1 (선택)

**현재**: Part 2 (5개) + 갤러리 인덱스 적용됨. `/bms/ui` → 카드 12개 중 5개만 라우트 연결됨.

- [ ] Part 1 레이아웃 7개 추가 시:  
  이전에 공유한 **Part 1/2 코드**(Layout3PanelOpsPage, LayoutControlRoomWallPage, … LayoutChargingStationPage)를  
  `src/pages/ui_gallery/*.tsx` 로 추가하고 `App.tsx`에 해당 경로 등록  
  - 예: `/bms/ui/layout-3panel-ops`, `/bms/ui/layout-control-room-wall`, …
- [ ] 공통 컴포넌트(BatteryPill, BatteryCard, AppShell 3패널 버전)는 Part 1 코드와 함께 추가하거나, 기존 갤러리 스타일(`BMSUIGallery.css`)로 통일

---

## 5. 데이터 파이프라인 (선택)

- [ ] `processed.zip` 풀기 → `data_lake/processed/` (또는 backend 설정에 맞는 경로)
- [ ] `backend/scripts/` 에 parquet → DB 적재 스크립트가 있다면 실행해 시계열/인덱스 적재
- [ ] WS 시뮬레이터로 `ws://localhost:8000/ws/bms` 에 `data_update` 전송해 Realtime 페이지 동작 확인

---

## 6. 실행 순서 요약

1. **DB** — `backend/scripts/setup_mysql.sh`
2. **Backend** — `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
3. **Frontend** — `cd frontend && npm i && npm run dev`
4. **확인** — `http://localhost:5173/bms/ui` (갤러리), `/bms/alarms` (알람), `/bms/realtime` (실시간), `/bms/ml` (ML 콘솔)

---

## 참고 문서

| 문서 | 용도 |
|------|------|
| `docs/CURSOR_IMPLEMENTATION_GUIDE.md` | 현재 상태, 아키텍처, Backend/Frontend Cursor 프롬프트, 실행 워크플로우 |
| `docs/CURSOR_PROMPTS_SPEC.md` | 디렉터리 정리 규칙, Backend “한 방” / Frontend “REAL 연동” 붙여넣기용 프롬프트 |
| `db/DB_SCHEMA_MYSQL_EXTENDED.sql` | alarm_evidence, explanations 테이블 정의 |
