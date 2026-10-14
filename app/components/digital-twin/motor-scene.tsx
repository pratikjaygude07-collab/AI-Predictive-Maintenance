"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Component,
  type ErrorInfo,
  type RefObject,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { MotorComponentId } from "../../../lib/digital-twin";

interface ModelPartProps {
  id: MotorComponentId;
  selectedPart: MotorComponentId | null;
  onSelect: (id: MotorComponentId) => void;
  children: ReactNode;
}

function ModelPart({
  id,
  selectedPart,
  onSelect,
  children,
}: ModelPartProps) {
  const selected = selectedPart === id;
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group
        scale={1}
        userData={{ componentId: id }}
      >
        {children}
      </group>
      {selected && <SelectionOutline id={id} />}
      {hovered && !selected && <HoverOutline id={id} />}
    </group>
  );
}

function SelectionOutline({ id }: { id: MotorComponentId }) {
  return <ComponentAccent id={id} color="#22d3ee" opacity={0.34} />;
}

function HoverOutline({ id }: { id: MotorComponentId }) {
  return <ComponentAccent id={id} color="#b6f5fb" opacity={0.15} />;
}

function ComponentAccent({
  id,
  color,
  opacity,
}: {
  id: MotorComponentId;
  color: string;
  opacity: number;
}) {
  const accent = useMemo(() => {
    switch (id) {
      case "shaft":
        return {
          geometry: new THREE.CylinderGeometry(0.105, 0.105, 1.44, 32),
          position: [1.92, 0.05, 0] as const,
          rotation: [0, 0, Math.PI / 2] as const,
        };
      case "terminal-box":
        return {
          geometry: new THREE.BoxGeometry(0.96, 0.56, 0.84),
          position: [0.08, 0.83, 0] as const,
          rotation: [0, 0, 0] as const,
        };
      case "mounting":
        return {
          geometry: new THREE.BoxGeometry(3.08, 0.36, 1.92),
          position: [0, -0.83, 0] as const,
          rotation: [0, 0, 0] as const,
        };
      case "cooling":
        return {
          geometry: new THREE.TorusGeometry(0.696, 0.055, 8, 56),
          position: [0, 0, 0] as const,
          rotation: [0, Math.PI / 2, 0] as const,
        };
      case "housing":
        return {
          geometry: new THREE.CylinderGeometry(0.72, 0.72, 2.72, 48),
          position: [0, 0, 0] as const,
          rotation: [0, 0, Math.PI / 2] as const,
        };
      case "drive-end":
        return {
          geometry: new THREE.CylinderGeometry(0.79, 0.79, 0.26, 48),
          position: [1.37, 0, 0] as const,
          rotation: [0, 0, Math.PI / 2] as const,
        };
      case "non-drive-end":
        return {
          geometry: new THREE.CylinderGeometry(0.79, 0.79, 0.26, 48),
          position: [-1.37, 0, 0] as const,
          rotation: [0, 0, Math.PI / 2] as const,
        };
    }
  }, [id]);

  useEffect(() => () => accent.geometry.dispose(), [accent]);

  return (
    <mesh
      geometry={accent.geometry}
      position={accent.position}
      rotation={accent.rotation}
      renderOrder={2}
    >
      <meshBasicMaterial
        color={color}
        depthWrite={false}
        opacity={opacity}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  );
}

