export interface OverviewMetrics {
  sensor_readings_count: number;
  total_tickets_count: number;
  open_tickets_count: number;
  in_progress_tickets_count: number;
  resolved_tickets_count: number;
  zones_monitored_count: number;
  estimated_water_loss_liters: number;
  estimated_cost_impact_inr: number;
  sim_start: string;
  sim_end: string;
  sim_duration_hours: number;
  zones: { zone_id: string; color: string; name: string }[];
  total_fixtures: number;
}

export interface Reading {
  timestamp_str: string;
  zone_id: string;
  fixture_id?: string;
  flow_rate_lpm: number;
  occupancy?: number;
  sensor_status?: string;
}

export interface TicketEvidence {
  expected_flow_lpm: number;
  observed_flow_lpm: number;
  peak_flow_lpm: number;
  flow_deviation_lpm: number;
  duration_minutes: number;
  occupancy_rate: number;
  occupancy_mismatch: number;
  sensor_health: string;
  sensor_health_score: number;
  normalized_flow_deviation: number;
  normalized_duration: number;
  normalized_occupancy_mismatch: number;
  normalized_sensor_health: number;
  evidence_strength_score: number;
  evidence_strength_label: "Strong" | "Moderate" | "Weak";
  anomaly_type: string;
  severity_score: number;
  severity_label: string;
  estimated_water_loss_liters: number;
}

export interface ProjectionHorizon {
  duration_minutes: number;
  projected_loss_liters: number;
  projected_cost_inr: number;
}

export interface InterventionImpact {
  actual_loss_liters: number;
  potential_unassisted_loss_liters: number;
  estimated_water_saved_liters: number;
  avoided_cost_inr: number;
  counterfactual_horizon_hours: number;
  model_label: string;
}

export interface TicketSustainability {
  type: "active" | "resolved";
  projections?: {
    "1h": ProjectionHorizon;
    "6h": ProjectionHorizon;
    "24h": ProjectionHorizon;
    "7d": ProjectionHorizon;
  };
  intervention_impact?: InterventionImpact;
}

export interface Ticket {
  ticket_id: string;
  timestamp_flagged: string;
  timestamp_flagged_str: string;
  zone_id: string;
  fixture_id: string;
  anomaly_type: string;
  severity_score: number;
  severity_label: string;
  explanation: string;
  estimated_water_loss_liters: number;
  estimated_cost_impact: number;
  status: "open" | "dispatched" | "resolved";
  resolution_note?: string;
  evidence?: TicketEvidence;
  sustainability?: TicketSustainability;
}

export interface ZoneSustainability {
  zone_id: string;
  water_waste_liters: number;
  water_saved_liters: number;
  cost_impact_inr: number;
  avoided_cost_inr: number;
  open_count: number;
  resolved_count: number;
}

export interface SustainabilitySummary {
  water_waste_liters: number;
  water_saved_liters: number;
  cost_impact_inr: number;
  avoided_cost_inr: number;
  projected_unresolved_loss_24h_liters: number;
  projected_unresolved_loss_7d_liters: number;
  highest_waste_fixture?: {
    fixture_id: string;
    zone_id: string;
    water_waste_liters: number;
    cost_impact_inr: number;
    ticket_count: number;
  } | null;
  highest_waste_zone?: {
    zone_id: string;
    water_waste_liters: number;
    cost_impact_inr: number;
    open_count: number;
    resolved_count: number;
  } | null;
  zone_breakdown: ZoneSustainability[];
  model_notice: string;
}

export interface DailyDigest {
  digest: string;
  ticket_count: number;
  created_at: string;
}

export interface OccupancyHeatmapData {
  fixtures: string[];
  hours: number[];
  matrix: number[][];
}

export interface FixtureRiskFactors {
  anomaly_frequency_score: number;
  recurrence_score: number;
  flow_drift_score: number;
  slow_drip_score: number;
  sensor_health_score: number;
  unresolved_score: number;
}

export interface FixtureHealthRecord {
  fixture_id: string;
  zone_id: string;
  fixture_type: string;
  health_score: number;
  risk_score: number;
  status: "Healthy" | "Watch" | "Degrading" | "High Risk";
  trend: "Deteriorating" | "Stable" | "Improving";
  anomaly_count: number;
  slow_drip_count: number;
  sensor_fault_count: number;
  last_incident_at?: string | null;
  calculated_at: string;
  recommendation: string;
  risk_factors: FixtureRiskFactors;
  tickets?: Ticket[];
}

