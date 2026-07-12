"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { VehicleStatus, VehicleType } from "@prisma/client";

/** Body colour is driven by operational status. */
const STATUS_COLOR: Record<VehicleStatus, string> = {
  AVAILABLE: "#a3e635",
  ON_TRIP: "#38bdf8",
  IN_SHOP: "#fbbf24",
  RETIRED: "#6b7280",
};

const GLASS = "#0b1220";
const TRIM = "#c9ced8";
const DARK = "#14161b";
const TYRE = "#0a0b0d";
const RIM = "#8e95a2";
const LAMP = "#fff3d0";

/* ------------------------------------------------------------------ */
/* Shared parts                                                        */
/* ------------------------------------------------------------------ */

function Wheel({
  position,
  radius = 0.3,
  width = 0.22,
}: {
  position: [number, number, number];
  radius?: number;
  width?: number;
}) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      {/* tyre */}
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, width, 24]} />
        <meshStandardMaterial color={TYRE} roughness={0.9} />
      </mesh>
      {/* rim */}
      <mesh position={[0, width * 0.52, 0]}>
        <cylinderGeometry args={[radius * 0.58, radius * 0.58, width * 0.12, 20]} />
        <meshStandardMaterial color={RIM} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -width * 0.52, 0]}>
        <cylinderGeometry args={[radius * 0.58, radius * 0.58, width * 0.12, 20]} />
        <meshStandardMaterial color={RIM} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Dual rear wheels for heavy vehicles. */
function DualWheel({ x, z, radius = 0.36 }: { x: number; z: number; radius?: number }) {
  const off = 0.13;
  return (
    <>
      <Wheel position={[x, 0, z > 0 ? z - off : z + off]} radius={radius} width={0.2} />
      <Wheel position={[x, 0, z > 0 ? z + off : z - off]} radius={radius} width={0.2} />
    </>
  );
}

function Headlights({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <>
      {[-z, z].map((sz, i) => (
        <mesh key={i} position={[x, y, sz]}>
          <boxGeometry args={[0.06, 0.12, 0.26]} />
          <meshStandardMaterial color={LAMP} emissive={LAMP} emissiveIntensity={1.3} />
        </mesh>
      ))}
    </>
  );
}

