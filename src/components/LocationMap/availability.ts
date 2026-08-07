/**
 * Single source of truth for how an availability percentage maps to a status
 * label and chip colours. Continuous colour rendering (markers, clusters,
 * progress rings, legend) is handled by `ColorUtils.getProgressColor` which
 * interpolates across the MUI theme's error → warning → success palette tokens.
 */

export interface AvailabilityStatus {
  label: string;
  /** MUI palette path, resolved by the `sx` prop (e.g. `info.subtleContrast`). */
  color: string;
  bgcolor: string;
}

/**
 * Fixed brand colour used to highlight a hovered marker. Intentionally NOT part
 * of the availability scale — the design calls for hover to always be this purple.
 */
export const HOVER_MARKER_COLOR = '#7c3aed';

const CRITICAL_STATUS: AvailabilityStatus = {
  label: 'Critical',
  color: 'error.subtleContrast',
  bgcolor: 'error.subtle',
};

/**
 * Unified availability band scale for the status chip. Higher availability =
 * lower risk. `min` is the inclusive lower bound; bands are ordered high→low so
 * the first match wins.
 */
const STATUS_BANDS: ReadonlyArray<{ min: number; status: AvailabilityStatus }> = [
  { min: 70, status: { label: 'Low', color: 'info.subtleContrast', bgcolor: 'info.subtle' } },
  {
    min: 40,
    status: { label: 'Medium', color: 'category4.subtleContrast', bgcolor: 'category4.subtle' },
  },
  {
    min: 20,
    status: { label: 'High', color: 'warning.subtleContrast', bgcolor: 'warning.subtle' },
  },
  { min: 0, status: CRITICAL_STATUS },
];

export const getAvailabilityStatus = (availability: number): AvailabilityStatus =>
  STATUS_BANDS.find((band) => availability >= band.min)?.status ?? CRITICAL_STATUS;

/**
 * Continuous gradient (0 %→100 %, left→right) drawn under the legend.  Mirrors
 * the three-stop gradient used by CircularProgressWithContent exactly:
 * error.main at 0 %, warning.light at 50 %, success.main at 100 %.
 */
export const LEGEND_GRADIENT = `linear-gradient(to right, #DD1708, #F99934 50%, #24802D)`;

/** Axis labels rendered beneath the legend gradient. */
export const LEGEND_TICKS = [0, 20, 40, 60, 80, 100];
