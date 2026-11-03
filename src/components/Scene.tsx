import { Stars } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'

/** Placeholder scene: a slowly spinning wireframe globe over a starfield. */
export function Scene() {
  const globe = useRef<Group>(null)

  useFrame((_, delta) => {
    if (globe.current) globe.current.rotation.y += delta * 0.08
  })

  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Stars radius={80} depth={40} count={4000} factor={3} fade speed={0.4} />

      <group ref={globe} rotation={[0.41, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#10243f" roughness={0.85} />
        </mesh>
        <mesh scale={1.01}>
          <sphereGeometry args={[1, 36, 18]} />
          <meshBasicMaterial color="#ff6b3d" wireframe transparent opacity={0.35} />
        </mesh>
      </group>
    </>
  )
}
