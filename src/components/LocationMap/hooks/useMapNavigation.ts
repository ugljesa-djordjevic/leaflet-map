import { useCallback, useState } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import { useAppDispatch } from 'src/store/hooks';
import { locationFilterChanged } from 'src/store/slices/dashboardFiltersSlice';
import { ICustomerLocation } from 'src/models/Customer';
import { IMapCountry } from 'src/models';
import {
  useGetMapCitiesQuery,
  useGetMapSitesQuery,
  useGetMapStatesQuery,
} from 'src/services/locationMapService';
import { MAP_DEFAULTS, ZOOM_BY_LEVEL } from '../mapConstants';
import {
  CityMarker,
  CountryMarker,
  MapView,
  StateMarker,
  StoreMarker,
  isUSA,
  toCountryMarker,
} from '../types';
import { IPendingNavigation, usePendingNavigation } from './usePendingNavigation';
import { useFilterSync } from './useFilterSync';
import { useBreadcrumbs } from './useBreadcrumbs';

interface UseMapNavigationParams {
  rawCountries: IMapCountry[];
}

/**
 * Central navigation state machine. Owns the selected location at every level,
 * the map viewport, and the bridge to the Redux location filter. Drilling into a
 * level always: selects it, clears the levels below, switches the view, and
 * recentres the map. `apply*` helpers do this locally (used when the change
 * originates from the filter, so we don't re-dispatch); `handle*Select` /
 * `navigateTo*` add the Redux dispatch for user-initiated changes.
 */
