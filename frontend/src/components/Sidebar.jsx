import RouteSummary from './RouteSummary.jsx'
import StopList from './StopList.jsx'

function Sidebar({ stops, result, loading, error, onOptimize }) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>Logistics bitss</h1>
        <p>The fastest order to visit every stop, on real roads.</p>
      </header>

      <button className="optimize-button" onClick={onOptimize} disabled={loading}>
        {loading ? 'Optimizing…' : 'Optimize route'}
      </button>

      {error && <p className="error">{error}</p>}
      {result && <RouteSummary result={result} />}

      <StopList stops={stops} order={result?.order} />
    </aside>
  )
}

export default Sidebar
