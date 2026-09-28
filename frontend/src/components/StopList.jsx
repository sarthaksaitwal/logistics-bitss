function StopList({ stops, order, onRemove }) {
  const ordered = order ? order.map((id) => stops.find((stop) => stop.id === id)) : stops

  return (
    <section>
      <h2>{order ? 'Visiting order' : `Stops (${stops.length})`}</h2>
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
      </ol>
    </section>
  )
}

export default StopList
