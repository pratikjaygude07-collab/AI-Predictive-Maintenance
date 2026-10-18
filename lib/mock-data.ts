// Centralized mock data for frontend simulation
// This provides realistic synthetic data to support frontend development
// until a real backend is integrated

export type SensorReading = {
  id: string;
  timestamp: string; // ISO string
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
};

export type MachineAsset = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "active" | "idle" | "maintenance" | "offline";
  healthScore: number; // 0-100
  uptimePercentage: number;
  lastSeen: string;
  latitude: number;
  longitude: number;
};

export type Alert = {
  id: string;
  machineId: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  acknowledged: boolean;
  // Frontend-only alert state, persisted for the current browser session.
  // Simulated data: no backend is involved.
  snoozed: boolean;
  snoozedUntil?: string; // ISO string; alert is snoozed until this time
  category: "temperature" | "vibration" | "pressure" | "electrical" | "other";
};

export type MaintenanceRecord = {
  id: string;
  machineId: string;
  description: string;
  date: string;
  status: "scheduled" | "completed" | "in-progress" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  technician: string;
};

export type FaultAnalysis = {
  id: string;
  machineId: string;
  faultType: string;
  severity: "mild" | "moderate" | "severe" | "critical";
  confidence: number; // 0-1
  description: string;
  detectedAt: string;
  predictedFailureAt?: string;
  recommendations: string[];
  sensorReadings: SensorReading[];
};

export type MetricSeries = {
  data: Array<{ timestamp: string; value: number }>;
  unit: string;
  trend: "increasing" | "decreasing" | "stable";
};

export type OperationalMetrics = {
  temperature: MetricSeries;
  vibration: MetricSeries;
  rpm: MetricSeries;
  pressure: MetricSeries;
  current: MetricSeries;
};

// Fixed reference time for deterministic mock data (SSR-safe hydration)
const MOCK_NOW = new Date("2026-10-17T12:00:00Z");

