"""
hygiene.py — Hygiene Module engine for KOHLER Smart Facility Manager.

Implements:
1. Cleaning cycle schedule generation (simulate_cleaning_schedule):
   - Produces a 7-day log of cleaning events per zone.
   - 10% of events are randomly marked "missed" for realism.
   - Completed events have realistic before/after hygiene scores.

2. Hourly hygiene score computation (compute_hygiene_scores):
   - Reads sensor_readings for flush counts (load factor).
   - Reads hygiene_events for last completed clean timestamps.
   - Applies exponential decay model:
       score = 100 × exp(-λ × minutes_since_clean) − load_penalty
   - Persists results to hygiene_scores table.

3. Zone hygiene summary (get_zone_hygiene_summary):
   - Returns latest score, status, and trend per zone.
"""

import datetime
import math
from pathlib import Path
from typing import Any, Dict, List, Optional
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd

from src.config import (
    DB_PATH, SIM_START, SIM_DURATION_HOURS,
    HYGIENE_CLEANING_INTERVALS, HYGIENE_DECAY_RATE,
    HYGIENE_LOAD_PENALTY_PER_USE, HYGIENE_MISSED_EVENT_RATE,
    HYGIENE_SCORE_CLEAN, HYGIENE_SCORE_MODERATE, HYGIENE_SCORE_ATTENTION,
)
from src.database import (
    init_db, get_connection,
    insert_hygiene_events, insert_hygiene_scores,
    get_hygiene_events, get_hygiene_scores,
)

ZONES = list(HYGIENE_CLEANING_INTERVALS.keys())

# Staff names for simulated cleaning events (adds realism to the audit log)
CLEANING_STAFF = [
    "Housekeeping Staff A", "Housekeeping Staff B",
    "Housekeeping Staff C", "Automated Cleaning System",
]


def _map_hygiene_status(score: float) -> str:
    """Map a 0–100 hygiene score to a human-readable status label."""
    if score >= HYGIENE_SCORE_CLEAN:
        return "Clean"
    elif score >= HYGIENE_SCORE_MODERATE:
        return "Moderate"
    elif score >= HYGIENE_SCORE_ATTENTION:
        return "Attention Needed"
    else:
        return "Critical"


