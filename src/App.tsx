import { Canvas } from '@react-three/fiber'
import { FeedStatus } from './components/FeedStatus'
import { Scene } from './components/Scene'
import { useQuakes } from './hooks/useQuakes'

export default function App() {
  const quakes = useQuakes('day')

  return (
    <main className="app">
      <Canvas
        className="canvas"
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>

      <header className="hud">
        <h1>
          quake<span>·</span>globe
        </h1>
        <p>Real-time earthquakes on a 3D Earth</p>
        <FeedStatus {...quakes} />
      </header>

      <p className="hint">Drag to rotate · Scroll to zoom</p>

      <footer className="credit">
        Data: <a href="https://earthquake.usgs.gov/earthquakes/feed/" target="_blank" rel="noreferrer">USGS</a>
      </footer>
    </main>
  )
}
