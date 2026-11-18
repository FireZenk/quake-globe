import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Object3D } from 'three'
import type { InstancedMesh } from 'three'
import { latLonToVector3 } from '../lib/geo'
import { magnitudeColor, magnitudeRadius } from '../lib/magnitude'
import type { Quake } from '../lib/usgs'

// Just above the surface and city lights; drawn after the clouds so they never hide a marker.
const SURFACE = 1.004
const RENDER_ORDER = 2

const dummy = new Object3D()
const color = new Color()

/** Every quake as one instanced sphere on the globe, sized and colored by magnitude. */
export function Quakes({ quakes }: { quakes: Quake[] }) {
  const mesh = useRef<InstancedMesh>(null)

  // Weakest first: with depth writes off, later instances paint over earlier ones,
  // so strong quakes stay on top where markers overlap.
  const sorted = useMemo(() => [...quakes].sort((a, b) => a.mag - b.mag), [quakes])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return

    sorted.forEach((q, i) => {
      latLonToVector3(q.lat, q.lon, SURFACE, dummy.position)
      dummy.scale.setScalar(magnitudeRadius(q.mag))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, magnitudeColor(q.mag, color))
    })

    m.count = sorted.length
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [sorted])

  if (sorted.length === 0) return null

  return (
    // Remount when the capacity has to grow; refreshes of similar size reuse the buffers.
    <instancedMesh
      key={capacityFor(sorted.length)}
      ref={mesh}
      args={[undefined, undefined, capacityFor(sorted.length)]}
      renderOrder={RENDER_ORDER}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial transparent opacity={0.9} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

/** Round instance capacity up to the next 512 so feed refreshes rarely reallocate. */
const capacityFor = (n: number) => Math.ceil(n / 512) * 512
