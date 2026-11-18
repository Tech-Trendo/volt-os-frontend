import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { StationStatus } from "@/models/stations";
import { slugStatus } from "@/lib/formatting";

function RecenterMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView([latitude, longitude], 16, { animate: false });
  }, [map, latitude, longitude]);
  return null;
}

export default function StationLocationMap({
  name,
  address,
  latitude,
  longitude,
  status,
}: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StationStatus;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "station-marker-wrapper",
        html: `<span class="station-marker ${slugStatus(status)}" style="width:22px;height:22px"><span></span></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [status],
  );

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={16}
      minZoom={6}
      maxZoom={18}
      scrollWheelZoom={false}
      zoomControl={true}
      attributionControl={true}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecenterMap latitude={latitude} longitude={longitude} />
      <Marker position={[latitude, longitude]} icon={icon}>
        <Tooltip direction="top" offset={[0, -12]} permanent>
          <div className="text-[11px] leading-tight">
            <div className="font-semibold">{name}</div>
            <div className="text-[10px] opacity-80">{address}</div>
          </div>
        </Tooltip>
      </Marker>
    </MapContainer>
  );
}
