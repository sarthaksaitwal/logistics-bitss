import { useEffect } from 'react'
import { Polyline, useMap } from 'react-leaflet'

function RouteLine({ geometry }) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(geometry, { padding: [40, 40] })
  }, [map, geometry])

  return (
    <>
      <Polyline positions={geometry} pathOptions={{ color: '#ffffff', weight: 8, opacity: 0.9 }} />
      <Polyline positions={geometry} pathOptions={{ color: '#2563eb', weight: 5 }} />
    </>
  )
}

export default RouteLine
