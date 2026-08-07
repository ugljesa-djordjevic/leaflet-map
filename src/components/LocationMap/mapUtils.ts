import { LngLatBounds } from 'maplibre-gl';

/**
 * Colour helpers for availability markers and cluster bubbles. Colours are
 * passed in already resolved from the MUI theme — this module does no colour
 * logic of its own. CSS class names used by the marker components match the
 * widget's external stylesheet and must not be renamed.
 */

/** Lightens a colour toward white by `amount` (0–1). Accepts both hex (#rrggbb) and rgba(...) strings. */
export const lightenColor = (color: string, amount = 0.22): string => {
  let r: number, g: number, b: number;

  const rgbaMatch = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    r = Number(rgbaMatch[1]);
    g = Number(rgbaMatch[2]);
    b = Number(rgbaMatch[3]);
  } else {
    const clean = color.replace('#', '');
    if (clean.length !== 6) return color;
    const num = Number.parseInt(clean, 16);
    r = (num >> 16) & 0xff;
    g = (num >> 8) & 0xff;
    b = num & 0xff;
  }

  const tint = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(tint(r))}${toHex(tint(g))}${toHex(tint(b))}`;
};

/** Border colour derived from a marker's fill. */
export const strokeFromFill = (fill: string): string => lightenColor(fill, 0.5);

/**
 * Expands bounds by `ratio` of their span on every side — MapLibre's
 * `LngLatBounds` has no equivalent of Leaflet's `bounds.pad()`.
 */
export const padBounds = (bounds: LngLatBounds, ratio: number): LngLatBounds => {
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  const lngPad = (east - west) * ratio;
  const latPad = (north - south) * ratio;
  return new LngLatBounds([west - lngPad, south - latPad], [east + lngPad, north + latPad]);
};
