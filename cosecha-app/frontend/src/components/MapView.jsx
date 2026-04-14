import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MapView({
  markers = [],
  center = [4.6, -74.08],
  zoom = 8,
  height = '300px',
  onMapClick,
  className = '',
}) {
  const validMarkers = markers.filter(m => m.lat && m.lng);

  // Auto-center on markers if any exist
  const effectiveCenter = validMarkers.length > 0
    ? [parseFloat(validMarkers[0].lat), parseFloat(validMarkers[0].lng)]
    : center;
  const effectiveZoom = validMarkers.length > 0 ? 13 : zoom;

  return (
    <div className={`card overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={effectiveCenter}
        zoom={effectiveZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        />
        {validMarkers.map(m => (
          <Marker key={m.id} position={[parseFloat(m.lat), parseFloat(m.lng)]}>
            <Popup>
              <strong>{m.name}</strong>
              {m.subtitle && <><br /><span className="text-xs">{m.subtitle}</span></>}
            </Popup>
          </Marker>
        ))}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        <RecenterMap center={effectiveCenter} />
      </MapContainer>
    </div>
  );
}
