import assert from "node:assert/strict";
import test from "node:test";
import {
  estimateRul,
  categorizeRisk,
  riskTone,
  riskLabel,
  type RulEstimate,
  type RiskLevel,
} from "./rul-model.ts";

const REFERENCE_MS = new Date("2026-10-17T12:00:00Z").getTime();

function toDays(iso: string): number {
  return (new Date(iso).getTime() - REFERENCE_MS) / (24 * 60 * 60 * 1000);
}

test("estimateRul returns deterministic results for the same machine", () => {
  const a = estimateRul({ machineId: "M-001", currentHealth: 92 });
  const b = estimateRul({ machineId: "M-001", currentHealth: 92 });
  assert.deepEqual(a, b);
  assert.equal(a.simulated, true);
});

test("different machines receive different machine-specific results", () => {
  const results = ["M-001", "M-002", "M-005"].map((id) =>
    estimateRul({ machineId: id, currentHealth: 80 }),
  );
  const rulDays = results.map((r) => r.rulDays);
  assert.ok(
    rulDays[0] !== rulDays[1] || rulDays[1] !== rulDays[2],
    "machines should differ",
  );
  results.forEach((r) => {
    assert.equal(r.machineId, r.machineId);
    assert.ok(r.rulHours >= 0);
    assert.ok(r.rulDays >= 0);
    assert.ok(r.forecast.length > 0);
  });
});

test("lower current health reduces RUL and raises risk", () => {
  const healthy = estimateRul({ machineId: "M-001", currentHealth: 92 });
  const degraded = estimateRul({ machineId: "M-001", currentHealth: 35 });
  assert.ok(degraded.rulDays < healthy.rulDays);
  const riskOrder: Record<RiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  assert.ok(riskOrder[degraded.riskLevel] >= riskOrder[healthy.riskLevel]);
});

test("health at or below threshold yields critical risk and near-zero RUL", () => {
  const atThreshold = estimateRul({ machineId: "M-001", currentHealth: 30 });
  assert.equal(atThreshold.rulDays, 0);
  assert.equal(atThreshold.riskLevel, "critical");

  const belowThreshold = estimateRul({ machineId: "M-001", currentHealth: 10 });
  assert.equal(belowThreshold.rulDays, 0);
  assert.equal(belowThreshold.riskLevel, "critical");
});

test("risk categorization boundaries", () => {
  const cases: Array<{ health: number; rulDays: number; expected: RiskLevel }> = [
    { health: 95, rulDays: 60, expected: "low" },
    { health: 65, rulDays: 40, expected: "medium" },
    { health: 45, rulDays: 20, expected: "high" },
    { health: 25, rulDays: 100, expected: "critical" },
    { health: 90, rulDays: 5, expected: "critical" },
  ];
  for (const { health, rulDays, expected } of cases) {
    assert.equal(categorizeRisk(health, rulDays), expected);
  }
});

test("risk tone and label mappings", () => {
  assert.equal(riskTone("critical"), "red");
  assert.equal(riskTone("high"), "amber");
  assert.equal(riskTone("medium"), "amber");
  assert.equal(riskTone("low"), "green");
  assert.equal(riskLabel("critical"), "Critical");
  assert.equal(riskLabel("low"), "Low");
});

test("forecast stays within 0-100 and ends at or below current health", () => {
  const estimate = estimateRul({ machineId: "M-004", currentHealth: 58 });
  let previous = 100;
  for (const point of estimate.forecast) {
    assert.ok(point.healthScore >= 0 && point.healthScore <= 100);
    assert.ok(point.healthScore <= previous + 0.01);
    previous = point.healthScore;
    assert.equal(point.day % 2, 0);
  }
  assert.equal(estimate.forecast[0].day, 0);
  assert.equal(estimate.forecast[0].healthScore, estimate.currentHealth);
  assert.equal(estimate.forecastHorizonDays, 30);
});

test("maintenance window is in the future relative to reference time", () => {
  const estimate = estimateRul({ machineId: "M-005", currentHealth: 34 });
  const offsetDays = toDays(estimate.maintenanceWindow);
  assert.ok(offsetDays >= 0);
  assert.ok(offsetDays <= estimate.forecastHorizonDays + 1);
});

test("estimate shape matches RulEstimate type", () => {
  const estimate: RulEstimate = estimateRul({
    machineId: "M-003",
    currentHealth: 76,
  });
  assert.equal(typeof estimate.machineId, "string");
  assert.ok(Number.isFinite(estimate.currentHealth));
  assert.ok(Number.isFinite(estimate.rulHours));
  assert.ok(Number.isFinite(estimate.degradationRatePerDay));
  assert.ok(estimate.degradationRatePerDay > 0);
  assert.equal(estimate.threshold, 30);
  assert.equal(estimate.simulated, true);
});
