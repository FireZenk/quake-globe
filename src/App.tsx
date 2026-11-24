import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { FeedStatus } from './components/FeedStatus'
import { MagnitudeLegend } from './components/MagnitudeLegend'
import { QuakeTooltip } from './components/QuakeTooltip'
import { Scene } from './components/Scene'
import { useQuakes } from './hooks/useQuakes'
import type { Quake } from './lib/usgs'

export default function App() {
  const quakes = useQuakes('day')
  const [hovered, setHovered] = useState<Quake | null>(null)

  return (
    <main className={`app${hovered ? ' hovering' : ''}`}>
      <Canvas
        className="canvas"
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene quakes={quakes.feed?.quakes ?? []} hovered={hovered} onHover={setHovered} />
      </Canvas>

      <header className="hud">
        <h1>
          quake<span>·</span>globe
        </h1>
        <p>Real-time earthquakes on a 3D Earth</p>
        <FeedStatus {...quakes} />
        {quakes.feed && <MagnitudeLegend />}
      </header>

      <QuakeTooltip quake={hovered} />

      <p className="hint">Drag to rotate · Scroll to zoom · Hover a quake for details</p>

      <footer className="credit">
        Data: <a href="https://earthquake.usgs.gov/earthquakes/feed/" target="_blank" rel="noreferrer">USGS</a>
      </footer>
    </main>
  )
}
