import { useState } from 'react'
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

function App() {
  const [stops] = useState(SAMPLE_STOPS)
  const { result, loading, error, optimize } = useRouteOptimizer()

  return (
    <div className="app">
      <Sidebar
        stops={stops}
        result={result}
        loading={loading}
        error={error}
        onOptimize={() => optimize({ stops })}
      />
      <RouteMap stops={stops} result={result} />
    </div>
  )
}

export default App
