import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Road } from './Road';
import { Vehicle3D } from './Vehicle3D';
import { TrajectoryLine } from './TrajectoryLine';
import { ImpactMarker } from './ImpactMarker';
import type { EdrRecord } from '../edr/schema';
import type { ReconstructionResult } from '../analysis/reconstruction';
import { COLORS } from '../utils/colors';

interface SceneProps {
  record: EdrRecord;
  reconstruction: ReconstructionResult;
  progress: number;
}

function AnimatedVehicle({ record, trajectory, progress, color }: {
  record: EdrRecord;
  trajectory: ReconstructionResult['preCrashTrajectory'];
  progress: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || trajectory.length < 2) return;
    const idx = Math.min(
      Math.floor(progress * (trajectory.length - 1)),
      trajectory.length - 2
    );
    const alpha = (progress * (trajectory.length - 1)) - idx;
    const p0 = trajectory[idx];
    const p1 = trajectory[idx + 1];

    const x = p0.x + (p1.x - p0.x) * alpha;
    const z = p0.y + (p1.y - p0.y) * alpha;
    const heading = p0.heading + (p1.heading - p0.heading) * alpha;

    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y = -heading;
  });

  return (
    <group ref={groupRef}>
      <Vehicle3D record={record} position={[0, 0, 0]} rotation={0} color={color} />
    </group>
  );
}

export function Scene3D({ record, reconstruction, progress }: SceneProps) {
  const impactPoint = reconstruction.preCrashTrajectory[reconstruction.preCrashTrajectory.length - 1];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Canvas shadows>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 50, 200]} />

        <ambientLight intensity={0.3} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#4080ff" />

        <PerspectiveCamera makeDefault position={[15, 12, 20]} fov={55} />
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={80}
        />

        <Suspense fallback={null}>
          <Road />

          <TrajectoryLine
            points={reconstruction.preCrashTrajectory}
            color={COLORS.vehicle1}
            opacity={0.6}
          />

          <AnimatedVehicle
            record={record}
            trajectory={reconstruction.preCrashTrajectory}
            progress={progress}
            color={COLORS.vehicle1}
          />

          {progress >= 0.95 && impactPoint && (
            <ImpactMarker
              position={[impactPoint.x, 0, impactPoint.y]}
              direction_deg={reconstruction.impactDirection_deg}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
