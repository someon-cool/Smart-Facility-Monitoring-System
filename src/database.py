"""
database.py — SQLite schema creation and query helpers.

Schema matches Section 3 of the PRD exactly.
All functions accept a db_path string so they are stateless and testable.
"""

import datetime
import sqlite3
from pathlib import Path

import pandas as pd


# ── Connection ─────────────────────────────────────────────────────────────────

def get_connection(db_path: str) -> sqlite3.Connection:
    """Return a SQLite connection with row_factory set for dict-style access."""
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ── Schema ─────────────────────────────────────────────────────────────────────

def init_db(db_path: str) -> None:
    """
    Create all application tables if they don't already exist.
    Safe to call multiple times (idempotent).

    Tables:
      Existing: sensor_readings, tickets, daily_digests, fixture_health
      New:      facility_config, zone_config, fixture_config,
                hygiene_events, hygiene_scores, energy_readings,
                carbon_snapshots, sustainability_recommendations
    """
    conn = get_connection(db_path)
    with conn:
        # ── sensor_readings (Section 3: Sensor reading) ────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp               TEXT    NOT NULL,
                zone_id                 TEXT    NOT NULL,
                fixture_id              TEXT    NOT NULL,
                flow_rate_lpm           REAL    NOT NULL,
                occupancy               INTEGER NOT NULL,
                flush_count_cumulative  INTEGER NOT NULL,
                sensor_status           TEXT    NOT NULL DEFAULT 'OK'
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_readings_fixture_ts
            ON sensor_readings (fixture_id, timestamp)
        """)

        # ── tickets (Section 3: Ticket + Feature 4 Explainability) ────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id                   TEXT PRIMARY KEY,
                timestamp_flagged           TEXT NOT NULL,
                zone_id                     TEXT NOT NULL,
                fixture_id                  TEXT NOT NULL,
                anomaly_type                TEXT NOT NULL,
                severity_score              REAL,
                severity_label              TEXT NOT NULL DEFAULT 'Flagged',
                explanation                 TEXT NOT NULL DEFAULT '',
                estimated_water_loss_liters REAL,
                estimated_cost_impact       REAL,
                status                      TEXT NOT NULL DEFAULT 'open',
                resolution_note             TEXT NOT NULL DEFAULT '',
                evidence_json               TEXT NOT NULL DEFAULT ''
            )
        """)

        # Migration: ensure resolution_note and evidence_json columns exist if table was created previously
        col_rows = conn.execute("PRAGMA table_info(tickets)").fetchall()
        col_names = [r["name"] for r in col_rows]
        if "resolution_note" not in col_names:
            conn.execute("ALTER TABLE tickets ADD COLUMN resolution_note TEXT NOT NULL DEFAULT ''")
        if "evidence_json" not in col_names:
            conn.execute("ALTER TABLE tickets ADD COLUMN evidence_json TEXT NOT NULL DEFAULT ''")

        # ── daily_digests (Section 5.2: End-of-day digest) ───────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS daily_digests (
                date            TEXT PRIMARY KEY,
                digest          TEXT NOT NULL,
                ticket_count    INTEGER NOT NULL DEFAULT 0,
                created_at      TEXT NOT NULL
            )
        """)

        # ── fixture_health (Section 1.5: Predictive Fixture Health) ──────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS fixture_health (
                fixture_id          TEXT PRIMARY KEY,
                health_score        REAL NOT NULL,
                risk_score          REAL NOT NULL,
                trend               TEXT NOT NULL,
                anomaly_count       INTEGER NOT NULL DEFAULT 0,
                slow_drip_count     INTEGER NOT NULL DEFAULT 0,
                sensor_fault_count  INTEGER NOT NULL DEFAULT 0,
                last_incident_at    TEXT,
                calculated_at       TEXT NOT NULL,
                recommendation      TEXT NOT NULL DEFAULT '',
                risk_factors_json   TEXT NOT NULL DEFAULT '{}'
            )
        """)

        # ── facility_config (key-value store for facility-level constants) ────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS facility_config (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key      TEXT NOT NULL UNIQUE,
                config_value    TEXT NOT NULL,
                config_type     TEXT NOT NULL DEFAULT 'string',
                description     TEXT NOT NULL DEFAULT '',
                updated_at      TEXT NOT NULL
            )
        """)

        # ── zone_config (per-zone metadata) ──────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS zone_config (
                zone_id             TEXT PRIMARY KEY,
                display_name        TEXT NOT NULL,
                floor               TEXT,
                capacity_persons    INTEGER,
                fixture_count       INTEGER NOT NULL DEFAULT 0,
                traffic_tier        TEXT NOT NULL DEFAULT 'Medium',
                color_hex           TEXT NOT NULL DEFAULT '#888888',
                description         TEXT NOT NULL DEFAULT ''
            )
        """)

        # ── fixture_config (per-fixture specs + power draw) ───────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS fixture_config (
                fixture_id              TEXT PRIMARY KEY,
                zone_id                 TEXT NOT NULL,
                fixture_type            TEXT NOT NULL,
                display_name            TEXT NOT NULL,
                brand_model             TEXT,
                install_date            TEXT,
                last_maintenance_date   TEXT,
                nominal_flow_lpm        REAL,
                power_draw_active_w     REAL NOT NULL DEFAULT 8.0,
                power_draw_idle_w       REAL NOT NULL DEFAULT 0.5,
                sensor_type             TEXT NOT NULL DEFAULT 'infrared',
                is_smart                INTEGER NOT NULL DEFAULT 1,
                notes                   TEXT NOT NULL DEFAULT ''
            )
        """)

        # ── hygiene_events (cleaning cycle log) ───────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS hygiene_events (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id                 TEXT NOT NULL,
                event_type              TEXT NOT NULL DEFAULT 'cleaning_cycle',
                scheduled_at            TEXT NOT NULL,
                completed_at            TEXT,
                completed_by            TEXT,
                duration_minutes        INTEGER,
                status                  TEXT NOT NULL DEFAULT 'scheduled',
                hygiene_score_before    REAL,
                hygiene_score_after     REAL,
                notes                   TEXT NOT NULL DEFAULT '',
                created_at              TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_hygiene_events_zone_ts
            ON hygiene_events (zone_id, scheduled_at)
        """)

        # ── hygiene_scores (hourly zone hygiene KPI time-series) ─────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS hygiene_scores (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id                 TEXT NOT NULL,
                timestamp               TEXT NOT NULL,
                score                   REAL NOT NULL,
                load_factor             REAL NOT NULL DEFAULT 0.0,
                minutes_since_clean     INTEGER NOT NULL DEFAULT 0,
                flush_count_hour        INTEGER NOT NULL DEFAULT 0,
                status                  TEXT NOT NULL DEFAULT 'Clean',
                calculated_at           TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_hygiene_scores_zone_ts
            ON hygiene_scores (zone_id, timestamp)
        """)

        # ── energy_readings (per-fixture kWh telemetry) ───────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS energy_readings (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT NOT NULL,
                zone_id         TEXT NOT NULL,
                fixture_id      TEXT NOT NULL,
                energy_kwh      REAL NOT NULL,
                power_state     TEXT NOT NULL DEFAULT 'idle',
                source          TEXT NOT NULL DEFAULT 'simulated'
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_energy_fixture_ts
            ON energy_readings (fixture_id, timestamp)
        """)

        # ── carbon_snapshots (hourly CO₂e footprint) ─────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS carbon_snapshots (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp               TEXT NOT NULL,
                zone_id                 TEXT,
                fixture_id              TEXT,
                water_consumed_liters   REAL NOT NULL DEFAULT 0.0,
                water_wasted_liters     REAL NOT NULL DEFAULT 0.0,
                energy_kwh              REAL NOT NULL DEFAULT 0.0,
                carbon_water_kg         REAL NOT NULL DEFAULT 0.0,
                carbon_waste_kg         REAL NOT NULL DEFAULT 0.0,
                carbon_energy_kg        REAL NOT NULL DEFAULT 0.0,
                carbon_total_kg         REAL NOT NULL DEFAULT 0.0,
                baseline_carbon_kg      REAL,
                carbon_delta_kg         REAL,
                period                  TEXT NOT NULL DEFAULT 'hourly',
                calculated_at           TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_carbon_ts_zone
            ON carbon_snapshots (timestamp, zone_id)
        """)

        # ── sustainability_recommendations (curated action items) ─────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sustainability_recommendations (
                id                          INTEGER PRIMARY KEY AUTOINCREMENT,
                recommendation_id           TEXT NOT NULL UNIQUE,
                category                    TEXT NOT NULL,
                priority                    TEXT NOT NULL DEFAULT 'Medium',
                title                       TEXT NOT NULL,
                description                 TEXT NOT NULL,
                metric_current              REAL,
                metric_unit                 TEXT,
                metric_target               REAL,
                potential_saving_inr        REAL,
                potential_saving_liters     REAL,
                potential_saving_carbon_kg  REAL,
                related_fixture_id          TEXT,
                related_zone_id             TEXT,
                related_ticket_id           TEXT,
                source                      TEXT NOT NULL DEFAULT 'rule',
                status                      TEXT NOT NULL DEFAULT 'active',
                generated_at                TEXT NOT NULL,
                expires_at                  TEXT
            )
        """)

    conn.close()


