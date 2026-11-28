import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, Object3D, Vector3 } from 'three'
import type { InstancedMesh, Mesh } from 'three'
import { latLonToVector3 } from '../lib/geo'
import { magnitudeColor, magnitudeRadius } from '../lib/magnitude'
import type { Quake } from '../lib/usgs'

// Just above the surface and city lights; drawn after the clouds so they never hide a marker.
const SURFACE = 1.004
const RENDER_ORDER = 2

// Which quakes get an expanding pulse ring: anything recent, plus every strong one.
const PULSE_RECENT_MS = 3 * 60 * 60 * 1000
const PULSE_MIN_MAG = 4.5
const PULSE_MAX = 256
// Seconds per pulse cycle and how far the ring grows, in marker radii.
const PULSE_PERIOD = 2.4
const PULSE_SPREAD = 5

// Invisible hit targets are bigger than the markers, so micro-quakes are still easy to hover.
const HIT_SCALE = 2.2
const HIT_MIN = 0.014

const dummy = new Object3D()
const color = new Color()
const outward = new Vector3()

interface Props {
  quakes: Quake[]
  hovered: Quake | null
  onHover: (quake: Quake | null) => void
}

/** Every quake as one instanced sphere on the globe, sized and colored by magnitude. */
export function Quakes({ quakes, hovered, onHover }: Props) {
  const mesh = useRef<InstancedMesh>(null)
  const hits = useRef<InstancedMesh>(null)

  // Weakest first: with depth writes off, later instances paint over earlier ones,
  // so strong quakes stay on top where markers overlap.
  const sorted = useMemo(() => [...quakes].sort((a, b) => a.mag - b.mag), [quakes])

  useLayoutEffect(() => {
    const m = mesh.current
    const h = hits.current
    if (!m || !h) return

    sorted.forEach((q, i) => {
      const r = magnitudeRadius(q.mag)
      latLonToVector3(q.lat, q.lon, SURFACE, dummy.position)

      dummy.scale.setScalar(r)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, magnitudeColor(q.mag, color))

      dummy.scale.setScalar(Math.max(r * HIT_SCALE, HIT_MIN))
      dummy.updateMatrix()
      h.setMatrixAt(i, dummy.matrix)
    })

    for (const im of [m, h]) {
      im.count = sorted.length
      im.instanceMatrix.needsUpdate = true
      im.computeBoundingSphere()
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [sorted])

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    // Hits come nearest first; only the first one decides.
    e.stopPropagation()
    const q = e.instanceId === undefined ? undefined : sorted[e.instanceId]
    if (!q) return onHover(null)

    // Raycasts ignore the Earth, so reject markers behind the horizon:
    // a point on the sphere faces the camera when p · camera > R².
    latLonToVector3(q.lat, q.lon, SURFACE, outward)
    onHover(outward.dot(e.camera.position) > 1 ? q : null)
  }

  if (sorted.length === 0) return null

  const capacity = capacityFor(sorted.length)

  return (
    <group>
      {/* Remount when the capacity has to grow; refreshes of similar size reuse the buffers. */}
      <instancedMesh
        key={`markers-${capacity}`}
        ref={mesh}
        args={[undefined, undefined, capacity]}
        renderOrder={RENDER_ORDER}
        frustumCulled={false}
        raycast={() => null}
      >
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        key={`hits-${capacity}`}
        ref={hits}
        args={[undefined, undefined, capacity]}
        frustumCulled={false}
        onPointerMove={handleMove}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </instancedMesh>

      <Pulses quakes={sorted} />
      {hovered && <HoverRing quake={hovered} />}
    </group>
  )
}

/** Expanding, fading rings around recent and strong quakes, like ripples on water. */
function Pulses({ quakes }: { quakes: Quake[] }) {
  const mesh = useRef<InstancedMesh>(null)

  const pulsing = useMemo(() => {
    // Measured from the newest quake in the feed, which keeps this pure and in step with the data.
    const since = quakes.reduce((t, q) => Math.max(t, q.time), 0) - PULSE_RECENT_MS
    return quakes
      .filter((q) => q.time >= since || q.mag >= PULSE_MIN_MAG)
      .slice(-PULSE_MAX) // sorted by magnitude, so the cap drops the weakest
      .map((q) => ({
        position: latLonToVector3(q.lat, q.lon, SURFACE),
        radius: magnitudeRadius(q.mag),
        color: magnitudeColor(q.mag),
        // Golden-ratio offsets keep neighbouring rings out of step; keyed on the
        // quake itself so rings don't jump when timeline playback adds markers.
        phase: ((q.time / 1000) * 0.618034) % 1,
        // Stronger quakes ripple a little slower and wider.
        speed: 1 / (PULSE_PERIOD + Math.max(q.mag, 0) * 0.12),
      }))
  }, [quakes])

  useFrame(({ clock }) => {
    const m = mesh.current
    if (!m) return
    const t = clock.elapsedTime

    pulsing.forEach((p, i) => {
      const k = (t * p.speed + p.phase) % 1
      dummy.position.copy(p.position)
      // Rings lie flat on the surface: point the ring's normal (+Z) straight out.
      dummy.lookAt(outward.copy(p.position).multiplyScalar(2))
      dummy.scale.setScalar(p.radius * (1 + k * PULSE_SPREAD))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // Additive blending: fading the color to black fades the ring out.
      m.setColorAt(i, color.copy(p.color).multiplyScalar((1 - k) * (1 - k)))
    })

    m.count = pulsing.length
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  if (pulsing.length === 0) return null

  return (
    <instancedMesh
      key={capacityFor(pulsing.length)}
      ref={mesh}
      args={[undefined, undefined, capacityFor(pulsing.length)]}
      renderOrder={RENDER_ORDER}
      frustumCulled={false}
      raycast={() => null}
    >
      <ringGeometry args={[0.82, 1, 48]} />
      <meshBasicMaterial
        side={DoubleSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

/** A crisp white ring that breathes around the hovered marker. */
function HoverRing({ quake }: { quake: Quake }) {
  const ring = useRef<Mesh>(null)
  const position = useMemo(() => latLonToVector3(quake.lat, quake.lon, SURFACE + 0.001), [quake])
  const radius = Math.max(magnitudeRadius(quake.mag) * 1.9, 0.012)

  useLayoutEffect(() => {
    ring.current?.lookAt(outward.copy(position).multiplyScalar(2))
  }, [position])

  useFrame(({ clock }) => {
    ring.current?.scale.setScalar(radius * (1 + 0.12 * Math.sin(clock.elapsedTime * 5)))
  })

  return (
    <mesh ref={ring} position={position} renderOrder={RENDER_ORDER + 1} raycast={() => null}>
      <ringGeometry args={[0.78, 1, 48]} />
      <meshBasicMaterial color="#ffffff" side={DoubleSide} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/** Round instance capacity up to the next 512 so feed refreshes rarely reallocate. */
const capacityFor = (n: number) => Math.ceil(n / 512) * 512
