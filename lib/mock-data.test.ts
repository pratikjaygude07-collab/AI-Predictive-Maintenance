import assert from "node:assert/strict";
import test from "node:test";
import {
  generateSensorReadings,
  generateOperationalMetrics,
  generateHealthTrend,
  type SensorReading,
} from "./mock-data.ts";

test("generateSensorReadings is deterministic for same machineId", () => {
  const a = generateSensorReadings("M-001");
  const b = generateSensorReadings("M-001");
  assert.deepEqual(a, b);
  assert.equal(a.length, 60);
  a.forEach((r) => {
    assert.ok(r.id.startsWith("M-001-sensor-"));
    assert.ok(typeof r.value === "number");
    assert.ok(typeof r.unit === "string");
    assert.ok(["normal", "warning", "critical"].includes(r.status));
  });
});

test("generateSensorReadings produces distinct values for different machines", () => {
  const m1 = generateSensorReadings("M-001");
  const m5 = generateSensorReadings("M-005");
  const m8 = generateSensorReadings("M-008");
  const m1First = m1[0].value;
  const m5First = m5[0].value;
  const m8First = m8[0].value;
  // Machines should not all produce identical first values
  assert.ok(m1First !== m5First || m5First !== m8First);
});

test("generateSensorReadings values stay within valid ranges", () => {
  const readings = generateSensorReadings("M-004");
  readings.forEach((r: SensorReading) => {
    assert.ok(r.value >= 0);
    assert.ok(r.value < 1000);
    assert.ok(typeof r.timestamp === "string");
    assert.ok(new Date(r.timestamp).getTime() > 0);
  });
});

test("generateOperationalMetrics is deterministic for same machineId", () => {
  const a = generateOperationalMetrics("M-002");
  const b = generateOperationalMetrics("M-002");
  assert.deepEqual(a, b);
  assert.equal(a.temperature.data.length, 60);
  assert.equal(a.temperature.unit, "°C");
  assert.equal(a.temperature.trend, "stable");
  assert.equal(a.vibration.trend, "increasing");
  assert.equal(a.rpm.trend, "stable");
  assert.equal(a.pressure.trend, "decreasing");
  assert.equal(a.current.trend, "stable");
});

test("generateOperationalMetrics produces distinct values for different machines", () => {
  const m1 = generateOperationalMetrics("M-001");
  const m2 = generateOperationalMetrics("M-002");
  assert.notDeepEqual(m1.temperature.data, m2.temperature.data);
});

test("generateOperationalMetrics values are finite numbers", () => {
  const metrics = generateOperationalMetrics("M-005");
  for (const series of Object.values(metrics)) {
    series.data.forEach((point) => {
      assert.ok(Number.isFinite(point.value));
      assert.ok(new Date(point.timestamp).getTime() > 0);
    });
  }
});

test("generateHealthTrend is deterministic for same machineId", () => {
  const a = generateHealthTrend("M-003");
  const b = generateHealthTrend("M-003");
  assert.deepEqual(a, b);
  assert.equal(a.length, 14);
  a.forEach((p) => {
    assert.ok(p.score >= 0 && p.score <= 100);
    assert.ok(new Date(p.date).getTime() > 0);
  });
});

test("generateHealthTrend produces distinct values for different machines", () => {
  const m1 = generateHealthTrend("M-001");
  const m5 = generateHealthTrend("M-005");
  const m1First = m1[0].score;
  const m5First = m5[0].score;
  assert.ok(m1First !== m5First || m1.some((p, i) => p.score !== m5[i].score));
});

test("generateHealthTrend retains realistic variation across days", () => {
  const trend = generateHealthTrend("M-007", 14);
  const scores = trend.map((p) => p.score);
  const uniqueScores = new Set(scores);
  assert.ok(uniqueScores.size > 1, "trend should have variation across days");
});

test("RUL and Diagnostics data consistency — health trends stay within valid range", () => {
  const m001 = generateHealthTrend("M-001");
  const m005 = generateHealthTrend("M-005");
  m001.forEach((p) => assert.ok(p.score >= 0 && p.score <= 100));
  m005.forEach((p) => assert.ok(p.score >= 0 && p.score <= 100));
});
