import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_ASSETS,
  filterAssets,
  filterFleetAssets,
  getDemoSnapshot,
  getRequestedAssetId,
  getTrend,
  sortAssets,
} from "./demo-data.ts";
import {
  MOTOR_COMPONENTS,
  getMachineMeasurements,
  getViewerMode,
} from "./digital-twin.ts";
import {
  EDUCATIONAL_FAULT_PATTERNS,
  getSimulatedSpectrum,
  getSimulatedTemperatureTrend,
  getSimulatedWaveform,
} from "./diagnostics.ts";

test("demo snapshot readings and derived status are stable", () => {
  const first = getDemoSnapshot();
  const second = getDemoSnapshot();

  assert.deepEqual(first, second);
  assert.equal(first.assets, DEMO_ASSETS);
  assert.deepEqual(first.summary, {
    operational: 5,
    review: 2,
    service: 1,
  });
  assert.equal(
    first.assets.reduce((total, asset) => total + asset.temperatureC, 0),
    second.assets.reduce((total, asset) => total + asset.temperatureC, 0),
  );
});

test("asset query selection resolves consistently across shared routes", () => {
  const requestedId = "MTR-006";
  const resolved = getRequestedAssetId(DEMO_ASSETS, requestedId);
  assert.equal(resolved, requestedId);
  assert.equal(
    DEMO_ASSETS.find(({ id }) => id === resolved)?.name,
    "Chilled-water pump motor",
  );
  assert.equal(getRequestedAssetId(DEMO_ASSETS, "unknown"), null);
  assert.equal(getRequestedAssetId(DEMO_ASSETS, null), null);
  assert.equal(getRequestedAssetId([], requestedId), null);
});

test("asset search is trimmed, case insensitive, and matches inventory fields", () => {
  assert.deepEqual(
    filterAssets(DEMO_ASSETS, "  CNC SPINDLE  ", "all").map(({ id }) => id),
    ["MTR-001"],
  );
  assert.deepEqual(
    filterAssets(DEMO_ASSETS, "roof west", "all").map(({ id }) => id),
    ["MTR-007"],
  );
  assert.deepEqual(
    filterAssets(DEMO_ASSETS, "MTR-00", "all").map(({ id }) => id),
    DEMO_ASSETS.slice(0, 4).map(({ id }) => id).concat(["MTR-006", "MTR-007", "MTR-008"]),
  );
});

test("status and search filters compose and empty matches remain empty", () => {
  const serviceAssets = filterAssets(DEMO_ASSETS, "", "service");
  assert.deepEqual(
    serviceAssets.map(({ id }) => id),
    ["MTR-006"],
  );
  assert.ok(serviceAssets.every(({ status }) => status === "service"));
  assert.deepEqual(filterAssets(DEMO_ASSETS, "unknown asset", "all"), []);
  assert.deepEqual(filterAssets(DEMO_ASSETS, "pump", "operational"), []);
});

test("fleet filters compose across type, condition, operating state, and search", () => {
  const motors = filterFleetAssets(DEMO_ASSETS, {
    query: "",
    machineType: "motor",
    status: "all",
    operatingState: "all",
  });
  assert.equal(motors.length, 7);
  assert.ok(motors.every(({ machineType }) => machineType === "motor"));

  const bearingForReview = filterFleetAssets(DEMO_ASSETS, {
    query: "materials",
    machineType: "bearing",
    status: "review",
    operatingState: "running",
  });
  assert.deepEqual(
    bearingForReview.map(({ id }) => id),
    ["BRG-005"],
  );

  const standbyAssets = filterFleetAssets(DEMO_ASSETS, {
    query: "",
    machineType: "all",
    status: "all",
    operatingState: "standby",
  });
  assert.deepEqual(
    standbyAssets.map(({ id }) => id),
    ["MTR-007"],
  );
});

test("fleet sorting returns a new collection in the requested field order", () => {
  const original = [...DEMO_ASSETS];
  const byTemperature = sortAssets(DEMO_ASSETS, "temperature", "desc");
  assert.notEqual(byTemperature, DEMO_ASSETS);
  assert.deepEqual(DEMO_ASSETS, original);
  assert.ok(
    byTemperature.every(
      (asset, index) =>
        index === 0 ||
        byTemperature[index - 1].temperatureC >= asset.temperatureC,
    ),
  );
  assert.equal(sortAssets(DEMO_ASSETS, "name", "asc")[0].name, "Bearing assembly");
  assert.equal(sortAssets(DEMO_ASSETS, "priority", "asc")[0].status, "service");
  assert.equal(sortAssets(DEMO_ASSETS, "priority", "desc")[0].status, "operational");
});

