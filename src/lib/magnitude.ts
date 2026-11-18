import { Color } from 'three'

/** Color stops for the magnitude ramp, shared by the globe markers and the legend. */
export const MAG_STOPS = [
  { mag: 0, color: '#ffe066' },
  { mag: 2.5, color: '#ffb03b' },
  { mag: 4, color: '#ff6b3d' },
  { mag: 5.5, color: '#ff2e4d' },
  { mag: 7, color: '#d63cff' },
] as const

const STOP_COLORS = MAG_STOPS.map((s) => new Color(s.color))

/** Ramp color for a magnitude, linearly blended between the nearest stops. */
export function magnitudeColor(mag: number, target = new Color()) {
  const last = MAG_STOPS.length - 1
  if (mag <= MAG_STOPS[0].mag) return target.copy(STOP_COLORS[0])
  if (mag >= MAG_STOPS[last].mag) return target.copy(STOP_COLORS[last])

  const i = MAG_STOPS.findIndex((s) => s.mag > mag) - 1
  const t = (mag - MAG_STOPS[i].mag) / (MAG_STOPS[i + 1].mag - MAG_STOPS[i].mag)
  return target.copy(STOP_COLORS[i]).lerp(STOP_COLORS[i + 1], t)
}

/**
 * Marker radius in globe units. Magnitude is logarithmic, so an exponential
 * keeps big quakes clearly bigger while micro-quakes stay visible as specks.
 */
export function magnitudeRadius(mag: number) {
  const m = Math.min(Math.max(mag, 0), 9)
  return 0.0035 + 0.0022 * Math.pow(1.45, m)
}
