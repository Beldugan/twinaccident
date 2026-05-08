import { useMemo } from 'react';
import * as THREE from 'three';
import type { TrajectoryPoint } from '../physics/kinematics';

interface TrajectoryLineProps {
  points: TrajectoryPoint[];
  color: string;
  opacity?: number;
}

export function TrajectoryLine({ points, color, opacity = 0.8 }: TrajectoryLineProps) {
  const lineObject = useMemo(() => {
    const S = 0.22; // același factor de scală ca în AnimatedVehicle
    const positions = points.flatMap(p => [p.y * S, 0.05, p.x * S]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geo, mat);
  }, [points, color, opacity]);

  return <primitive object={lineObject} />;
}
