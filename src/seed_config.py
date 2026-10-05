"""
seed_config.py — One-time seeder for static configuration tables.

Populates:
  - facility_config   (key-value constants for the facility)
  - zone_config       (per-zone metadata)
  - fixture_config    (per-fixture specs including power draw)

All inserts use INSERT OR REPLACE so this script is safe to run multiple times.
Usage:
    python src/seed_config.py
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import (
    DB_PATH, FIXTURES, FIXTURE_POWER_SPECS, EVENT_PARAMS,
    WATER_COST_PER_LITER, ELECTRICITY_COST_PER_KWH_INR,
    CARBON_FACTOR_WATER_KG_PER_LITER, CARBON_FACTOR_ELECTRICITY_KG_PER_KWH,
    HYGIENE_CLEANING_INTERVALS,
)
from src.database import (
    init_db, upsert_facility_config, upsert_zone_config, upsert_fixture_config,
)


# ── 1. facility_config ─────────────────────────────────────────────────────────

FACILITY_CONFIG_ENTRIES = [
    ("facility_name",               "Terminal 2 Restroom Block, International Airport", "string",
     "Display name of the monitored facility"),
    ("facility_location",           "Mumbai, India",                                     "string",
     "City and country of the facility"),
    ("timezone",                    "Asia/Kolkata",                                      "string",
     "IANA timezone for timestamp localisation"),
    ("water_cost_per_liter_inr",    str(WATER_COST_PER_LITER),                          "float",
     "Municipal water tariff: Rs. per litre (BWSSB/MCGM commercial slab midpoint)"),
    ("electricity_cost_per_kwh_inr", str(ELECTRICITY_COST_PER_KWH_INR),                 "float",
     "Commercial electricity tariff: Rs. per kWh (MSEDCL/BESCOM slab midpoint)"),
    ("carbon_factor_water",         str(CARBON_FACTOR_WATER_KG_PER_LITER),             "float",
     "kg CO2e per litre of municipal water (IPCC / BIS standard, India)"),
    ("carbon_factor_electricity",   str(CARBON_FACTOR_ELECTRICITY_KG_PER_KWH),         "float",
     "kg CO2e per kWh of grid electricity (CEA 2023 national average, India)"),
    ("hygiene_interval_restroom_a", str(HYGIENE_CLEANING_INTERVALS["T2_Restroom_A"]),   "float",
     "Target cleaning cycle interval in minutes for T2_Restroom_A"),
    ("hygiene_interval_restroom_b", str(HYGIENE_CLEANING_INTERVALS["T2_Restroom_B"]),   "float",
     "Target cleaning cycle interval in minutes for T2_Restroom_B"),
    ("hygiene_interval_family_room", str(HYGIENE_CLEANING_INTERVALS["T2_Family_Room"]), "float",
     "Target cleaning cycle interval in minutes for T2_Family_Room"),
    ("hygiene_interval_staff_wc",   str(HYGIENE_CLEANING_INTERVALS["T2_Staff_WC"]),    "float",
     "Target cleaning cycle interval in minutes for T2_Staff_WC"),
    ("peer_carbon_benchmark_kg_per_day", "2.10",                                        "float",
     "Industry peer-group carbon benchmark for comparable airport restroom blocks (kg CO2e/day)"),
    ("sim_start",                   "2024-01-15T00:00:00",                              "string",
     "Simulation start datetime (ISO-8601)"),
    ("sim_duration_hours",          "168",                                              "float",
     "Simulation duration in hours (7 days)"),
]


# ── 2. zone_config ─────────────────────────────────────────────────────────────

ZONE_CONFIG_ROWS = [
    {
        "zone_id":          "T2_Restroom_A",
        "display_name":     "Restroom A — Departure Side",
        "floor":            "Ground Floor",
        "capacity_persons": 12,
        "fixture_count":    8,
        "traffic_tier":     "High",
        "color_hex":        "#6B8CAE",
        "description":      "Busiest restroom block serving the departure gate corridor. Peak traffic during morning and evening flight banks.",
    },
    {
        "zone_id":          "T2_Restroom_B",
        "display_name":     "Restroom B — Arrival Side",
        "floor":            "Ground Floor",
        "capacity_persons": 8,
        "fixture_count":    5,
        "traffic_tier":     "Medium",
        "color_hex":        "#789A8B",
        "description":      "Arrival-side restroom serving disembarking passengers. Moderate but less predictable traffic patterns.",
    },
    {
        "zone_id":          "T2_Family_Room",
        "display_name":     "Family & Accessible Restroom",
        "floor":            "Ground Floor",
        "capacity_persons": 4,
        "fixture_count":    2,
        "traffic_tier":     "Low",
        "color_hex":        "#B08D57",
        "description":      "Dedicated accessible and family restroom. Low throughput, extended occupancy durations.",
    },
    {
        "zone_id":          "T2_Staff_WC",
        "display_name":     "Staff WC — Restricted Access",
        "floor":            "Ground Floor",
        "capacity_persons": 2,
        "fixture_count":    2,
        "traffic_tier":     "Staff-Only",
        "color_hex":        "#847E9C",
        "description":      "Restricted staff-only washroom. Very low usage; monitored for overnight anomaly detection.",
    },
]


# ── 3. fixture_config ──────────────────────────────────────────────────────────

# KOHLER model names per fixture type (representative commercial range)
BRAND_MODELS = {
    "sink":    "KOHLER K-7505-K Touchless Faucet (0.5 GPM)",
    "toilet":  "KOHLER K-4960 Flushometer (1.28 GPF dual-flush)",
    "urinal":  "KOHLER K-4970 Touchless Flushometer (0.5 GPF)",
}

# Nominal flow rates (LPM) from EVENT_PARAMS midpoints
NOMINAL_FLOW = {
    "sink":   round((EVENT_PARAMS["sink"]["volume_L"]["min"] + EVENT_PARAMS["sink"]["volume_L"]["max"]) / 2 /
                    ((EVENT_PARAMS["sink"]["duration_sec"]["min"] + EVENT_PARAMS["sink"]["duration_sec"]["max"]) / 2 / 60), 2),
    "toilet": round((EVENT_PARAMS["toilet"]["volume_L"]["min"] + EVENT_PARAMS["toilet"]["volume_L"]["max"]) / 2 /
                    ((EVENT_PARAMS["toilet"]["duration_sec"]["min"] + EVENT_PARAMS["toilet"]["duration_sec"]["max"]) / 2 / 60), 2),
    "urinal": round((EVENT_PARAMS["urinal"]["volume_L"]["min"] + EVENT_PARAMS["urinal"]["volume_L"]["max"]) / 2 /
                    ((EVENT_PARAMS["urinal"]["duration_sec"]["min"] + EVENT_PARAMS["urinal"]["duration_sec"]["max"]) / 2 / 60), 2),
}

# Staggered install dates across 2021–2022 (realistic multi-phase refurb)
INSTALL_DATES = {
    "T2_Restroom_A":  "2021-06-01",
    "T2_Restroom_B":  "2021-09-15",
    "T2_Family_Room": "2022-01-10",
    "T2_Staff_WC":    "2022-03-20",
}

# Last maintenance: staggered across 2023-11 to 2024-01
LAST_MAINTENANCE_DATES = {
    "Sink_01": "2023-12-10", "Sink_02": "2023-12-10", "Sink_03": "2023-11-28",
    "Toilet_A1": "2023-12-01", "Toilet_A2": "2023-11-15", "Toilet_A3": "2023-12-01",
    "Urinal_A1": "2023-12-10", "Urinal_A2": "2023-12-10",
    "Sink_04": "2024-01-02", "Sink_05": "2024-01-02",
    "Toilet_B1": "2023-11-20", "Toilet_B2": "2024-01-02", "Urinal_B1": "2024-01-02",
    "Sink_06": "2024-01-05", "Toilet_F1": "2024-01-05",
    "Sink_07": "2023-12-20", "Toilet_S1": "2023-12-20",
}

# Human-readable display names
DISPLAY_NAMES = {
    "Sink_01": "Sink 01",    "Sink_02": "Sink 02",    "Sink_03": "Sink 03",
    "Toilet_A1": "Toilet A1", "Toilet_A2": "Toilet A2", "Toilet_A3": "Toilet A3",
    "Urinal_A1": "Urinal A1", "Urinal_A2": "Urinal A2",
    "Sink_04": "Sink 04",    "Sink_05": "Sink 05",
    "Toilet_B1": "Toilet B1", "Toilet_B2": "Toilet B2", "Urinal_B1": "Urinal B1",
    "Sink_06": "Sink 06",    "Toilet_F1": "Toilet F1",
    "Sink_07": "Sink 07",    "Toilet_S1": "Toilet S1",
}


def build_fixture_config_rows() -> list[dict]:
    rows = []
    for zone_id, fixture_id, fixture_type in FIXTURES:
        power = FIXTURE_POWER_SPECS[fixture_type]
        rows.append({
            "fixture_id":            fixture_id,
            "zone_id":               zone_id,
            "fixture_type":          fixture_type,
            "display_name":          DISPLAY_NAMES.get(fixture_id, fixture_id),
            "brand_model":           BRAND_MODELS[fixture_type],
            "install_date":          INSTALL_DATES[zone_id],
            "last_maintenance_date": LAST_MAINTENANCE_DATES.get(fixture_id),
            "nominal_flow_lpm":      NOMINAL_FLOW[fixture_type],
            "power_draw_active_w":   power["active_w"],
            "power_draw_idle_w":     power["idle_w"],
            "sensor_type":           power["sensor_type"],
            "is_smart":              1,
            "notes":                 "",
        })
    return rows


# ── Entry point ────────────────────────────────────────────────────────────────

def run_seed(db_path: str = None) -> None:
    if db_path is None:
        db_path = str(DB_PATH)

    print("=" * 60)
    print("KOHLER Facility Manager — Config Seeder")
    print("=" * 60)

    init_db(db_path)

    # facility_config
    print("\nSeeding facility_config ...")
    for key, value, cfg_type, description in FACILITY_CONFIG_ENTRIES:
        upsert_facility_config(db_path, key, value, cfg_type, description)
    print(f"  [OK] {len(FACILITY_CONFIG_ENTRIES)} config keys written.")

    # zone_config
    print("\nSeeding zone_config ...")
    for row in ZONE_CONFIG_ROWS:
        upsert_zone_config(db_path, row)
    print(f"  [OK] {len(ZONE_CONFIG_ROWS)} zone rows written.")

    # fixture_config
    fixture_rows = build_fixture_config_rows()
    print("\nSeeding fixture_config ...")
    for row in fixture_rows:
        upsert_fixture_config(db_path, row)
    print(f"  [OK] {len(fixture_rows)} fixture rows written.")

    print("\n[DONE] Config tables seeded successfully.")


if __name__ == "__main__":
    run_seed()
