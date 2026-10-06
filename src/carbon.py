"""
carbon.py — Carbon Footprint Detector engine for Smart Facility Manager.

Implements:
1. Energy simulation (simulate_energy_readings):
   - Generates per-fixture kWh readings for the 7-day window.
   - Active minutes (flow > 0) use power_draw_active_w from fixture_config.
   - Idle minutes use power_draw_idle_w.
   - Sensor fault windows (OFFLINE) contribute zero energy.
   - Persists to energy_readings table.

2. Carbon snapshot calculation (compute_carbon_snapshots):
   - Aggregates water consumption + wasted water + energy per zone per hour.
   - Applies India-specific carbon factors (CEA 2023 / IPCC / BIS).
   - Computes a baseline expectation per hour-of-day for anomaly detection.
   - Persists hourly + daily rollups to carbon_snapshots table.

3. Facility carbon summary (get_carbon_summary):
   - Returns facility-wide totals + zone breakdown + highest-emission source.

Carbon factors used:
  Water consumption: 0.000298 kg CO2e/L  (IPCC / BIS standard, India municipal)
  Grid electricity:  0.82 kg CO2e/kWh    (CEA 2023 national average)
"""

import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

from src.config import (
    DB_PATH, SIM_START, SIM_DURATION_HOURS, FIXTURES,
    FIXTURE_POWER_SPECS,
    CARBON_FACTOR_WATER_KG_PER_LITER,
    CARBON_FACTOR_ELECTRICITY_KG_PER_KWH,
    ELECTRICITY_COST_PER_KWH_INR,
    WATER_COST_PER_LITER,
)
from src.database import (
    init_db, get_connection, get_readings_df, get_tickets_df,
    get_fixture_configs, insert_energy_readings_df,
    insert_carbon_snapshots, get_carbon_snapshots,
)

ZONES = [z for z, _, _ in FIXTURES]
ZONES_UNIQUE = list(dict.fromkeys(ZONES))  # preserve order, deduplicate

# Minutes per reading interval
_MIN_PER_ROW = 1
_KWH_PER_MIN = 1 / 60 / 1000  # = 1/60000 — multiply by watts to get kWh/row


def simulate_energy_readings(db_path: str = None) -> pd.DataFrame:
    """
    Generate per-fixture energy_readings rows from existing sensor_readings.

    For each sensor_reading row:
      - If sensor_status in {"FAULT", "OFFLINE"}: energy = 0, power_state = "fault"
      - If flow_rate_lpm > 0:                     energy = active_w × (1/60/1000)
      - Else:                                      energy = idle_w   × (1/60/1000)

    Reads power specs from fixture_config table (falls back to FIXTURE_POWER_SPECS constants).
    """
    if db_path is None:
        db_path = str(DB_PATH)

    init_db(db_path)

    # Load sensor readings
    readings_df = get_readings_df(db_path)
    if readings_df.empty:
        print("  [carbon] No sensor readings found — skipping energy simulation.")
        return pd.DataFrame()

    # Build power spec lookup: fixture_id → {active_w, idle_w}
    fixture_cfgs = get_fixture_configs(db_path)
    power_lookup: Dict[str, Dict[str, float]] = {}
    if fixture_cfgs:
        for fc in fixture_cfgs:
            power_lookup[fc["fixture_id"]] = {
                "active_w": float(fc.get("power_draw_active_w") or 8.0),
                "idle_w":   float(fc.get("power_draw_idle_w") or 0.5),
            }

    # Fall back to FIXTURE_POWER_SPECS via fixture type if config not seeded
    fix_type_map = {f_id: f_type for _, f_id, f_type in FIXTURES}

    def get_power(fixture_id: str, is_active: bool) -> float:
        if fixture_id in power_lookup:
            spec = power_lookup[fixture_id]
            return spec["active_w"] if is_active else spec["idle_w"]
        f_type = fix_type_map.get(fixture_id, "sink")
        spec = FIXTURE_POWER_SPECS.get(f_type, FIXTURE_POWER_SPECS["sink"])
        return spec["active_w"] if is_active else spec["idle_w"]

    energy_rows = []
    for _, row in readings_df.iterrows():
        f_id = str(row["fixture_id"])
        status = str(row.get("sensor_status", "OK"))
        flow = float(row.get("flow_rate_lpm", 0.0))

        if status in {"FAULT", "OFFLINE"}:
            energy_kwh = 0.0
            power_state = "fault"
        elif flow > 0.0:
            energy_kwh = round(get_power(f_id, True) * _KWH_PER_MIN, 8)
            power_state = "active"
        else:
            energy_kwh = round(get_power(f_id, False) * _KWH_PER_MIN, 8)
            power_state = "idle"

        energy_rows.append({
            "timestamp":   str(row["timestamp"])[:19],   # ISO without microseconds
            "zone_id":     str(row["zone_id"]),
            "fixture_id":  f_id,
            "energy_kwh":  energy_kwh,
            "power_state": power_state,
            "source":      "simulated",
        })

    energy_df = pd.DataFrame(energy_rows)

    # Clear old energy readings and write new
    conn = get_connection(db_path)
    with conn:
        conn.execute("DELETE FROM energy_readings")
    conn.close()
    insert_energy_readings_df(db_path, energy_df)
    print(f"  [carbon] {len(energy_df):,} energy reading rows written.")
    return energy_df


