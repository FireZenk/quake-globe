import { Canvas } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { FeedStatus } from './components/FeedStatus'
import { MagnitudeLegend } from './components/MagnitudeLegend'
import { QuakeTooltip } from './components/QuakeTooltip'
import { Scene } from './components/Scene'
import { Timeline } from './components/Timeline'
import { usePlayback } from './hooks/usePlayback'
import { useQuakes } from './hooks/useQuakes'
import type { Quake } from './lib/usgs'

const DAY_MS = 24 * 60 * 60 * 1000
const NO_QUAKES: Quake[] = []

/** Index of the first quake at or before `time` in a newest-first list. */
function firstAtOrBefore(quakes: Quake[], time: number) {
  let lo = 0
  let hi = quakes.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (quakes[mid].time > time) lo = mid + 1
    else hi = mid
  }
  return lo
}

export default function App() {
  const quakes = useQuakes('day')
  const [hovered, setHovered] = useState<Quake | null>(null)

  const all = quakes.feed?.quakes ?? NO_QUAKES
  const end = quakes.feed?.generated ?? 0
  const start = end - DAY_MS
  const playback = usePlayback(start, end)

  // The feed is newest first, so "everything up to the playhead" is a tail of it.
  // Memoising on the index means the globe only updates when a quake appears.
  const from = playback.cursor === null ? 0 : firstAtOrBefore(all, playback.cursor)
  const visible = useMemo(() => (from === 0 ? all : all.slice(from)), [all, from])

  // Drop the hover if scrubbing hides that quake.
  const shownHover = hovered && hovered.time <= (playback.cursor ?? Infinity) ? hovered : null

  return (
    <main className={`app${shownHover ? ' hovering' : ''}`}>
      <Canvas
        className="canvas"
        camera={{ position: [0, 0, 3.6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene quakes={visible} hovered={shownHover} onHover={setHovered} />
      </Canvas>

      <header className="hud">
        <h1>
          quake<span>·</span>globe
        </h1>
        <p>Real-time earthquakes on a 3D Earth</p>
        <FeedStatus {...quakes} />
        {quakes.feed && <MagnitudeLegend />}
      </header>

      <QuakeTooltip quake={shownHover} />

      {quakes.feed && <Timeline {...playback} quakes={all} start={start} end={end} shown={visible.length} />}

      <p className="hint">Drag to rotate · Scroll to zoom · Space to replay the day</p>

      <footer className="credit">
        Data: <a href="https://earthquake.usgs.gov/earthquakes/feed/" target="_blank" rel="noreferrer">USGS</a>
      </footer>
    </main>
  )
}