test("digital twin measurements stay linked to the selected simulated asset", () => {
  const asset = DEMO_ASSETS.find(({ id }) => id === "MTR-006");
  assert.ok(asset);
  const measurements = getMachineMeasurements(asset);

  assert.deepEqual(
    measurements.map(({ id, value, unit, source }) => ({
      id,
      value,
      unit,
      source,
    })),
    [
      { id: "temperature", value: asset.temperatureC.toFixed(1), unit: "°C", source: "simulated" },
      { id: "vibration", value: asset.vibrationMmS.toFixed(1), unit: "mm/s", source: "simulated" },
      { id: "speed", value: asset.speedRpm.toLocaleString("en-US"), unit: "rpm", source: "simulated" },
      { id: "load", value: String(asset.loadPercent), unit: "%", source: "simulated" },
    ],
  );
  assert.equal(new Set(MOTOR_COMPONENTS.map(({ id }) => id)).size, 7);
  assert.ok(MOTOR_COMPONENTS.some(({ id }) => id === "terminal-box"));
});

test("digital twin explicitly switches to a fallback when WebGL 2 is unavailable", () => {
  assert.equal(getViewerMode(true), "interactive");
  assert.equal(getViewerMode(false), "fallback");
});

test("diagnostic waveform and spectrum are stable simulated signals for the selected asset", () => {
  const asset = DEMO_ASSETS.find(({ id }) => id === "MTR-003");
  assert.ok(asset);
  const waveform = getSimulatedWaveform(asset);
  const spectrum = getSimulatedSpectrum(asset, waveform);

  assert.deepEqual(waveform, getSimulatedWaveform(asset));
  assert.deepEqual(spectrum, getSimulatedSpectrum(asset, waveform));
  assert.equal(waveform.length, 256);
  assert.ok(waveform.every(({ source }) => source === "simulated"));
  assert.ok(spectrum.every(({ source }) => source === "simulated"));
  assert.ok(spectrum.every(({ frequencyHz, amplitudeMmS }) => frequencyHz >= 0 && amplitudeMmS >= 0));
  const calculatedRms = Math.sqrt(
    waveform.reduce((sum, { valueMmS }) => sum + valueMmS ** 2, 0) /
      waveform.length,
  );
  assert.ok(Math.abs(calculatedRms - asset.vibrationMmS) < 0.03);
  const runningSpeedPeak = spectrum.find(({ order }) => order === 1);
  const secondHarmonic = spectrum.find(({ order }) => order === 2);
  assert.ok(runningSpeedPeak);
  assert.ok(secondHarmonic);
  assert.ok(runningSpeedPeak.amplitudeMmS > secondHarmonic.amplitudeMmS);
});

test("diagnostic temperature trends are deterministic and end on the seeded reading", () => {
  const asset = DEMO_ASSETS.find(({ id }) => id === "MTR-006");
  assert.ok(asset);
  const dayTrend = getSimulatedTemperatureTrend(asset, "24h");
  const weekTrend = getSimulatedTemperatureTrend(asset, "7d");

  assert.deepEqual(dayTrend, getSimulatedTemperatureTrend(asset, "24h"));
  assert.equal(dayTrend.length, 24);
  assert.equal(weekTrend.length, 7);
  assert.equal(dayTrend.at(-1)?.value, asset.temperatureC);
  assert.equal(weekTrend.at(-1)?.value, asset.temperatureC);
  assert.ok([...dayTrend, ...weekTrend].every(({ source }) => source === "simulated"));
  assert.equal(EDUCATIONAL_FAULT_PATTERNS.length, 3);
});

test("dashboard readings carry simulated provenance across its sections", () => {
  const snapshot = getDemoSnapshot();

  for (const asset of snapshot.assets) {
    assert.equal(asset.source, "simulated");
  }
  for (const alert of snapshot.alerts) {
    assert.equal(alert.source, "simulated");
  }
  for (const task of snapshot.maintenance) {
    assert.equal(task.source, "simulated");
  }
  for (const activity of snapshot.activity) {
    assert.equal(activity.source, "simulated");
  }

  assert.ok(
    snapshot.alerts.every(({ assetId }) =>
      snapshot.assets.some((asset) => asset.id === assetId),
    ),
  );
});

test("trend data is deterministic, bounded, and adapted to the selected period", () => {
  const day = getTrend("temperature", "24h");
  const repeatedDay = getTrend("temperature", "24h");
  const shift = getTrend("vibration", "6h");
  const week = getTrend("temperature", "7d");

  assert.deepEqual(day, repeatedDay);
  assert.equal(day.length, 24);
  assert.equal(shift.length, 7);
  assert.equal(week.length, 7);
  assert.equal(shift[0].label, "00:00");
  assert.equal(shift.at(-1)?.label, "06:00");
  assert.ok(day.some(({ value }) => value !== day[0].value));
  assert.ok([...day, ...shift, ...week].every(({ source }) => source === "simulated"));
  assert.deepEqual(getTrend("temperature", "24h", []), []);
});
