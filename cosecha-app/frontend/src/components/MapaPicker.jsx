import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Centro de Colombia por defecto
const COLOMBIA_CENTER = [4.6, -74.08];
const DEFAULT_ZOOM = 6;
const SELECTED_ZOOM = 13;

/** Captura clics en el mapa */
function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/** Recentra el mapa cuando cambian las coordenadas */
function Recentrar({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], SELECTED_ZOOM, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

/**
 * Componente reutilizable de seleccion de ubicacion en mapa.
 *
 * @param {number|null} lat - Latitud seleccionada
 * @param {number|null} lng - Longitud seleccionada
 * @param {function} onSelect - Callback ({ lat, lng }) al hacer clic
 * @param {string} height - Altura CSS del mapa
 * @param {boolean} hasError - Si true, muestra borde rojo
 */
export default function MapaPicker({ lat, lng, onSelect, height = '220px', hasError = false }) {
  const hasMarker = lat != null && lng != null;
  const center = hasMarker ? [lat, lng] : COLOMBIA_CENTER;
  const zoom = hasMarker ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className="space-y-2">
      <div
        className={`rounded-xl overflow-hidden border-2 transition-colors ${
          hasError ? 'border-red-400' : hasMarker ? 'border-campo-400' : 'border-tierra-200'
        }`}
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
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
          <ClickHandler onSelect={onSelect} />
          {hasMarker && (
            <>
              <Marker position={[lat, lng]} />
              <Recentrar lat={lat} lng={lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordenadas seleccionadas */}
      {hasMarker ? (
        <div className="flex items-center gap-2 text-xs text-campo-700 bg-campo-50 rounded-lg px-3 py-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</span>
        </div>
      ) : (
        <p className="text-xs text-tierra-400 text-center">
          Haz clic en el mapa para marcar la ubicacion de tu finca
        </p>
      )}
    </div>
  );
}
