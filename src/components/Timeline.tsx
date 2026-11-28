import { useEffect, useMemo } from 'react'
import type { Playback } from '../hooks/usePlayback'
import { magnitudeColor } from '../lib/magnitude'
import type { Quake } from '../lib/usgs'

// Half-hour buckets for the activity histogram behind the scrubber.
const BINS = 48
const TICK_HOURS = 6
const HOUR_MS = 60 * 60 * 1000

const clockFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })

interface Props extends Playback {
  quakes: Quake[]
  start: number
  end: number
  /** How many quakes are on the globe at the current playhead. */
  shown: number
}

/** Bottom dock: per-half-hour activity histogram with a scrubber and playback controls. */
export function Timeline({ quakes, start, end, shown, cursor, playing, speed, seek, toggle, cycleSpeed, goLive }: Props) {
  const span = end - start
  const head = cursor ?? end
  const progress = span > 0 ? (head - start) / span : 1

  const bins = useMemo(() => {
    const out = Array.from({ length: BINS }, () => ({ count: 0, maxMag: -Infinity }))
    for (const q of quakes) {
      const i = Math.floor(((q.time - start) / span) * BINS)
      const bin = out[Math.min(Math.max(i, 0), BINS - 1)]
      bin.count++
      bin.maxMag = Math.max(bin.maxMag, q.mag)
    }
    // sqrt keeps quiet hours visible next to a busy aftershock sequence.
    const peak = Math.sqrt(Math.max(1, ...out.map((b) => b.count)))
    return out.map((b) => ({
      height: b.count ? 0.12 + 0.88 * (Math.sqrt(b.count) / peak) : 0,
      color: b.count ? `#${magnitudeColor(b.maxMag).getHexString()}` : 'transparent',
    }))
  }, [quakes, start, span])

  // Hour ticks on round local hours, every TICK_HOURS.
  const ticks = useMemo(() => {
    const d = new Date(start)
    d.setMinutes(0, 0, 0)
    while (d.getTime() < start || d.getHours() % TICK_HOURS) d.setHours(d.getHours() + 1)
    const out: number[] = []
    // Leave room for the "now" label at the right edge.
    for (let t = d.getTime(); t < end - 2 * HOUR_MS; t += TICK_HOURS * HOUR_MS) out.push(t)
    return out
  }, [start, end])

  // Space toggles playback, arrows step 15 minutes, Escape returns to live.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, button, textarea')) return
      if (e.code === 'Space') {
        e.preventDefault()
        toggle()
      } else if (e.key === 'Escape') {
        goLive()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        seek(head + (e.key === 'ArrowLeft' ? -1 : 1) * 15 * 60 * 1000)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, goLive, seek, head])

  const isLive = cursor === null

  return (
    <section className="timeline" aria-label="24-hour timeline">
      <div className="timeline-controls">
        <button
          type="button"
          className="tl-play"
          onClick={toggle}
          aria-label={playing ? 'Pause playback' : 'Replay the last 24 hours'}
          title={playing ? 'Pause (Space)' : 'Play (Space)'}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden>
              <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
              <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M4.5 2.8v10.4a.8.8 0 0 0 1.2.7l8.2-5.2a.8.8 0 0 0 0-1.4L5.7 2.1a.8.8 0 0 0-1.2.7z" />
            </svg>
          )}
        </button>
        <button type="button" className="tl-speed" onClick={cycleSpeed} title="Playback speed">
          {speed}×
        </button>

        <p className="tl-readout" aria-live="off">
          <span className="tl-time">{isLive ? clockFmt.format(end) : dayFmt.format(head)}</span>
          <span className="tl-count">
            <b>{shown.toLocaleString()}</b>
            {!isLive && <> / {quakes.length.toLocaleString()}</>} quakes
          </span>
        </p>

        <button
          type="button"
          className={`tl-live${isLive ? ' on' : ''}`}
          onClick={goLive}
          disabled={isLive}
          title="Jump to now (Esc)"
        >
          <span className="dot" /> Live
        </button>
      </div>

      <div className="timeline-track" style={{ ['--progress' as string]: progress }}>
        <div className="tl-bars" aria-hidden>
          {bins.map((b, i) => (
            <span
              key={i}
              className={(i + 0.5) / BINS > progress ? 'future' : undefined}
              style={{ height: `${b.height * 100}%`, background: b.color }}
            />
          ))}
        </div>
        <div className="tl-head" aria-hidden />
        <input
          type="range"
          className="tl-range"
          min={start}
          max={end}
          step={60 * 1000}
          value={head}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Timeline position"
          aria-valuetext={isLive ? 'Live' : dayFmt.format(head)}
        />
      </div>

      <div className="tl-ticks" aria-hidden>
        {ticks.map((t) => (
          <span key={t} style={{ left: `${((t - start) / span) * 100}%` }}>
            {clockFmt.format(t)}
          </span>
        ))}
        <span className="now" style={{ left: '100%' }}>
          now
        </span>
      </div>
    </section>
  )
}
