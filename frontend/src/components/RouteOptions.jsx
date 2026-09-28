function RouteOptions({ stops, depotId, returnToDepot, onDepotChange, onReturnChange }) {
  return (
    <section className="options">
      <label className="options__field">
        <span>Start from</span>
        <select value={depotId ?? ''} onChange={(event) => onDepotChange(event.target.value)}>
          {stops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.id}
            </option>
          ))}
        </select>
      </label>

      <label className="options__toggle">
        <input
          type="checkbox"
          checked={returnToDepot}
          onChange={(event) => onReturnChange(event.target.checked)}
        />
        Return to the start at the end
      </label>
    </section>
  )
}

export default RouteOptions
