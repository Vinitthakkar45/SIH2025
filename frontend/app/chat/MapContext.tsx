"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type LocationType = "STATE" | "DISTRICT" | "TALUK";

export interface MapLocation {
  id: string;
  name: string;
  type: LocationType;
  category: string | null;
  stageOfExtraction: number | null;
  extractable: number | null;
  extraction: number | null;
  rainfall: number | null;
}

export interface MapState {
  currentLevel: LocationType;
  currentParentId: string | null;
  currentParentName: string | null;
  locations: MapLocation[];
  selectedLocations: MapLocation[];
  highlightedLocationIds: string[];
  isLoading: boolean;
}

interface MapContextType {
  state: MapState;
  loadStates: () => Promise<void>;
  drillDown: (location: MapLocation) => Promise<void>;
  drillUp: () => Promise<void>;
  toggleSelection: (location: MapLocation, multiSelect: boolean) => void;
  clearSelection: () => void;
  highlightLocations: (locationIds: string[]) => void;
  clearHighlights: () => void;
  searchAndHighlight: (query: string, type?: LocationType) => Promise<void>;
}

const MapContext = createContext<MapContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function MapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapState>({
    currentLevel: "STATE",
    currentParentId: null,
    currentParentName: null,
    locations: [],
    selectedLocations: [],
    highlightedLocationIds: [],
    isLoading: false,
  });

  const [navigationStack, setNavigationStack] = useState<
    {
      level: LocationType;
      parentId: string | null;
      parentName: string | null;
    }[]
  >([]);

  const loadStates = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch(`${API_URL}/api/gw-map/states`);
      const data = await response.json();
      setState((prev) => ({
        ...prev,
        currentLevel: "STATE",
        currentParentId: null,
        currentParentName: null,
        locations: data,
        isLoading: false,
      }));
      setNavigationStack([]);
    } catch (error) {
      console.error("Failed to load states:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const drillDown = useCallback(
    async (location: MapLocation) => {
      if (location.type === "TALUK") return;

      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const nextLevel: LocationType =
          location.type === "STATE" ? "DISTRICT" : "TALUK";
        const endpoint =
          location.type === "STATE"
            ? `${API_URL}/api/gw-map/states/${location.id}/districts`
            : `${API_URL}/api/gw-map/districts/${location.id}/taluks`;

        const response = await fetch(endpoint);
        const data = await response.json();

        setNavigationStack((prev) => [
          ...prev,
          {
            level: state.currentLevel,
            parentId: state.currentParentId,
            parentName: state.currentParentName,
          },
        ]);

        setState((prev) => ({
          ...prev,
          currentLevel: nextLevel,
          currentParentId: location.id,
          currentParentName: location.name,
          locations: data,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to drill down:", error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.currentLevel, state.currentParentId, state.currentParentName]
  );

  const drillUp = useCallback(async () => {
    if (navigationStack.length === 0) return;

    const previousState = navigationStack[navigationStack.length - 1];
    setNavigationStack((prev) => prev.slice(0, -1));

    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      let endpoint: string;
      if (previousState.level === "STATE") {
        endpoint = `${API_URL}/api/gw-map/states`;
      } else if (previousState.level === "DISTRICT" && previousState.parentId) {
        endpoint = `${API_URL}/api/gw-map/states/${previousState.parentId}/districts`;
      } else {
        endpoint = `${API_URL}/api/gw-map/states`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      setState((prev) => ({
        ...prev,
        currentLevel: previousState.level,
        currentParentId: previousState.parentId,
        currentParentName: previousState.parentName,
        locations: data,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to drill up:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [navigationStack]);

  const toggleSelection = useCallback(
    (location: MapLocation, multiSelect: boolean) => {
      setState((prev) => {
        const isSelected = prev.selectedLocations.some(
          (l) => l.id === location.id
        );

        if (multiSelect) {
          if (isSelected) {
            return {
              ...prev,
              selectedLocations: prev.selectedLocations.filter(
                (l) => l.id !== location.id
              ),
            };
          } else {
            return {
              ...prev,
              selectedLocations: [...prev.selectedLocations, location],
            };
          }
        } else {
          if (isSelected && prev.selectedLocations.length === 1) {
            return { ...prev, selectedLocations: [] };
          }
          return { ...prev, selectedLocations: [location] };
        }
      });
    },
    []
  );

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedLocations: [] }));
  }, []);

  const highlightLocations = useCallback((locationIds: string[]) => {
    setState((prev) => ({ ...prev, highlightedLocationIds: locationIds }));
  }, []);

  const clearHighlights = useCallback(() => {
    setState((prev) => ({ ...prev, highlightedLocationIds: [] }));
  }, []);

  const searchAndHighlight = useCallback(
    async (query: string, type?: LocationType) => {
      try {
        const params = new URLSearchParams({ query });
        if (type) params.append("type", type);

        const response = await fetch(`${API_URL}/api/gw-map/search?${params}`);
        const results = await response.json();

        if (results.length > 0) {
          highlightLocations(results.map((r: { id: string }) => r.id));
        }
      } catch (error) {
        console.error("Failed to search locations:", error);
      }
    },
    [highlightLocations]
  );

  return (
    <MapContext.Provider
      value={{
        state,
        loadStates,
        drillDown,
        drillUp,
        toggleSelection,
        clearSelection,
        highlightLocations,
        clearHighlights,
        searchAndHighlight,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}
