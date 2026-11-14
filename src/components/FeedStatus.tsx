import type { QuakesState } from '../hooks/useQuakes'

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

type Props = QuakesState & { retry: () => void }

/** Compact HUD card summarising the live feed: count, strongest quake, freshness. */
export function FeedStatus(props: Props) {
  const { status, feed, retry } = props

  if (!feed) {
    return (
      <section className={`feed-status ${status}`} aria-live="polite">
        {status === 'error' ? (
          <>
            <span className="dot" /> Couldn&apos;t reach USGS · {props.error}
            <button type="button" onClick={retry}>
              Retry
            </button>
          </>
        ) : (
          <>
            <span className="dot" /> Fetching live USGS feed…
          </>
        )}
      </section>
    )
  }

  const strongest = feed.quakes.reduce<(typeof feed.quakes)[number] | null>(
    (best, q) => (!best || q.mag > best.mag ? q : best),
    null,
  )

  return (
    <section className={`feed-status ${status}`} aria-live="polite">
      <p className="count">
        <strong>{feed.quakes.length.toLocaleString()}</strong> quakes in the last 24h
      </p>
      {strongest && (
        <p className="strongest">
          Strongest <b>M{strongest.mag.toFixed(1)}</b> · {strongest.place}
        </p>
      )}
      <p className="updated">
        <span className="dot" />
        {status === 'error' ? 'Refresh failed · ' : 'Live · '}updated {timeFmt.format(feed.generated)}
      </p>
    </section>
  )
}
