import { MapContainer, TileLayer } from 'react-leaflet'
import RouteLine from './RouteLine.jsx'
import StopMarker from './StopMarker.jsx'

const DELHI_CENTER = [28.59, 77.22]

function RouteMap({ stops, result }) {
  const order = result?.order

  return (
    <MapContainer center={DELHI_CENTER} zoom={12} className="route-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {result && <RouteLine geometry={result.geometry} />}

      {stops.map((stop, index) => {
        const position = order ? order.indexOf(stop.id) : index
        return (
          <StopMarker
            key={stop.id}
            stop={stop}
            label={position === 0 ? 'D' : String(position)}
            isDepot={position === 0}
          />
        )
      })}
    </MapContainer>
  )
}

export default RouteMap
