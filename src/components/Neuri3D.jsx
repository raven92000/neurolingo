import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function NeuriBody({ color = '#8B5CF6' }) {
  const groupRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.15
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.2
  })

  return (
    <group ref={groupRef}>

      {/* CORPS */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* VENTRE */}
      <mesh position={[0.1, -0.1, 0.7]}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color="#C4B5FD" roughness={0.4} metalness={0} opacity={0.6} transparent />
      </mesh>

      {/* TÊTE */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* ŒIL GAUCHE */}
      <mesh position={[-0.32, 1.52, 0.68]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#1A1433" roughness={0.1} />
      </mesh>
      <mesh position={[-0.32, 1.52, 0.88]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#0D0A1F" roughness={0.1} />
      </mesh>
      <mesh position={[-0.24, 1.6, 0.94]}>
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0} />
      </mesh>

      {/* ŒIL DROIT */}
      <mesh position={[0.32, 1.52, 0.68]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#1A1433" roughness={0.1} />
      </mesh>
      <mesh position={[0.32, 1.52, 0.88]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#0D0A1F" roughness={0.1} />
      </mesh>
      <mesh position={[0.4, 1.6, 0.94]}>
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0} />
      </mesh>

      {/* CRÊTE */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 2.2 + (i === 1 ? 0.12 : 0), 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#6D28D9" roughness={0.4} />
        </mesh>
      ))}

      {/* PATTE GAUCHE */}
      <mesh position={[-0.9, -0.8, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.12, 0.08, 0.8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      {/* PATTE DROITE */}
      <mesh position={[0.9, -0.8, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.12, 0.08, 0.8, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      {/* QUEUE */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[
          -0.8 - i * 0.3,
          -0.2 + i * 0.15,
          0
        ]}>
          <sphereGeometry args={[0.18 - i * 0.025, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
      ))}

    </group>
  )
}

function Neuri3D({ color = '#8B5CF6' }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 7], fov: 35 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#8B5CF6" />
      <pointLight position={[0, 3, 3]} intensity={0.6} color="#C4B5FD" />
      <OrbitControls enableZoom={false} enablePan={false} />
      <NeuriBody color={color} />
    </Canvas>
  )
}

export default Neuri3D