// Machine fleet data
export const MOCK_MACHINES: MachineAsset[] = [
  {
    id: "M-001",
    name: "Production Pump A",
    type: "Centrifugal Pump",
    location: "Factory Floor - Zone A",
    status: "active",
    healthScore: 92,
    uptimePercentage: 98.5,
    lastSeen: new Date(MOCK_NOW.getTime() - 5 * 60000).toISOString(),
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: "M-002",
    name: "Conveyor Belt 3",
    type: "Modular Belt",
    location: "Warehouse Section 3",
    status: "active",
    healthScore: 85,
    uptimePercentage: 92.1,
    lastSeen: new Date(MOCK_NOW.getTime() - 2 * 60000).toISOString(),
    latitude: 37.7849,
    longitude: -122.4094,
  },
  {
    id: "M-003",
    name: "Compressor Unit 2",
    type: "Air Compressor",
    location: "Maintenance Bay",
    status: "idle",
    healthScore: 76,
    uptimePercentage: 88.9,
    lastSeen: new Date(MOCK_NOW.getTime() - 15 * 60000).toISOString(),
    latitude: 37.7649,
    longitude: -122.4294,
  },
  {
    id: "M-004",
    name: "Robotic Arm X",
    type: "Industrial Robot",
    location: "Assembly Line X",
    status: "maintenance",
    healthScore: 58,
    uptimePercentage: 85.3,
    lastSeen: new Date(MOCK_NOW.getTime() - 45 * 60000).toISOString(),
    latitude: 37.7549,
    longitude: -122.4394,
  },
  {
    id: "M-005",
    name: "Generator Set G",
    type: "Diesel Generator",
    location: "Power Room",
    status: "offline",
    healthScore: 34,
    uptimePercentage: 76.8,
    lastSeen: new Date(MOCK_NOW.getTime() - 120 * 60000).toISOString(),
    latitude: 37.7449,
    longitude: -122.4494,
  },
  {
    id: "M-006",
    name: "Processing Tank 2",
    type: "Mixing Tank",
    location: "Chemical Processing Wing",
    status: "active",
    healthScore: 88,
    uptimePercentage: 95.2,
    lastSeen: new Date(MOCK_NOW.getTime() - 8 * 60000).toISOString(),
    latitude: 37.7349,
    longitude: -122.4594,
  },
  {
    id: "M-007",
    name: "Packaging Machine 1",
    type: "Packaging System",
    location: "Packaging Line 1",
    status: "active",
    healthScore: 91,
    uptimePercentage: 97.8,
    lastSeen: new Date(MOCK_NOW.getTime() - 12 * 60000).toISOString(),
    latitude: 37.7249,
    longitude: -122.4694,
  },
  {
    id: "M-008",
    name: "Cooling Tower C",
    type: "Cooling System",
    location: "HVAC Section",
    status: "active",
    healthScore: 79,
    uptimePercentage: 89.4,
    lastSeen: new Date(MOCK_NOW.getTime() - 10 * 60000).toISOString(),
    latitude: 37.7149,
    longitude: -122.4794,
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "A-001",
    machineId: "M-005",
    message: "Critical low oil pressure detected",
    severity: "critical",
    timestamp: new Date(MOCK_NOW.getTime() - 5 * 60000).toISOString(),
    acknowledged: false,
    snoozed: false,
    category: "pressure",
  },
  {
    id: "A-002",
    machineId: "M-004",
    message: "Unusual vibration patterns in the operating range",
    severity: "high",
    timestamp: new Date(MOCK_NOW.getTime() - 25 * 60000).toISOString(),
    acknowledged: false,
    snoozed: false,
    category: "vibration",
  },
  {
    id: "A-003",
    machineId: "M-003",
    message: "Temperature threshold exceeded by 15% above nominal",
    severity: "medium",
    timestamp: new Date(MOCK_NOW.getTime() - 60 * 60000).toISOString(),
    acknowledged: true,
    snoozed: false,
    category: "temperature",
  },
  {
    id: "A-004",
    machineId: "M-006",
    message: "Electrical current draw stabilized",
    severity: "low",
    timestamp: new Date(MOCK_NOW.getTime() - 2 * 24 * 60 * 60000).toISOString(),
    acknowledged: true,
    snoozed: false,
    category: "electrical",
  },
  {
    id: "A-005",
    machineId: "M-001",
    message: "Sensor calibration warning",
    severity: "low",
    timestamp: new Date(MOCK_NOW.getTime() - 8 * 24 * 60 * 60000).toISOString(),
    acknowledged: false,
    snoozed: false,
    category: "other",
  },
  {
    id: "A-006",
    machineId: "M-002",
    message: "Minor oil level decrease detected",
    severity: "medium",
    timestamp: new Date(MOCK_NOW.getTime() - 4 * 24 * 60 * 60000).toISOString(),
    acknowledged: false,
    snoozed: false,
    category: "other",
  },
];

export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: "MT-001",
    machineId: "M-004",
    description: "Routine bearing replacement",
    date: new Date(MOCK_NOW.getTime() + 2 * 24 * 60 * 60000).toISOString(),
    status: "scheduled",
    priority: "medium",
    technician: "John Miller",
  },
  {
    id: "MT-002",
    machineId: "M-005",
    description: "Oil change and filter replacement",
    date: new Date(MOCK_NOW.getTime() + 1 * 24 * 60 * 60000).toISOString(),
    status: "in-progress",
    priority: "high",
    technician: "Sarah Chen",
  },
  {
    id: "MT-003",
    machineId: "M-001",
    description: "Calibration of speed sensors",
    date: new Date(MOCK_NOW.getTime() - 2 * 24 * 60 * 60000).toISOString(),
    status: "completed",
    priority: "low",
    technician: "Mike Johnson",
  },
  {
    id: "MT-004",
    machineId: "M-006",
    description: "Chemical tank inspection",
    date: new Date(MOCK_NOW.getTime() + 7 * 24 * 60 * 60000).toISOString(),
    status: "scheduled",
    priority: "medium",
    technician: "Lisa Anderson",
  },
];

