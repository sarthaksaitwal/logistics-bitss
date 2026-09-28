function StopList({ stops, order }) {
  const ordered = order ? order.map((id) => stops.find((stop) => stop.id === id)) : stops

  return (
    <section>
      <h2>{order ? 'Visiting order' : 'Stops'}</h2>
      <ol className="stop-list">
        {ordered.map((stop, index) => (
          <li key={stop.id} className="stop-list__item">
            <span className={`stop-pin${index === 0 ? ' stop-pin--depot' : ''}`}>
              {index === 0 ? 'D' : index}
            </span>
            {stop.id}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default StopList
