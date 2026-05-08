export function Road() {

  return (
    <group>
      {/* Main road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
      </mesh>

      {/* Road shoulder */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 200]} />
        <meshStandardMaterial color="#4a4a3a" roughness={0.9} />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a2a1a" roughness={1.0} />
      </mesh>

      {/* Center line */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -90 + i * 10]}>
          <planeGeometry args={[0.15, 4]} />
          <meshStandardMaterial color="#f5f5a0" />
        </mesh>
      ))}

      {/* Edge lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.001, 0]}>
        <planeGeometry args={[0.15, 200]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[9, 0.001, 0]}>
        <planeGeometry args={[0.15, 200]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