# ── Write ──────────────────────────────────────────────────────────────────────

def insert_readings_df(db_path: str, df: pd.DataFrame) -> None:
    """
    Bulk-insert a DataFrame of sensor readings.
    The DataFrame must NOT include the auto-increment 'id' column.
    """
    conn = get_connection(db_path)
    df.to_sql("sensor_readings", conn, if_exists="append", index=False)
    conn.close()


def insert_ticket(db_path: str, ticket: dict) -> None:
    """Insert (or replace) a single ticket row."""
    conn = get_connection(db_path)
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO tickets (
                ticket_id, timestamp_flagged, zone_id, fixture_id,
                anomaly_type, severity_score, severity_label, explanation,
                estimated_water_loss_liters, estimated_cost_impact, status,
                resolution_note, evidence_json
            ) VALUES (
                :ticket_id, :timestamp_flagged, :zone_id, :fixture_id,
                :anomaly_type, :severity_score, :severity_label, :explanation,
                :estimated_water_loss_liters, :estimated_cost_impact, :status,
                :resolution_note, :evidence_json
            )
        """, {
            "ticket_id": ticket["ticket_id"],
            "timestamp_flagged": ticket["timestamp_flagged"],
            "zone_id": ticket["zone_id"],
            "fixture_id": ticket["fixture_id"],
            "anomaly_type": ticket.get("anomaly_type", ""),
            "severity_score": ticket.get("severity_score"),
            "severity_label": ticket.get("severity_label", "Flagged"),
            "explanation": ticket.get("explanation", ""),
            "estimated_water_loss_liters": ticket.get("estimated_water_loss_liters"),
            "estimated_cost_impact": ticket.get("estimated_cost_impact"),
            "status": ticket.get("status", "open"),
            "resolution_note": ticket.get("resolution_note", ""),
            "evidence_json": ticket.get("evidence_json", ""),
        })
    conn.close()


# ── Read ───────────────────────────────────────────────────────────────────────

def get_readings_df(db_path: str, fixture_id: str = None) -> pd.DataFrame:
    """
    Return all (or fixture-filtered) sensor readings as a DataFrame.
    timestamp column is parsed as datetime.
    """
    db_path = str(db_path)
    if not Path(db_path).exists():
        return pd.DataFrame()

    conn = get_connection(db_path)
    query = "SELECT timestamp, zone_id, fixture_id, flow_rate_lpm, occupancy, flush_count_cumulative, sensor_status FROM sensor_readings"
    params: list = []
    if fixture_id:
        query += " WHERE fixture_id = ?"
        params.append(fixture_id)
    query += " ORDER BY timestamp"

    df = pd.read_sql_query(query, conn, params=params, parse_dates=["timestamp"])
    conn.close()
    return df


def get_tickets_df(db_path: str) -> pd.DataFrame:
    """Return all tickets as a DataFrame, newest first."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return pd.DataFrame()

    conn = get_connection(db_path)
    df = pd.read_sql_query(
        "SELECT * FROM tickets ORDER BY timestamp_flagged DESC",
        conn,
        parse_dates=["timestamp_flagged"],
    )
    conn.close()
    return df


