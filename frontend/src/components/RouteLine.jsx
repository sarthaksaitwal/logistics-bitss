import { useEffect, useRef } from 'react'
import { Polyline, useMap } from 'react-leaflet'

function RouteLine({ geometry, loading }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (!geometry || hasFitted.current) return
    map.fitBounds(geometry, { padding: [40, 40] })
    hasFitted.current = true
  }, [map, geometry])

  if (!geometry) return null

  const opacity = loading ? 0.35 : 1

  return (
    <>
      <Polyline positions={geometry} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 * opacity }} />
      <Polyline positions={geometry} pathOptions={{ color: '#2563eb', weight: 5, opacity }} />
    </>
  )
}

export default RouteLine
