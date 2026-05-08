import { Suspense, useRef, useMemo } from 'react';
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

// Scală vizuală: comprimă 90m reali la ~20m în scenă
const TRAJ_SCALE = 0.22;

interface SceneProps {
  record: EdrRecord;
  reconstruction: ReconstructionResult;
  progress: number;
}

// Calculează offset-ul astfel încât IMPACTUL să fie la origine [0,0,0]
// — vehiculele apar în prim plan, impactul se produce în centrul camerei
function useTrajOffset(trajectory: ReconstructionResult['preCrashTrajectory']) {
  return useMemo(() => {
    const last = trajectory[trajectory.length - 1];
    if (!last) return { ox: 0, oz: 0 };
    return {
      ox: -(last.y * TRAJ_SCALE),  // lateral final → 0
      oz: -(last.x * TRAJ_SCALE),  // forward final → 0
    };
  }, [trajectory]);
}

function AnimatedVehicle({ record, trajectory, progress, color, reconstruction, ox, oz }: {
  record: EdrRecord;
  trajectory: ReconstructionResult['preCrashTrajectory'];
  progress: number;
  color: string;
  reconstruction: ReconstructionResult;
  ox: number;
  oz: number;
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
        const postImpactDist = (deltaV_ms / 2) * crashDuration_s * eased * 8;
        groupRef.current.position.set(0, 0, postImpactDist);
        groupRef.current.rotation.y = 0;
      }
      return;
    }

    if (trajectory.length < 2) return;
    const idx = Math.min(Math.floor(progress * (trajectory.length - 1)), trajectory.length - 2);
    const alpha = progress * (trajectory.length - 1) - idx;
    const p0 = trajectory[idx];
    const p1 = trajectory[idx + 1];

    // Poziție cu offset → impactul la [0,0,0]
    const lx = (p0.y + (p1.y - p0.y) * alpha) * TRAJ_SCALE + ox;
    const lz = (p0.x + (p1.x - p0.x) * alpha) * TRAJ_SCALE + oz;
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

function AttackerVehicle({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    if (progress < 0.85) {
      // Agresorul vine din -Z (din spatele victimei staționate la origine)
      const approachDist = -(1 - progress / 0.85) * 22;
      groupRef.current.position.set(0, 0, approachDist - 5);
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
  const { ox, oz } = useTrajOffset(reconstruction.preCrashTrajectory);
  const showImpact = reconstruction.isStationaryVictim ? progress >= 0.83 : progress >= 0.95;

  // Impactul este ÎNTOTDEAUNA la [0,0,0] — centrul camerei
  const impactPos: [number, number, number] = [0, 0, 0];

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 420 }}>
      <Canvas shadows>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 40, 120]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
        <pointLight position={[0, 8, 0]} intensity={0.8} color="#4080ff" />
        {/* Lumină extra la punctul de impact pentru evidențiere */}
        <pointLight position={[0, 5, 0]} intensity={0.6} color="#ff4444" distance={15} />

        {/* Camera laterală-oblică: vehiculele vin dinspre -Z spre 0 */}
        <PerspectiveCamera makeDefault position={[12, 8, -18]} fov={50} />
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={60}
        />

        <Suspense fallback={null}>
          <Road />

          {!reconstruction.isStationaryVictim && (
            <TrajectoryLine
              points={reconstruction.preCrashTrajectory}
              color={COLORS.vehicle1}
              opacity={0.7}
              ox={ox}
              oz={oz}
            />
          )}

          <AnimatedVehicle
            record={record}
            trajectory={reconstruction.preCrashTrajectory}
            progress={progress}
            color={COLORS.vehicle1}
            reconstruction={reconstruction}
            ox={ox}
            oz={oz}
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
