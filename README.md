# Smart Facility Monitoring & Sustainability System — Airport Restroom Operations

> **Scenario:** Terminal 2 Restroom Block, International Airport  
> **Telemetry:** 4 Zones · 17 Smart Fixtures · 7-Day / 168-Hour Continuous Sensor Stream (1-min cadence, 171,360 readings)  
> **Backend Stack:** Python 3.10+ · FastAPI · Uvicorn · SQLite · Pandas · NumPy · Google Gemini API (`gemini-2.5-flash`)  
> **Frontend Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Recharts 3.10 · Lucide Icons  

---

## Demo Video & Project Deliverables

- **Demo Walkthrough Video:** [Watch Video (Google Drive)](https://drive.google.com/file/d/16Xk0pKtHjQkwvdTcGfrMe5nFSJK2VV_I/view?usp=sharing)
- **Executive Presentation Deck:** [`presentation deck.pdf`](./presentation%20deck.pdf)
- **Prompts & Engineering Log:** [`prompts_documentation.pdf`](./prompts_documentation.pdf) & [`prompts_log.md`](./prompts_log.md)
- **Feature Implementation Plan:** [`Track2_Feature_Implementation_Plan.md`](./Track2_Feature_Implementation_Plan.md)
- **Project PRD Specification:** [`facility_manager_prd.md`](./facility_manager_prd.md)

---

## Architecture Overview

The platform uses a decoupled industrial control-room architecture designed for high-throughput operational monitoring across 7 dedicated functional areas:

1. **Simulation & Ingestion Engine (`src/simulator.py`):** Generates 7 days (168 hours) of 1-minute continuous telemetry (flow rate, occupancy, pressure, temperature, sensor diagnostics) across 17 commercial fixtures in 4 airport zones with diurnal passenger waves and realistic anomaly injection.
2. **Deterministic 3-Pass Detection Engine (`src/detector.py`):**
   - *Pass 1:* Adaptive statistical baseline per `(fixture, hour_of_day)`.
   - *Pass 2:* Multi-signal correlation (zero-occupancy validation, duration filtering, sensor fault isolation, session coalescing).
   - *Pass 3:* Cumulative slow-drip scanner (0.25 LPM overnight drift detection).
   - *Composite Severity Scorer:* Weighted ranking (`Critical`, `High`, `Medium`, `Low`) and municipal water loss cost quantification.
3. **Hygiene & Custodial Dispatch Engine (`src/hygiene.py`):** Tracks facility cleanliness index (0–100), automated cleaning dispatches, soap and paper towel dispenser levels, and overdue zone alerts.
4. **Carbon Footprint Estimation Engine (`src/carbon.py`):** Calculates carbon emissions ($kg\ CO_2e$) using CEA/EPA grid emission factors across municipal water pumping, water heating, fixture standby electricity, and hygiene consumables.
5. **Sensor Fleet Intelligence Engine (`src/api.py`):** Aggregates 17 IoT sensor telemetry streams, battery percentages, RSSI signal strength, firmware revisions, and calibration drift indicators.
6. **AI Explainability & Grounded Copilot Layer (`src/llm.py`):** Google Gemini generates plain-English incident explanations citing physical telemetry and powers the conversational **AI Facility Copilot** with SQLite database grounding across all operational domains.
7. **Next.js 16 Executive Frontend (`frontend/`):** Built with React 19, Tailwind CSS v4, and a tailored "porcelain & brass" (light mode) / "warm graphite" (dark mode) industrial design system. Features unified app shell navigation, attention urgency band, interactive 60 FPS Replay Simulator, and slide-over AI Copilot drawer.

---

## Fresh Clone Setup & Run Instructions

Follow these steps to run both the Python backend and Next.js frontend from a fresh clone.

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)
- *(Optional)* A Google Gemini API key (the system includes deterministic local fallbacks if no key is provided).

---

### Step 1: Clone and Configure Environment

```bash
git clone https://github.com/someon-cool/Smart-Facility-Monitoring-System.git
cd Smart-Facility-Monitoring-System
```

Create your local `.env` file from `.env.example`:
```bash
# On Linux / macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

Open `.env` and insert your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If left blank, the application uses built-in deterministic grounding fallbacks).*

---

### Step 2: Install Python Backend Dependencies

```bash
pip install -r requirements.txt
```

---

### Step 3: Seed Telemetry Database & Anomaly Detector

```bash
# Generate 7 days (168 hours / 171,360 readings) across 17 fixtures into SQLite (facility.db)
python src/simulator.py

# Run the 3-pass multi-signal detector and generate LLM incident explanations
python src/detector.py
```

---

### Step 4: Launch the FastAPI Backend Server

In your first terminal window, start the REST API:
```bash
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
```
*API documentation (Swagger UI) is available at: `http://127.0.0.1:8000/docs`*

---

