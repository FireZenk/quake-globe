import { useCallback, useEffect, useRef, useState } from 'react'

/** Playback speeds; at 1× one hour of the feed plays in one second. */
export const SPEEDS = [1, 2, 4] as const
export type Speed = (typeof SPEEDS)[number]

const HOUR_MS = 60 * 60 * 1000

export interface Playback {
  /** Where the playhead is, epoch ms; null means "live": show everything. */
  cursor: number | null
  playing: boolean
  speed: Speed
  seek: (time: number) => void
  toggle: () => void
  cycleSpeed: () => void
  goLive: () => void
}

/** Playhead over the [start, end] window that can be scrubbed or played back in real time. */
export function usePlayback(start: number, end: number): Playback {
  const [cursor, setCursor] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  // Source of truth for the playhead between renders, so the rAF loop and
  // scrubbing never read a stale value.
  const pos = useRef<number | null>(null)
  const range = useRef({ start, end, speed })
  useEffect(() => {
    range.current = { start, end, speed }
  }, [start, end, speed])

  const moveTo = useCallback((time: number | null) => {
    pos.current = time
    setCursor(time)
  }, [])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const { start: s, end: e, speed: v } = range.current
      // Clamp the step so a backgrounded tab doesn't jump hours on return.
      const dt = Math.min(now - last, 100)
      last = now
      const next = (pos.current ?? s) + dt * v * (HOUR_MS / 1000)

      if (next >= e) {
        // Reached the present: stop and hand back to the live view.
        moveTo(null)
        setPlaying(false)
        return
      }
      moveTo(next)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, moveTo])

  const seek = useCallback(
    (time: number) => {
      const { start: s, end: e } = range.current
      if (time >= e) {
        // Dragged all the way to "now": back to live.
        setPlaying(false)
        moveTo(null)
      } else {
        moveTo(Math.max(time, s))
      }
    },
    [moveTo],
  )

  const toggle = useCallback(() => {
    // Playing from live replays the day from the beginning.
    if (!playing && pos.current === null) moveTo(range.current.start)
    setPlaying(!playing)
  }, [playing, moveTo])

  const cycleSpeed = useCallback(() => setSpeed((v) => SPEEDS[(SPEEDS.indexOf(v) + 1) % SPEEDS.length]), [])

  const goLive = useCallback(() => {
    setPlaying(false)
    moveTo(null)
  }, [moveTo])

  return { cursor, playing, speed, seek, toggle, cycleSpeed, goLive }
}