def simulate_cleaning_schedule(db_path: str = None, seed: int = 42) -> List[dict]:
    """
    Generate a 7-day simulated cleaning event log for all zones.

    Algorithm:
    - For each zone, generate cleaning events every `interval` minutes
      starting from SIM_START + 30 min (first morning clean).
    - Peak hours (06:00–22:00) use the normal interval.
    - Overnight hours (22:00–06:00) use 2× the interval (reduced staffing).
    - 10% of events are randomly flagged as "missed".
    - Completed events get a realistic 15–20 min duration and a score bump.

    Returns list of event dicts ready for insert_hygiene_events().
    """
    rng = np.random.default_rng(seed)
    events: List[dict] = []

    sim_end = SIM_START + datetime.timedelta(hours=SIM_DURATION_HOURS)

    for zone_id in ZONES:
        base_interval = HYGIENE_CLEANING_INTERVALS[zone_id]   # minutes
        current_dt = SIM_START + datetime.timedelta(minutes=30)
        zone_score = 95.0  # starts nearly clean after overnight deep-clean

        while current_dt < sim_end:
            hour = current_dt.hour
            # Overnight: double interval (reduced staffing)
            effective_interval = base_interval if 6 <= hour < 22 else base_interval * 2

            scheduled_at = current_dt.isoformat()
            is_missed = rng.random() < HYGIENE_MISSED_EVENT_RATE

            if is_missed:
                event = {
                    "zone_id":              zone_id,
                    "event_type":           "cleaning_cycle",
                    "scheduled_at":         scheduled_at,
                    "completed_at":         None,
                    "completed_by":         None,
                    "duration_minutes":     None,
                    "status":               "missed",
                    "hygiene_score_before": round(zone_score, 1),
                    "hygiene_score_after":  None,
                    "notes":                "Cleaning cycle missed — staff unavailable.",
                }
                # Score degrades further since no cleaning occurred
                decay = math.exp(-HYGIENE_DECAY_RATE * effective_interval)
                zone_score = max(5.0, zone_score * decay)
            else:
                # Cleaning lag: 0–10 min after scheduled (realistic response time)
                lag_minutes = int(rng.integers(0, 10))
                completed_dt = current_dt + datetime.timedelta(minutes=lag_minutes)
                duration = int(rng.integers(12, 22))  # 12–22 min per clean

                score_before = round(zone_score, 1)
                # After cleaning, score resets to 90–100
                score_after = round(float(rng.uniform(88.0, 100.0)), 1)

                staff = CLEANING_STAFF[int(rng.integers(0, len(CLEANING_STAFF)))]
                event = {
                    "zone_id":              zone_id,
                    "event_type":           "cleaning_cycle",
                    "scheduled_at":         scheduled_at,
                    "completed_at":         completed_dt.isoformat(),
                    "completed_by":         staff,
                    "duration_minutes":     duration,
                    "status":               "completed",
                    "hygiene_score_before": score_before,
                    "hygiene_score_after":  score_after,
                    "notes":                "",
                }
                zone_score = score_after

            events.append(event)
            current_dt += datetime.timedelta(minutes=effective_interval)

    if db_path:
        # Clear existing simulated events before re-seeding
        conn = get_connection(db_path)
        with conn:
            conn.execute("DELETE FROM hygiene_events")
        conn.close()
        insert_hygiene_events(db_path, events)
        print(f"  [hygiene] {len(events)} cleaning events written ({HYGIENE_MISSED_EVENT_RATE*100:.0f}% missed).")

    return events


def compute_hygiene_scores(db_path: str = None) -> List[dict]:
    """
    Compute hourly hygiene scores for each zone across the 7-day simulation window.

    For each zone × hour:
    1. Find the last completed cleaning event prior to this hour.
    2. Compute minutes_since_clean.
    3. Count flush events from sensor_readings in the preceding hour (load factor).
    4. Apply: score = 100 × exp(-λ × minutes_since_clean) - (load × penalty)
    5. Clamp to [0, 100].

    Persists results to hygiene_scores table. Returns list of score dicts.
    """
    if db_path is None:
        db_path = str(DB_PATH)

    # Load cleaning events (completed only)
    all_events = get_hygiene_events(db_path)
    completed = [e for e in all_events if e["status"] == "completed" and e.get("completed_at")]

    # Load sensor readings for flush/occupancy load
    conn = get_connection(db_path)
    try:
        rows = conn.execute(
            "SELECT timestamp, zone_id, fixture_id, occupancy, flush_count_cumulative FROM sensor_readings ORDER BY timestamp"
        ).fetchall()
    finally:
        conn.close()

    readings_df = pd.DataFrame([dict(r) for r in rows])
    if not readings_df.empty:
        readings_df["timestamp"] = pd.to_datetime(readings_df["timestamp"])

    scores: List[dict] = []
    sim_end = SIM_START + datetime.timedelta(hours=SIM_DURATION_HOURS)
    current_hour = SIM_START.replace(minute=0, second=0, microsecond=0)

    while current_hour < sim_end:
        hour_end = current_hour + datetime.timedelta(hours=1)
        hour_iso = current_hour.isoformat()

        for zone_id in ZONES:
            # Last completed clean before current_hour
            zone_completes = sorted(
                [e for e in completed if e["zone_id"] == zone_id and e["completed_at"] < hour_iso],
                key=lambda e: e["completed_at"],
            )

            if zone_completes:
                last_clean_dt = datetime.datetime.fromisoformat(zone_completes[-1]["completed_at"])
                minutes_since_clean = int((current_hour - last_clean_dt).total_seconds() / 60)
            else:
                # No cleaning yet — treat as very long since last clean
                minutes_since_clean = int((current_hour - SIM_START).total_seconds() / 60) + 480

            # Flush/occupancy load in the preceding hour
            flush_count = 0
            if not readings_df.empty:
                hour_readings = readings_df[
                    (readings_df["zone_id"] == zone_id) &
                    (readings_df["timestamp"] >= current_hour) &
                    (readings_df["timestamp"] < hour_end) &
                    (readings_df["occupancy"] == 1)
                ]
                flush_count = len(hour_readings)

            # Exponential decay model
            decay_score = 100.0 * math.exp(-HYGIENE_DECAY_RATE * minutes_since_clean)
            load_penalty = flush_count * HYGIENE_LOAD_PENALTY_PER_USE
            raw_score = max(0.0, min(100.0, decay_score - load_penalty))
            score = round(raw_score, 1)

            # Load factor: normalize flush count to 0–1 scale (cap at 60 events/hr)
            load_factor = round(min(flush_count / 60.0, 1.0), 3)

            scores.append({
                "zone_id":            zone_id,
                "timestamp":          hour_iso,
                "score":              score,
                "load_factor":        load_factor,
                "minutes_since_clean": minutes_since_clean,
                "flush_count_hour":   flush_count,
                "status":             _map_hygiene_status(score),
            })

        current_hour = hour_end

    # Persist
    conn = get_connection(db_path)
    with conn:
        conn.execute("DELETE FROM hygiene_scores")
    conn.close()
    insert_hygiene_scores(db_path, scores)
    print(f"  [hygiene] {len(scores)} hourly hygiene score snapshots written.")
    return scores


