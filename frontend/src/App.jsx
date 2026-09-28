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

function entryOrder(stops, depot) {
  if (!depot) return []
  return [depot.id, ...stops.filter((stop) => stop.id !== depot.id).map((stop) => stop.id)]
}

function matchesStops(result, stops, depot) {
  if (!result || !depot || result.order.length !== stops.length) return false
  if (result.order[0] !== depot.id) return false
  const ids = new Set(stops.map((stop) => stop.id))
  return result.order.every((id) => ids.has(id))
}

function App() {
  const [stops, setStops] = useState(SAMPLE_STOPS)
  const [depotId, setDepotId] = useState(SAMPLE_STOPS[0].id)
  const [returnToDepot, setReturnToDepot] = useState(true)
  const { result, loading, error, optimize } = useRouteOptimizer()

  const depot = stops.find((stop) => stop.id === depotId) ?? stops[0]
  const depotIndex = depot ? stops.indexOf(depot) : 0
  const route = matchesStops(result, stops, depot) ? result : null
  const order = route ? route.order : entryOrder(stops, depot)

  useEffect(() => {
    if (stops.length < 2) return
    optimize({ stops, depotIndex, returnToDepot })
  }, [stops, depotIndex, returnToDepot, optimize])

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
    if (id === depotId) setDepotId(null)
  }

  function resetStops() {
    setStops(SAMPLE_STOPS)
    setDepotId(SAMPLE_STOPS[0].id)
    setReturnToDepot(true)
  }

  function clearStops() {
    setStops([])
    setDepotId(null)
  }


  return (
    <div className="app">
      <Sidebar
        stops={stops}
        order={order}
        route={route}
        depotId={depot?.id}
        returnToDepot={returnToDepot}
        loading={loading}
        error={error}
        onOptimize={() => optimize({ stops, depotIndex, returnToDepot })}
        onRemoveStop={removeStop}
        onDepotChange={setDepotId}
        onReturnChange={setReturnToDepot}
        onReset={resetStops}
        onClear={clearStops}

      />
      <RouteMap
        stops={stops}
        order={order}
        geometry={route?.geometry}
        loading={loading}
        onAddStop={addStop}
        onMoveStop={moveStop}
      />
    </div>
  )
}

export default App
