"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap as useLeafletMap,
} from "react-leaflet";
import {
  type LatLngExpression,
  type Layer,
  type LeafletMouseEvent,
} from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";
import { ChevronLeft, Loader2 } from "lucide-react";

const INDIA_CENTER: LatLngExpression = [22.5937, 78.9629];
const INDIA_ZOOM = 5;

const GEOJSON_BASE_URL =
  "https://raw.githubusercontent.com/geohacker/india/master";
const STATES_URL = `${GEOJSON_BASE_URL}/state/india_telengana.geojson`;
const DISTRICTS_URL = `${GEOJSON_BASE_URL}/district/india_district.geojson`;
const TALUKS_URL = `${GEOJSON_BASE_URL}/taluk/india_taluk.geojson`;

type ViewLevel = "country" | "state" | "district";

interface RegionProperties {
  NAME_1?: string; // State name
  NAME_2?: string; // District name
  NAME_3?: string; // Taluk name
  ID_1?: number;
  ID_2?: number;
  ID_3?: number;
}

interface BreadcrumbProps {
  path: string[];
  onNavigate: (level: number) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000] flex items-center gap-2">
      {path.length > 0 && (
        <button
          onClick={() => onNavigate(path.length - 1)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-300" />
        </button>
      )}
      <div className="text-white text-sm flex items-center gap-1">
        <button
          onClick={() => onNavigate(0)}
          className="hover:text-blue-400 transition-colors"
        >
          India
        </button>
        {path.map((item, idx) => (
          <span key={idx}>
            <span className="text-gray-500 mx-1">/</span>
            <button
              onClick={() => onNavigate(idx + 1)}
              className="hover:text-blue-400 transition-colors"
            >
              {item}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function MapController({
  geoData,
  level,
}: {
  geoData: FeatureCollection | null;
  level: ViewLevel;
}) {
  const map = useLeafletMap();

  useEffect(() => {
    if (!geoData) return;

    import("leaflet").then((L) => {
      const geoJsonLayer = L.geoJSON(geoData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        const padding: [number, number] =
          level === "country" ? [20, 20] : [40, 40];
        map.fitBounds(bounds, {
          padding,
          maxZoom: level === "district" ? 10 : 8,
        });
      }
    });
  }, [geoData, map, level]);

  return null;
}

export default function IndiaMap() {
  const [statesData, setStatesData] = useState<FeatureCollection | null>(null);
  const [districtsData, setDistrictsData] = useState<FeatureCollection | null>(
    null
  );
  const [taluksData, setTaluksData] = useState<FeatureCollection | null>(null);
  const [loadingStates, setLoadingStates] = useState(true);

  const [viewLevel, setViewLevel] = useState<ViewLevel>("country");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const fetchingDistricts = useRef(false);
  const fetchingTaluks = useRef(false);

  // Load states on mount
  useEffect(() => {
    fetch(STATES_URL)
      .then((res) => res.json())
      .then((data: FeatureCollection) => {
        setStatesData(data);
        setLoadingStates(false);
      })
      .catch((err) => {
        console.error("Failed to load states GeoJSON:", err);
        setLoadingStates(false);
      });
  }, []);

  // Load districts when needed
  useEffect(() => {
    if (viewLevel === "state" && !districtsData && !fetchingDistricts.current) {
      fetchingDistricts.current = true;
      fetch(DISTRICTS_URL)
        .then((res) => res.json())
        .then((data: FeatureCollection) => {
          setDistrictsData(data);
        })
        .catch((err) => {
          console.error("Failed to load districts GeoJSON:", err);
        });
    }
  }, [viewLevel, districtsData]);

  // Load taluks when needed
  useEffect(() => {
    if (viewLevel === "district" && !taluksData && !fetchingTaluks.current) {
      fetchingTaluks.current = true;
      fetch(TALUKS_URL)
        .then((res) => res.json())
        .then((data: FeatureCollection) => {
          setTaluksData(data);
        })
        .catch((err) => {
          console.error("Failed to load taluks GeoJSON:", err);
        });
    }
  }, [viewLevel, taluksData]);

  const isLevelLoading =
    (viewLevel === "state" && !districtsData) ||
    (viewLevel === "district" && !taluksData);

  // Filter data based on current view
  const currentGeoData = useMemo((): FeatureCollection | null => {
    if (viewLevel === "country") {
      return statesData;
    }
    if (viewLevel === "state" && selectedState && districtsData) {
      const filtered = districtsData.features.filter(
        (f) => f.properties?.NAME_1 === selectedState
      );
      return { type: "FeatureCollection", features: filtered };
    }
    if (
      viewLevel === "district" &&
      selectedState &&
      selectedDistrict &&
      taluksData
    ) {
      const filtered = taluksData.features.filter(
        (f) =>
          f.properties?.NAME_1 === selectedState &&
          f.properties?.NAME_2 === selectedDistrict
      );
      return { type: "FeatureCollection", features: filtered };
    }
    return null;
  }, [
    viewLevel,
    selectedState,
    selectedDistrict,
    statesData,
    districtsData,
    taluksData,
  ]);

  const path = useMemo(() => {
    const p: string[] = [];
    if (selectedState) p.push(selectedState);
    if (selectedDistrict) p.push(selectedDistrict);
    return p;
  }, [selectedState, selectedDistrict]);

  const getRegionName = useCallback(
    (feature: Feature<Geometry, RegionProperties>): string => {
      if (viewLevel === "country") return feature.properties?.NAME_1 || "";
      if (viewLevel === "state") return feature.properties?.NAME_2 || "";
      if (viewLevel === "district") return feature.properties?.NAME_3 || "";
      return "";
    },
    [viewLevel]
  );

  const getStyle = useCallback(
    (feature: Feature<Geometry, RegionProperties> | undefined) => {
      if (!feature) return {};
      const name = getRegionName(feature);
      const isHovered = hoveredRegion === name;

      return {
        fillColor: isHovered ? "#3b82f6" : "#1e3a5f",
        weight: isHovered ? 2 : 1,
        opacity: 1,
        color: "#000", // Black border
        fillOpacity: isHovered ? 0.6 : 0.4,
      };
    },
    [hoveredRegion, getRegionName]
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, RegionProperties>, layer: Layer) => {
      const name = getRegionName(feature);

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          setHoveredRegion(name);
          const target = e.target;
          target.setStyle({
            fillOpacity: 0.6,
            weight: 2,
          });
          target.bringToFront();
        },
        mouseout: (e: LeafletMouseEvent) => {
          setHoveredRegion(null);
          const target = e.target;
          target.setStyle(getStyle(feature));
        },
        click: () => {
          if (viewLevel === "country") {
            setSelectedState(name);
            setViewLevel("state");
          } else if (viewLevel === "state") {
            setSelectedDistrict(name);
            setViewLevel("district");
          }
          // At taluk level, just select (no deeper drill-down)
        },
      });

      layer.bindTooltip(name, {
        permanent: false,
        direction: "center",
        className: "bg-gray-900 text-white border-0 px-2 py-1 rounded text-sm",
      });
    },
    [getStyle, getRegionName, viewLevel]
  );

  const handleNavigate = useCallback((level: number) => {
    if (level === 0) {
      setViewLevel("country");
      setSelectedState(null);
      setSelectedDistrict(null);
    } else if (level === 1) {
      setViewLevel("state");
      setSelectedDistrict(null);
    }
  }, []);

  if (loadingStates) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        className="w-full h-full"
        style={{ background: "#1f2937" }}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {currentGeoData && !isLevelLoading && (
          <GeoJSON
            key={`${viewLevel}-${selectedState}-${selectedDistrict}`}
            data={currentGeoData}
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <MapController geoData={currentGeoData} level={viewLevel} />
      </MapContainer>

      <Breadcrumb path={path} onNavigate={handleNavigate} />

      {isLevelLoading && (
        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-[1001]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {hoveredRegion && (
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
          <span className="text-white text-sm">{hoveredRegion}</span>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 z-[1000]">
        <span className="text-gray-400 text-xs">
          {viewLevel === "country" && "Click a state to drill down"}
          {viewLevel === "state" && "Click a district to drill down"}
          {viewLevel === "district" && "Viewing taluks"}
        </span>
      </div>
    </div>
  );
}
