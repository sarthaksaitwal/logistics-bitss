import L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'

function makeIcon(label, isDepot) {
  return L.divIcon({
    className: '',
    html: `<div class="stop-pin${isDepot ? ' stop-pin--depot' : ''}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function StopMarker({ stop, label, isDepot, onMove }) {
  return (
    <Marker
      position={[stop.lat, stop.lng]}
      icon={makeIcon(label, isDepot)}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const { lat, lng } = event.target.getLatLng()
          onMove(stop.id, lat, lng)
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -14]}>
        {stop.id}
      </Tooltip>
    </Marker>
  )
}

export default StopMarker