# ── Daily Digests (Section 5.2) ───────────────────────────────────────────────

def save_daily_digest(db_path: str, date_str: str, digest: str, ticket_count: int = 0) -> None:
    """Save or update an end-of-day digest for a specific date (YYYY-MM-DD)."""
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO daily_digests (date, digest, ticket_count, created_at)
            VALUES (?, ?, ?, ?)
        """, (date_str, digest, ticket_count, now_iso))
    conn.close()


def get_daily_digests(db_path: str) -> dict[str, dict]:
    """
    Return all daily digests keyed by date_str (YYYY-MM-DD).
    Returns {date: {'digest': ..., 'ticket_count': ..., 'created_at': ...}}.
    """
    db_path = str(db_path)
    if not Path(db_path).exists():
        return {}
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT date, digest, ticket_count, created_at FROM daily_digests ORDER BY date DESC"
        ).fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()

    return {
        row["date"]: {
            "digest": row["digest"],
            "ticket_count": row["ticket_count"],
            "created_at": row["created_at"],
        }
        for row in rows
    }


def update_ticket_status(
    db_path: str, ticket_id: str, new_status: str, resolution_note: str = None
) -> bool:
    """Update the status and optional resolution note of a ticket. Returns True if updated."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return False
    conn = get_connection(db_path)
    with conn:
        if resolution_note is not None:
            cursor = conn.execute(
                "UPDATE tickets SET status = ?, resolution_note = ? WHERE ticket_id = ?",
                (new_status, resolution_note, ticket_id),
            )
        else:
            cursor = conn.execute(
                "UPDATE tickets SET status = ? WHERE ticket_id = ?",
                (new_status, ticket_id),
            )
        updated = cursor.rowcount > 0
    conn.close()
    return updated


