import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { IMapCity, IMapCountry, IMapSite, IMapState } from 'src/models';
import { mockCities, mockCountries, mockSites, mockStates } from 'src/mocks/mapData';

/**
 * Preview stand-in for the host app's RTK Query service. Same endpoint names,
 * arg shapes and response types as the real service backed by the location-map
 * Azure Functions — but resolved from the mock estate with a small latency so
 * `isFetching` code paths behave like production.
 */

const LATENCY_MS = 300;

const respond = async <T>(data: T): Promise<{ data: T }> => {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return { data };
};

interface CitiesArgs {
  countryCode?: string;
  stateCode?: string;
}

interface SitesArgs {
  countryCode?: string;
  stateCode?: string;
  cityName?: string;
}

export const locationMapApi = createApi({
  reducerPath: 'locationMapApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getMapCountries: builder.query<IMapCountry[], void>({
      queryFn: () => respond(mockCountries),
    }),
    getMapStates: builder.query<IMapState[], string>({
      queryFn: (countryCode) =>
        respond(mockStates.filter((s) => !countryCode || s.countryCode === countryCode)),
    }),
    getMapCities: builder.query<IMapCity[], CitiesArgs>({
      queryFn: ({ countryCode, stateCode }) =>
        respond(
          mockCities.filter(
            (c) =>
              (!countryCode || c.countryCode === countryCode) &&
              (!stateCode || c.stateCode === stateCode)
          )
        ),
    }),
    getMapSites: builder.query<IMapSite[], SitesArgs>({
      queryFn: ({ countryCode, stateCode, cityName }) =>
        respond(
          mockSites.filter(
            (s) =>
              (!countryCode || s.countryCode === countryCode) &&
              (!stateCode || s.stateCode === stateCode) &&
              (!cityName || s.cityName === cityName)
          )
        ),
    }),
  }),
});

export const {
  useGetMapCountriesQuery,
  useGetMapStatesQuery,
  useGetMapCitiesQuery,
  useGetMapSitesQuery,
} = locationMapApi;
