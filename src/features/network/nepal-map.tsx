import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import national from "@/assets/nepal-boundaries.geojson.json";
import provincial from "@/assets/nepal-provinces.geojson.json";
import { clusterStatus, markerSize, statusToken } from "@/lib/station-status";
import type { Station, StationStatus } from "@/models/stations";
import { slugStatus } from "@/lib/formatting";
const nepalBounds: L.LatLngBoundsExpression = [
  [26.3, 80],
  [30.5, 88.3],
];
function ProvinceLabels() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useEffect(() => {
    const change = () => setZoom(map.getZoom());
    map.on("zoomend", change);
    return () => {
      map.off("zoomend", change);
    };
  }, [map]);
  if (zoom < 8) return null;
  return (
    <>
      {provincial.features.map((feature) => {
        const center = L.geoJSON(feature as import("geojson").Feature)
          .getBounds()
          .getCenter();
        const name = String(feature.properties.shapeName)
          .replace("Province 1", "Koshi")
          .replace("Province 2", "Madhesh")
          .replace("Sudurpaschim", "Sudurpashchim");
        return (
          <Marker
            key={name}
            position={center}
            icon={L.divIcon({ className: "province-label-marker", html: name, iconSize: [90, 18] })}
            interactive={false}
          />
        );
      })}
    </>
  );
}
function ViewController({
  stations,
  province,
  focus,
  reset,
  mini,
}: {
  stations: Station[];
  province?: string | undefined;
  focus?: Station | null | undefined;
  reset?: number | undefined;
  mini?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (focus) {
      map.flyTo([focus.latitude, focus.longitude], 12, { duration: 0.7 });
    } else if (province) {
      const feature = provincial.features.find(
        (f) =>
          String(f.properties.shapeName)
            .replace("Province 1", "Koshi")
            .replace("Province 2", "Madhesh")
            .replace("Sudurpaschim", "Sudurpashchim") === province,
      );
      if (feature) {
        map.flyToBounds(L.geoJSON(feature as import("geojson").Feature).getBounds(), {
          padding: [25, 25],
          maxZoom: 9,
        });
      }
    } else {
      map.fitBounds(nepalBounds, { padding: mini ? [4, 4] : [12, 12] });
    }
  }, [map, province, focus, reset, mini, stations]);
  return null;
}
export default function NepalMap({
  stations,
  onSelect,
  province,
  focus,
  reset,
  mini = false,
}: {
  stations: Station[];
  onSelect?: (s: Station) => void;
  province?: string | undefined;
  focus?: Station | null | undefined;
  reset?: number | undefined;
  mini?: boolean;
}) {
  const markers = useMemo(
    () =>
      stations.map((s) => {
        const size = markerSize(s.chargers.length);
        return {
          station: s,
          icon: L.divIcon({
            className: "station-marker-wrapper",
            html: `<span class="station-marker ${slugStatus(s.status)}" style="width:${size}px;height:${size}px"><span></span></span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          }),
        };
      }),
    [stations],
  );
  const createClusterIcon = (cluster: {
    getAllChildMarkers: () => L.Marker[];
    getChildCount: () => number;
  }) => {
    const statuses = cluster
      .getAllChildMarkers()
      .map(
        (marker) =>
          (marker.options as L.MarkerOptions & { stationStatus?: StationStatus }).stationStatus ??
          "Operational",
      );
    const status = clusterStatus(statuses);
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: `map-cluster ${slugStatus(status)}`,
      iconSize: [36, 36],
    });
  };
  return (
    <MapContainer
      center={[28.39, 84.12]}
      zoom={7}
      minZoom={mini ? 4 : 5}
      maxZoom={17}
      maxBounds={nepalBounds}
      maxBoundsViscosity={0.7}
      scrollWheelZoom={!mini}
      zoomControl={!mini}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <GeoJSON
        data={national as FeatureCollection}
        style={() => ({
          color: "var(--primary)",
          weight: 1.5,
          fillColor: "var(--primary)",
          fillOpacity: 0.025,
        })}
      />
      <GeoJSON
        data={provincial as FeatureCollection}
        style={() => ({ color: "var(--pipeline)", weight: 0.7, fillOpacity: 0 })}
        onEachFeature={(feature, layer) => {
          const label = String(feature.properties?.shapeName ?? "")
            .replace("Province 1", "Koshi")
            .replace("Province 2", "Madhesh");
          layer.bindTooltip(label, {
            permanent: false,
            className: "province-label",
            direction: "center",
          });
        }}
      />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={24}
        iconCreateFunction={createClusterIcon}
      >
        {markers.map(({ station: s, icon }) => (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={icon}
            {...{ stationStatus: s.status }}
            eventHandlers={{ click: () => onSelect?.(s) }}
          >
            <Tooltip>
              {s.name}
              <br />
              {s.status}
            </Tooltip>
          </Marker>
        ))}
      </MarkerClusterGroup>
      <ProvinceLabels />
      <ViewController
        stations={stations}
        province={province}
        focus={focus}
        reset={reset}
        mini={mini}
      />
    </MapContainer>
  );
}
