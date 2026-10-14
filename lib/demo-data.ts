export type MachineStatus = "operational" | "review" | "service";
export type StatusFilter = "all" | MachineStatus;
export type MachineType = "motor" | "bearing";
export type MachineTypeFilter = "all" | MachineType;
export type OperatingState = "running" | "standby";
export type OperatingStateFilter = "all" | OperatingState;
export type AssetSortKey =
  | "priority"
  | "name"
  | "type"
  | "temperature"
  | "vibration"
  | "load"
  | "service";
export type ChartRange = "6h" | "24h" | "7d";
export type ChartMetric = "temperature" | "vibration";

export interface DemoAsset {
  id: string;
  name: string;
  type: string;
  machineType: MachineType;
  location: string;
  status: MachineStatus;
  operatingState: OperatingState;
  temperatureC: number;
  vibrationMmS: number;
  speedRpm: number;
  loadPercent: number;
  nextService: string;
  source: "simulated";
}

export interface TrendPoint {
  label: string;
  value: number;
  source: "simulated";
}

export interface MaintenanceAlert {
  id: string;
  assetId: string;
  assetName: string;
  priority: "review" | "schedule";
  signal: string;
  value: string;
  recommendation: string;
  source: "simulated";
}

export interface ScheduledMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  task: string;
  source: "simulated";
}

export interface DemoActivity {
  id: string;
  time: string;
  message: string;
  assetId: string;
  assetName: string;
  source: "simulated";
}

export interface DemoSnapshot {
  assets: readonly DemoAsset[];
  summary: Record<MachineStatus, number>;
  alerts: readonly MaintenanceAlert[];
  maintenance: readonly ScheduledMaintenance[];
  activity: readonly DemoActivity[];
}

const SIMULATION_SEED = 481_516;

const ASSET_PROFILES = [
  {
    id: "MTR-001",
    name: "CNC spindle motor",
    type: "Variable-speed spindle",
    machineType: "motor",
    location: "Machining · Cell 01",
    operatingState: "running",
    temperatureC: 66.3,
    vibrationMmS: 1.8,
    speedRpm: 3600,
    loadPercent: 72,
    nextService: "Oct 28",
  },
  {
    id: "MTR-002",
    name: "Line induction motor",
    type: "Three-phase induction",
    machineType: "motor",
    location: "Assembly · Line A",
    operatingState: "running",
    temperatureC: 70.1,
    vibrationMmS: 2.2,
    speedRpm: 1780,
    loadPercent: 68,
    nextService: "Nov 04",
  },
  {
    id: "MTR-003",
    name: "Coolant pump motor",
    type: "Pump motor",
    machineType: "motor",
    location: "Machining · Utility Bay",
    operatingState: "running",
    temperatureC: 76.3,
    vibrationMmS: 4.2,
    speedRpm: 1450,
    loadPercent: 81,
    nextService: "Oct 20",
  },
  {
    id: "MTR-004",
    name: "Conveyor drive motor",
    type: "Geared conveyor drive",
    machineType: "motor",
    location: "Packaging · Line 02",
    operatingState: "running",
    temperatureC: 72.4,
    vibrationMmS: 2.5,
    speedRpm: 1160,
    loadPercent: 75,
    nextService: "Oct 30",
  },
  {
    id: "BRG-005",
    name: "Bearing assembly",
    type: "Pillow block bearing",
    machineType: "bearing",
    location: "Materials · Conveyor C",
    operatingState: "running",
    temperatureC: 69.4,
    vibrationMmS: 4.4,
    speedRpm: 1480,
    loadPercent: 64,
    nextService: "Oct 18",
  },
  {
    id: "MTR-006",
    name: "Chilled-water pump motor",
    type: "Pump motor",
    machineType: "motor",
    location: "Utilities · Plant Room",
    operatingState: "running",
    temperatureC: 82.2,
    vibrationMmS: 5.3,
    speedRpm: 1760,
    loadPercent: 89,
    nextService: "Oct 16",
  },
  {
    id: "MTR-007",
    name: "Exhaust fan motor",
    type: "Induction fan drive",
    machineType: "motor",
    location: "Utilities · Roof West",
    operatingState: "standby",
    temperatureC: 64.3,
    vibrationMmS: 1.4,
    speedRpm: 890,
    loadPercent: 56,
    nextService: "Nov 12",
  },
  {
    id: "MTR-008",
    name: "Lathe spindle motor",
    type: "Variable-speed spindle",
    machineType: "motor",
    location: "Machining · Cell 04",
    operatingState: "running",
    temperatureC: 67.9,
    vibrationMmS: 2.0,
    speedRpm: 2850,
    loadPercent: 71,
    nextService: "Nov 02",
  },
] as const;