def compute_carbon_snapshots(db_path: str = None) -> List[Dict[str, Any]]:
    """
    Compute hourly and daily carbon footprint snapshots.

    Hourly snapshots (per zone):
      carbon_water  = water_consumed_liters   × CARBON_FACTOR_WATER
      carbon_waste  = water_wasted_liters      × CARBON_FACTOR_WATER
      carbon_energy = energy_kwh               × CARBON_FACTOR_ELECTRICITY
      carbon_total  = sum of above three

    Baseline is the median carbon_total for the same hour-of-day across all 7 days.
    carbon_delta = carbon_total - baseline (positive = above expected).

    Daily snapshots aggregate the 24 hourly rows for each zone.
    """
    if db_path is None:
        db_path = str(DB_PATH)

    # ── Load data ──────────────────────────────────────────────────────────────
    conn = get_connection(db_path)
    try:
        sensor_rows = conn.execute(
            "SELECT timestamp, zone_id, fixture_id, flow_rate_lpm, sensor_status FROM sensor_readings ORDER BY timestamp"
        ).fetchall()
        energy_rows = conn.execute(
            "SELECT timestamp, zone_id, fixture_id, energy_kwh FROM energy_readings ORDER BY timestamp"
        ).fetchall()
    finally:
        conn.close()

    if not sensor_rows:
        print("  [carbon] No sensor data — skipping carbon snapshots.")
        return []

    readings_df = pd.DataFrame([dict(r) for r in sensor_rows])
    readings_df["timestamp"] = pd.to_datetime(readings_df["timestamp"])

    energy_df = pd.DataFrame([dict(r) for r in energy_rows]) if energy_rows else pd.DataFrame()
    if not energy_df.empty:
        energy_df["timestamp"] = pd.to_datetime(energy_df["timestamp"])

    # Water loss from tickets (per zone, per hour bucket)
    tickets_df = get_tickets_df(db_path)
    zone_ticket_waste: Dict[str, float] = {}
    if not tickets_df.empty:
        for _, t in tickets_df.iterrows():
            z = str(t.get("zone_id", ""))
            loss = float(t.get("estimated_water_loss_liters") or 0.0)
            zone_ticket_waste[z] = zone_ticket_waste.get(z, 0.0) + loss

    # ── Hourly aggregation ────────────────────────────────────────────────────
    snapshots: List[Dict[str, Any]] = []
    now_iso = datetime.datetime.now().isoformat()

    sim_end = SIM_START + datetime.timedelta(hours=SIM_DURATION_HOURS)
    current_hour = SIM_START.replace(minute=0, second=0, microsecond=0)

    # For baseline: collect all hourly totals first, then compute median per hour-of-day
    hourly_records: List[Dict[str, Any]] = []

    while current_hour < sim_end:
        hour_end = current_hour + datetime.timedelta(hours=1)
        hour_ts = current_hour.isoformat()

        for zone_id in ZONES_UNIQUE:
            # Water consumed (sum of flow × 1 min = L)
            mask = (
                (readings_df["zone_id"] == zone_id) &
                (readings_df["timestamp"] >= current_hour) &
                (readings_df["timestamp"] < hour_end)
            )
            zone_hour_df = readings_df[mask]
            water_consumed = float(zone_hour_df["flow_rate_lpm"].sum())  # LPM × 1 min = L

            # Energy consumed
            energy_kwh = 0.0
            if not energy_df.empty:
                emask = (
                    (energy_df["zone_id"] == zone_id) &
                    (energy_df["timestamp"] >= current_hour) &
                    (energy_df["timestamp"] < hour_end)
                )
                energy_kwh = float(energy_df[emask]["energy_kwh"].sum())

            # Water wasted from tickets — prorated across hours (simple even distribution)
            waste_total = zone_ticket_waste.get(zone_id, 0.0)
            water_wasted = round(waste_total / SIM_DURATION_HOURS, 4) if SIM_DURATION_HOURS else 0.0

            # Carbon calculations
            carbon_water  = round(water_consumed * CARBON_FACTOR_WATER_KG_PER_LITER,  6)
            carbon_waste  = round(water_wasted   * CARBON_FACTOR_WATER_KG_PER_LITER,  6)
            carbon_energy = round(energy_kwh     * CARBON_FACTOR_ELECTRICITY_KG_PER_KWH, 6)
            carbon_total  = round(carbon_water + carbon_waste + carbon_energy, 6)

            hourly_records.append({
                "timestamp":             hour_ts,
                "zone_id":               zone_id,
                "fixture_id":            None,
                "water_consumed_liters": round(water_consumed, 3),
                "water_wasted_liters":   round(water_wasted, 3),
                "energy_kwh":            round(energy_kwh, 6),
                "carbon_water_kg":       carbon_water,
                "carbon_waste_kg":       carbon_waste,
                "carbon_energy_kg":      carbon_energy,
                "carbon_total_kg":       carbon_total,
                "baseline_carbon_kg":    None,   # filled in pass 2
                "carbon_delta_kg":       None,
                "period":                "hourly",
                "calculated_at":         now_iso,
            })

        current_hour = hour_end

    # ── Pass 2: compute per zone per hour-of-day baseline (median) ────────────
    rec_df = pd.DataFrame(hourly_records)
    rec_df["hour_of_day"] = pd.to_datetime(rec_df["timestamp"]).dt.hour

    baseline_map: Dict[tuple, float] = {}
    for (zone_id, hod), grp in rec_df.groupby(["zone_id", "hour_of_day"]):
        baseline_map[(zone_id, hod)] = float(grp["carbon_total_kg"].median())

    for rec in hourly_records:
        hod = datetime.datetime.fromisoformat(rec["timestamp"]).hour
        baseline = baseline_map.get((rec["zone_id"], hod), rec["carbon_total_kg"])
        rec["baseline_carbon_kg"] = round(baseline, 6)
        rec["carbon_delta_kg"]    = round(rec["carbon_total_kg"] - baseline, 6)

    snapshots.extend(hourly_records)

    # ── Daily rollups ─────────────────────────────────────────────────────────
    for zone_id in ZONES_UNIQUE:
        zone_hourly = [r for r in hourly_records if r["zone_id"] == zone_id]
        if not zone_hourly:
            continue

        # Group by date
        by_date: Dict[str, List[Dict]] = {}
        for r in zone_hourly:
            date_str = r["timestamp"][:10]
            by_date.setdefault(date_str, []).append(r)

        for date_str, day_recs in by_date.items():
            daily_snap = {
                "timestamp":             f"{date_str}T00:00:00",
                "zone_id":               zone_id,
                "fixture_id":            None,
                "water_consumed_liters": round(sum(r["water_consumed_liters"] for r in day_recs), 3),
                "water_wasted_liters":   round(sum(r["water_wasted_liters"] for r in day_recs), 3),
                "energy_kwh":            round(sum(r["energy_kwh"] for r in day_recs), 6),
                "carbon_water_kg":       round(sum(r["carbon_water_kg"] for r in day_recs), 6),
                "carbon_waste_kg":       round(sum(r["carbon_waste_kg"] for r in day_recs), 6),
                "carbon_energy_kg":      round(sum(r["carbon_energy_kg"] for r in day_recs), 6),
                "carbon_total_kg":       round(sum(r["carbon_total_kg"] for r in day_recs), 6),
                "baseline_carbon_kg":    None,
                "carbon_delta_kg":       None,
                "period":                "daily",
                "calculated_at":         now_iso,
            }
            snapshots.append(daily_snap)

    # ── Facility-wide daily rollup ─────────────────────────────────────────────
    by_date_all: Dict[str, List[Dict]] = {}
    for r in hourly_records:
        date_str = r["timestamp"][:10]
        by_date_all.setdefault(date_str, []).append(r)

    for date_str, day_recs in by_date_all.items():
        snapshots.append({
            "timestamp":             f"{date_str}T00:00:00",
            "zone_id":               None,
            "fixture_id":            None,
            "water_consumed_liters": round(sum(r["water_consumed_liters"] for r in day_recs), 3),
            "water_wasted_liters":   round(sum(r["water_wasted_liters"] for r in day_recs), 3),
            "energy_kwh":            round(sum(r["energy_kwh"] for r in day_recs), 6),
            "carbon_water_kg":       round(sum(r["carbon_water_kg"] for r in day_recs), 6),
            "carbon_waste_kg":       round(sum(r["carbon_waste_kg"] for r in day_recs), 6),
            "carbon_energy_kg":      round(sum(r["carbon_energy_kg"] for r in day_recs), 6),
            "carbon_total_kg":       round(sum(r["carbon_total_kg"] for r in day_recs), 6),
            "baseline_carbon_kg":    None,
            "carbon_delta_kg":       None,
            "period":                "daily",
            "calculated_at":         now_iso,
        })

    # Persist
    conn = get_connection(db_path)
    with conn:
        conn.execute("DELETE FROM carbon_snapshots")
    conn.close()
    insert_carbon_snapshots(db_path, snapshots)
    print(f"  [carbon] {len(snapshots)} carbon snapshots written ({len(hourly_records)} hourly + {len(snapshots)-len(hourly_records)} daily).")
    return snapshots


