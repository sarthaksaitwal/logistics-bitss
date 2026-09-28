import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import RouteLine from './RouteLine.jsx'
import StopMarker from './StopMarker.jsx'

const DELHI_CENTER = [28.59, 77.22]

function AddStopOnClick({ onAdd }) {
  useMapEvents({
    click(event) {
      onAdd(event.latlng)
    },
  })
  return null
}

function RouteMap({ stops, order, geometry, loading, onAddStop, onMoveStop }) {
  return (
    <div className="map-area">
      <MapContainer center={DELHI_CENTER} zoom={12} className="route-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AddStopOnClick onAdd={onAddStop} />
        <RouteLine geometry={geometry} loading={loading} />

        {stops.map((stop) => {
          const position = order.indexOf(stop.id)
          return (
            <StopMarker
              key={stop.id}
              stop={stop}
              label={position === 0 ? 'D' : String(position)}
              isDepot={position === 0}
              onMove={onMoveStop}
            />
          )
        })}
      </MapContainer>

      {loading && (
        <div className="map-status" role="status">
          <span className="spinner" />
          Optimizing route…
        </div>
      )}
    </div>
  )
}

export default RouteMap
