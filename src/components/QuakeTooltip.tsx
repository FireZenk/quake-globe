import { useEffect, useRef } from 'react'
import { magnitudeColor } from '../lib/magnitude'
import type { Quake } from '../lib/usgs'

const OFFSET = 16
const timeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) // matches the English UI copy

/** "12 minutes ago", "3 hours ago"… */
function timeAgo(time: number) {
  const minutes = Math.round((time - Date.now()) / 60000)
  if (Math.abs(minutes) < 60) return relFmt.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) return relFmt.format(hours, 'hour')
  return relFmt.format(Math.round(hours / 24), 'day')
}

/** Card that follows the cursor with the details of the hovered quake. */
export function QuakeTooltip({ quake }: { quake: Quake | null }) {
  const card = useRef<HTMLDivElement>(null)

  // Follow the pointer straight from DOM events: no React re-render per mouse move.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = card.current
      if (!el) return
      const { offsetWidth: w, offsetHeight: h } = el
      // Flip to the other side of the cursor near the right / bottom edges.
      const x = e.clientX + OFFSET + w > window.innerWidth ? e.clientX - OFFSET - w : e.clientX + OFFSET
      const y = e.clientY + OFFSET + h > window.innerHeight ? e.clientY - OFFSET - h : e.clientY + OFFSET
      el.style.transform = `translate(${Math.max(x, 8)}px, ${Math.max(y, 8)}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const accent = quake ? `#${magnitudeColor(quake.mag).getHexString()}` : undefined

  return (
    <div ref={card} className={`tooltip${quake ? ' visible' : ''}`} role="tooltip" aria-hidden={!quake}>
      {quake && (
        <>
          <div className="tooltip-head">
            <span className="tooltip-mag" style={{ color: accent, borderColor: accent }}>
              M{quake.mag.toFixed(1)}
            </span>
            <span className="tooltip-place">{quake.place}</span>
          </div>
          <p className="tooltip-meta">
            <span title={timeFmt.format(quake.time)}>{timeAgo(quake.time)}</span> ·{' '}
            {quake.depth.toFixed(1)} km deep
          </p>
          {(quake.type !== 'earthquake' || quake.alert || quake.tsunami) && (
            <p className="tooltip-tags">
              {quake.type !== 'earthquake' && <span className="tag">{quake.type}</span>}
              {quake.alert && <span className={`tag alert-${quake.alert}`}>PAGER {quake.alert}</span>}
              {quake.tsunami && <span className="tag tsunami">Tsunami flag</span>}
            </p>
          )}
        </>
      )}
    </div>
  )
}
