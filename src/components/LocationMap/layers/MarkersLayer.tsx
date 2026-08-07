import { useCallback, useMemo } from 'react';
import type { LngLatBounds } from 'maplibre-gl';
import Supercluster from 'supercluster';
import { Marker, useMap } from '@vis.gl/react-maplibre';
import { useTheme } from '@mui/material';
import { AvailabilityMarker } from '../AvailabilityMarker';
import { padBounds, strokeFromFill } from '../mapUtils';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  LABEL_ZOOM_BY_VIEW,
  MARKER_SIZE,
  VIEWPORT_PAD,
} from '../mapConstants';
import { useMapDataContext, useMapHoverContext } from '../MapContext';
import { AvailabilityPoint, MapView } from '../types';
import { ColorUtils } from 'src/utils/ColorUtils';

type Props<T extends AvailabilityPoint> = {
  markers: T[];
  /** Drives the zoom level at which labels become permanently visible. */
  view: MapView;
  onSelect: (marker: T) => void;
  /** When provided, off-screen markers are culled (used for the dense city/store sets). */
  viewportBounds?: LngLatBounds | null;
};

/** Availability aggregated by supercluster's map/reduce over child points. */
type ClusterProps = { sum: number };
type PointProps = { id: string; availability: number };

const WORLD_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

/**
 * Renders a clustered set of availability markers for any navigation level.
 * The four levels (world / usa-states / country / city) differ only in their
 * data and click handler, so they share this single implementation.
 * Clustering is supercluster (same engine MapLibre uses internally); a
 * cluster's colour reflects the average availability of its children. Past
 * CLUSTER_MAX_ZOOM, co-located markers fan out in a circle (spiderfy
 * replacement).
 */
export const MarkersLayer = <T extends AvailabilityPoint>({
  markers,
  view,
  onSelect,
  viewportBounds,
}: Props<T>) => {
  const theme = useTheme();
  const { current: mapRef } = useMap();
  const { currentZoom } = useMapDataContext();
  const { hoveredId, setHoveredId } = useMapHoverContext();

  const labelZoom = LABEL_ZOOM_BY_VIEW[view];

  const visibleMarkers = useMemo(() => {
    if (!viewportBounds) return markers;
    const padded = padBounds(viewportBounds, VIEWPORT_PAD);
    return markers.filter((m) => padded.contains([m.lng, m.lat]));
  }, [markers, viewportBounds]);

  const markersById = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers]);
  const handleSelect = useCallback(
    (id: string) => {
      const marker = markersById.get(id);
      if (marker) onSelect(marker);
    },
    [markersById, onSelect]
  );

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<PointProps, ClusterProps>({
      radius: CLUSTER_RADIUS,
      maxZoom: CLUSTER_MAX_ZOOM,
      map: (props) => ({ sum: props.availability }),
      reduce: (accumulated, props) => {
        accumulated.sum += props.sum;
      },
    });
    index.load(
      visibleMarkers.map((m) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
        properties: { id: m.id, availability: m.availability },
      }))
    );
    return index;
  }, [visibleMarkers]);

  const zoom = Math.max(0, Math.floor(currentZoom));
  const clusters = useMemo(
    () => clusterIndex.getClusters(WORLD_BBOX, zoom),
    [clusterIndex, zoom]
  );

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const map = mapRef?.getMap();
      if (!map) return;
      const targetZoom = Math.min(
        clusterIndex.getClusterExpansionZoom(clusterId),
        map.getMaxZoom()
      );
      map.easeTo({ center: [lng, lat], zoom: targetZoom, duration: 500 });
    },
    [clusterIndex, mapRef]
  );

  // Past CLUSTER_MAX_ZOOM supercluster returns co-located points individually
  // (they'd otherwise stack invisibly). Group by exact coordinate so such
  // markers can be fanned out in a circle — the spiderfy replacement.
  const coordinateGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    visibleMarkers.forEach((m) => {
      const key = `${m.lng},${m.lat}`;
      const ids = groups.get(key) ?? [];
      ids.push(m.id);
      groups.set(key, ids);
    });
    return groups;
  }, [visibleMarkers]);

  const fanOffset = (point: T): [number, number] | undefined => {
    if (zoom < CLUSTER_MAX_ZOOM) return undefined;
    const group = coordinateGroups.get(`${point.lng},${point.lat}`);
    if (!group || group.length < 2) return undefined;
    const index = group.indexOf(point.id);
    const radius = MARKER_SIZE.base * 0.75 + group.length * 2;
    const angle = (2 * Math.PI * index) / group.length;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  };

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const properties = feature.properties;

        if ('cluster' in properties) {
          const clusterId = properties.cluster_id;
          const count = properties.point_count;
          const average = Math.round(properties.sum / count);
          const fill = ColorUtils.getProgressColor(theme, average);
          const stroke = strokeFromFill(fill);
          return (
            <Marker
              key={`cluster-${clusterId}`}
              longitude={lng}
              latitude={lat}
              anchor='center'
              onClick={(event) => {
                event.originalEvent?.stopPropagation();
                handleClusterClick(clusterId, lng, lat);
              }}
            >
              <div
                className='availability-cluster'
                style={{ background: fill, borderColor: stroke }}
              >
                <span className='availability-cluster__value'>{average}%</span>
              </div>
            </Marker>
          );
        }

        const point = markersById.get(properties.id);
        if (!point) return null;
        const isHovered = hoveredId === point.id;
        return (
          <AvailabilityMarker
            key={point.id}
            id={point.id}
            lat={point.lat}
            lng={point.lng}
            availability={point.availability}
            label={isHovered ? point.name : `${point.availability}%`}
            showLabel={isHovered || currentZoom >= labelZoom}
            isHovered={isHovered}
            onSelect={handleSelect}
            onHover={setHoveredId}
            pixelOffset={fanOffset(point)}
          />
        );
      })}
    </>
  );
};
