import { OrbitControls, Stars } from '@react-three/drei'
import { Suspense } from 'react'
import { SUN_DIRECTION } from '../lib/sun'
import type { Quake } from '../lib/usgs'
import { Earth } from './Earth'
import { Quakes } from './Quakes'

/** Wireframe stand-in shown while the Earth textures are loading. */
function GlobeFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 36, 18]} />
      <meshBasicMaterial color="#ff6b3d" wireframe transparent opacity={0.35} />
    </mesh>
  )
}

interface Props {
  quakes: Quake[]
  hovered: Quake | null
  onHover: (quake: Quake | null) => void
}

/** Earth lit by a fixed sun over a starfield, with live quakes; the camera orbits around it. */
export function Scene({ quakes, hovered, onHover }: Props) {
  return (
    <>
      <color attach="background" args={['#05060a']} />
      <ambientLight intensity={0.06} />
      <directionalLight position={SUN_DIRECTION} intensity={3} />
      <Stars radius={80} depth={40} count={4000} factor={3} fade speed={0.4} />

      <Suspense fallback={<GlobeFallback />}>
        <Earth />
        <Quakes quakes={quakes} hovered={hovered} onHover={onHover} />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        minDistance={1.6}
        maxDistance={8}
        // Hold still while a quake is hovered so the tooltip doesn't drift off its marker.
        autoRotate={!hovered}
        autoRotateSpeed={0.35}
      />
    </>
  )
}
