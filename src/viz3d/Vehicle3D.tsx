import { useRef } from 'react';
import * as THREE from 'three';
import type { EdrRecord } from '../edr/schema';

interface Vehicle3DProps {
  record: EdrRecord;
  position: [number, number, number];
  rotation: number;
  color: string;
  opacity?: number;
}

export function Vehicle3D({ record, position, rotation, color, opacity = 1 }: Vehicle3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  const length = record.vehicle.length_mm / 1000;
  const width = record.vehicle.width_mm / 1000;
  const height = record.vehicle.bodyType === 'suv' || record.vehicle.bodyType === 'van' ? 1.7 : 1.4;
  const wheelR = 0.33;
  const wheelW = 0.22;
  const wheelbase = record.vehicle.wheelbase_mm / 1000;
  const track = record.vehicle.track_mm / 1000;

  const bodyMat = (
    <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.3} metalness={0.4} />
  );

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height * 0.65, length]} />
        {bodyMat}
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, height * 0.7 + height * 0.15, -length * 0.05]}>
        <boxGeometry args={[width * 0.88, height * 0.35, length * 0.55]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.1} metalness={0.1} />
      </mesh>

      {/* Wheels */}
      {[
        [track / 2, wheelR, wheelbase / 2],
        [-track / 2, wheelR, wheelbase / 2],
        [track / 2, wheelR, -wheelbase / 2],
        [-track / 2, wheelR, -wheelbase / 2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Headlights */}
      <mesh position={[width * 0.3, height * 0.45, length / 2 + 0.01]}>
        <boxGeometry args={[0.2, 0.1, 0.02]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-width * 0.3, height * 0.45, length / 2 + 0.01]}>
        <boxGeometry args={[0.2, 0.1, 0.02]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
