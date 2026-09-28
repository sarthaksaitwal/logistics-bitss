import { MAX_STOPS } from '../api/optimize.js'
import RouteOptions from './RouteOptions.jsx'
import RouteSummary from './RouteSummary.jsx'
import StopList from './StopList.jsx'

function Sidebar({
  stops,
  order,
  route,
  depotId,
  returnToDepot,
  loading,
  error,
  onOptimize,
  onRemoveStop,
  onDepotChange,
  onReturnChange,
  onReset,
  onClear,
}) {
  const tooFew = stops.length < 2
  const full = stops.length >= MAX_STOPS

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>Logistics bitss</h1>
        <p>The fastest order to visit every stop, on real roads.</p>
        <p className="hint">Click the map to add a stop. Drag a pin to move it.</p>
      </header>

      <RouteOptions
        stops={stops}
        depotId={depotId}
        returnToDepot={returnToDepot}
        onDepotChange={onDepotChange}
        onReturnChange={onReturnChange}
      />

      <button className="optimize-button" onClick={onOptimize} disabled={loading || tooFew}>
        {loading ? 'Optimizing…' : 'Re-optimize'}
      </button>

      {tooFew && <p className="notice">Add at least 2 stops to plan a route.</p>}
      {full && <p className="notice">Maximum of {MAX_STOPS} stops reached.</p>}
      {error && !tooFew && <p className="error">{error}</p>}
      {route && <RouteSummary result={route} />}

      <StopList
        stops={stops}
        order={order}
        optimized={Boolean(route)}
        returnToDepot={returnToDepot}
        onRemove={onRemoveStop}
      />

      <div className="sidebar__actions">
        <button type="button" className="link-button" onClick={onReset}>
          Reset to sample stops
        </button>
        <button
          type="button"
          className="link-button"
          onClick={onClear}
          disabled={stops.length === 0}
        >
          Clear all stops
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
