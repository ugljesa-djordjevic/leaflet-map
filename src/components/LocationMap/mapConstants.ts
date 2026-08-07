import { MapView } from './types';

/**
 * All map tuning values live here so the widget has no magic numbers scattered
 * across components. Adjust behaviour from this single file.
 *
 * Zoom values are MapLibre levels. MapLibre renders 512px vector tiles, so a
 * given scale sits ~1 zoom level lower than the old Leaflet (256px raster)
 * values — every zoom below is the Leaflet-era number minus one.
 */

/** Initial/world view camera. Center is [latitude, longitude] (widget order). */
export const MAP_DEFAULTS = {
  center: [30, 0] as [number, number],
  zoom: 2,
};

/** Zoom level applied when drilling into each navigation level. */
export const ZOOM_BY_LEVEL = {
  country: 4,
  state: 6,
  city: 12,
  store: 14,
};

/** A marker's label becomes permanently visible once the map zoom reaches this
 *  level for the active view (otherwise the label only shows on hover). */
export const LABEL_ZOOM_BY_VIEW: Record<MapView, number> = {
  world: 3,
  'usa-states': 3,
  country: 4,
  city: 8,
};

/** Pixel diameter of an availability marker. */
export const MARKER_SIZE = {
  base: 32,
  hover: 42,
};

/** Pixel diameter of a cluster bubble. */
export const CLUSTER_SIZE = 46;

/** Cluster radius in pixels (parity with leaflet.markercluster's default 80). */
export const CLUSTER_RADIUS = 80;

/**
 * Zoom at which clustering stops. Beyond it, markers sharing coordinates are
 * fanned out in a circle (replaces markercluster's spiderfy).
 */
export const CLUSTER_MAX_ZOOM = 13;

/** How far to extend the viewport when culling off-screen markers (fraction of
 *  the visible bounds added on every side). */
export const VIEWPORT_PAD = 0.2;

/** Debounce for map move/zoom events before recomputing the viewport. */
export const VIEWPORT_DEBOUNCE_MS = 120;

/** Options used when fitting the map to a bounding box. */
export const FIT_BOUNDS_OPTIONS = {
  padding: 50,
  maxZoom: 11,
};

/** Maximum number of countries listed in the sidebar at world level. */
export const COUNTRY_LIST_LIMIT = 100;

/** Items shown per page in the sidebar availability list. */
export const SIDEBAR_ITEMS_PER_PAGE = 10;

/** Stacking order for the overlays drawn on top of the map canvas. */
export const Z_INDEX = {
  mapOverlay: 1000,
  sidebarFooter: 2,
};
