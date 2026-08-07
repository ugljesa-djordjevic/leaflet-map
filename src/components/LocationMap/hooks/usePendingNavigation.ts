import { useEffect, useRef } from 'react';
import { IMapCountry, IMapState, IMapCity, IMapSite } from 'src/models';
import {
  CityMarker,
  CountryMarker,
  StateMarker,
  StoreMarker,
  toCityMarker,
  toCityMarkerFromSite,
  toCountryMarker,
  toStateMarker,
  toStateMarkerAt,
  toStoreMarker,
} from '../types';

export interface IPendingNavigation {
  level: 'State' | 'City' | 'Store';
  countryCode: string;
  stateCode?: string;
  cityName?: string;
  storeValue?: string;
}

interface Params {
  pendingNavigation: IPendingNavigation | null;
  setPendingNavigation: (nav: IPendingNavigation | null) => void;
  rawCountries: IMapCountry[];
  rawStates: IMapState[];
  isFetchingStates: boolean;
  rawCities: IMapCity[];
  isFetchingCities: boolean;
  rawSites: IMapSite[];
  isFetchingSites: boolean;
  setIsNoData: (v: boolean) => void;
  resetToWorldInternal: () => void;
  applyStateNavigation: (state: StateMarker, country: CountryMarker) => void;
  applyCityNavigation: (
    city: CityMarker,
    country: CountryMarker,
    state: StateMarker | null
  ) => void;
  applyStoreNavigation: (
    store: StoreMarker,
    country: CountryMarker,
    state: StateMarker | null,
    city: CityMarker | null
  ) => void;
}

export interface UsePendingNavigationResult {
  /** Resets dedup guards so a fresh navigation to the same target is re-processed. */
  clearResolvedRefs: () => void;
}

/**
 * Resolves a pending navigation (set by `useFilterSync` from the LocationSwitcher)
 * once the matching Cosmos data has loaded: finds the record, builds the typed
 * markers, applies the navigation, and clears the pending state. Each level
 * dedupes via a ref so the same target isn't re-resolved on every data refresh.
 */
export const usePendingNavigation = ({
  pendingNavigation,
  setPendingNavigation,
  rawCountries,
  rawStates,
  isFetchingStates,
  rawCities,
  isFetchingCities,
  rawSites,
  isFetchingSites,
  setIsNoData,
  resetToWorldInternal,
  applyStateNavigation,
  applyCityNavigation,
  applyStoreNavigation,
}: Params): UsePendingNavigationResult => {
  const resolvedState = useRef<string | null>(null);
  const resolvedCity = useRef<string | null>(null);
  const resolvedStore = useRef<string | null>(null);

  /** Logs a dev warning, flags no-data, clears pending, and resets to world. */
  const bailToWorld = (message: string) => {
    if (import.meta.env.DEV) console.warn(`[LocationSwitcher→Map] ${message}`);
    setIsNoData(true);
    setPendingNavigation(null);
    resetToWorldInternal();
  };

  // Resolve pending State navigation once rawStates data arrives.
  useEffect(() => {
    if (pendingNavigation?.level !== 'State') return;
    if (resolvedState.current === pendingNavigation.stateCode) return;
    if (isFetchingStates) return;

    const rawState = rawStates.find((s) => s.stateCode === pendingNavigation.stateCode);
    if (!rawState) {
      bailToWorld(
        `State "${pendingNavigation.stateCode}" not found in map data. Resetting to world view.`
      );
      return;
    }
    const rawCountry = rawCountries.find((c) => c.countryCode === rawState.countryCode);
    if (!rawCountry) {
      bailToWorld(
        `Country "${rawState.countryCode}" for state not found. Resetting to world view.`
      );
      return;
    }
    resolvedState.current = pendingNavigation.stateCode ?? null;
    setIsNoData(false);
    applyStateNavigation(toStateMarker(rawState), toCountryMarker(rawCountry));
    setPendingNavigation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStates, isFetchingStates, pendingNavigation, rawCountries]);

  // Resolve pending City navigation once rawCities data arrives.
  useEffect(() => {
    if (pendingNavigation?.level !== 'City') return;
    if (resolvedCity.current === pendingNavigation.cityName) return;
    if (isFetchingCities) return;

    const rawCity = rawCities.find((c) => c.cityName === pendingNavigation.cityName);
    if (!rawCity) {
      bailToWorld(`City "${pendingNavigation.cityName}" not found. Resetting to world view.`);
      return;
    }
    const rawCountry = rawCountries.find((c) => c.countryCode === rawCity.countryCode);
    if (!rawCountry) {
      bailToWorld(`Country "${rawCity.countryCode}" for city not found. Resetting to world view.`);
      return;
    }
    resolvedCity.current = pendingNavigation.cityName ?? null;
    setIsNoData(false);
    const state = rawCity.stateCode
      ? toStateMarkerAt(
          {
            stateName: rawCity.stateName,
            stateCode: rawCity.stateCode,
            countryCode: rawCity.countryCode,
          },
          rawCity.geoPosition.coordinates
        )
      : null;
    applyCityNavigation(toCityMarker(rawCity), toCountryMarker(rawCountry), state);
    setPendingNavigation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCities, isFetchingCities, pendingNavigation, rawCountries]);

  // Resolve pending Store navigation once rawSites data arrives.
  useEffect(() => {
    if (pendingNavigation?.level !== 'Store') return;
    if (resolvedStore.current === pendingNavigation.storeValue) return;
    if (isFetchingSites) return;

    const rawSite = rawSites.find(
      (s) =>
        s.siteId === pendingNavigation.storeValue || s.storeNbr === pendingNavigation.storeValue
    );
    if (!rawSite) {
      bailToWorld(`Store "${pendingNavigation.storeValue}" not found. Resetting to world view.`);
      return;
    }
    const rawCountry = rawCountries.find((c) => c.countryCode === rawSite.countryCode);
    if (!rawCountry) {
      bailToWorld(`Country "${rawSite.countryCode}" for store not found. Resetting to world view.`);
      return;
    }
    resolvedStore.current = pendingNavigation.storeValue ?? null;
    setIsNoData(false);
    const state = rawSite.stateCode
      ? toStateMarkerAt(
          {
            stateName: rawSite.stateName,
            stateCode: rawSite.stateCode,
            countryCode: rawSite.countryCode,
          },
          rawSite.geoPosition.coordinates
        )
      : null;
    const city = rawSite.cityName ? toCityMarkerFromSite(rawSite) : null;
    applyStoreNavigation(toStoreMarker(rawSite), toCountryMarker(rawCountry), state, city);
    setPendingNavigation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSites, isFetchingSites, pendingNavigation, rawCountries]);

  return {
    clearResolvedRefs: () => {
      resolvedState.current = null;
      resolvedCity.current = null;
      resolvedStore.current = null;
    },
  };
};
