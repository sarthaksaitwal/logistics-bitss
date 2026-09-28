function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

function formatDistance(metres) {
  return `${(metres / 1000).toFixed(1)} km`
}

function RouteSummary({ result }) {
  const saved = result.naive_duration_s - result.total_duration_s
  const savedPercent = Math.round((saved / result.naive_duration_s) * 100)

  return (
    <section className="summary">
      {savedPercent > 0 ? (
        <p className="summary__saved">
          <strong>{savedPercent}% faster</strong>
          than visiting the stops in the order entered
        </p>
      ) : (
        <p className="summary__saved">Your order is already the fastest.</p>
      )}

      <dl className="summary__grid">
        <dt>Optimized</dt>
        <dd>
          {formatDuration(result.total_duration_s)} · {formatDistance(result.total_distance_m)}
        </dd>
        <dt>Order entered</dt>
        <dd>
          {formatDuration(result.naive_duration_s)} · {formatDistance(result.naive_distance_m)}
        </dd>
      </dl>
    </section>
  )
}

export default RouteSummary
