import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

function NeuriModel({ color }) {
  const { scene } = useGLTF('/Neuri.glb')
  const ref = useRef()

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = -0.2 + Math.sin(state.clock.elapsedTime * 1.2) * 0.05
      ref.current.rotation.y = 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08
    }
  })

  useEffect(() => {
    if (color) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone()
        }
      })
    }
  }, [color, scene])

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={0.85}
      position={[0, -0.2, 0]}
      rotation={[0, 0.3, 0]}
    />
  )
}

export default function Neuri3D({ color }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 35 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <directionalLight position={[-3, 3, -3]} intensity={0.5} color="#a78bfa" />
      <NeuriModel color={color} />
    </Canvas>
  )
}

useGLTF.preload('/Neuri.glb')