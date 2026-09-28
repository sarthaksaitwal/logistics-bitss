import { MAX_STOPS } from '../api/optimize.js'
import RouteSummary from './RouteSummary.jsx'
import StopList from './StopList.jsx'

function Sidebar({ stops, result, loading, error, onOptimize, onRemoveStop }) {
  const tooFew = stops.length < 2
  const full = stops.length >= MAX_STOPS

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>Logistics bitss</h1>
        <p>The fastest order to visit every stop, on real roads.</p>
        <p className="hint">Click the map to add a stop. Drag a pin to move it.</p>
      </header>

      <button className="optimize-button" onClick={onOptimize} disabled={loading || tooFew}>
        {loading ? 'Optimizing…' : 'Re-optimize'}
      </button>

      {tooFew && <p className="notice">Add at least 2 stops to plan a route.</p>}
      {full && <p className="notice">Maximum of {MAX_STOPS} stops reached.</p>}
      {error && !tooFew && <p className="error">{error}</p>}
      {result && <RouteSummary result={result} />}

      <StopList stops={stops} order={result?.order} onRemove={onRemoveStop} />
    </aside>
  )
}

export default Sidebar