// Sensor unit mappings
const SENSOR_UNITS: Record<string, string> = {
  "M-001": "°F",
  "M-002": "mm/s",
  "M-003": "°F",
  "M-004": "mm/s",
  "M-005": "mm/s",
  "M-006": "°F",
  "M-007": "mm/s",
  "M-008": "mm/s",
};

// Deterministic seeded PRNG (mulberry32) for SSR-safe, machine-specific
// simulated data generation. Same machineId always produces identical output.
// No Date.now() or Math.random() is used during rendering.
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

export const generateSensorReadings = (
  machineId: string,
  count = 60,
): SensorReading[] => {
  const readings: SensorReading[] = [];
  const now = MOCK_NOW.getTime();
  const rng = mulberry32(seedFromMachineId(machineId));
  const baseValue = 70 + rng() * 30;
  const unit = SENSOR_UNITS[machineId] ?? "units";

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 60000).toISOString();
    let value = baseValue + (rng() * 10 - 5);

    if (i > count * 0.7) {
      value += (i / count) * 40;
    }

    if (rng() < 0.05) {
      value += rng() * 60;
    }

    let status: SensorReading["status"] = "normal";
    if (value > 120 || value < 20) status = "critical";
    else if (value > 100 || value < 40) status = "warning";

    readings.push({
      id: `${machineId}-sensor-${i}`,
      timestamp,
      value: parseFloat(value.toFixed(2)),
      unit,
      status,
    });
  }

  return readings;
};

// Operational metrics for digital twin telemetry
export const generateOperationalMetrics = (machineId: string): OperationalMetrics => {
  const now = MOCK_NOW.getTime();
  const points = 60;
  const rng = mulberry32(seedFromMachineId(machineId));
  const series = (base: number, noise: number, drift: number, unit: string, trend: MetricSeries["trend"]): MetricSeries => {
    return {
      data: Array.from({ length: points }, (_, i) => {
        const value = base + drift * (i / points) + (rng() * noise - noise / 2);
        return {
          timestamp: new Date(now - (points - i) * 60000).toISOString(),
          value: parseFloat(value.toFixed(2)),
        };
      }),
      unit,
      trend,
    };
  };

  const seed = machineId.charCodeAt(machineId.length - 1) * 7;

  return {
    temperature: series(75 + (seed % 10), 5, 2, "°C", "stable"),
    vibration: series(2.5 + (seed % 3), 0.5, -0.5, "mm/s", "increasing"),
    rpm: series(1750 + (seed % 50), 20, 10, "RPM", "stable"),
    pressure: series(45 + (seed % 15), 3, -1, "bar", "decreasing"),
    current: series(12 + (seed % 4), 1.5, 0.5, "A", "stable"),
  };
};

// Fault analysis data for diagnostics
export const MOCK_FAULT_ANALYSES: FaultAnalysis[] = [
  {
    id: "FA-001",
    machineId: "M-005",
    faultType: "Bearing wear",
    severity: "critical",
    confidence: 0.94,
    description:
      "High-frequency vibration patterns detected at the drive-end bearing assembly indicate advanced wear. Oil pressure remains below nominal thresholds.",
    detectedAt: new Date(MOCK_NOW.getTime() - 3 * 24 * 60 * 60000).toISOString(),
    predictedFailureAt: new Date(MOCK_NOW.getTime() + 7 * 24 * 60 * 60000).toISOString(),
    recommendations: [
      "Schedule immediate bearing inspection and replacement",
      "Reduce machine load until maintenance is performed",
      "Monitor oil pressure and temperature every 4 hours",
    ],
    sensorReadings: [],
  },
  {
    id: "FA-002",
    machineId: "M-004",
    faultType: "Vibration anomaly",
    severity: "severe",
    confidence: 0.87,
    description:
      "Unusual vibration signatures in the motor-to-load coupling suggest potential misalignment or looseness in the output shaft assembly.",
    detectedAt: new Date(MOCK_NOW.getTime() - 2 * 24 * 60 * 60000).toISOString(),
    predictedFailureAt: new Date(MOCK_NOW.getTime() + 14 * 24 * 60 * 60000).toISOString(),
    recommendations: [
      "Perform laser shaft alignment check",
      "Inspect coupling for wear or damage",
      "Tighten mounting bolts to specification",
    ],
    sensorReadings: [],
  },
  {
    id: "FA-003",
    machineId: "M-003",
    faultType: "Temperature excursion",
    severity: "moderate",
    confidence: 0.72,
    description:
      "Winding temperature exceeds nominal operating range under light load. Possible cooling fan degradation or ambient temperature increase.",
    detectedAt: new Date(MOCK_NOW.getTime() - 6 * 60 * 60000).toISOString(),
    predictedFailureAt: new Date(MOCK_NOW.getTime() + 30 * 24 * 60 * 60000).toISOString(),
    recommendations: [
      "Inspect cooling fan and ventilation path",
      "Verify ambient temperature within specification",
      "Schedule preventive winding inspection",
    ],
    sensorReadings: [],
  },
  {
    id: "FA-004",
    machineId: "M-002",
    faultType: "Minor oil degradation",
    severity: "mild",
    confidence: 0.61,
    description:
      "Oil level decrease detected below alert threshold. No immediate failure risk but requires top-up within next service window.",
    detectedAt: new Date(MOCK_NOW.getTime() - 4 * 24 * 60 * 60000).toISOString(),
    predictedFailureAt: new Date(MOCK_NOW.getTime() + 60 * 24 * 60 * 60000).toISOString(),
    recommendations: [
      "Top up oil to recommended level",
      "Schedule oil analysis at next maintenance",
    ],
    sensorReadings: [],
  },
];