const SCHEDULED_MAINTENANCE: readonly ScheduledMaintenance[] = [
  {
    id: "work-order-006",
    assetId: "MTR-006",
    assetName: "Chilled-water pump motor",
    date: "Oct 16",
    task: "Cooling-path and operating-limit review",
    source: "simulated",
  },
  {
    id: "work-order-005",
    assetId: "BRG-005",
    assetName: "Bearing assembly",
    date: "Oct 18",
    task: "Routine bearing inspection",
    source: "simulated",
  },
  {
    id: "work-order-003",
    assetId: "MTR-003",
    assetName: "Coolant pump motor",
    date: "Oct 20",
    task: "Planned pump-condition review",
    source: "simulated",
  },
];

const RECENT_ACTIVITY: readonly DemoActivity[] = [
  {
    id: "activity-1",
    time: "09:42",
    message: "Simulated readings refreshed",
    assetId: "MTR-001",
    assetName: "CNC spindle motor",
    source: "simulated",
  },
  {
    id: "activity-2",
    time: "09:18",
    message: "Routine inspection added to schedule",
    assetId: "BRG-005",
    assetName: "Bearing assembly",
    source: "simulated",
  },
  {
    id: "activity-3",
    time: "08:56",
    message: "Illustrative signal flagged for review",
    assetId: "MTR-006",
    assetName: "Chilled-water pump motor",
    source: "simulated",
  },
];

function hashSeed(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619);
  }

  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function classifyStatus(
  temperatureC: number,
  vibrationMmS: number,
): MachineStatus {
  if (temperatureC >= 80 || vibrationMmS >= 5) return "service";
  if (temperatureC >= 74 || vibrationMmS >= 4) return "review";
  return "operational";
}

function createAssets(): readonly DemoAsset[] {
  return ASSET_PROFILES.map((profile) => {
    const random = createRandom(hashSeed(`${SIMULATION_SEED}:${profile.id}`));
    const temperatureC = Number(
      (profile.temperatureC + (random() - 0.5) * 0.4).toFixed(1),
    );
    const vibrationMmS = Number(
      (profile.vibrationMmS + (random() - 0.5) * 0.12).toFixed(1),
    );

    return {
      ...profile,
      temperatureC,
      vibrationMmS,
      status: classifyStatus(temperatureC, vibrationMmS),
      source: "simulated",
    };
  });
}

export const DEMO_ASSETS = createAssets();

export function getRequestedAssetId(
  assets: readonly DemoAsset[],
  requestedAssetId: string | null,
): string | null {
  return requestedAssetId &&
    assets.some((asset) => asset.id === requestedAssetId)
    ? requestedAssetId
    : null;
}

export function filterAssets(
  assets: readonly DemoAsset[],
  query: string,
  status: StatusFilter,
): DemoAsset[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return assets.filter((asset) => {
    const matchesStatus = status === "all" || asset.status === status;
    const searchableText =
      `${asset.id} ${asset.name} ${asset.type} ${asset.location}`.toLocaleLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });
}

export function filterFleetAssets(
  assets: readonly DemoAsset[],
  {
    query,
    machineType,
    status,
    operatingState,
  }: {
    query: string;
    machineType: MachineTypeFilter;
    status: StatusFilter;
    operatingState: OperatingStateFilter;
  },
): DemoAsset[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return assets.filter((asset) => {
    const matchesMachineType =
      machineType === "all" || asset.machineType === machineType;
    const matchesStatus = status === "all" || asset.status === status;
    const matchesOperatingState =
      operatingState === "all" || asset.operatingState === operatingState;
    const searchableText =
      `${asset.id} ${asset.name} ${asset.type} ${asset.location} ${asset.machineType} ${asset.operatingState}`.toLocaleLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return (
      matchesMachineType &&
      matchesStatus &&
      matchesOperatingState &&
      matchesQuery
    );
  });
}

