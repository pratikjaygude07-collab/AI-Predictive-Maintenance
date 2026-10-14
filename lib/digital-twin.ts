import type { DemoAsset } from "./demo-data.ts";

export type ViewerMode = "interactive" | "fallback";
export type MotorComponentId =
  | "housing"
  | "cooling"
  | "drive-end"
  | "non-drive-end"
  | "shaft"
  | "mounting"
  | "terminal-box";

export interface MotorComponentDescription {
  id: MotorComponentId;
  name: string;
  category: string;
  description: string;
  material: string;
}

export interface MachineMeasurement {
  id: "temperature" | "vibration" | "speed" | "load";
  label: string;
  value: string;
  unit: string;
  source: "simulated";
}

export const MOTOR_COMPONENTS: readonly MotorComponentDescription[] = [
  {
    id: "housing",
    name: "Motor housing",
    category: "STRUCTURAL",
    description:
      "Ribbed enclosure around the stator assembly. The outer casing supports heat dissipation and protects internal electrical components.",
    material: "Simulated cast-aluminium finish",
  },
  {
    id: "cooling",
    name: "Cooling fins",
    category: "THERMAL",
    description:
      "External cooling ribs increase the casing surface area. Fin geometry is procedurally modelled as part of this local demonstration.",
    material: "Simulated anodized metal",
  },
  {
    id: "drive-end",
    name: "Drive-end cover",
    category: "BEARING SUPPORT",
    description:
      "End shield at the output-shaft side. It represents the support interface for the drive-end bearing assembly.",
    material: "Simulated machined aluminium",
  },
  {
    id: "non-drive-end",
    name: "Non-drive-end cover",
    category: "BEARING SUPPORT",
    description:
      "Opposite end shield, shown with a local simulated cooling fan guard and ventilation apertures.",
    material: "Simulated machined aluminium",
  },
  {
    id: "shaft",
    name: "Output shaft",
    category: "ROTATING ASSEMBLY",
    description:
      "Stepped output shaft showing the motor-to-load interface. The model is static and does not represent a live or measured rotation.",
    material: "Simulated brushed steel",
  },
  {
    id: "mounting",
    name: "Mounting feet",
    category: "MOUNTING",
    description:
      "Base feet and bolt details representing a common horizontal motor mounting arrangement.",
    material: "Simulated cast-aluminium finish",
  },
  {
    id: "terminal-box",
    name: "Terminal housing",
    category: "ELECTRICAL CONNECTION",
    description:
      "Raised junction box on top of the motor casing. Internal wiring and electrical connections are not modelled.",
    material: "Simulated painted steel",
  },
];

export function getViewerMode(webGL2Available: boolean): ViewerMode {
  return webGL2Available ? "interactive" : "fallback";
}

export function getMachineMeasurements(
  asset: DemoAsset,
): MachineMeasurement[] {
  return [
    {
      id: "temperature",
      label: "Temperature",
      value: asset.temperatureC.toFixed(1),
      unit: "°C",
      source: "simulated",
    },
    {
      id: "vibration",
      label: "Vibration RMS",
      value: asset.vibrationMmS.toFixed(1),
      unit: "mm/s",
      source: "simulated",
    },
    {
      id: "speed",
      label: "Shaft speed",
      value: asset.speedRpm.toLocaleString("en-US"),
      unit: "rpm",
      source: "simulated",
    },
    {
      id: "load",
      label: "Operating load",
      value: String(asset.loadPercent),
      unit: "%",
      source: "simulated",
    },
  ];
}
