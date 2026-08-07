import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import { Map, NavigationControl } from '@vis.gl/react-maplibre';
import { Box, useColorScheme } from '@mui/material';
import { LocationMapController } from './LocationMapController';
import { LocationViewportListener } from './LocationViewportListener';
import { IMapDataContext, MapDataContext } from './MapContext';
import { MAP_DEFAULTS } from './mapConstants';
import { useBasemapStyle } from './mapStyle';
import { ActiveMarkersLayer } from './layers/ActiveMarkersLayer';

type Props = {
  mapBounds: LngLatBounds | null;
  mapCenter: [number, number] | null;
  mapZoom: number | null;
  context: IMapDataContext;
};

export const LocationMapContainer = ({ mapBounds, mapCenter, mapZoom, context }: Props) => {
  const [viewportBounds, setViewportBounds] = useState<LngLatBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(mapZoom ?? MAP_DEFAULTS.zoom);
  const { mode } = useColorScheme();
  const basemapStyle = useBasemapStyle(mode === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (mapZoom !== null) setCurrentZoom(mapZoom);
  }, [mapZoom]);

  const handleViewportChange = useCallback(
    (bounds: LngLatBounds) => setViewportBounds(bounds),
    []
  );
  const handleZoomChange = useCallback((zoom: number) => setCurrentZoom(zoom), []);

  // Re-provide the data context with the live map zoom. Memoized so a zoom
  // change doesn't churn a new object when nothing else changed.
  const mapContext = useMemo<IMapDataContext>(
    () => ({ ...context, currentZoom }),
    [context, currentZoom]
  );

  // Blank until the (cached) basemap style JSON is ready — avoids a flash of
  // labelled basemap before the nolabels transform is applied.
  if (!basemapStyle) return <Box className='h-full w-full' />;

  return (
    <MapDataContext.Provider value={mapContext}>
      <Map
        initialViewState={{
          latitude: (mapCenter ?? MAP_DEFAULTS.center)[0],
          longitude: (mapCenter ?? MAP_DEFAULTS.center)[1],
          zoom: mapZoom ?? MAP_DEFAULTS.zoom,
        }}
        mapStyle={basemapStyle}
        maxZoom={18}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Attribution hidden for the preview (matches the original widget's
            attributionControl={false}); ODbL-required credit — legal decides
            for production, see MAP_LIBRARY_SPIKE.md open question #3. */}
        <NavigationControl position='bottom-right' showCompass={false} />
        <LocationMapController bounds={mapBounds} center={mapCenter} zoom={mapZoom} />
        <LocationViewportListener
          onViewportChange={handleViewportChange}
          onZoomChange={handleZoomChange}
        />

        <ActiveMarkersLayer viewportBounds={viewportBounds} />
      </Map>
    </MapDataContext.Provider>
  );
};