# ── Fixture Health (Section 1.5) ──────────────────────────────────────────────

def save_fixture_health_records(db_path: str, records: list[dict]) -> None:
    """Bulk insert or replace fixture health records in SQLite."""
    db_path = str(db_path)
    conn = get_connection(db_path)
    with conn:
        for r in records:
            conn.execute(
                """
                INSERT OR REPLACE INTO fixture_health (
                    fixture_id, health_score, risk_score, trend,
                    anomaly_count, slow_drip_count, sensor_fault_count,
                    last_incident_at, calculated_at, recommendation,
                    risk_factors_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    r["fixture_id"],
                    r["health_score"],
                    r["risk_score"],
                    r["trend"],
                    r.get("anomaly_count", 0),
                    r.get("slow_drip_count", 0),
                    r.get("sensor_fault_count", 0),
                    str(r["last_incident_at"]) if r.get("last_incident_at") is not None and not pd.isna(r.get("last_incident_at")) else None,
                    str(r["calculated_at"]),
                    r.get("recommendation", ""),
                    r.get("risk_factors_json", "{}"),
                ),
            )
    conn.close()


def get_fixture_health_records(db_path: str, fixture_id: str = None) -> list[dict]:
    """Retrieve fixture health records. If fixture_id is provided, returns single record or empty."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        if fixture_id:
            rows = conn.execute(
                "SELECT * FROM fixture_health WHERE fixture_id = ?",
                (fixture_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM fixture_health ORDER BY risk_score DESC"
            ).fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()

    return [dict(r) for r in rows]


# ── Facility / Zone / Fixture Config ──────────────────────────────────────────

def upsert_facility_config(db_path: str, key: str, value: str, config_type: str = "string", description: str = "") -> None:
    """Insert or replace a facility config key-value entry."""
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO facility_config (config_key, config_value, config_type, description, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (key, value, config_type, description, now_iso),
        )
    conn.close()


def get_facility_config(db_path: str) -> dict:
    """Return all facility config entries as {key: {value, type, description}}."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return {}
    conn = get_connection(db_path)
    try:
        rows = conn.execute("SELECT config_key, config_value, config_type, description FROM facility_config").fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return {r["config_key"]: {"value": r["config_value"], "type": r["config_type"], "description": r["description"]} for r in rows}


def upsert_zone_config(db_path: str, record: dict) -> None:
    """Insert or replace a zone_config row."""
    conn = get_connection(db_path)
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO zone_config
                (zone_id, display_name, floor, capacity_persons, fixture_count, traffic_tier, color_hex, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["zone_id"], record["display_name"], record.get("floor"),
                record.get("capacity_persons"), record.get("fixture_count", 0),
                record.get("traffic_tier", "Medium"), record.get("color_hex", "#888888"),
                record.get("description", ""),
            ),
        )
    conn.close()


def get_zone_configs(db_path: str) -> list[dict]:
    """Return all zone config rows as list of dicts."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        rows = conn.execute("SELECT * FROM zone_config ORDER BY zone_id").fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


def upsert_fixture_config(db_path: str, record: dict) -> None:
    """Insert or replace a fixture_config row."""
    conn = get_connection(db_path)
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO fixture_config (
                fixture_id, zone_id, fixture_type, display_name, brand_model,
                install_date, last_maintenance_date, nominal_flow_lpm,
                power_draw_active_w, power_draw_idle_w, sensor_type, is_smart, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["fixture_id"], record["zone_id"], record["fixture_type"],
                record["display_name"], record.get("brand_model"),
                record.get("install_date"), record.get("last_maintenance_date"),
                record.get("nominal_flow_lpm"),
                record.get("power_draw_active_w", 8.0), record.get("power_draw_idle_w", 0.5),
                record.get("sensor_type", "infrared"), record.get("is_smart", 1),
                record.get("notes", ""),
            ),
        )
    conn.close()


def get_fixture_configs(db_path: str, fixture_id: str = None) -> list[dict]:
    """Return fixture config rows. Optionally filter by fixture_id."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        if fixture_id:
            rows = conn.execute("SELECT * FROM fixture_config WHERE fixture_id = ?", (fixture_id,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM fixture_config ORDER BY zone_id, fixture_id").fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


def get_sensor_intelligence(db_path: str) -> dict:
    """
    Return comprehensive telemetry, parameters, and status for all facility sensors.
    Joins fixture_config with the latest sensor_readings and historical fault statistics.
    """
    db_path = str(db_path)
    if not Path(db_path).exists():
        return {"summary": {}, "sensors": []}

    conn = get_connection(db_path)
    try:
        cfg_rows = conn.execute("SELECT * FROM fixture_config ORDER BY zone_id, fixture_id").fetchall()
        configs = [dict(r) for r in cfg_rows]
        lr_rows = conn.execute("""
            SELECT sr.fixture_id, sr.flow_rate_lpm, sr.occupancy, sr.flush_count_cumulative,
                   sr.sensor_status, sr.timestamp
            FROM sensor_readings sr
            WHERE sr.timestamp = (SELECT MAX(timestamp) FROM sensor_readings)
        """).fetchall()
        latest_rows = [dict(r) for r in lr_rows]
        fr_rows = conn.execute("""
            SELECT fixture_id,
                   COUNT(*) as total_samples,
                   SUM(CASE WHEN sensor_status != 'OK' THEN 1 ELSE 0 END) as fault_samples,
                   SUM(CASE WHEN sensor_status = 'FAULT' THEN 1 ELSE 0 END) as hard_faults,
                   SUM(CASE WHEN sensor_status = 'DEGRADED' THEN 1 ELSE 0 END) as degraded_samples,
                   SUM(CASE WHEN sensor_status = 'OFFLINE' THEN 1 ELSE 0 END) as offline_samples
            FROM sensor_readings
            GROUP BY fixture_id
        """).fetchall()
        fault_rows = [dict(r) for r in fr_rows]
    except sqlite3.OperationalError:
        configs, latest_rows, fault_rows = [], [], []
    finally:
        conn.close()

    latest_map = {r["fixture_id"]: r for r in latest_rows}
    fault_map = {r["fixture_id"]: r for r in fault_rows}

    SENSOR_SPECS = {
        "infrared": {
            "tech_label": "Infrared Proximity & Turbine Flow",
            "parameter": "Water Flow Rate (LPM) & Hand Proximity",
            "units": "LPM / Binary Detection",
        },
        "ultrasonic": {
            "tech_label": "Dual-Beam Ultrasonic Occupancy & Flush",
            "parameter": "Flush Flow Rate (LPM) & Stall Occupancy",
            "units": "LPM / Ultrasonic Distance",
        },
        "passive_infrared": {
            "tech_label": "Passive Infrared (PIR) Motion & Flow",
            "parameter": "Flush Flow Rate (LPM) & User Presence",
            "units": "LPM / PIR Motion",
        },
    }

    sensors = []
    total_online = 0
    total_degraded = 0
    total_fault = 0
    total_offline = 0
    uptime_sum = 0.0

    for cfg in configs:
        f_id = cfg["fixture_id"]
        latest = latest_map.get(f_id, {})
        f_stats = fault_map.get(f_id, {})
        s_type = cfg.get("sensor_type", "infrared")
        spec = SENSOR_SPECS.get(s_type, SENSOR_SPECS["infrared"])

        status = latest.get("sensor_status", "OK")
        if status == "OK":
            total_online += 1
        elif status == "DEGRADED":
            total_degraded += 1
        elif status == "FAULT":
            total_fault += 1
        elif status == "OFFLINE":
            total_offline += 1

        total_samples = f_stats.get("total_samples", 10080)
        fault_samples = f_stats.get("fault_samples", 0)
        uptime = round((1.0 - (fault_samples / total_samples)) * 100.0, 1) if total_samples else 100.0
        uptime_sum += uptime

        flow = float(latest.get("flow_rate_lpm") or 0.0)
        occ = int(latest.get("occupancy") or 0)
        flushes = int(latest.get("flush_count_cumulative") or 0)
        ts = latest.get("timestamp", "")

        sensors.append({
            "fixture_id": f_id,
            "display_name": cfg.get("display_name", f_id),
            "zone_id": cfg["zone_id"],
            "fixture_type": cfg["fixture_type"],
            "brand_model": cfg.get("brand_model", "Commercial Smart Fixture"),
            "sensor_type": s_type,
            "sensor_tech_label": spec["tech_label"],
            "parameter_measured": spec["parameter"],
            "parameter_units": spec["units"],
            "nominal_flow_lpm": float(cfg.get("nominal_flow_lpm") or 3.0),
            "latest_reading": {
                "flow_rate_lpm": round(flow, 2),
                "occupancy": occ,
                "occupancy_label": "Occupied" if occ == 1 else "Vacant",
                "flush_count_cumulative": flushes,
                "timestamp": ts,
            },
            "status": status,
            "uptime_pct": uptime,
            "fault_samples": fault_samples,
            "install_date": cfg.get("install_date"),
            "last_maintenance_date": cfg.get("last_maintenance_date"),
        })

    avg_uptime = round(uptime_sum / len(sensors), 1) if sensors else 100.0

    return {
        "summary": {
            "total_sensors": len(sensors),
            "online_count": total_online,
            "degraded_count": total_degraded,
            "fault_count": total_fault,
            "offline_count": total_offline,
            "average_uptime_pct": avg_uptime,
            "last_telemetry_timestamp": sensors[0]["latest_reading"]["timestamp"] if sensors else "",
        },
        "sensors": sensors,
    }


# ── Hygiene Events & Scores ───────────────────────────────────────────────────

def insert_hygiene_events(db_path: str, events: list[dict]) -> None:
    """Bulk insert hygiene events (cleaning cycles, audits, etc.)."""
    db_path = str(db_path)
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        for ev in events:
            conn.execute(
                """
                INSERT INTO hygiene_events (
                    zone_id, event_type, scheduled_at, completed_at, completed_by,
                    duration_minutes, status, hygiene_score_before, hygiene_score_after,
                    notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    ev["zone_id"], ev.get("event_type", "cleaning_cycle"),
                    ev["scheduled_at"], ev.get("completed_at"), ev.get("completed_by"),
                    ev.get("duration_minutes"), ev.get("status", "completed"),
                    ev.get("hygiene_score_before"), ev.get("hygiene_score_after"),
                    ev.get("notes", ""), now_iso,
                ),
            )
    conn.close()