### Step 5: Install Frontend Dependencies & Start Next.js

In a **second terminal window**, navigate to `frontend/` and start the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

---

### Step 6: Open the Dashboard

Open your browser to:
```text
http://localhost:3000
```
*To explore the design system component showcase, navigate to: `http://localhost:3000/styleguide`*

---

## Platform Features & Navigation Modules

### 1. Executive Dashboard (`Dashboard` Tab)
- **Attention Band:** High-priority banner alerting facility managers to active critical anomalies and overdue zone cleanings with direct jump links.
- **Top-Level KPI Cards:** Live telemetry count, active open tickets, Facility Health Index, Estimated Water Loss (₹ impact), and Estimated Carbon Footprint.
- **Flow Rate Telemetry Chart (Recharts):** Multi-zone aggregated flow and individual fixture drilldowns with active anomaly overlays.
- **Integrated Mode Switcher:** Toggle seamlessly between **Full Dataset** (7-day overview with Day 1–7 presets) and **Replay Simulator** directly in the chart toolbar.
- **Occupancy Heatmap Matrix:** 17 fixtures monitored across 24 hours displaying diurnal traffic patterns.
- **Estimated Carbon Breakdown Banner:** Contextual summary of Scope 1, 2, and 3 emissions located directly below telemetry graphs.

### 2. Dedicated Tickets Tab (`Tickets` Tab)
- **Strict Severity Hierarchy:** Active tickets (`Open` / `Dispatched`) sorted strictly by severity tier (`Critical` → `High` → `Medium` → `Low`).
- **Status Progression Workflow:** Transitions (`Open` → `Dispatched` → `Resolved`) persisted directly to SQLite.
- **Audit Trail Resolution Notes:** Prompts for resolution cause chips (*"Valve replaced"*, *"Sensor recalibrated"*, *"Flapper seal cleaned"*).
- **AI Telemetry Evidence Breakdown:** Plain-English incident explanation with baseline vs. observed flow rates, durations, and confidence scores.

### 3. Dedicated Sustainability Tab (`Sustainability` Tab)
- **Water Conservation Impact:** Tracks cumulative water waste, water saved through prompt interventions, and avoided municipal utility costs (₹).
- **Projected Unresolved Loss:** Projected 24-hour waste from currently open anomalies.
- **Zone Attribution:** Breakdown of consumption and loss across Terminal 2 zones.

### 4. Dedicated Fixture Health Tab (`Fixture Health` Tab)
- **Facility Health Score:** 0–100 health gauge reflecting operational status across all 17 fixtures.
- **Status Tier Distribution:** Fixtures categorized into Optimal, Fair, and Needs Attention.
- **7-Day Trend Analysis:** Identifies fixtures as `Deteriorating`, `Stable`, or `Improving` based on recent vs. historical anomaly frequency.
- **Proactive Maintenance Actions:** Plain-English recommendations for high-risk fixtures.

### 5. Dedicated Hygiene Tab (`Hygiene` Tab)
- **Cleanliness Index (0–100):** Real-time hygiene rating computed from traffic, time since last sanitation, and active alerts.
- **Zone Hygiene Cards:** Live status for Departure Restroom, Arrival Restroom, Family Room, and Staff WC.
- **Consumables Monitoring:** Soap and paper towel fill levels with low-stock warnings.
- **Interactive Custodial Dispatch:** One-click "Log Cleaning" action to immediately restore zone hygiene scores.

### 6. Dedicated Carbon Tab (`Carbon` Tab)
- **Carbon Estimation Engine:** Tracks total equivalent carbon emissions ($kg\ CO_2e$).
- **Contributor Breakdown:**
  * Municipal Water Pumping & Supply ($0.34\ kg\ CO_2e/kL$)
  * Water Heating for Lavatories ($0.05\ kWh/L$, grid emission factor $0.82\ kg\ CO_2e/kWh$)
  * Smart Sensor Standby Electricity
  * Restroom Paper Consumables ($1.3\ kg\ CO_2e/kg\ paper$)
- **Actionable Decarbonization Tips:** Specific measures to reduce facility carbon intensity.

### 7. Dedicated Sensor Health Tab (`Sensors` Tab)
- **Fleet-Wide Status:** Active, degraded, and offline IoT sensor inventory.
- **Diagnostics Grid:** Sensor battery voltage, RSSI signal strength (dBm), measurement parameter, and latest reading.
- **Calibration Drift Monitor:** Flags sensors requiring recalibration before false positives occur.

### 8. Interactive Replay Simulator (60 FPS Scrubbing)
- **168-Hour Timeline Scrubber:** Full 7-day timeline slider (`0h` to `168h`) with Play / Pause, Reset (`00:00`), Speed multipliers (`0.5x` to `8x`), and live Replay Clock.
- **Rolling Window Telemetry:** Zooms in on a readable recent window (`2h`, `4h`, `6h`) that smoothly auto-scrolls forward with playback.
- **Unified REPLAY JUMP Day Selector:** `D1` through `D7` selector toolbar that synchronizes playback position, scrubber position, and the rolling window chart simultaneously.

