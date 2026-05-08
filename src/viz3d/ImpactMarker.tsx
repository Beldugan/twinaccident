import { useRef } from 'react';
import * as THREE from 'three';

interface ImpactMarkerProps {
  position: [number, number, number];
  direction_deg: number;
}

export function ImpactMarker({ position, direction_deg }: ImpactMarkerProps) {
  const ref = useRef<THREE.Group>(null);
  const rad = (direction_deg * Math.PI) / 180;

  return (
    <group ref={ref} position={position}>
      {/* Impact sphere */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.7} emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>

      {/* Impact ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.9, 32]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Force direction arrow */}
      <arrowHelper
        args={[
          new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)).normalize(),
          new THREE.Vector3(0, 0.5, 0),
          3,
          0xff6666,
          0.8,
          0.4,
        ]}
      />

      {/* Label plane */}
      <mesh position={[0, 1.5, 0]}>
        <planeGeometry args={[1.5, 0.5]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