function TailLights({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <>
      {[-z, z].map((sz, i) => (
        <mesh key={i} position={[x, y, sz]}>
          <boxGeometry args={[0.05, 0.14, 0.2]} />
          <meshStandardMaterial color="#ff2d2d" emissive="#ff2d2d" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  );
}

const bodyMat = (color: string) => (
  <meshStandardMaterial color={color} metalness={0.25} roughness={0.42} />
);

/* ------------------------------------------------------------------ */
/* CAR — sedan: low, sloped cabin, 4 wheels                            */
/* ------------------------------------------------------------------ */
function Car({ color }: { color: string }) {
  return (
    <group position={[0, 0.05, 0]}>
      {/* lower body */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[3.5, 0.46, 1.5]} />
        {bodyMat(color)}
      </mesh>
      {/* bonnet + boot shoulders */}
      <mesh position={[1.25, 0.68, 0]} castShadow>
        <boxGeometry args={[1.0, 0.16, 1.42]} />
        {bodyMat(color)}
      </mesh>
      <mesh position={[-1.35, 0.68, 0]} castShadow>
        <boxGeometry args={[0.8, 0.18, 1.42]} />
        {bodyMat(color)}
      </mesh>
      {/* cabin (tapered via a smaller top box) */}
      <mesh position={[-0.15, 0.82, 0]} castShadow>
        <boxGeometry args={[1.9, 0.42, 1.4]} />
        {bodyMat(color)}
      </mesh>
      <mesh position={[-0.15, 1.03, 0]} castShadow>
        <boxGeometry args={[1.5, 0.06, 1.3]} />
        {bodyMat(color)}
      </mesh>
      {/* glasshouse */}
      <mesh position={[-0.15, 0.85, 0]}>
        <boxGeometry args={[1.82, 0.34, 1.44]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* grille + bumpers */}
      <mesh position={[1.76, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.3, 1.3]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[-1.76, 0.42, 0]}>
        <boxGeometry args={[0.08, 0.3, 1.3]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      <Headlights x={1.74} y={0.6} z={0.5} />
      <TailLights x={-1.74} y={0.62} z={0.55} />
      {/* wheels */}
      <Wheel position={[1.1, 0.05, 0.78]} radius={0.3} />
      <Wheel position={[1.1, 0.05, -0.78]} radius={0.3} />
      <Wheel position={[-1.15, 0.05, 0.78]} radius={0.3} />
      <Wheel position={[-1.15, 0.05, -0.78]} radius={0.3} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* VAN — tall boxy panel van, sloped nose                              */
/* ------------------------------------------------------------------ */
function Van({ color }: { color: string }) {
  return (
    <group position={[0, 0.06, 0]}>
      {/* cargo box */}
      <mesh position={[-0.45, 1.0, 0]} castShadow>
        <boxGeometry args={[2.5, 1.5, 1.66]} />
        {bodyMat(color)}
      </mesh>
      {/* roof rib detail */}
      {[-1.3, -0.6, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 1.77, 0]}>
          <boxGeometry args={[0.06, 0.05, 1.6]} />
          <meshStandardMaterial color={DARK} roughness={0.8} />
        </mesh>
      ))}
      {/* nose / bonnet */}
      <mesh position={[1.15, 0.62, 0]} castShadow>
        <boxGeometry args={[0.85, 0.62, 1.6]} />
        {bodyMat(color)}
      </mesh>
      {/* cab upper + windscreen */}
      <mesh position={[0.92, 1.16, 0]} castShadow>
        <boxGeometry args={[0.5, 0.78, 1.62]} />
        {bodyMat(color)}
      </mesh>
      <mesh position={[0.95, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.62, 1.66]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* door windows */}
      {[0.85, -0.85].map((z, i) => (
        <mesh key={i} position={[0.55, 1.18, z]}>
          <boxGeometry args={[0.5, 0.5, 0.03] as [number, number, number]} />
          <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
        </mesh>
      ))}
      {/* rear door seam */}
      <mesh position={[-1.71, 1.0, 0]}>
        <boxGeometry args={[0.04, 1.3, 0.05]} />
        <meshStandardMaterial color={DARK} />
      </mesh>
      {/* bumpers */}
      <mesh position={[1.6, 0.36, 0]}>
        <boxGeometry args={[0.12, 0.24, 1.6]} />
        <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.6} />
      </mesh>
      <Headlights x={1.57} y={0.62} z={0.6} />
      <TailLights x={-1.7} y={1.35} z={0.68} />
      {/* wheels */}
      <Wheel position={[1.0, 0.06, 0.86]} radius={0.32} />
      <Wheel position={[1.0, 0.06, -0.86]} radius={0.32} />
      <Wheel position={[-1.1, 0.06, 0.86]} radius={0.32} />
      <Wheel position={[-1.1, 0.06, -0.86]} radius={0.32} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* PICKUP — cab + open cargo bed with walls                            */
/* ------------------------------------------------------------------ */
function Pickup({ color }: { color: string }) {
  const bedY = 0.72;
  return (
    <group position={[0, 0.06, 0]}>
      {/* chassis */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3.7, 0.34, 1.6]} />
        {bodyMat(color)}
      </mesh>
      {/* bonnet */}
      <mesh position={[1.35, 0.78, 0]} castShadow>
        <boxGeometry args={[1.0, 0.28, 1.56]} />
        {bodyMat(color)}
      </mesh>
      {/* cab */}
      <mesh position={[0.35, 1.06, 0]} castShadow>
        <boxGeometry args={[1.25, 0.72, 1.55]} />
        {bodyMat(color)}
      </mesh>
      <mesh position={[0.35, 1.1, 0]}>
        <boxGeometry args={[1.15, 0.5, 1.6]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* open bed: floor + 2 sides + tailgate */}
      <mesh position={[-1.05, bedY, 0]}>
        <boxGeometry args={[1.9, 0.08, 1.5]} />
        <meshStandardMaterial color={DARK} roughness={0.85} />
      </mesh>
      {[0.75, -0.75].map((z, i) => (
        <mesh key={i} position={[-1.05, bedY + 0.26, z]} castShadow>
          <boxGeometry args={[1.9, 0.46, 0.09]} />
          {bodyMat(color)}
        </mesh>
      ))}
      <mesh position={[-1.97, bedY + 0.26, 0]} castShadow>
        <boxGeometry args={[0.09, 0.46, 1.5]} />
        {bodyMat(color)}
      </mesh>
      {/* bumpers + lights */}
      <mesh position={[1.87, 0.44, 0]}>
        <boxGeometry args={[0.12, 0.24, 1.55]} />
        <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.6} />
      </mesh>
      <Headlights x={1.84} y={0.72} z={0.58} />
      <TailLights x={-1.99} y={0.8} z={0.6} />
      {/* wheels — chunkier */}
      <Wheel position={[1.25, 0.06, 0.86]} radius={0.36} width={0.26} />
      <Wheel position={[1.25, 0.06, -0.86]} radius={0.36} width={0.26} />
      <Wheel position={[-1.25, 0.06, 0.86]} radius={0.36} width={0.26} />
      <Wheel position={[-1.25, 0.06, -0.86]} radius={0.36} width={0.26} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* TRUCK — heavy rigid: tall cab, container body, 6 wheels, stack      */
/* ------------------------------------------------------------------ */
function Truck({ color }: { color: string }) {
  return (
    <group position={[0, 0.1, 0]}>
      {/* chassis rail */}
      <mesh position={[-0.1, 0.5, 0]}>
        <boxGeometry args={[4.5, 0.2, 1.3]} />
        <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* cargo container */}
      <mesh position={[-1.15, 1.42, 0]} castShadow>
        <boxGeometry args={[2.9, 1.62, 1.78]} />
        {bodyMat(color)}
      </mesh>
      {/* container corrugation */}
      {[-2.3, -1.85, -1.4, -0.95, -0.5, -0.05].map((x, i) => (
        <mesh key={i} position={[x, 1.42, 0.9]}>
          <boxGeometry args={[0.05, 1.5, 0.03]} />
          <meshStandardMaterial color={DARK} roughness={0.9} />
        </mesh>
      ))}
      {/* cab */}
      <mesh position={[1.35, 1.14, 0]} castShadow>
        <boxGeometry args={[1.35, 1.28, 1.72]} />
        <meshStandardMaterial color={TRIM} metalness={0.35} roughness={0.4} />
      </mesh>
      {/* windscreen */}
      <mesh position={[1.75, 1.38, 0]}>
        <boxGeometry args={[0.6, 0.62, 1.64]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* side cab windows */}
      {[0.87, -0.87].map((z, i) => (
        <mesh key={i} position={[1.3, 1.36, z]}>
          <boxGeometry args={[0.7, 0.5, 0.03]} />
          <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
        </mesh>
      ))}
      {/* grille + bumper */}
      <mesh position={[2.03, 0.86, 0]}>
        <boxGeometry args={[0.1, 0.5, 1.6]} />
        <meshStandardMaterial color={DARK} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[2.06, 0.5, 0]}>
        <boxGeometry args={[0.14, 0.26, 1.7]} />
        <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.6} />
      </mesh>
      <Headlights x={2.02} y={0.66} z={0.62} />
      <TailLights x={-2.62} y={0.8} z={0.72} />
      {/* exhaust stack */}
      <mesh position={[0.62, 1.5, 0.82]}>
        <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
        <meshStandardMaterial color={RIM} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* fuel tank */}
      <mesh position={[0.5, 0.44, 0.72]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.85, 16]} />
        <meshStandardMaterial color={RIM} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* wheels: 2 front + 4 rear (dual) */}
      <Wheel position={[1.5, 0.1, 0.85]} radius={0.38} width={0.22} />
      <Wheel position={[1.5, 0.1, -0.85]} radius={0.38} width={0.22} />
      <DualWheel x={-1.15} z={0.82} />
      <DualWheel x={-1.15} z={-0.82} />
      <DualWheel x={-2.0} z={0.82} />
      <DualWheel x={-2.0} z={-0.82} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* BUS — long body, window strip, door, roof vents                     */