def get_carbon_summary(db_path: str = None) -> Dict[str, Any]:
    """
    Return a facility-level carbon footprint summary.

    Includes:
    - 7-day totals: water carbon, waste carbon, energy carbon, grand total
    - Per-zone breakdown (daily rollup totals)
    - Highest emission zone
    - kWh and water consumption totals
    - Peer benchmark comparison
    - Cost impact (electricity + water)
    """
    if db_path is None:
        db_path = str(DB_PATH)

    # Facility-wide daily snapshots (zone_id IS NULL)
    conn = get_connection(db_path)
    try:
        daily_rows = conn.execute(
            "SELECT * FROM carbon_snapshots WHERE period = 'daily' AND zone_id IS NULL ORDER BY timestamp"
        ).fetchall()
        zone_daily_rows = conn.execute(
            "SELECT * FROM carbon_snapshots WHERE period = 'daily' AND zone_id IS NOT NULL ORDER BY zone_id, timestamp"
        ).fetchall()
    except Exception:
        daily_rows, zone_daily_rows = [], []
    finally:
        conn.close()

    daily = [dict(r) for r in daily_rows]
    zone_daily = [dict(r) for r in zone_daily_rows]

    total_carbon  = round(sum(r["carbon_total_kg"] for r in daily), 4)
    total_water   = round(sum(r["carbon_water_kg"] for r in daily), 4)
    total_waste   = round(sum(r["carbon_waste_kg"] for r in daily), 4)
    total_energy  = round(sum(r["carbon_energy_kg"] for r in daily), 4)
    total_kwh     = round(sum(r["energy_kwh"] for r in daily), 4)
    total_water_l = round(sum(r["water_consumed_liters"] for r in daily), 1)
    wasted_l      = round(sum(r["water_wasted_liters"] for r in daily), 1)

    # Cost impact
    electricity_cost_inr = round(total_kwh * ELECTRICITY_COST_PER_KWH_INR, 2)
    water_cost_inr       = round(total_water_l * WATER_COST_PER_LITER, 2)

    # Peer benchmark: 2.10 kg CO2e/day (from facility_config)
    peer_benchmark_daily = 2.10
    peer_benchmark_7d    = peer_benchmark_daily * 7
    vs_benchmark_kg      = round(total_carbon - peer_benchmark_7d, 4)
    vs_benchmark_pct     = round((vs_benchmark_kg / peer_benchmark_7d) * 100, 1) if peer_benchmark_7d else 0.0

    # Zone breakdown
    zone_totals: Dict[str, Dict] = {}
    for r in zone_daily:
        z = r["zone_id"]
        if z not in zone_totals:
            zone_totals[z] = {
                "zone_id": z,
                "carbon_total_kg": 0.0, "carbon_water_kg": 0.0,
                "carbon_waste_kg": 0.0, "carbon_energy_kg": 0.0,
                "energy_kwh": 0.0, "water_consumed_liters": 0.0,
            }
        zone_totals[z]["carbon_total_kg"]      += r["carbon_total_kg"]
        zone_totals[z]["carbon_water_kg"]      += r["carbon_water_kg"]
        zone_totals[z]["carbon_waste_kg"]      += r["carbon_waste_kg"]
        zone_totals[z]["carbon_energy_kg"]     += r["carbon_energy_kg"]
        zone_totals[z]["energy_kwh"]           += r["energy_kwh"]
        zone_totals[z]["water_consumed_liters"] += r["water_consumed_liters"]

    zone_breakdown = [
        {k: (round(v, 4) if isinstance(v, float) else v) for k, v in z.items()}
        for z in zone_totals.values()
    ]
    zone_breakdown.sort(key=lambda x: x["carbon_total_kg"], reverse=True)

    highest_zone = zone_breakdown[0] if zone_breakdown else None

    return {
        "period_days":              7,
        "carbon_total_kg":          total_carbon,
        "carbon_from_water_kg":     total_water,
        "carbon_from_waste_kg":     total_waste,
        "carbon_from_energy_kg":    total_energy,
        "total_energy_kwh":         total_kwh,
        "total_water_consumed_liters": total_water_l,
        "total_water_wasted_liters":   wasted_l,
        "electricity_cost_inr":     electricity_cost_inr,
        "water_cost_inr":           water_cost_inr,
        "peer_benchmark_7d_kg":     peer_benchmark_7d,
        "vs_benchmark_kg":          vs_benchmark_kg,
        "vs_benchmark_pct":         vs_benchmark_pct,
        "highest_emission_zone":    highest_zone,
        "zone_breakdown":           zone_breakdown,
        "model_notice":             "Carbon factors: water 0.000298 kg CO2e/L (IPCC/BIS India), electricity 0.82 kg CO2e/kWh (CEA 2023).",
    }
