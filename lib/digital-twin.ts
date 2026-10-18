import { Spherical, Vector3, type Camera } from "three";

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

export const MOTOR_SCENE_LIGHTING = {
  ambient: 0.8,
  hemisphere: 0.6,
  key: 2,
  rim: 1.2,
  fill: 0.8,
} as const;

export const MOTOR_COMPONENTS: readonly MotorComponentDescription[] = [
  {
    id: "housing",
    name: "Motor housing",
    category: "STRUCTURAL",
    description:
      "Ribbed enclosure around the stator assembly. The outer casing represents heat-dissipating structure around internal electrical components.",
    material: "Illustrative cast aluminium",
  },
  {
    id: "cooling",
    name: "Cooling fins",
    category: "THERMAL",
    description:
      "External cooling ribs increase the casing surface area. Fin geometry is procedurally modelled for this local illustration.",
    material: "Illustrative anodized metal",
  },
  {
    id: "drive-end",
    name: "Drive-end cover",
    category: "BEARING SUPPORT",
    description:
      "End shield at the output-shaft side, representing a support interface for the drive-end bearing assembly.",
    material: "Illustrative machined aluminium",
  },
  {
    id: "non-drive-end",
    name: "Non-drive-end cover",
    category: "BEARING SUPPORT",
    description:
      "Opposite end shield, shown with a locally illustrated cooling fan guard and ventilation apertures.",
    material: "Illustrative machined aluminium",
  },
  {
    id: "shaft",
    name: "Output shaft",
    category: "ROTATING ASSEMBLY",
    description:
      "Stepped output shaft showing a motor-to-load interface. The model is static and does not represent live or measured rotation.",
    material: "Illustrative brushed steel",
  },
  {
    id: "mounting",
    name: "Mounting feet",
    category: "MOUNTING",
    description:
      "Base feet and bolt details representing a common horizontal motor mounting arrangement.",
    material: "Illustrative cast aluminium",
  },
  {
    id: "terminal-box",
    name: "Terminal housing",
    category: "ELECTRICAL CONNECTION",
    description:
      "Raised junction box on top of the motor casing. Internal wiring and electrical connections are not modelled.",
    material: "Illustrative painted steel",
  },
];

export function getViewerMode(webGL2Available: boolean): ViewerMode {
  return webGL2Available ? "interactive" : "fallback";
}

export function adjustCameraForKey(
  camera: Camera,
  target: Vector3,
  key: string,
): boolean {
  const offset = new Vector3().copy(camera.position).sub(target);
  const spherical = new Spherical().setFromVector3(offset);
  const step = Math.PI / 12;

  switch (key) {
    case "ArrowLeft":
      spherical.theta += step;
      break;
    case "ArrowRight":
      spherical.theta -= step;
      break;
    case "ArrowUp":
      spherical.phi = Math.max(0.12, spherical.phi - step);
      break;
    case "ArrowDown":
      spherical.phi = Math.min(Math.PI * 0.82, spherical.phi + step);
      break;
    case "+":
    case "=":
      spherical.radius = Math.max(3.2, spherical.radius / 1.2);
      break;
    case "-":
      spherical.radius = Math.min(10, spherical.radius * 1.2);
      break;
    default:
      return false;
  }

  offset.setFromSpherical(spherical);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  return true;
}
