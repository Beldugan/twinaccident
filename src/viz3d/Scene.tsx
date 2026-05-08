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

// progress 0..1 = linia timpului.
// Pentru vehicule care se mișcă: urmăresc traiectoria pre-crash.
// Pentru victimă staționară: stau pe loc 0..0.85, apoi animez faza crash 0.85..1.
function AnimatedVehicle({ record, trajectory, progress, color, reconstruction }: {
  record: EdrRecord;
  trajectory: ReconstructionResult['preCrashTrajectory'];
  progress: number;
  color: string;
  reconstruction: ReconstructionResult;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    if (reconstruction.isStationaryVictim) {
      if (progress < 0.85) {
        groupRef.current.position.set(0, 0, 0);
        groupRef.current.rotation.y = 0;
      } else {
        const crashAlpha = (progress - 0.85) / 0.15;
        const eased = crashAlpha * crashAlpha * (3 - 2 * crashAlpha);
        const deltaV_ms = reconstruction.deltaV_longitudinal_kmh / 3.6;
        const crashDuration_s = reconstruction.crashDuration_ms / 1000 || 0.25;
        // Victima e împinsă înainte pe drum (axa Z)
        const postImpactDist = (deltaV_ms / 2) * crashDuration_s * eased * 8;
        groupRef.current.position.set(0, 0, postImpactDist);
        groupRef.current.rotation.y = 0;
      }
      return;
    }

    // Vehicul normal: urmăresc traiectoria
    // trajectory.x = distanță înainte → scene Z (de-a lungul drumului)
    // trajectory.y = deviație laterală → scene X
    // TRAJ_SCALE comprimă distanța vizuală (nu afectează fizica/datele)
    const TRAJ_SCALE = 0.22;
    if (trajectory.length < 2) return;
    const idx = Math.min(Math.floor(progress * (trajectory.length - 1)), trajectory.length - 2);
    const alpha = progress * (trajectory.length - 1) - idx;
    const p0 = trajectory[idx];
    const p1 = trajectory[idx + 1];
    const lx = (p0.y + (p1.y - p0.y) * alpha) * TRAJ_SCALE;
    const lz = (p0.x + (p1.x - p0.x) * alpha) * TRAJ_SCALE;
    const heading = p0.heading + (p1.heading - p0.heading) * alpha;

    groupRef.current.position.set(lx, 0, lz);
    groupRef.current.rotation.y = -heading;
  });

  return (
    <group ref={groupRef}>
      <Vehicle3D record={record} position={[0, 0, 0]} rotation={0} color={color} />
    </group>
  );
}

// Vehiculul agresor care apare din spate pentru scenariul rear-end
function AttackerVehicle({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    if (progress < 0.85) {
      // Vine din spate pe drum (direcție -Z) cu viteza agresorului
      const approachDist = -(1 - progress / 0.85) * 25;
      groupRef.current.position.set(0, 0, approachDist - 6);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 4.5]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, -1.5]}>
        <boxGeometry args={[1.6, 0.8, 2.5]} />
        <meshStandardMaterial color="#dc2626" roughness={0.2} />
      </mesh>
    </group>
  );
}

export function Scene3D({ record, reconstruction, progress }: SceneProps) {
  const impactPoint = reconstruction.preCrashTrajectory[reconstruction.preCrashTrajectory.length - 1];
  const showImpact = reconstruction.isStationaryVictim
    ? progress >= 0.83
    : progress >= 0.95;
  const TRAJ_SCALE = 0.22;
  const impactPos: [number, number, number] = reconstruction.isStationaryVictim
    ? [0, 0, 0]
    : [(impactPoint?.y ?? 0) * TRAJ_SCALE, 0, (impactPoint?.x ?? 0) * TRAJ_SCALE];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Canvas shadows>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 50, 200]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#4080ff" />

        <PerspectiveCamera makeDefault position={[15, 12, 20]} fov={55} />
        <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={80} />

        <Suspense fallback={null}>
          <Road />

          {!reconstruction.isStationaryVictim && (
            <TrajectoryLine points={reconstruction.preCrashTrajectory} color={COLORS.vehicle1} opacity={0.6} />
          )}

          <AnimatedVehicle
            record={record}
            trajectory={reconstruction.preCrashTrajectory}
            progress={progress}
            color={COLORS.vehicle1}
            reconstruction={reconstruction}
          />

          {reconstruction.isStationaryVictim && (
            <AttackerVehicle progress={progress} />
          )}

          {showImpact && (
            <ImpactMarker position={impactPos} direction_deg={reconstruction.impactDirection_deg} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