/* ------------------------------------------------------------------ */
function Bus({ color }: { color: string }) {
  return (
    <group position={[0, 0.08, 0]}>
      {/* main body */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[5.4, 1.7, 1.9]} />
        {bodyMat(color)}
      </mesh>
      {/* skirt */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[5.3, 0.36, 1.84]} />
        <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.7} />
      </mesh>
      {/* continuous window strip both sides */}
      {[0.96, -0.96].map((z, i) => (
        <mesh key={i} position={[-0.25, 1.52, z]}>
          <boxGeometry args={[4.4, 0.66, 0.04]} />
          <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
        </mesh>
      ))}
      {/* window pillars */}
      {[-2.2, -1.5, -0.8, -0.1, 0.6, 1.3].map((x, i) =>
        [0.98, -0.98].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 1.52, z]}>
            <boxGeometry args={[0.07, 0.68, 0.05]} />
            {bodyMat(color)}
          </mesh>
        )),
      )}
      {/* windscreen */}
      <mesh position={[2.72, 1.42, 0]}>
        <boxGeometry args={[0.06, 0.86, 1.76]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* rear window */}
      <mesh position={[-2.72, 1.5, 0]}>
        <boxGeometry args={[0.06, 0.6, 1.7]} />
        <meshStandardMaterial color={GLASS} metalness={0.9} roughness={0.12} />
      </mesh>
      {/* passenger door */}
      <mesh position={[1.95, 1.05, 0.96]}>
        <boxGeometry args={[0.7, 1.3, 0.05]} />
        <meshStandardMaterial color={GLASS} metalness={0.85} roughness={0.18} />
      </mesh>
      {/* roof vents */}
      {[-1.6, 0.2, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 2.12, 0]}>
          <boxGeometry args={[0.5, 0.12, 0.7]} />
          <meshStandardMaterial color={TRIM} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* bumpers + lights */}
      <mesh position={[2.74, 0.5, 0]}>
        <boxGeometry args={[0.12, 0.28, 1.86]} />
        <meshStandardMaterial color={DARK} metalness={0.5} roughness={0.6} />
      </mesh>
      <Headlights x={2.73} y={0.78} z={0.72} />
      <TailLights x={-2.74} y={0.9} z={0.74} />
      {/* wheels */}
      <Wheel position={[1.95, 0.08, 0.98]} radius={0.4} width={0.24} />
      <Wheel position={[1.95, 0.08, -0.98]} radius={0.4} width={0.24} />
      <DualWheel x={-1.85} z={0.95} radius={0.4} />
      <DualWheel x={-1.85} z={-0.95} radius={0.4} />
    </group>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Per-type scale so bodies of very different lengths all frame consistently.
 * The group spins, so these are tuned against the model's *diagonal*, not its
 * length — otherwise long bodies clip the frame as they turn broadside.
 */