export function sortAssets(
  assets: readonly DemoAsset[],
  sortBy: AssetSortKey,
  direction: "asc" | "desc",
): DemoAsset[] {
  const statusRank: Record<MachineStatus, number> = {
    service: 0,
    review: 1,
    operational: 2,
  };
  const sorted = [...assets].sort((left, right) => {
    let comparison = 0;

    switch (sortBy) {
      case "priority":
        comparison = statusRank[left.status] - statusRank[right.status];
        break;
      case "name":
        comparison = left.name.localeCompare(right.name);
        break;
      case "type":
        comparison = left.machineType.localeCompare(right.machineType);
        break;
      case "temperature":
        comparison = left.temperatureC - right.temperatureC;
        break;
      case "vibration":
        comparison = left.vibrationMmS - right.vibrationMmS;
        break;
      case "load":
        comparison = left.loadPercent - right.loadPercent;
        break;
      case "service":
        comparison = left.nextService.localeCompare(right.nextService);
        break;
    }

    if (comparison === 0) comparison = left.id.localeCompare(right.id);
    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

function createAlerts(assets: readonly DemoAsset[]): MaintenanceAlert[] {
  return assets
    .filter((asset) => asset.status !== "operational")
    .map<MaintenanceAlert>((asset) => {
      const vibrationIsPrimary =
        asset.vibrationMmS >= 4 &&
        (asset.temperatureC < 80 || asset.vibrationMmS >= 5);
      const priority: MaintenanceAlert["priority"] =
        asset.status === "service" ? "schedule" : "review";

      return {
        id: `triage-${asset.id}`,
        assetId: asset.id,
        assetName: asset.name,
        priority,
        signal: vibrationIsPrimary
          ? "Vibration · mm/s RMS"
          : "Temperature · °C",
        value: vibrationIsPrimary
          ? asset.vibrationMmS.toFixed(1)
          : asset.temperatureC.toFixed(1),
        recommendation: vibrationIsPrimary
          ? "Compare with the site limit and review during a planned stop."
          : "Check the cooling path and compare with the site operating limit.",
        source: "simulated",
      };
    })
    .sort((left, right) => {
      if (left.priority === right.priority) {
        return left.assetId.localeCompare(right.assetId);
      }
      return left.priority === "schedule" ? -1 : 1;
    });
}

export function getDemoSnapshot(): DemoSnapshot {
  const assets = DEMO_ASSETS;
  const summary: Record<MachineStatus, number> = {
    operational: 0,
    review: 0,
    service: 0,
  };

  for (const asset of assets) {
    summary[asset.status] += 1;
  }

  return {
    assets,
    summary,
    alerts: createAlerts(assets),
    maintenance: SCHEDULED_MAINTENANCE,
    activity: RECENT_ACTIVITY,
  };
}

export function getTrend(
  metric: ChartMetric,
  range: ChartRange,
  assets: readonly DemoAsset[] = DEMO_ASSETS,
): TrendPoint[] {
  if (assets.length === 0) return [];

  const temperatureAverage =
    assets.reduce((total, asset) => total + asset.temperatureC, 0) /
    assets.length;
  const vibrationAverage =
    assets.reduce((total, asset) => total + asset.vibrationMmS, 0) /
    assets.length;
  const base = metric === "temperature" ? temperatureAverage : vibrationAverage;
  const amplitude = metric === "temperature" ? 4.4 : 0.72;
  const seed = hashSeed(`${SIMULATION_SEED}:${metric}:${range}`);
  const random = createRandom(seed);
  const sampleCount = range === "6h" ? 7 : range === "7d" ? 7 : 24;

  return Array.from({ length: sampleCount }, (_, index) => {
    const phase = index / Math.max(sampleCount - 1, 1);
    const cycle = Math.sin(phase * Math.PI * 2.2 - 0.8);
    const drift = Math.sin(phase * Math.PI * 4) * amplitude * 0.24;
    const noise = (random() - 0.5) * amplitude * 0.32;
    const value = Number((base + cycle * amplitude + drift + noise).toFixed(1));
    const label =
      range === "7d"
        ? `Day ${index + 1}`
        : range === "6h"
          ? `${String(index).padStart(2, "0")}:00`
          : `${String(index).padStart(2, "0")}:00`;

    return { label, value, source: "simulated" };
  });
}
