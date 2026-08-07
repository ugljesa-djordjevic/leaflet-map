import { createContext, useContext } from 'react';
import { CityMarker, CountryMarker, MapView, StateMarker, StoreMarker } from './types';

/**
 * Stable navigation data – changes only on navigation events, never on hover.
 * Consumers of this context are not re-rendered by hover activity.
 */
export interface IMapDataContext {
  view: MapView;
  currentZoom: number;
  countries: CountryMarker[];
  usaStates: StateMarker[];
  cities: CityMarker[];
  stores: StoreMarker[];
  selectedCountry: CountryMarker | null;
  selectedState: StateMarker | null;
  selectedCity: CityMarker | null;
  onCountryClick: (country: CountryMarker) => void;
  onStateClick: (state: StateMarker) => void;
  onCityClick: (city: CityMarker) => void;
  onStoreClick: (store: StoreMarker) => void;
}

/**
 * High-frequency hover state – isolated so hover changes never trigger re-renders
 * in components that only care about navigation data.
 */
export interface IMapHoverContext {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

export const MapDataContext = createContext<IMapDataContext | null>(null);
export const MapHoverContext = createContext<IMapHoverContext | null>(null);

export const useMapDataContext = (): IMapDataContext => {
  const ctx = useContext(MapDataContext);
  if (!ctx) throw new Error('useMapDataContext must be used inside MapDataContext.Provider');
  return ctx;
};

export const useMapHoverContext = (): IMapHoverContext => {
  const ctx = useContext(MapHoverContext);
  if (!ctx) throw new Error('useMapHoverContext must be used inside MapHoverContext.Provider');
  return ctx;
};
