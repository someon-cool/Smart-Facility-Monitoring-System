"""
recommendations.py — Sustainability Recommendations engine for Smart Facility Manager.

Generates prioritized, actionable recommendations from live DB data:
- Water conservation (leak & drip resolution impact)
- Carbon reduction (emission hotspots)
- Hygiene compliance (missed cleaning cycles)
- Maintenance urgency (fixture risk scores)
- Energy efficiency (idle energy waste)

Each recommendation has quantified potential savings (₹, litres, kg CO2e).
Recommendations are persisted to sustainability_recommendations table.
"""

import datetime
from pathlib import Path
from typing import Any, Dict, List
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import (
    DB_PATH,
    WATER_COST_PER_LITER,
    ELECTRICITY_COST_PER_KWH_INR,
    CARBON_FACTOR_WATER_KG_PER_LITER,
    CARBON_FACTOR_ELECTRICITY_KG_PER_KWH,
)
from src.database import (
    init_db, get_tickets_df, get_fixture_health_records,
    get_hygiene_events, get_carbon_snapshots,
    upsert_sustainability_recommendations,
)


def _rec_id(category: str, idx: int) -> str:
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    return f"REC-{category.upper()[:3]}-{date_str}-{idx:03d}"


def generate_recommendations(db_path: str = None) -> List[Dict[str, Any]]:
    """
    Generate all sustainability recommendations from current DB state.

    Recommendation categories:
      water       — Active leaks & drips with quantified savings potential
      carbon      — Zone emission hotspots vs peer benchmark
      hygiene     — Zones with missed cleaning cycles or critical scores
      maintenance — Fixtures with deteriorating health / high risk scores
      energy      — Estimated idle energy waste across zones

    Returns list of recommendation dicts and persists to DB.
    """
    if db_path is None:
        db_path = str(DB_PATH)

    init_db(db_path)
    now_iso = datetime.datetime.now().isoformat()
    recs: List[Dict[str, Any]] = []
    idx = 1

    # ── Water Recommendations ─────────────────────────────────────────────────
    tickets_df = get_tickets_df(db_path)
    if not tickets_df.empty:
        open_tickets = tickets_df[tickets_df["status"].isin(["open", "dispatched"])].copy()
        open_tickets["estimated_water_loss_liters"] = open_tickets["estimated_water_loss_liters"].fillna(0.0)

        # Group by fixture to find worst offenders
        by_fixture = (
            open_tickets.groupby(["fixture_id", "zone_id"])
            .agg(
                total_loss=("estimated_water_loss_liters", "sum"),
                ticket_count=("ticket_id", "count"),
                max_severity=("severity_score", "max"),
                anomaly_types=("anomaly_type", lambda x: list(x.unique())),
                ticket_id=("ticket_id", "first"),
            )
            .reset_index()
            .sort_values("total_loss", ascending=False)
        )

        for _, row in by_fixture.iterrows():
            if float(row["total_loss"]) < 5.0:
                continue   # Skip trivially small losses

            fix_id  = str(row["fixture_id"])
            zone_id = str(row["zone_id"])
            loss_l  = round(float(row["total_loss"]), 1)
            cost_rs = round(loss_l * WATER_COST_PER_LITER, 2)
            carbon_kg = round(loss_l * CARBON_FACTOR_WATER_KG_PER_LITER, 4)
            ticket_count = int(row["ticket_count"])
            types   = row["anomaly_types"]

            # Priority based on severity score
            max_sev = float(row.get("max_severity") or 0.0)
            if max_sev >= 63:
                priority = "Critical"
            elif max_sev >= 51:
                priority = "High"
            else:
                priority = "Medium"

            atype_label = " & ".join(str(t).replace("_", " ") for t in types)
            title = f"{fix_id}: Resolve {atype_label} — {loss_l:.0f}L loss detected"
            description = (
                f"{fix_id} in {zone_id} has {ticket_count} active anomaly ticket(s) "
                f"({atype_label}) with a cumulative water loss of {loss_l:.1f} L "
                f"(₹{cost_rs:.2f} utility cost). "
                f"Immediate valve inspection and repair could eliminate this waste and "
                f"avoid {carbon_kg:.4f} kg CO₂e in unnecessary water treatment emissions."
            )

            recs.append({
                "recommendation_id":        _rec_id("water", idx),
                "category":                 "water",
                "priority":                 priority,
                "title":                    title,
                "description":              description,
                "metric_current":           loss_l,
                "metric_unit":              "Liters",
                "metric_target":            0.0,
                "potential_saving_inr":     cost_rs,
                "potential_saving_liters":  loss_l,
                "potential_saving_carbon_kg": carbon_kg,
                "related_fixture_id":       fix_id,
                "related_zone_id":          zone_id,
                "related_ticket_id":        str(row.get("ticket_id", "")),
                "source":                   "rule",
                "generated_at":             now_iso,
            })
            idx += 1

    # ── Carbon Recommendations ────────────────────────────────────────────────
    zone_daily = get_carbon_snapshots(db_path, period="daily")
    if zone_daily:
        # Group by zone, sum 7-day totals
        zone_totals: Dict[str, float] = {}
        for r in zone_daily:
            if not r.get("zone_id"):
                continue
            z = r["zone_id"]
            zone_totals[z] = zone_totals.get(z, 0.0) + float(r.get("carbon_total_kg", 0.0))

        peer_benchmark_7d = 2.10 * 7  # kg CO2e total across facility
        facility_total = sum(zone_totals.values())
        if facility_total > peer_benchmark_7d * 1.1:
            excess_kg = round(facility_total - peer_benchmark_7d, 4)
            excess_pct = round((excess_kg / peer_benchmark_7d) * 100, 1)
            recs.append({
                "recommendation_id":        _rec_id("carbon", idx),
                "category":                 "carbon",
                "priority":                 "High" if excess_pct > 15 else "Medium",
                "title":                    f"Facility carbon footprint {excess_pct:.0f}% above peer benchmark",
                "description":              (
                    f"Total 7-day carbon footprint is {facility_total:.3f} kg CO₂e — "
                    f"{excess_kg:.3f} kg ({excess_pct:.0f}%) above the comparable airport restroom "
                    f"peer benchmark of {peer_benchmark_7d:.1f} kg CO₂e. "
                    f"Primary drivers: unresolved water leaks (waste carbon) and peak-hour energy draw. "
                    f"Resolving active anomaly tickets is the highest-leverage action."
                ),
                "metric_current":           round(facility_total, 4),
                "metric_unit":              "kg CO2e",
                "metric_target":            peer_benchmark_7d,
                "potential_saving_inr":     None,
                "potential_saving_liters":  None,
                "potential_saving_carbon_kg": round(excess_kg, 4),
                "related_fixture_id":       None,
                "related_zone_id":          None,
                "related_ticket_id":        None,
                "source":                   "rule",
                "generated_at":             now_iso,
            })
            idx += 1

        # Worst zone
        if zone_totals:
            worst_zone = max(zone_totals, key=zone_totals.get)
            worst_kg = round(zone_totals[worst_zone], 4)
            zone_share_pct = round((worst_kg / facility_total * 100), 1) if facility_total > 0 else 0.0
            recs.append({
                "recommendation_id":        _rec_id("carbon", idx),
                "category":                 "carbon",
                "priority":                 "Medium",
                "title":                    f"{worst_zone}: highest-emission zone ({zone_share_pct:.0f}% of facility)",
                "description":              (
                    f"{worst_zone} accounts for {worst_kg:.4f} kg CO₂e ({zone_share_pct:.0f}% of facility total) "
                    f"over the 7-day window. Focus leak resolution and energy-saving efforts here first "
                    f"for the greatest carbon reduction impact."
                ),
                "metric_current":           worst_kg,
                "metric_unit":              "kg CO2e",
                "metric_target":            round(peer_benchmark_7d / len(zone_totals), 4),
                "potential_saving_inr":     None,
                "potential_saving_liters":  None,
                "potential_saving_carbon_kg": None,
                "related_fixture_id":       None,
                "related_zone_id":          worst_zone,
                "related_ticket_id":        None,
                "source":                   "rule",
                "generated_at":             now_iso,
            })
            idx += 1

    # ── Hygiene Recommendations ───────────────────────────────────────────────
    from src.hygiene import get_zone_hygiene_summary
    hygiene_summaries = get_zone_hygiene_summary(db_path)
    for h in hygiene_summaries:
        score = float(h["current_score"])
        missed = int(h.get("missed_events_24h", 0))
        zone_id = h["zone_id"]

        if score < 40 or missed >= 2:
            priority = "Critical" if score < 40 else "High"
            title = (
                f"{zone_id}: Hygiene score critical ({score:.0f}/100)" if score < 40
                else f"{zone_id}: {missed} missed cleaning cycles in last 24h"
            )
            description = (
                f"{zone_id} hygiene score is {score:.1f}/100 (status: {h['status']}). "
                f"{missed} cleaning cycles were missed in the past 24 hours. "
                f"Immediate cleaning dispatch required to restore compliance with "
                f"airport hygiene standards."
            )
            recs.append({
                "recommendation_id":        _rec_id("hygiene", idx),
                "category":                 "hygiene",
                "priority":                 priority,
                "title":                    title,
                "description":              description,
                "metric_current":           score,
                "metric_unit":              "Hygiene Score (0-100)",
                "metric_target":            80.0,
                "potential_saving_inr":     None,
                "potential_saving_liters":  None,
                "potential_saving_carbon_kg": None,
                "related_fixture_id":       None,
                "related_zone_id":          zone_id,
                "related_ticket_id":        None,
                "source":                   "rule",
                "generated_at":             now_iso,
            })
            idx += 1

    # ── Maintenance Recommendations ───────────────────────────────────────────
    health_records = get_fixture_health_records(db_path)
    for r in health_records:
        hs = float(r.get("health_score", 100.0))
        trend = str(r.get("trend", "Stable"))
        fix_id = str(r.get("fixture_id", ""))
        zone_id = str(r.get("zone_id", ""))
        risk_score = float(r.get("risk_score", 0.0))

        if hs < 40 or (hs < 60 and trend == "Deteriorating"):
            priority = "Critical" if hs < 40 else "High"
            recs.append({
                "recommendation_id":        _rec_id("maintenance", idx),
                "category":                 "maintenance",
                "priority":                 priority,
                "title":                    f"{fix_id}: Health score {hs:.0f}/100 — {trend} trend",
                "description":              (
                    f"{fix_id} in {zone_id} has a health score of {hs:.0f}/100 (risk: {risk_score:.0f}/100) "
                    f"with a {trend} trend. "
                    f"{str(r.get('recommendation', 'Schedule preventive inspection.'))} "
                    f"Delaying action risks escalation to a full fixture failure."
                ),
                "metric_current":           hs,
                "metric_unit":              "Health Score (0-100)",
                "metric_target":            80.0,
                "potential_saving_inr":     None,
                "potential_saving_liters":  None,
                "potential_saving_carbon_kg": None,
                "related_fixture_id":       fix_id,
                "related_zone_id":          zone_id,
                "related_ticket_id":        None,
                "source":                   "rule",
                "generated_at":             now_iso,
            })
            idx += 1

    # ── Energy Efficiency Recommendation ─────────────────────────────────────
    conn_check = None
    try:
        from src.database import get_connection
        conn_check = get_connection(db_path)
        total_kwh_row = conn_check.execute(
            "SELECT SUM(energy_kwh) FROM energy_readings WHERE power_state = 'idle'"
        ).fetchone()
        idle_kwh = float(total_kwh_row[0] or 0.0)
    except Exception:
        idle_kwh = 0.0
    finally:
        if conn_check:
            conn_check.close()

    if idle_kwh > 0.01:
        idle_cost = round(idle_kwh * ELECTRICITY_COST_PER_KWH_INR, 2)
        idle_carbon = round(idle_kwh * CARBON_FACTOR_ELECTRICITY_KG_PER_KWH, 4)
        # Assume 20% idle energy could be eliminated with smart scheduling
        saving_kwh = round(idle_kwh * 0.20, 4)
        saving_cost = round(saving_kwh * ELECTRICITY_COST_PER_KWH_INR, 2)
        saving_carbon = round(saving_kwh * CARBON_FACTOR_ELECTRICITY_KG_PER_KWH, 4)

        recs.append({
            "recommendation_id":        _rec_id("energy", idx),
            "category":                 "energy",
            "priority":                 "Low",
            "title":                    f"Idle sensor energy: {idle_kwh:.3f} kWh over 7 days (₹{idle_cost:.2f})",
            "description":              (
                f"Across all 17 fixtures, standby/idle sensor draw totalled {idle_kwh:.3f} kWh over the "
                f"monitoring window (₹{idle_cost:.2f}, {idle_carbon:.4f} kg CO₂e). "
                f"Implementing scheduled sensor sleep-mode during verified low-occupancy windows "
                f"(00:00–05:00) could eliminate up to 20% of idle draw, saving ~{saving_cost:.2f} ₹ "
                f"and {saving_carbon:.4f} kg CO₂e per 7-day period."
            ),
            "metric_current":           round(idle_kwh, 4),
            "metric_unit":              "kWh (idle)",
            "metric_target":            round(idle_kwh * 0.80, 4),
            "potential_saving_inr":     saving_cost,
            "potential_saving_liters":  None,
            "potential_saving_carbon_kg": saving_carbon,
            "related_fixture_id":       None,
            "related_zone_id":          None,
            "related_ticket_id":        None,
            "source":                   "rule",
            "generated_at":             now_iso,
        })
        idx += 1

    # Persist
    upsert_sustainability_recommendations(db_path, recs)
    print(f"  [recommendations] {len(recs)} recommendations generated and persisted.")
    return recs