### 9. Conversational AI Facility Copilot
- **Top Navigation Trigger:** Distinct gold-accented `AI Copilot` button anchored in the top bar.
- **Slide-Over Panel & Prompt Chips:** Pre-built query chips covering Water Waste, Carbon Emissions, Hygiene Status, Sensor Fleet Health, and Anomaly Diagnostics.
- **Telemetry Grounding:** Powered by Google Gemini with live SQLite database context across all 5 operational domains.

---

## Project Structure

```
├── .env.example                  ← Environment variable template
├── .gitignore                    ← Git ignore rules (protects keys, builds, backups)
├── facility.db                   ← SQLite database (telemetry, tickets, digests)
├── facility_manager_prd.md       ← Project specification and requirements PRD
├── presentation deck.pdf         ← Executive presentation deck
├── prompts_documentation.pdf     ← Prompts and AI engineering documentation
├── prompts_log.md                ← Running log of development prompts
├── README.md                     ← Comprehensive project documentation & guide
├── requirements.txt              ← Python backend dependencies
├── Track2_Feature_Implementation_Plan.md ← Detailed feature implementation plan
├── src/
│   ├── api.py                    ← FastAPI REST API server
│   ├── carbon.py                 ← Carbon footprint calculation engine
│   ├── config.py                 ← Constants: zones, fixtures, costs, thresholds
│   ├── database.py               ← SQLite schema migrations & query helpers
│   ├── detector.py               ← 3-pass multi-signal anomaly detector
│   ├── explainability.py         ← Telemetry-cited incident evidence builder
│   ├── fixture_health.py         ← Fixture health scoring & degradation trends
│   ├── hygiene.py                ← Restroom hygiene & custodial dispatch engine
│   ├── llm.py                    ← Google Gemini explainability & copilot service
│   ├── recommendations.py        ← Sustainability & maintenance recommendation rules
│   ├── seed_config.py            ← Facility, zone, and fixture configuration seeder
│   ├── simulator.py              ← 7-day telemetry generator & anomaly injector
│   └── sustainability.py         ← Water conservation & financial loss engine
└── frontend/                     ← Next.js 16 Web Application
    ├── package.json              ← Node.js dependencies
    ├── next.config.ts            ← API rewrites proxying to FastAPI (:8000)
    ├── tsconfig.json             ← TypeScript configuration
    ├── app/
    │   ├── globals.css           ← Porcelain & graphite theme design tokens
    │   ├── layout.tsx            ← Root layout & font styling
    │   ├── page.tsx              ← Main dashboard, tab routing & state manager
    │   └── styleguide/page.tsx   ← Design system and UI component showcase
    ├── components/
    │   ├── AiCopilotDrawer.tsx   ← Slide-over Conversational Copilot drawer
    │   ├── CarbonBreakdownCard.tsx ← Contextual carbon banner on dashboard
    │   ├── CarbonView.tsx        ← Dedicated Carbon Footprint tab
    │   ├── EvidencePanel.tsx     ← Telemetry evidence breakdown panel
    │   ├── FixtureHealthView.tsx ← Dedicated Fixture Health & Degradation tab
    │   ├── FlowRateChart.tsx     ← Telemetry chart with embedded Full/Replay controls
    │   ├── Header.tsx            ← Brand lockup, 7 tabs & Copilot trigger
    │   ├── HygieneView.tsx       ← Dedicated Hygiene & Custodial Dispatch tab
    │   ├── MetricCards.tsx       ← 5 KPI summary cards
    │   ├── OccupancyHeatmap.tsx  ← 24-hour occupancy matrix with accordion
    │   ├── ReplayScrubber.tsx    ← 60 FPS timeline scrubber & clock
    │   ├── SensorIntelligenceSection.tsx ← Dedicated Sensor Health tab
    │   ├── SustainabilityPanel.tsx ← Dedicated Sustainability & Conservation tab
    │   ├── TicketsView.tsx       ← Dedicated Tickets tab with resolution modal
    │   ├── types.ts              ← Shared TypeScript data interfaces
    │   ├── copilot/              ← Copilot panel subcomponents
    │   ├── dashboard/            ← Dashboard attention and overview components
    │   ├── impact/               ← Sustainability & impact switchers
    │   ├── shell/                ← AppShell, SideNav, TopBar, MobileTabBar
    │   └── ui/                   ← Reusable design system primitives
    └── lib/
        ├── cn.ts                 ← Class name merge utility
        ├── format.ts             ← Formatting utilities for numbers and dates
        └── names.ts              ← Fixture and zone naming helpers
```
