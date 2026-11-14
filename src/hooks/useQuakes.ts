import { useCallback, useEffect, useState } from 'react'
import { fetchQuakes } from '../lib/usgs'
import type { FeedPeriod, QuakeFeed } from '../lib/usgs'

// USGS regenerates the summary feeds every minute; polling slower is plenty.
const REFRESH_MS = 5 * 60 * 1000

export type QuakesState =
  | { status: 'loading'; feed: QuakeFeed | null }
  | { status: 'ready'; feed: QuakeFeed }
  | { status: 'error'; feed: QuakeFeed | null; error: string }

/** Live USGS feed for a period, refreshed in the background. Keeps the last good data on errors. */
export function useQuakes(period: FeedPeriod = 'day') {
  const [state, setState] = useState<QuakesState>({ status: 'loading', feed: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    const load = () => {
      fetchQuakes(period, controller.signal)
        .then((feed) => setState({ status: 'ready', feed }))
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          const error = err instanceof Error ? err.message : String(err)
          setState((prev) => ({ status: 'error', feed: prev.feed, error }))
        })
    }

    load()
    const timer = window.setInterval(load, REFRESH_MS)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [period, nonce])

  const retry = useCallback(() => {
    setState((prev) => ({ status: 'loading', feed: prev.feed }))
    setNonce((n) => n + 1)
  }, [])

  return { ...state, retry }
}