function CoolingFins({
  selectedPart,
  onSelect,
}: {
  selectedPart: MotorComponentId | null;
  onSelect: (id: MotorComponentId) => void;
}) {
  const finMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#526c83",
        metalness: 0.78,
        roughness: 0.31,
      }),
    [],
  );

  return (
    <ModelPart id="cooling" selectedPart={selectedPart} onSelect={onSelect}>
      <group>
        {Array.from({ length: 13 }, (_, index) => {
          const x = -1.13 + index * 0.188;

          return (
            <mesh
              castShadow
              key={index}
              material={finMaterial}
              position={[x, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <torusGeometry args={[0.696, 0.045, 8, 56]} />
            </mesh>
          );
        })}
        {[-0.54, 0.54].map((z) =>
          [-1.2, 1.2].map((x) => (
            <mesh
              castShadow
              key={`${x}-${z}`}
              material={finMaterial}
              position={[x, 0.63, z]}
            >
              <boxGeometry args={[0.15, 0.07, 0.11]} />
            </mesh>
          )),
        )}
      </group>
    </ModelPart>
  );
}

function ElectricMotor({
  selectedPart,
  onSelect,
}: {
  selectedPart: MotorComponentId | null;
  onSelect: (id: MotorComponentId) => void;
}) {
  const materials = useMemo(
    () => ({
      housing: new THREE.MeshStandardMaterial({
        color: "#45627b",
        metalness: 0.76,
        roughness: 0.33,
      }),
      end: new THREE.MeshStandardMaterial({
        color: "#70879a",
        metalness: 0.84,
        roughness: 0.27,
      }),
      inset: new THREE.MeshStandardMaterial({
        color: "#17293a",
        metalness: 0.77,
        roughness: 0.36,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: "#c5d0d6",
        metalness: 0.94,
        roughness: 0.2,
      }),
      darkSteel: new THREE.MeshStandardMaterial({
        color: "#354a5d",
        metalness: 0.85,
        roughness: 0.28,
      }),
      terminal: new THREE.MeshStandardMaterial({
        color: "#273b4d",
        metalness: 0.66,
        roughness: 0.39,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: "#c5a467",
        metalness: 0.79,
        roughness: 0.25,
      }),
    }),
    [],
  );
  return (
    <group rotation={[0, -0.11, 0]}>
      <ModelPart id="housing" selectedPart={selectedPart} onSelect={onSelect}>
        <mesh
          castShadow
          material={materials.housing}
          position={[0, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.66, 0.66, 2.62, 64]} />
        </mesh>
        <mesh
          castShadow
          material={materials.brass}
          position={[0.44, 0.03, 0.57]}
        >
          <boxGeometry args={[0.075, 0.15, 0.55]} />
        </mesh>
      </ModelPart>

      <CoolingFins selectedPart={selectedPart} onSelect={onSelect} />

      <ModelPart id="drive-end" selectedPart={selectedPart} onSelect={onSelect}>
        <group position={[1.37, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow material={materials.end}>
            <cylinderGeometry args={[0.716, 0.716, 0.25, 56]} />
          </mesh>
          <mesh position={[0, 0.135, 0]} material={materials.darkSteel}>
            <cylinderGeometry args={[0.33, 0.39, 0.035, 48]} />
          </mesh>
          <mesh position={[0, 0.164, 0]} material={materials.inset}>
            <cylinderGeometry args={[0.24, 0.31, 0.025, 48]} />
          </mesh>
          <mesh position={[0, 0.181, 0]} material={materials.steel}>
            <cylinderGeometry args={[0.17, 0.22, 0.026, 48]} />
          </mesh>
          <mesh position={[0, 0.196, 0]} material={materials.inset}>
            <cylinderGeometry args={[0.105, 0.15, 0.03, 40]} />
          </mesh>
          <mesh
            castShadow
            material={materials.brass}
            position={[0, 0.213, 0]}
          >
            <cylinderGeometry args={[0.075, 0.095, 0.024, 40]} />
          </mesh>
        </group>
      </ModelPart>

      <ModelPart
        id="non-drive-end"
        selectedPart={selectedPart}
        onSelect={onSelect}
      >
        <group position={[-1.37, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow material={materials.end}>
            <cylinderGeometry args={[0.716, 0.716, 0.25, 56]} />
          </mesh>
          <mesh
            position={[0, -0.135, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.darkSteel}
          >
            <cylinderGeometry args={[0.44, 0.44, 0.045, 48]} />
          </mesh>
          <mesh
            position={[0, -0.16, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.inset}
          >
            <cylinderGeometry args={[0.34, 0.34, 0.025, 48]} />
          </mesh>
          <mesh
            position={[0, -0.18, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.steel}
          >
            <cylinderGeometry args={[0.23, 0.23, 0.024, 48]} />
          </mesh>
          <mesh
            position={[0, -0.196, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={materials.darkSteel}
          >
            <cylinderGeometry args={[0.12, 0.12, 0.025, 40]} />
          </mesh>
          {Array.from({ length: 12 }, (_, index) => {
            const angle = (index / 12) * Math.PI * 2;
            const y = Math.cos(angle) * 0.52;
            const z = Math.sin(angle) * 0.52;

            return (
              <mesh
                key={index}
                material={materials.inset}
                position={[0, y, z]}
              >
                <boxGeometry args={[0.05, 0.12, 0.035]} />
              </mesh>
            );
          })}
        </group>
      </ModelPart>

      <ModelPart id="shaft" selectedPart={selectedPart} onSelect={onSelect}>
        <group position={[1.92, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow material={materials.steel}>
            <cylinderGeometry args={[0.095, 0.125, 0.82, 40]} />
          </mesh>
          <mesh
            castShadow
            material={materials.steel}
            position={[0, 0.38, 0]}
          >
            <cylinderGeometry args={[0.075, 0.095, 0.11, 32]} />
          </mesh>
          <mesh
            material={materials.darkSteel}
            position={[0, -0.04, 0]}
          >
            <cylinderGeometry args={[0.127, 0.127, 0.045, 40]} />
          </mesh>
          <mesh material={materials.inset} position={[0, 0.02, 0.105]}>
            <boxGeometry args={[0.54, 0.085, 0.028]} />
          </mesh>
        </group>
      </ModelPart>

      <ModelPart id="mounting" selectedPart={selectedPart} onSelect={onSelect}>
        {[-0.88, 0.88].map((x) => (
          <group key={x} position={[x, -0.71, 0]}>
            <mesh castShadow material={materials.housing}>
              <boxGeometry args={[0.62, 0.25, 1.48]} />
            </mesh>
            <mesh material={materials.end} position={[0, -0.16, 0]}>
              <boxGeometry args={[0.7, 0.09, 1.62]} />
            </mesh>
            {[-0.54, 0.54].map((z) => (
              <mesh
                key={z}
                castShadow
                material={materials.brass}
                position={[0, -0.211, z]}
              >
                <cylinderGeometry args={[0.07, 0.07, 0.035, 20]} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh
          castShadow
          material={materials.housing}
          position={[0, -0.86, 0]}
        >
          <boxGeometry args={[2.34, 0.08, 1.5]} />
        </mesh>
      </ModelPart>

      <ModelPart
        id="terminal-box"
        selectedPart={selectedPart}
        onSelect={onSelect}
      >
        <group position={[0.08, 0.83, 0]}>
          <mesh castShadow material={materials.terminal}>
            <boxGeometry args={[0.84, 0.46, 0.74]} />
          </mesh>
          <mesh
            castShadow
            material={materials.end}
            position={[0, 0.245, 0]}
          >
            <boxGeometry args={[0.93, 0.075, 0.82]} />
          </mesh>
          <mesh
            material={materials.inset}
            position={[0.427, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.31, 0.19]} />
          </mesh>
          <mesh material={materials.brass} position={[0.449, 0, 0]}>
            <boxGeometry args={[0.018, 0.028, 0.3]} />
          </mesh>
          <mesh
            material={materials.end}
            position={[0, -0.263, 0]}
          >
            <boxGeometry args={[0.48, 0.06, 0.43]} />
          </mesh>
        </group>
      </ModelPart>
    </group>
  );
}

class WebGLSceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Digital twin WebGL viewer failed to initialize.", error, info);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function MotorScene({
  selectedPart,
  onSelect,
  autoRotate,
  resetToken,
  onViewerReady,
  onViewerError,
}: {
  selectedPart: MotorComponentId | null;
  onSelect: (id: MotorComponentId) => void;
  autoRotate: boolean;
  resetToken: number;
  onViewerReady: () => void;
  onViewerError: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const initialCamera = useMemo(() => new THREE.Vector3(4.9, 3.2, 6.3), []);

  return (
    <WebGLSceneErrorBoundary
      fallback={
        <div className="twin-fallback" role="status">
          <strong>Interactive 3D view unavailable</strong>
          <span>
            This device or browser could not initialize the local WebGL
            viewer. Measurements and component descriptions remain available.
          </span>
          <button className="ui-button button-secondary" onClick={onViewerError} type="button">
            Use text component view
          </button>
        </div>
      }
    >
      <Canvas
        camera={{ fov: 38, near: 0.1, far: 100, position: initialCamera.toArray() }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#080d18", 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          onViewerReady();
        }}
      >
        <color attach="background" args={["#080d18"]} />
        <ambientLight intensity={1.7} />
        <directionalLight
          castShadow
          intensity={3.2}
          position={[2, 6, 5]}
          shadow-mapSize-height={1024}
          shadow-mapSize-width={1024}
        />
        <pointLight color="#3cb9d6" intensity={75} position={[-4, 1, -3]} />
        <pointLight color="#88b6d0" intensity={34} position={[5, 1, 3]} />
        <Suspense fallback={null}>
          <ElectricMotor selectedPart={selectedPart} onSelect={onSelect} />
          <ContactShadows
            blur={2.5}
            far={4}
            opacity={0.42}
            position={[0, -0.99, 0]}
            scale={7}
          />
        </Suspense>
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={0.75}
          dampingFactor={0.08}
          enableDamping
          enablePan={false}
          maxDistance={10}
          maxPolarAngle={Math.PI * 0.82}
          minDistance={3.2}
          ref={controlsRef}
          target={[0, 0, 0]}
        />
        <ResetCamera token={resetToken} controlsRef={controlsRef} />
      </Canvas>
    </WebGLSceneErrorBoundary>
  );
}

function ResetCamera({
  token,
  controlsRef,
}: {
  token: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (token === 0) return;
    camera.position.set(4.9, 3.2, 6.3);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.reset();
    controlsRef.current?.update();
  }, [camera, controlsRef, token]);

  return null;
}
