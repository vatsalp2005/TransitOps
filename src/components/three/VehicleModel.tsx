"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { VehicleStatus } from "@prisma/client";

const STATUS_COLOR: Record<VehicleStatus, string> = {
  AVAILABLE: "#34d399",
  ON_TRIP: "#38bdf8",
  IN_SHOP: "#fbbf24",
  RETIRED: "#71717a",
};

function Truck({ status }: { status: VehicleStatus }) {
  const ref = useRef<THREE.Group>(null);
  const color = STATUS_COLOR[status];
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5;
  });

  return (
    <group ref={ref} position={[0, -0.35, 0]} rotation={[0, 0.5, 0]}>
      {/* Cargo body — tinted by status */}
      <mesh position={[-0.5, 0.55, 0]} castShadow>
        <boxGeometry args={[1.8, 1.1, 1.3]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.5} emissive={color} emissiveIntensity={0.18} />
      </mesh>
      {/* Cab */}
      <mesh position={[1.05, 0.42, 0]} castShadow>
        <boxGeometry args={[0.9, 0.85, 1.25]} />
        <meshStandardMaterial color="#d7dbe4" metalness={0.2} roughness={0.45} />
      </mesh>
      {/* Windshield */}
      <mesh position={[1.42, 0.55, 0]}>
        <boxGeometry args={[0.18, 0.5, 1.1]} />
        <meshStandardMaterial color="#0b1220" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Chassis */}
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[3, 0.25, 1.1]} />
        <meshStandardMaterial color="#1a1d25" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {[
        [1.1, -0.7],
        [-0.5, -0.7],
        [-1.1, -0.7],
        [1.1, 0.7],
        [-0.5, 0.7],
        [-1.1, 0.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.18, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 20]} />
          <meshStandardMaterial color="#0c0e13" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function VehicleModel({ status }: { status: VehicleStatus }) {
  return (
    <Canvas camera={{ position: [3.4, 2, 4], fov: 40 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.8]} shadows>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 3]} intensity={1.6} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#38bdf8" />
      <Truck status={status} />
      <ContactShadows position={[0, -0.7, 0]} opacity={0.5} scale={9} blur={2.4} far={4} />
    </Canvas>
  );
}
