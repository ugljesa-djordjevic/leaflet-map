import { useMemo, useState } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { useGetMapCountriesQuery } from 'src/services/locationMapService';
import { LocationMapAvailabilityWidget } from './LocationMapAvailabilityWidget';
import { LocationMapContainer } from './LocationMapContainer';
import { LocationMapLegend } from './LocationMapLegend';
import { LocationMapBreadcrumb } from './LocationMapBreadcrumb';
import { useMapNavigation } from './hooks/useMapNavigation';
import { useLocationMapData } from './hooks/useLocationMapData';
import { IMapDataContext, IMapHoverContext, MapDataContext, MapHoverContext } from './MapContext';
import { SIDEBAR_ITEMS_PER_PAGE } from './mapConstants';

export const LocationMap = () => {
  const { data: rawCountries = [] } = useGetMapCountriesQuery();

  const {
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
  } = useMapNavigation({ rawCountries });

  const { countries, usaStates, cities, stores } = useLocationMapData({
    rawCountries,
    selectedCountry,
    selectedState,
    selectedCity,
  });

  // Hover state lives here so MapHoverContext.Provider can wrap both the map
  // and the sidebar widget, enabling cross-highlight without re-rendering
  // the stable MapDataContext consumers on every hover event.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const theme = useTheme();

  const mapDataContext = useMemo<IMapDataContext>(
    () => ({
      view,
      currentZoom: 0, // placeholder; LocationMapContainer re-provides the real Leaflet zoom
      countries: isNoData ? [] : countries,
      usaStates,
      cities,
      stores,
      selectedCountry,
      selectedState,
      selectedCity,
      onCountryClick: handleCountrySelect,
      onStateClick: handleStateSelect,
      onCityClick: handleCitySelect,
      onStoreClick: handleStoreSelect,
    }),
    [
      view,
      isNoData,
      countries,
      usaStates,
      cities,
      stores,
      selectedCountry,
      selectedState,
      selectedCity,
      handleCountrySelect,
      handleStateSelect,
      handleCitySelect,
      handleStoreSelect,
    ]
  );

  const hoverContext = useMemo<IMapHoverContext>(() => ({ hoveredId, setHoveredId }), [hoveredId]);

  return (
    <Paper
      variant='outlined'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        p: '16px',
        borderRadius: '8px',
        gap: '8px',
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Typography variant='overline'>ESTATE HEALTH</Typography>
      </Box>
      <MapDataContext.Provider value={mapDataContext}>
        <MapHoverContext.Provider value={hoverContext}>
          <Box sx={{ display: 'flex', gap: '16px', height: '100%', width: '100%', minHeight: 0 }}>
            <Box
              sx={{
                flex: 1,
                position: 'relative',
                border: 1,
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.background.paper,
                minWidth: 0,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <LocationMapBreadcrumb breadcrumbs={breadcrumbs} />
              <LocationMapContainer
                mapBounds={mapBounds}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                context={mapDataContext}
              />
              <LocationMapLegend />
            </Box>

            <LocationMapAvailabilityWidget
              countries={countries}
              usaStates={usaStates}
              cities={cities}
              stores={stores}
              selectedCity={selectedCity}
              selectedState={selectedState}
              selectedCountry={selectedCountry}
              isNoData={isNoData}
              view={view}
              itemsPerPage={SIDEBAR_ITEMS_PER_PAGE}
              page={page}
              setPage={setPage}
            />
          </Box>
        </MapHoverContext.Provider>
      </MapDataContext.Provider>
    </Paper>
  );
};
