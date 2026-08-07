import { IMapCountry, IMapState, IMapCity, IMapSite, StoresMarker } from 'src/models';

/** The four zoom levels the map can render. */
export type MapView = 'world' | 'country' | 'usa-states' | 'city';

/**
 * Shared shape for anything drawn on the map. `lat`/`lng` are already in
 * Leaflet order — the GeoJSON `[lng, lat]` swap happens once, in `toLatLng`,
 * when raw Cosmos data is mapped into these models.
 */
export interface AvailabilityPoint {
  id: string;
  name: string;
  availability: number;
  lat: number;
  lng: number;
}

export interface CountryMarker extends AvailabilityPoint {
  countryCode: string;
}

export interface StateMarker extends AvailabilityPoint {
  stateCode: string;
  countryCode: string;
}

export interface CityMarker extends AvailabilityPoint {
  cityName: string;
  countryCode: string;
  stateCode?: string;
}

/** Stores reuse the shared model from `src/models` (already `{ id, name, availability, lat, lng }`). */
export type StoreMarker = StoresMarker;

/** GeoJSON stores coordinates as `[longitude, latitude]`; Leaflet wants the reverse. */
const toLatLng = (coordinates: number[]): { lat: number; lng: number } => ({
  lat: coordinates[1],
  lng: coordinates[0],
});

const roundAvailability = (percent: number): number => Math.round(percent);

export const toCountryMarker = (c: IMapCountry): CountryMarker => ({
  id: c.countryCode,
  name: c.countryCode,
  countryCode: c.countryCode,
  availability: roundAvailability(c.percentAvailable),
  ...toLatLng(c.geoPosition.coordinates),
});

export const toStateMarker = (s: IMapState): StateMarker => ({
  id: s.stateCode,
  name: s.stateName,
  stateCode: s.stateCode,
  countryCode: s.countryCode,
  availability: roundAvailability(s.percentAvailable),
  ...toLatLng(s.geoPosition.coordinates),
});

/** Cities are keyed by country + name so the marker and the sidebar row cross-highlight. */
export const cityMarkerId = (countryCode: string, cityName: string): string =>
  `${countryCode}-${cityName}`;

export const toCityMarker = (c: IMapCity): CityMarker => ({
  id: cityMarkerId(c.countryCode, c.cityName),
  name: c.cityName,
  cityName: c.cityName,
  countryCode: c.countryCode,
  stateCode: c.stateCode,
  availability: roundAvailability(c.percentAvailable),
  ...toLatLng(c.geoPosition.coordinates),
});

export const toStoreMarker = (s: IMapSite): StoreMarker => ({
  id: s.id,
  name: s.storeName,
  availability: roundAvailability(s.percentAvailable),
  ...toLatLng(s.geoPosition.coordinates),
});

/** City marker derived from a site record (used when resolving a store-level filter). */
export const toCityMarkerFromSite = (s: IMapSite): CityMarker => ({
  id: cityMarkerId(s.countryCode, s.cityName),
  name: s.cityName,
  cityName: s.cityName,
  countryCode: s.countryCode,
  stateCode: s.stateCode,
  availability: roundAvailability(s.percentAvailable),
  ...toLatLng(s.geoPosition.coordinates),
});

/**
 * State carried for breadcrumb/identity when resolving a city or store. The
 * state's own centroid isn't fetched on those paths, so we approximate its
 * position with the resolved child's coordinates (a point inside the state) —
 * this is what the state breadcrumb recentres to. `availability` is unused for a
 * selected (non-rendered) state.
 */
export const toStateMarkerAt = (
  source: { stateName: string; stateCode: string; countryCode: string },
  coordinates: number[]
): StateMarker => ({
  id: source.stateCode,
  name: source.stateName,
  stateCode: source.stateCode,
  countryCode: source.countryCode,
  availability: 0,
  ...toLatLng(coordinates),
});

/** A USA selection switches the map into the state-level (`usa-states`) view. */
export const isUSA = (country: Pick<CountryMarker, 'countryCode'> | null): boolean =>
  country?.countryCode === 'USA' || country?.countryCode === 'US';