def get_zone_hygiene_summary(db_path: str = None) -> List[Dict[str, Any]]:
    """
    Return the latest hygiene score, status, and 24h trend for each zone.

    Trend: "Improving" if latest score > avg of previous 6h; "Worsening" if lower; "Stable" otherwise.
    """
    if db_path is None:
        db_path = str(DB_PATH)

    all_scores = get_hygiene_scores(db_path)
    if not all_scores:
        return []

    df = pd.DataFrame(all_scores)
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    summaries = []
    for zone_id in ZONES:
        zone_df = df[df["zone_id"] == zone_id].sort_values("timestamp")
        if zone_df.empty:
            continue

        latest = zone_df.iloc[-1]
        current_score = float(latest["score"])

        # Trend: compare last score vs average of 6 readings before it
        if len(zone_df) >= 7:
            prev_avg = float(zone_df.iloc[-7:-1]["score"].mean())
            if current_score > prev_avg + 3:
                trend = "Improving"
            elif current_score < prev_avg - 3:
                trend = "Worsening"
            else:
                trend = "Stable"
        else:
            trend = "Stable"

        # Last completed clean
        events = get_hygiene_events(db_path, zone_id=zone_id, status="completed")
        last_clean = events[-1]["completed_at"] if events else None

        # Count missed events in last 24h
        last_24h = (datetime.datetime.fromisoformat(str(latest["timestamp"])) - datetime.timedelta(hours=24)).isoformat()
        all_zone_events = get_hygiene_events(db_path, zone_id=zone_id)
        missed_24h = sum(
            1 for e in all_zone_events
            if e["status"] == "missed" and e["scheduled_at"] >= last_24h
        )

        summaries.append({
            "zone_id":          zone_id,
            "current_score":    current_score,
            "status":           _map_hygiene_status(current_score),
            "trend":            trend,
            "minutes_since_clean": int(latest["minutes_since_clean"]),
            "load_factor":      float(latest["load_factor"]),
            "flush_count_last_hour": int(latest["flush_count_hour"]),
            "last_clean_at":    last_clean,
            "missed_events_24h": missed_24h,
        })

    # Sort by score ascending (worst first)
    summaries.sort(key=lambda x: x["current_score"])
    return summaries