def get_hygiene_events(db_path: str, zone_id: str = None, status: str = None) -> list[dict]:
    """Return hygiene events, optionally filtered by zone and/or status."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        sql = "SELECT * FROM hygiene_events WHERE 1=1"
        params = []
        if zone_id:
            sql += " AND zone_id = ?"
            params.append(zone_id)
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY scheduled_at ASC"
        rows = conn.execute(sql, params).fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


def insert_hygiene_scores(db_path: str, scores: list[dict]) -> None:
    """Bulk insert hourly hygiene score snapshots."""
    db_path = str(db_path)
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        for s in scores:
            conn.execute(
                """
                INSERT OR REPLACE INTO hygiene_scores (
                    zone_id, timestamp, score, load_factor,
                    minutes_since_clean, flush_count_hour, status, calculated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    s["zone_id"], s["timestamp"], s["score"],
                    s.get("load_factor", 0.0), s.get("minutes_since_clean", 0),
                    s.get("flush_count_hour", 0), s.get("status", "Clean"), now_iso,
                ),
            )
    conn.close()


def get_hygiene_scores(db_path: str, zone_id: str = None) -> list[dict]:
    """Return hygiene score time-series, optionally filtered by zone."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        if zone_id:
            rows = conn.execute(
                "SELECT * FROM hygiene_scores WHERE zone_id = ? ORDER BY timestamp ASC", (zone_id,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM hygiene_scores ORDER BY timestamp ASC").fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


# ── Energy Readings ───────────────────────────────────────────────────────────

def insert_energy_readings_df(db_path: str, df: pd.DataFrame) -> None:
    """Bulk-insert a DataFrame of energy readings into energy_readings table."""
    conn = get_connection(db_path)
    df.to_sql("energy_readings", conn, if_exists="append", index=False)
    conn.close()


def get_energy_readings_df(db_path: str, fixture_id: str = None, zone_id: str = None) -> pd.DataFrame:
    """Return energy readings as a DataFrame, optionally filtered."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return pd.DataFrame()
    conn = get_connection(db_path)
    sql = "SELECT timestamp, zone_id, fixture_id, energy_kwh, power_state FROM energy_readings WHERE 1=1"
    params = []
    if fixture_id:
        sql += " AND fixture_id = ?"
        params.append(fixture_id)
    if zone_id:
        sql += " AND zone_id = ?"
        params.append(zone_id)
    sql += " ORDER BY timestamp ASC"
    df = pd.read_sql_query(sql, conn, params=params, parse_dates=["timestamp"])
    conn.close()
    return df