export const useMapNavigation = ({ rawCountries }: UseMapNavigationParams) => {
  const [view, setView] = useState<MapView>('world');
  const [selectedCountry, setSelectedCountry] = useState<CountryMarker | null>(null);
  const [selectedState, setSelectedState] = useState<StateMarker | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityMarker | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreMarker | null>(null);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(MAP_DEFAULTS.center);
  const [mapZoom, setMapZoom] = useState<number | null>(MAP_DEFAULTS.zoom);
  const [page, setPage] = useState<number>(0);
  const [isNoData, setIsNoData] = useState<boolean>(false);

  // Tracks a multi-step navigation triggered from the LocationSwitcher filter.
  const [pendingNavigation, setPendingNavigation] = useState<IPendingNavigation | null>(null);

  const dispatch = useAppDispatch();

  // --- RTK Query for pending navigation resolution (args differ from display queries) ---
  const { data: rawStates = [], isFetching: isFetchingStates } = useGetMapStatesQuery(
    pendingNavigation?.countryCode ?? '',
    { skip: !pendingNavigation?.countryCode }
  );

  const { data: rawCities = [], isFetching: isFetchingCities } = useGetMapCitiesQuery(
    { countryCode: pendingNavigation?.countryCode, stateCode: pendingNavigation?.stateCode },
    {
      skip:
        !pendingNavigation ||
        (pendingNavigation.level !== 'City' && pendingNavigation.level !== 'Store'),
    }
  );

  const { data: rawSites = [], isFetching: isFetchingSites } = useGetMapSitesQuery(
    {
      countryCode: pendingNavigation?.countryCode,
      stateCode: pendingNavigation?.stateCode,
      cityName: pendingNavigation?.cityName,
    },
    { skip: pendingNavigation?.level !== 'Store' }
  );

  const selectLocation = useCallback(
    (location: ICustomerLocation | null) => dispatch(locationFilterChanged(location)),
    [dispatch]
  );

  /** Recentre the map and reset pagination. Shared by every drill-down. */
  const focus = useCallback((lat: number, lng: number, zoom: number) => {
    setMapBounds(null);
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    setPage(0);
  }, []);

  /** Reset to world view without touching Redux (graceful degradation / filter sync). */
  const resetToWorldInternal = useCallback(() => {
    setSelectedCity(null);
    setSelectedState(null);
    setSelectedCountry(null);
    setSelectedStore(null);
    setPendingNavigation(null);
    setView('world');
    setMapBounds(null);
    setMapCenter(MAP_DEFAULTS.center);
    setMapZoom(MAP_DEFAULTS.zoom);
    setPage(0);
  }, []);

  // --- Local state writes per level (no Redux dispatch) ---
  const applyCountry = useCallback(
    (country: CountryMarker) => {
      setSelectedCountry(country);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedStore(null);
      setView(isUSA(country) ? 'usa-states' : 'country');
      focus(country.lat, country.lng, ZOOM_BY_LEVEL.country);
    },
    [focus]
  );

  const applyState = useCallback(
    (state: StateMarker) => {
      setSelectedState(state);
      setSelectedCity(null);
      setSelectedStore(null);
      setView('country');
      focus(state.lat, state.lng, ZOOM_BY_LEVEL.state);
    },
    [focus]
  );

  const applyCity = useCallback(
    (city: CityMarker) => {
      setSelectedCity(city);
      setSelectedStore(null);
      setView('city');
      focus(city.lat, city.lng, ZOOM_BY_LEVEL.city);
    },
    [focus]
  );

  // Note: drilling to a store intentionally does NOT change the view.
  const applyStore = useCallback(
    (store: StoreMarker) => {
      setSelectedStore(store);
      focus(store.lat, store.lng, ZOOM_BY_LEVEL.store);
    },
    [focus]
  );

  // ---------------------------------------------------------------------------
  // Filter-originated navigators (no Redux dispatch — the filter already changed)
  // ---------------------------------------------------------------------------
  const applyCountryNavigation = useCallback(
    (countryCode: string) => {
      // Match priority: exact → case-insensitive → ISO-2/ISO-3 prefix (GB↔GBR, US↔USA).
      const normalised = countryCode.toUpperCase();
      const raw =
        rawCountries.find((c) => c.countryCode === countryCode) ??
        rawCountries.find((c) => c.countryCode.toUpperCase() === normalised) ??
        rawCountries.find(
          (c) =>
            c.countryCode.toUpperCase().startsWith(normalised) ||
            normalised.startsWith(c.countryCode.toUpperCase())
        );
      if (!raw) {
        if (import.meta.env.DEV)
          console.warn(
            `[LocationSwitcher→Map] Country not found in map data: "${countryCode}". rawCountries has ${rawCountries.length} entries. Resetting to world view.`
          );
        setIsNoData(true);
        resetToWorldInternal();
        return;
      }
      setIsNoData(false);
      applyCountry(toCountryMarker(raw));
    },
    [rawCountries, resetToWorldInternal, applyCountry]
  );

  const applyStateNavigation = useCallback(
    (state: StateMarker, country: CountryMarker) => {
      setSelectedCountry(country);
      applyState(state);
    },
    [applyState]
  );

  const applyCityNavigation = useCallback(
    (city: CityMarker, country: CountryMarker, state: StateMarker | null) => {
      setSelectedCountry(country);
      setSelectedState(state);
      applyCity(city);
    },
    [applyCity]
  );

  const applyStoreNavigation = useCallback(
    (
      store: StoreMarker,
      country: CountryMarker,
      state: StateMarker | null,
      city: CityMarker | null
    ) => {
      setSelectedCountry(country);
      setSelectedState(state);
      setSelectedCity(city);
      // Fix over the original widget: a store filter arriving on a fresh
      // world view used to keep view='world', rendering country markers under
      // a street-level camera. Switch to the city level when the city is known.
      if (city) setView('city');
      applyStore(store);
    },
    [applyStore]
  );

  // ---------------------------------------------------------------------------
  // Async navigation resolution – filter → pending → resolved
  // ---------------------------------------------------------------------------
  const { clearResolvedRefs } = usePendingNavigation({
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
  });

  // ---------------------------------------------------------------------------
  // External filter synchronisation – LocationSwitcher → map
  // ---------------------------------------------------------------------------
  useFilterSync({
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
  });

  // ---------------------------------------------------------------------------
  // User-initiated navigation (updates local state AND dispatches to Redux)
  // ---------------------------------------------------------------------------
  const navigateToWorld = useCallback(() => {
    setIsNoData(false);
    resetToWorldInternal();
    selectLocation(null);
  }, [resetToWorldInternal, selectLocation]);

  const navigateToCountryOrStates = useCallback(() => {
    if (!selectedCountry) return;
    applyCountry(selectedCountry);
    selectLocation({
      displayName: selectedCountry.name,
      value: selectedCountry.countryCode,
      level: 'Country',
    });
  }, [selectedCountry, applyCountry, selectLocation]);

  const navigateToState = useCallback(() => {
    if (!selectedState) return;
    applyState(selectedState);
    selectLocation({
      displayName: selectedState.name || selectedState.stateCode || 'State',
      value: selectedState.stateCode || selectedState.name,
      level: 'State',
    });
  }, [selectedState, applyState, selectLocation]);

  const handleCountrySelect = useCallback(
    (country: CountryMarker) => {
      applyCountry(country);
      selectLocation({ displayName: country.name, value: country.countryCode, level: 'Country' });
    },
    [applyCountry, selectLocation]
  );

  const handleStateSelect = useCallback(
    (state: StateMarker) => {
      applyState(state);
      selectLocation({
        displayName: state.name || state.stateCode || 'State',
        value: state.stateCode || state.name,
        level: 'State',
      });
    },
    [applyState, selectLocation]
  );

  const handleCitySelect = useCallback(
    (city: CityMarker) => {
      applyCity(city);
      selectLocation({
        displayName: city.name || 'City',
        value: city.name || 'City',
        level: 'City',
      });
    },
    [applyCity, selectLocation]
  );

  const handleStoreSelect = useCallback(
    (store: StoreMarker) => {
      applyStore(store);
      selectLocation({ displayName: store.name, value: store.id, level: 'Store' });
    },
    [applyStore, selectLocation]
  );

  // ---------------------------------------------------------------------------
  // Breadcrumbs (derived state, extracted to useBreadcrumbs)
  // ---------------------------------------------------------------------------
  const breadcrumbs = useBreadcrumbs({
    selectedCountry,
    selectedState,
    selectedCity,
    selectedStore,
    navigateToWorld,
    navigateToCountryOrStates,
    navigateToState,
    handleStoreSelect,
  });

  return {
    view,
    selectedCountry,
    selectedState,
    selectedCity,
    mapBounds,
    mapCenter,
    mapZoom,
    page,
    setPage,
    breadcrumbs,
    isNoData,
    handleCountrySelect,
    handleStateSelect,
    handleCitySelect,
    handleStoreSelect,
  };
};
