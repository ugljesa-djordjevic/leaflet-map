import { useEffect } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import { useMap } from '@vis.gl/react-maplibre';
import { FIT_BOUNDS_OPTIONS } from './mapConstants';

type Props = {
  bounds: LngLatBounds | null;
  /** [latitude, longitude] — widget order; flipped at this MapLibre boundary. */
  center: [number, number] | null;
  zoom: number | null;
};

/** Imperatively drives the map camera from the navigation state. */
export const LocationMapController = ({ bounds, center, zoom }: Props) => {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;
    if (import.meta.env.DEV) (window as unknown as { __previewMap?: unknown }).__previewMap = map;
    if (bounds) {
      map.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
    } else if (center && zoom !== null) {
      map.easeTo({ center: [center[1], center[0]], zoom, duration: 600 });
    }
  }, [bounds, center, zoom, mapRef]);

  return null;
};