# ── Carbon Snapshots ──────────────────────────────────────────────────────────

def insert_carbon_snapshots(db_path: str, snapshots: list[dict]) -> None:
    """Bulk insert carbon footprint snapshot records."""
    db_path = str(db_path)
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        for s in snapshots:
            conn.execute(
                """
                INSERT OR REPLACE INTO carbon_snapshots (
                    timestamp, zone_id, fixture_id,
                    water_consumed_liters, water_wasted_liters, energy_kwh,
                    carbon_water_kg, carbon_waste_kg, carbon_energy_kg, carbon_total_kg,
                    baseline_carbon_kg, carbon_delta_kg, period, calculated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    s["timestamp"], s.get("zone_id"), s.get("fixture_id"),
                    s.get("water_consumed_liters", 0.0), s.get("water_wasted_liters", 0.0),
                    s.get("energy_kwh", 0.0),
                    s.get("carbon_water_kg", 0.0), s.get("carbon_waste_kg", 0.0),
                    s.get("carbon_energy_kg", 0.0), s.get("carbon_total_kg", 0.0),
                    s.get("baseline_carbon_kg"), s.get("carbon_delta_kg"),
                    s.get("period", "hourly"), now_iso,
                ),
            )
    conn.close()


def get_carbon_snapshots(db_path: str, period: str = "hourly", zone_id: str = None) -> list[dict]:
    """Return carbon snapshots filtered by period and optionally zone."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        sql = "SELECT * FROM carbon_snapshots WHERE period = ?"
        params: list = [period]
        if zone_id:
            sql += " AND zone_id = ?"
            params.append(zone_id)
        sql += " ORDER BY timestamp ASC"
        rows = conn.execute(sql, params).fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


# ── Sustainability Recommendations ────────────────────────────────────────────

def upsert_sustainability_recommendations(db_path: str, recs: list[dict]) -> None:
    """Bulk insert or replace sustainability recommendation records."""
    db_path = str(db_path)
    conn = get_connection(db_path)
    now_iso = datetime.datetime.now().isoformat()
    with conn:
        for r in recs:
            conn.execute(
                """
                INSERT OR REPLACE INTO sustainability_recommendations (
                    recommendation_id, category, priority, title, description,
                    metric_current, metric_unit, metric_target,
                    potential_saving_inr, potential_saving_liters, potential_saving_carbon_kg,
                    related_fixture_id, related_zone_id, related_ticket_id,
                    source, status, generated_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    r["recommendation_id"], r["category"],
                    r.get("priority", "Medium"), r["title"], r["description"],
                    r.get("metric_current"), r.get("metric_unit"), r.get("metric_target"),
                    r.get("potential_saving_inr"), r.get("potential_saving_liters"),
                    r.get("potential_saving_carbon_kg"),
                    r.get("related_fixture_id"), r.get("related_zone_id"), r.get("related_ticket_id"),
                    r.get("source", "rule"), r.get("status", "active"),
                    r.get("generated_at", now_iso), r.get("expires_at"),
                ),
            )
    conn.close()


def get_sustainability_recommendations(db_path: str, status: str = "active", category: str = None) -> list[dict]:
    """Return sustainability recommendations, optionally filtered by status and category."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return []
    conn = get_connection(db_path)
    try:
        sql = "SELECT * FROM sustainability_recommendations WHERE status = ?"
        params: list = [status]
        if category:
            sql += " AND category = ?"
            params.append(category)
        sql += " ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, generated_at DESC"
        rows = conn.execute(sql, params).fetchall()
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()
    return [dict(r) for r in rows]


def update_recommendation_status(db_path: str, rec_id: str, new_status: str) -> bool:
    """Update the status of a sustainability recommendation ('active', 'implemented', 'dismissed')."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return False
    conn = get_connection(db_path)
    with conn:
        cursor = conn.execute(
            "UPDATE sustainability_recommendations SET status = ? WHERE recommendation_id = ?",
            (new_status, rec_id),
        )
        updated = cursor.rowcount > 0
    conn.close()
    return updated


def complete_hygiene_event(
    db_path: str, event_id: int, completed_by: str = "Facility Staff",
    notes: str = "", score_after: float = 95.0
) -> bool:
    """Mark a hygiene event as completed with timestamp and post-cleaning score."""
    db_path = str(db_path)
    if not Path(db_path).exists():
        return False
    now_iso = datetime.datetime.now().isoformat()
    conn = get_connection(db_path)
    with conn:
        cursor = conn.execute(
            """
            UPDATE hygiene_events
            SET status = 'completed',
                completed_at = ?,
                completed_by = ?,
                hygiene_score_after = ?,
                notes = CASE WHEN ? != '' THEN ? ELSE notes END
            WHERE id = ?
            """,
            (now_iso, completed_by, score_after, notes, notes, event_id),
        )
        updated = cursor.rowcount > 0
    conn.close()
    return updated