// Health trends for diagnostics
export type HealthTrendPoint = {
  date: string;
  score: number;
};

export const generateHealthTrend = (
  machineId: string,
  days = 14,
): HealthTrendPoint[] => {
  const points: HealthTrendPoint[] = [];
  const now = MOCK_NOW.getTime();
  const rng = mulberry32(seedFromMachineId(machineId));
  const baseScore = 80 + (machineId.charCodeAt(machineId.length - 1) % 15);
  for (let i = 0; i < days; i++) {
    const date = new Date(now - (days - i) * 24 * 60 * 60000).toISOString();
    const variance = (rng() - 0.5) * 10;
    points.push({
      date,
      score: Math.max(0, Math.min(100, Math.round(baseScore + variance))),
    });
  }
  return points;
};

// Simulated maintenance work orders (frontend-only, no backend).
// All work orders below are demo records until a real maintenance backend is connected.
export type WorkOrderStatus = "open" | "in-progress" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "medium" | "high" | "critical";

export type WorkOrder = {
  id: string;
  machineId: string;
  title: string;
  description: string;
  notes: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: string; // ISO date
  createdAt: string;
  updatedAt: string;
  technician: string;
};

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-001",
    machineId: "M-005",
    title: "Bearing inspection and replacement",
    description:
      "Inspect drive-end bearing for wear and replace if nominal thresholds are exceeded.",
    notes: "Oil pressure remains below nominal; schedule within next service window.",
    status: "in-progress",
    priority: "critical",
    scheduledDate: new Date(MOCK_NOW.getTime() + 3 * 24 * 60 * 60000).toISOString(),
    createdAt: new Date(MOCK_NOW.getTime() - 5 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date(MOCK_NOW.getTime() - 1 * 24 * 60 * 60000).toISOString(),
    technician: "Sarah Chen",
  },
  {
    id: "WO-002",
    machineId: "M-004",
    title: "Laser shaft alignment check",
    description:
      "Perform laser shaft alignment on the motor-to-load coupling and inspect for misalignment.",
    notes: "Tighten mounting bolts to specification after alignment.",
    status: "open",
    priority: "high",
    scheduledDate: new Date(MOCK_NOW.getTime() + 7 * 24 * 60 * 60000).toISOString(),
    createdAt: new Date(MOCK_NOW.getTime() - 10 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date(MOCK_NOW.getTime() - 10 * 24 * 60 * 60000).toISOString(),
    technician: "Mike Johnson",
  },
  {
    id: "WO-003",
    machineId: "M-002",
    title: "Oil top-up and analysis",
    description: "Top up oil to recommended level and schedule oil analysis at next service.",
    notes: "No immediate failure risk; minor oil degradation detected.",
    status: "completed",
    priority: "low",
    scheduledDate: new Date(MOCK_NOW.getTime() - 2 * 24 * 60 * 60000).toISOString(),
    createdAt: new Date(MOCK_NOW.getTime() - 8 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date(MOCK_NOW.getTime() - 2 * 24 * 60 * 60000).toISOString(),
    technician: "Lisa Anderson",
  },
  {
    id: "WO-004",
    machineId: "M-001",
    title: "Speed sensor calibration",
    description: "Calibrate speed sensors and verify readings against nominal range.",
    notes: "Routine preventive calibration.",
    status: "open",
    priority: "medium",
    scheduledDate: new Date(MOCK_NOW.getTime() + 14 * 24 * 60 * 60000).toISOString(),
    createdAt: new Date(MOCK_NOW.getTime() - 1 * 24 * 60 * 60000).toISOString(),
    updatedAt: new Date(MOCK_NOW.getTime() - 1 * 24 * 60 * 60000).toISOString(),
    technician: "John Miller",
  },
];

// Centralized data-access functions (mock backend abstraction)
// These isolate the frontend from mock-data implementation so a real
// backend can be swapped in later.

export const dataAccess = {
  getMachines: (): MachineAsset[] => [...MOCK_MACHINES],
  getMachineById: (id: string): MachineAsset | undefined =>
    MOCK_MACHINES.find((m) => m.id === id),
  getAlerts: (machineId?: string): Alert[] =>
    machineId ? MOCK_ALERTS.filter((a) => a.machineId === machineId) : [...MOCK_ALERTS],
  getUnacknowledgedAlerts: (): Alert[] =>
    MOCK_ALERTS.filter((a) => !a.acknowledged),
  getMaintenance: (machineId?: string): MaintenanceRecord[] =>
    machineId
      ? MOCK_MAINTENANCE.filter((m) => m.machineId === machineId)
      : [...MOCK_MAINTENANCE],
  getMaintenanceById: (id: string): MaintenanceRecord | undefined =>
    MOCK_MAINTENANCE.find((m) => m.id === id),
  getFaultAnalyses: (machineId?: string): FaultAnalysis[] =>
    machineId
      ? MOCK_FAULT_ANALYSES.filter((f) => f.machineId === machineId)
      : [...MOCK_FAULT_ANALYSES],
  getFaultAnalysisById: (id: string): FaultAnalysis | undefined =>
    MOCK_FAULT_ANALYSES.find((f) => f.id === id),
  getSensorReadings: (machineId: string): SensorReading[] =>
    generateSensorReadings(machineId),
  getOperationalMetrics: (machineId: string): OperationalMetrics =>
    generateOperationalMetrics(machineId),
  getHealthTrend: (machineId: string): HealthTrendPoint[] =>
    generateHealthTrend(machineId),
  getActiveMachinesCount: (): number =>
    MOCK_MACHINES.filter((m) => m.status === "active").length,
  getMaintenanceCount: (): number => MOCK_MAINTENANCE.length,
  getUpcomingMaintenanceCount: (): number =>
    MOCK_MAINTENANCE.filter(
      (m) => m.status === "scheduled" || m.status === "in-progress",
    ).length,
  getCriticalAlertsCount: (): number =>
    MOCK_ALERTS.filter(
      (a) => a.severity === "critical" && !a.acknowledged,
    ).length,
  getAverageHealthScore: (): number => {
    if (MOCK_MACHINES.length === 0) return 0;
    const sum = MOCK_MACHINES.reduce((acc, m) => acc + m.healthScore, 0);
    return Math.round(sum / MOCK_MACHINES.length);
  },
  getWorkOrders: (): WorkOrder[] => [...MOCK_WORK_ORDERS],
  getWorkOrderById: (id: string): WorkOrder | undefined =>
    MOCK_WORK_ORDERS.find((w) => w.id === id),
  getWorkOrdersByMachine: (machineId: string): WorkOrder[] =>
    MOCK_WORK_ORDERS.filter((w) => w.machineId === machineId),
};
