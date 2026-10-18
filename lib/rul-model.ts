// Frontend-only simulated Remaining Useful Life (RUL) estimation model.
// This is an illustrative estimation for demonstration only. It is NOT a
// trained AI/ML model and makes no claim to real predictive accuracy.
// All calculations are deterministic and machine-specific.

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RulForecastPoint = {
  day: number; // days from reference time
  healthScore: number; // 0-100
  timestamp: string; // ISO string
};

export type RulEstimate = {
  machineId: string;
  currentHealth: number; // 0-100
  rulHours: number; // estimated remaining useful life in operating hours
  rulDays: number;
  forecastHorizonDays: number;
  maintenanceWindow: string; // ISO string; estimated maintenance need date
  riskLevel: RiskLevel;
  degradationRatePerDay: number; // health points lost per simulated day
  forecast: RulForecastPoint[];
  threshold: number; // health score below which maintenance is needed
  simulated: true; // always true; illustrative estimate only
};

// Fixed reference time aligned with the mock-data MOCK_NOW (SSR-safe).
const REFERENCE_TIME = "2026-10-17T12:00:00Z";
const REFERENCE_MS = new Date(REFERENCE_TIME).getTime();

// Simulation constants (illustrative only).
const HEALTH_THRESHOLD = 30; // below this score, maintenance is needed
const HOURS_PER_DAY = 24;
const FORECAST_HORIZON_DAYS = 30;
const FORECAST_STEP_DAYS = 2;

// Deterministic PRNG seeded purely by machineId string. No Math.random(),
// no Date.now(). Same machineId always yields the same sequence.
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromMachineId(machineId: string): number {
  let hash = 0;
  for (let i = 0; i < machineId.length; i++) {
    hash = ((hash << 5) - hash + machineId.charCodeAt(i)) | 0;
  }
  return hash;
}

export interface RulModelInput {
  machineId: string;
  currentHealth: number; // 0-100
}

export function estimateRul(input: RulModelInput): RulEstimate {
  const { machineId, currentHealth } = input;
  const rng = mulberry32(seedFromMachineId(machineId));

  // Deterministic degradation rate: 0.5 to 4.0 health points per simulated day.
  const degradationRatePerDay = 0.5 + rng() * 3.5;
  const threshold = HEALTH_THRESHOLD;

  let rulDays = 0;
  if (currentHealth > threshold) {
    rulDays = (currentHealth - threshold) / degradationRatePerDay;
  }
  rulDays = Math.max(0, rulDays);
  const rulHours = rulDays * HOURS_PER_DAY;

  const forecast: RulForecastPoint[] = [];
  for (
    let day = 0;
    day <= FORECAST_HORIZON_DAYS;
    day += FORECAST_STEP_DAYS
  ) {
    let health = currentHealth - degradationRatePerDay * day;
    health = Math.max(0, Math.min(100, Math.round(health * 10) / 10));
    const timestamp = new Date(
      REFERENCE_MS + day * 24 * 60 * 60 * 1000,
    ).toISOString();
    forecast.push({ day, healthScore: health, timestamp });
  }

  const maintenanceWindow = new Date(
    REFERENCE_MS + rulDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const riskLevel = categorizeRisk(currentHealth, rulDays);

  return {
    machineId,
    currentHealth: Math.round(currentHealth * 10) / 10,
    rulHours: Math.round(rulHours * 10) / 10,
    rulDays: Math.round(rulDays * 10) / 10,
    forecastHorizonDays: FORECAST_HORIZON_DAYS,
    maintenanceWindow,
    riskLevel,
    degradationRatePerDay: Math.round(degradationRatePerDay * 100) / 100,
    forecast,
    threshold,
    simulated: true,
  };
}

export function categorizeRisk(
  currentHealth: number,
  rulDays: number,
): RiskLevel {
  if (currentHealth <= 30 || rulDays <= 7) return "critical";
  if (currentHealth <= 50 || rulDays <= 14) return "high";
  if (currentHealth <= 70 || rulDays <= 30) return "medium";
  return "low";
}

export type RiskTone = "neutral" | "cyan" | "green" | "amber" | "red";

export function riskTone(riskLevel: RiskLevel): RiskTone {
  switch (riskLevel) {
    case "critical":
      return "red";
    case "high":
      return "amber";
    case "medium":
      return "amber";
    case "low":
      return "green";
    default:
      return "neutral";
  }
}

export function riskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Unknown";
  }
}