export interface FacilityHealthSummary {
  average_health_score: number;
  healthy_count: number;
  watch_count: number;
  degrading_count: number;
  high_risk_count: number;
  deteriorating_count: number;
  total_fixtures: number;
}

export interface FixtureHealthApiResponse {
  summary: FacilityHealthSummary;
  fixtures: FixtureHealthRecord[];
}

export interface ZoneHygieneSummary {
  zone_id: string;
  current_score: number;
  status: "Clean" | "Moderate" | "Attention Needed" | "Critical";
  trend: "Improving" | "Stable" | "Worsening";
  minutes_since_clean: number;
  load_factor: number;
  flush_count_last_hour: number;
  last_clean_at: string | null;
  missed_events_24h: number;
}

export interface FacilityHygieneSummary {
  average_score: number;
  facility_status: "Clean" | "Moderate" | "Attention Needed" | "Critical";
  clean_zones_count: number;
  attention_zones_count: number;
  critical_zones_count: number;
  total_missed_events_24h: number;
  zones: ZoneHygieneSummary[];
}

export interface HygieneEvent {
  id: number;
  zone_id: string;
  event_type: string;
  scheduled_at: string;
  completed_at: string | null;
  completed_by: string | null;
  duration_minutes: number | null;
  status: "completed" | "missed" | "scheduled";
  hygiene_score_before: number | null;
  hygiene_score_after: number | null;
  notes: string;
  created_at: string;
}

export interface ZoneCarbonBreakdown {
  zone_id: string;
  carbon_total_kg: number;
  carbon_water_kg: number;
  carbon_waste_kg: number;
  carbon_energy_kg: number;
  energy_kwh: number;
  water_consumed_liters: number;
}

export interface CarbonSummary {
  period_days: number;
  carbon_total_kg: number;
  carbon_from_water_kg: number;
  carbon_from_waste_kg: number;
  carbon_from_energy_kg: number;
  total_energy_kwh: number;
  total_water_consumed_liters: number;
  total_water_wasted_liters: number;
  electricity_cost_inr: number;
  water_cost_inr: number;
  peer_benchmark_7d_kg: number;
  vs_benchmark_kg: number;
  vs_benchmark_pct: number;
  highest_emission_zone: ZoneCarbonBreakdown | null;
  zone_breakdown: ZoneCarbonBreakdown[];
  model_notice: string;
}

export interface CarbonSnapshot {
  id?: number;
  timestamp: string;
  zone_id: string | null;
  fixture_id?: string | null;
  water_consumed_liters: number;
  water_wasted_liters: number;
  energy_kwh: number;
  carbon_water_kg: number;
  carbon_waste_kg: number;
  carbon_energy_kg: number;
  carbon_total_kg: number;
  baseline_carbon_kg?: number | null;
  carbon_delta_kg?: number | null;
  period: "hourly" | "daily";
  calculated_at?: string;
}

export interface SensorLatestReading {
  flow_rate_lpm: number;
  occupancy: number;
  occupancy_label: string;
  flush_count_cumulative: number;
  timestamp: string;
}

export interface SensorRecord {
  fixture_id: string;
  display_name: string;
  zone_id: string;
  fixture_type: "sink" | "toilet" | "urinal";
  brand_model: string;
  sensor_type: "infrared" | "ultrasonic" | "passive_infrared";
  sensor_tech_label: string;
  parameter_measured: string;
  parameter_units: string;
  nominal_flow_lpm: number;
  latest_reading: SensorLatestReading;
  status: "OK" | "DEGRADED" | "FAULT" | "OFFLINE";
  uptime_pct: number;
  fault_samples: number;
  install_date?: string;
  last_maintenance_date?: string;
}

export interface SensorFleetSummary {
  total_sensors: number;
  online_count: number;
  degraded_count: number;
  fault_count: number;
  offline_count: number;
  average_uptime_pct: number;
  last_telemetry_timestamp: string;
}

export interface SensorIntelligenceApiResponse {
  summary: SensorFleetSummary;
  sensors: SensorRecord[];
}


