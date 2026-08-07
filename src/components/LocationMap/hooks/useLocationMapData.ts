import { useMemo } from 'react';
import {
  useGetMapCitiesQuery,
  useGetMapStatesQuery,
  useGetMapSitesQuery,
} from 'src/services/locationMapService';
import { IMapCountry } from 'src/models';
import {
  CityMarker,
  CountryMarker,
  StateMarker,
  StoreMarker,
  toCityMarker,
  toCountryMarker,
  toStateMarker,
  toStoreMarker,
} from '../types';

interface UseLocationMapDataParams {
  rawCountries: IMapCountry[];
  selectedCountry: CountryMarker | null;
  selectedState: StateMarker | null;
  selectedCity: CityMarker | null;
}

interface LocationMapData {
  countries: CountryMarker[];
  usaStates: StateMarker[];
  cities: CityMarker[];
  stores: StoreMarker[];
}

/**
 * Transforms the raw Cosmos data (countries from the parent, states/cities/sites
 * fetched on demand for the current selection) into the typed marker models the
 * map and sidebar render.
 */
export const useLocationMapData = ({
  rawCountries,
  selectedCountry,
  selectedState,
  selectedCity,
}: UseLocationMapDataParams): LocationMapData => {
  const countryCode = selectedCountry?.countryCode ?? null;
  const stateCode = selectedState?.stateCode ?? null;
  const cityName = selectedCity?.cityName ?? null;

  const { data: rawStates = [] } = useGetMapStatesQuery(countryCode ?? '', { skip: !countryCode });

  const { data: rawCities = [] } = useGetMapCitiesQuery(
    { countryCode: countryCode ?? undefined, stateCode: stateCode ?? undefined },
    { skip: !countryCode && !stateCode }
  );

  const { data: rawSites = [] } = useGetMapSitesQuery(
    {
      countryCode: countryCode ?? undefined,
      stateCode: stateCode ?? undefined,
      cityName: cityName ?? undefined,
    },
    { skip: !cityName }
  );

  const countries = useMemo(() => rawCountries.map(toCountryMarker), [rawCountries]);
  const usaStates = useMemo(() => rawStates.map(toStateMarker), [rawStates]);
  const cities = useMemo(() => {
    if (!selectedCountry && !selectedState) return [];
    return rawCities.map(toCityMarker);
  }, [rawCities, selectedCountry, selectedState]);
  const stores = useMemo(() => rawSites.map(toStoreMarker), [rawSites]);

  return { countries, usaStates, cities, stores };
};
