/**
 * USGS real-time earthquake feed: types, fetching and parsing.
 * https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 */

export type FeedPeriod = 'hour' | 'day' | 'week'

const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'

export const feedUrl = (period: FeedPeriod) => `${FEED_BASE}/all_${period}.geojson`

/** One earthquake, flattened from a GeoJSON feature into what the app needs. */
export interface Quake {
  id: string
  /** Magnitude; can be slightly negative for tiny local events. */
  mag: number
  place: string
  /** Origin time, epoch milliseconds (UTC). */
  time: number
  lat: number
  lon: number
  /** Hypocenter depth in km below sea level. */
  depth: number
  /** USGS event page. */
  url: string
  tsunami: boolean
  /** PAGER alert level, when USGS issued one. */
  alert: 'green' | 'yellow' | 'orange' | 'red' | null
  /** earthquake, quarry blast, explosion, ice quake… */
  type: string
}

export interface QuakeFeed {
  quakes: Quake[]
  /** When USGS generated the feed, epoch ms. */
  generated: number
  title: string
}

// Only the fields we read; the real feed carries many more.
interface RawFeature {
  id?: unknown
  properties?: {
    mag?: unknown
    place?: unknown
    time?: unknown
    url?: unknown
    tsunami?: unknown
    alert?: unknown
    type?: unknown
  }
  geometry?: { coordinates?: unknown }
}

interface RawCollection {
  type?: unknown
  metadata?: { generated?: unknown; title?: unknown }
  features?: unknown
}

const ALERTS = new Set(['green', 'yellow', 'orange', 'red'])

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Turn one raw feature into a Quake, or null if it lacks a position, time or magnitude. */
function parseFeature(f: RawFeature): Quake | null {
  const p = f.properties
  const coords = f.geometry?.coordinates
  if (!p || !Array.isArray(coords)) return null

  const [lon, lat, depth] = coords as unknown[]
  if (!isNum(lon) || !isNum(lat) || !isNum(p.time) || !isNum(p.mag)) return null

  return {
    id: typeof f.id === 'string' ? f.id : `${p.time}:${lat}:${lon}`,
    mag: p.mag,
    place: typeof p.place === 'string' && p.place ? p.place : 'Unknown location',
    time: p.time,
    lat,
    lon,
    depth: isNum(depth) ? depth : 0,
    url: typeof p.url === 'string' ? p.url : '',
    tsunami: p.tsunami === 1,
    alert: typeof p.alert === 'string' && ALERTS.has(p.alert) ? (p.alert as Quake['alert']) : null,
    type: typeof p.type === 'string' ? p.type : 'earthquake',
  }
}

/** Validate and flatten a USGS FeatureCollection, newest quake first. */
export function parseFeed(json: unknown): QuakeFeed {
  const raw = json as RawCollection | null
  if (!raw || raw.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    throw new Error('Unexpected response: not a GeoJSON FeatureCollection')
  }

  const quakes = (raw.features as RawFeature[])
    .map(parseFeature)
    .filter((q): q is Quake => q !== null)
    .sort((a, b) => b.time - a.time)

  return {
    quakes,
    generated: isNum(raw.metadata?.generated) ? raw.metadata.generated : Date.now(),
    title: typeof raw.metadata?.title === 'string' ? raw.metadata.title : 'USGS earthquakes',
  }
}

export async function fetchQuakes(period: FeedPeriod, signal?: AbortSignal): Promise<QuakeFeed> {
  const res = await fetch(feedUrl(period), { signal })
  if (!res.ok) throw new Error(`USGS feed responded ${res.status}`)
  return parseFeed(await res.json())
}
