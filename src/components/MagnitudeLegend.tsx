import { MAG_STOPS } from '../lib/magnitude'

const MAX = MAG_STOPS[MAG_STOPS.length - 1].mag
const pct = (mag: number) => `${(mag / MAX) * 100}%`

const gradient = `linear-gradient(90deg, ${MAG_STOPS.map((s) => `${s.color} ${pct(s.mag)}`).join(', ')})`

/** Color ramp key for the globe markers. */
export function MagnitudeLegend() {
  return (
    <section className="legend" aria-label="Magnitude color scale">
      <p className="legend-title">Magnitude</p>
      <div className="legend-bar" style={{ background: gradient }} />
      <div className="legend-ticks">
        {MAG_STOPS.map((s, i) => (
          <span key={s.mag} style={{ left: pct(s.mag) }}>
            {s.mag}
            {i === MAG_STOPS.length - 1 ? '+' : ''}
          </span>
        ))}
      </div>
    </section>
  )
}