const FIT: Record<VehicleType, number> = {
  CAR: 0.88,
  VAN: 0.88,
  PICKUP: 0.84,
  TRUCK: 0.68,
  BUS: 0.58,
};

function Model({ type, status }: { type: VehicleType; status: VehicleStatus }) {
  const ref = useRef<THREE.Group>(null);
  const color = STATUS_COLOR[status];

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.45;
  });

  const body =
    type === "CAR" ? <Car color={color} /> :
    type === "VAN" ? <Van color={color} /> :
    type === "PICKUP" ? <Pickup color={color} /> :
    type === "BUS" ? <Bus color={color} /> :
    <Truck color={color} />;

  return (
    <group ref={ref} scale={FIT[type] ?? 1} position={[0, -0.55, 0]} rotation={[0, 0.6, 0]}>
      {body}
    </group>
  );
}

export function VehicleModel({
  status,
  type = "TRUCK",
}: {
  status: VehicleStatus;
  type?: VehicleType;
}) {
  return (
    <Canvas
      camera={{ position: [5.4, 3.0, 5.8], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.8]}
      shadows
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 7, 4]} intensity={1.7} castShadow />
      <directionalLight position={[-5, 3, -4]} intensity={0.55} color="#7fb2ff" />
      <directionalLight position={[0, 2, 6]} intensity={0.35} />
      <Model type={type} status={status} />
      <ContactShadows position={[0, -0.62, 0]} opacity={0.55} scale={11} blur={2.6} far={5} />
    </Canvas>
  );
}
