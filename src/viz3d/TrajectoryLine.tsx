import { useMemo } from 'react';
import * as THREE from 'three';
import type { TrajectoryPoint } from '../physics/kinematics';

const TRAJ_SCALE = 0.22;

interface TrajectoryLineProps {
  points: TrajectoryPoint[];
  color: string;
  opacity?: number;
  ox?: number;
  oz?: number;
}

export function TrajectoryLine({ points, color, opacity = 0.8, ox = 0, oz = 0 }: TrajectoryLineProps) {
  const lineObject = useMemo(() => {
    const positions = points.flatMap(p => [
      p.y * TRAJ_SCALE + ox,
      0.05,
      p.x * TRAJ_SCALE + oz,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geo, mat);
  }, [points, color, opacity, ox, oz]);

  return <primitive object={lineObject} />;
}
