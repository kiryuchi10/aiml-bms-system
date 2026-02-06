# AI/ML BMS System — Requirements

## Goals

- Show BMS-like dashboard using existing NASA MAT (and optional Parquet) datasets.
- Provide real-time-like monitoring via WebSocket simulation.
- Store telemetry / feature / metric / events in DB with clear separation (Raw ≠ Feature ≠ Metric).
- Common AI/ML pipeline: ingest → raw → feature → metric → alarms → dashboard.

## Non-Goals

- Real hardware CAN control is not required.
- True SOC/SOH physics model is not required (proxy allowed).

---

## 1) Dashboard Home — Layout Rules (Shell & Grid)

요구사항(좌측 네비 / 상단 pack summary / 중앙 그리드 / 카드 기반 / 숫자+색+아이콘)을 고정 Shell 레이아웃으로 정리:

### 전체 Shell (고정)

| 영역 | 설명 |
|------|------|
| **TopBar** | 상단 고정, height 48~56px |
| **SideNav** | 좌측 고정, width 88~120px |
| **Main** | 중앙 스크롤 영역. 페이지별로 카드/그리드가 들어감 |

### Dashboard Home (Main 내부)

권장 그리드: **12-column**

| Row | 영역 | 컴포넌트 |
|-----|------|----------|
| **Row 1** (col-12) | 전체 | PackSummaryBar (또는 PackOverviewTiles) |
| **Row 2** | Left (col-8) | 2열 카드 그리드: PackOverviewTiles (4~6 tiles), SocGaugeCard, WorstCellCard (min/max V, max temp) |
| **Row 2** | Right (col-4) | ActiveAlarmsMiniTable (최근 N개 + severity 색) |
| **Row 3** (col-12) | 전체 | CellTable (요약 테이블, 클릭 시 Cells Grid/Drawer로 이동) |

**Right panel** 느낌 유지:

- Right (col-4) 영역 하단에 **LearningsCard** + **AlarmsGridCard**를 **stack(세로)**로 배치.

---

## 2) Component Specs (세부 구성요소)

### TopBar

- **Left:** App title / Vehicle selector (옵션)
- **Center:** Connection status pill (● Connected / Disconnected)
- **Right:**
  - Start / Stop (WS connect/disconnect 또는 replay control)
  - Config (Threshold/Rule 설정으로 이동)
  - User menu (role 표시, logout)

### PackOverviewTiles (Pack Voltage / Current / Status / Temps)

| Tile | 내용 |
|------|------|
| 1 | ⚡ Pack Voltage (V) |
| 2 | 🌊 Pack Current (A) |
| 3 | 🔋 SOC (%) |
| 4 | 🌡 Pack Temp Avg (°C) |
| 5 | 🌡 Ambient Temp (°C) |
| 6 (옵션) | ΔV imbalance / Worst cell id |

- 각 Tile 공통: 값 + 단위 + 작은 trend sparkline(옵션) + 상태색(정상/경고/고장).

### SocGaugeCard

- 원형 게이지(중앙 %).
- 상단: Unusable SOC (옵션).
- 하단: Usable SOC 라벨.
- 우측(또는 하단): 작은 텍스트로 Remaining time proxy / To full proxy.

### PackInfoCards (SoH / Remaining / CC Charge / To Full)

- 2×2 카드.
- SoH는 강조(초록).
- Remaining / To Full은 “추정 근거” tooltip (모델/룰 출처).

### CellTable

- **Columns:** Cell | V | T | I | SOC | SoH | Discharge Est | Charge Est
- Row 클릭 → `/cells` 이동 + cellId highlight.
- 정렬/필터(최악 셀 우선) 옵션.

### LearningsCard

- “Calibration / learned params” 영역.
- 예: CC charger current, end current, heat transfer coeff…
- 목적: 운영자가 “모델/파라미터가 업데이트되었는지” 확인.

### AlarmsGridCard

- 4×4 (또는 2col 리스트) 알람 타입 그리드.
- Active / Latched 표시(점/테두리).
- 클릭 → Alarm Center로 필터링 이동 (e.g. severity=critical&type=open_wire).

---

## 3) Token & Auth (누가 줌?)

- **Backend (Auth API)** 가 JWT access token 발급.
- **Frontend:**
  - 로그인 성공 시 access token 받아서 API 호출에 붙임.
  - 만료 시 refresh token으로 재발급 (가능하면 HttpOnly cookie).
- **RBAC (roles):** 페이지/액션 제어 — `admin` / `operator` / `engineer` / `ml`.

---

## Pages (Summary)

| Page | 목적 |
|------|------|
| Dashboard Home | pack summary, worst cell, active alarms, PackOverviewTiles, SocGaugeCard, CellTable, LearningsCard, AlarmsGridCard |
| Cells Grid | color-coded cards + balancing badge + drawer |
| Realtime Monitor | WS sliding charts (Pack V, I, SOC, Temp) |
| Analytics | SOC/SOH trend + thermal map + aging index |
| Alarm Center | fault list + explanation panel |
| ML Console | dataset selector + training runs + comparison table (mean±std) |

---

## Data Principles

- Raw ≠ Feature ≠ Metric separation.
- Telemetry tables are append-only; enforce unique keys for idempotency.
- Dashboard-optimized endpoints return minimal/aggregated data.

## Security

- JWT auth (Bearer in header or cookie).
- RBAC: admin / operator / engineer / ml.
- Rate limiting for WS and heavy endpoints (later).
