import { useEffect, useRef } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import { useMap } from '@vis.gl/react-maplibre';
import { VIEWPORT_DEBOUNCE_MS } from './mapConstants';

type Props = {
  onViewportChange: (bounds: LngLatBounds) => void;
  onZoomChange?: (zoom: number) => void;
};

/** Reports the map's bounds and zoom after pan/zoom settles (debounced). */
export const LocationViewportListener = ({ onViewportChange, onZoomChange }: Props) => {
  const { current: mapRef } = useMap();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const updateBounds = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onViewportChange(map.getBounds());
        onZoomChange?.(map.getZoom());
      }, VIEWPORT_DEBOUNCE_MS);
    };

    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    // Children mount after the map instance exists, so the 'load' event may
    // already have fired — report the initial viewport explicitly.
    if (map.loaded()) updateBounds();
    else map.once('load', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
      map.off('load', updateBounds);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mapRef, onViewportChange, onZoomChange]);

  return null;
};
