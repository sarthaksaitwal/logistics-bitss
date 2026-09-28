function StopList({ stops, order, optimized, returnToDepot, onRemove }) {
  const ordered = order.map((id) => stops.find((stop) => stop.id === id))
  const depot = ordered[0]

  return (
    <section>
      <h2>{optimized ? 'Visiting order' : `Stops (${stops.length})`}</h2>
      <ol className="stop-list">
        {ordered.map((stop, index) => (
          <li key={stop.id} className="stop-list__item">
            <span className={`stop-pin${index === 0 ? ' stop-pin--depot' : ''}`}>
              {index === 0 ? 'D' : index}
            </span>
            <span className="stop-list__name">{stop.id}</span>
            <button
              type="button"
              className="stop-list__remove"
              onClick={() => onRemove(stop.id)}
              aria-label={`Remove ${stop.id}`}
              title="Remove stop"
            >
              ×
            </button>
          </li>
        ))}

        {optimized && returnToDepot && depot && (
          <li className="stop-list__item stop-list__item--return">
            <span className="stop-pin stop-pin--depot">D</span>
            <span className="stop-list__name">Back to {depot.id}</span>
          </li>
        )}
      </ol>
    </section>
  )
}

export default StopList
