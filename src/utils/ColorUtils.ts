import { Theme } from '@mui/material/styles';

/**
 * Preview copy of the host app's ColorUtils. `getProgressColor` interpolates a
 * 0–100 availability across the theme's error.main → warning.light →
 * success.main ramp (same three stops the legend gradient and
 * CircularProgressWithContent use). Always returns a hex string — marker
 * stroke derivation (`strokeFromFill`) depends on that.
 */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const num = Number.parseInt(clean, 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
};

const rgbToHex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

const mix = (
  from: [number, number, number],
  to: [number, number, number],
  t: number
): [number, number, number] => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

export const ColorUtils = {
  getProgressColor(theme: Theme, value: number): string {
    const v = clamp(value, 0, 100);
    const low = hexToRgb(theme.palette.error.main);
    const mid = hexToRgb(theme.palette.warning.light);
    const high = hexToRgb(theme.palette.success.main);
    return v <= 50 ? rgbToHex(mix(low, mid, v / 50)) : rgbToHex(mix(mid, high, (v - 50) / 50));
  },
};
