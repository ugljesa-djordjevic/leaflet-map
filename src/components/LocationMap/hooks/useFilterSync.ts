import { useEffect, useRef } from 'react';
import { useAppSelector } from 'src/store/hooks';
import { selectCurrentLocationFilter } from 'src/store/slices/dashboardFiltersSlice';
import { CityMarker, CountryMarker, MapView, StateMarker, StoreMarker } from '../types';
import { IPendingNavigation } from './usePendingNavigation';

interface Params {
  view: MapView;
  selectedCountry: CountryMarker | null;
  selectedState: StateMarker | null;
  selectedCity: CityMarker | null;
  selectedStore: StoreMarker | null;
  setPendingNavigation: (nav: IPendingNavigation | null) => void;
  applyCountryNavigation: (code: string) => void;
  setIsNoData: (v: boolean) => void;
  resetToWorldInternal: () => void;
  clearResolvedRefs: () => void;
}

/**
 * Observes the Redux location filter and drives the map into the matching
 * navigation state. This is the bridge between the LocationSwitcher and the map.
 * Country resolves immediately; State/City/Store need data and so are deferred to
 * `usePendingNavigation` via `setPendingNavigation`.
 */
export const useFilterSync = ({
  view,
  selectedCountry,
  selectedState,
  selectedCity,
  selectedStore,
  setPendingNavigation,
  applyCountryNavigation,
  setIsNoData,
  resetToWorldInternal,
  clearResolvedRefs,
}: Params): void => {
  const filterLocation = useAppSelector(selectCurrentLocationFilter);
  const prevFilterRef = useRef<typeof filterLocation>(filterLocation);

  // Reset to world; `view`/`selectedCountry` guard avoids redundant resets.
  const resetFromFilter = (noData: boolean) => {
    setIsNoData(noData);
    if (view === 'world' && !selectedCountry) return;
    clearResolvedRefs();
    resetToWorldInternal();
  };

  // A deeper filter that arrived without a country code can't be located on the map.
  const bailMissingCountryCode = (levelLabel: string, value: string) => {
    if (import.meta.env.DEV)
      console.warn(
        `[LocationSwitcher→Map] Cannot navigate to ${levelLabel} "${value}" — countryCode is missing. Rebuild & restart the backend. Resetting to world view.`
      );
    setIsNoData(true);
    resetToWorldInternal();
  };

  const queuePending = (nav: IPendingNavigation) => {
    clearResolvedRefs();
    setPendingNavigation(nav);
  };

  const goToCountry = (value: string) => {
    if (selectedCountry?.countryCode === value) return;
    applyCountryNavigation(value);
  };

  const goToState = (value: string, countryCode?: string) => {
    if (selectedState?.stateCode === value) return;
    if (!countryCode) return bailMissingCountryCode('State', value);
    queuePending({ level: 'State', countryCode, stateCode: value });
  };

  const goToCity = (value: string, countryCode?: string, stateCode?: string) => {
    if (selectedCity?.cityName === value) return;
    if (!countryCode) return bailMissingCountryCode('City', value);
    queuePending({ level: 'City', countryCode, stateCode, cityName: value });
  };

  const goToStore = (
    value: string,
    countryCode?: string,
    stateCode?: string,
    cityName?: string
  ) => {
    if (selectedStore?.id === value) return;
    if (!countryCode) return bailMissingCountryCode('Store', value);
    queuePending({ level: 'Store', countryCode, stateCode, cityName, storeValue: value });
  };

  const routeFilterChange = () => {
    if (!filterLocation) return resetFromFilter(false);

    const { level, value, countryCode, stateCode, cityName } = filterLocation;
    switch (level) {
      // Region is above Country — the map has no region concept; reset to world.
      case 'Region':
        return resetFromFilter(true);
      case 'Country':
        return goToCountry(value);
      case 'State':
        return goToState(value, countryCode);
      case 'City':
        return goToCity(value, countryCode, stateCode);
      case 'Store':
      case 'Store Nbr':
        return goToStore(value, countryCode, stateCode, cityName);
      default:
        if (import.meta.env.DEV)
          console.warn(
            `[LocationSwitcher→Map] Unhandled location level: "${level}" (value: "${value}"). Navigation not implemented for this level.`
          );
    }
  };

  useEffect(() => {
    const prev = prevFilterRef.current;
    prevFilterRef.current = filterLocation;
    if (filterLocation !== prev) routeFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLocation]);
};
