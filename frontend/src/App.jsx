import { useEffect, useState } from 'react'
import { MAX_STOPS } from './api/optimize.js'
import RouteMap from './components/RouteMap.jsx'
import Sidebar from './components/Sidebar.jsx'
import { useRouteOptimizer } from './hooks/useRouteOptimizer.js'

const SAMPLE_STOPS = [
  { id: 'India Gate', lat: 28.6129, lng: 77.2295 },
  { id: 'Qutub Minar', lat: 28.5245, lng: 77.1855 },
  { id: 'Red Fort', lat: 28.6562, lng: 77.241 },
  { id: 'Lotus Temple', lat: 28.5535, lng: 77.2588 },
  { id: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { id: "Humayun's Tomb", lat: 28.5933, lng: 77.2507 },
]

function nextStopName(stops) {
  let n = 1
  while (stops.some((stop) => stop.id === `Stop ${n}`)) n++
  return `Stop ${n}`
}

function matchesStops(result, stops) {
  if (!result || result.order.length !== stops.length) return false
  const ids = new Set(stops.map((stop) => stop.id))
  return result.order.every((id) => ids.has(id))
}

function App() {
  const [stops, setStops] = useState(SAMPLE_STOPS)
  const { result, loading, error, optimize } = useRouteOptimizer()
  const route = matchesStops(result, stops) ? result : null

  useEffect(() => {
    if (stops.length < 2) return
    optimize({ stops })
  }, [stops, optimize])

  function addStop({ lat, lng }) {
    setStops((current) => {
      if (current.length >= MAX_STOPS) return current
      return [...current, { id: nextStopName(current), lat, lng }]
    })
  }

  function moveStop(id, lat, lng) {
    setStops((current) =>
      current.map((stop) => (stop.id === id ? { ...stop, lat, lng } : stop)),
    )
  }

  function removeStop(id) {
    setStops((current) => current.filter((stop) => stop.id !== id))
  }

  return (
    <div className="app">
      <Sidebar
        stops={stops}
        result={route}
        loading={loading}
        error={error}
        onOptimize={() => optimize({ stops })}
        onRemoveStop={removeStop}
      />
      <RouteMap
        stops={stops}
        result={route}
        loading={loading}
        onAddStop={addStop}
        onMoveStop={moveStop}
      />
    </div>
  )
}

export default App
