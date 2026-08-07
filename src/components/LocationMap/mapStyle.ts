import { useEffect, useState } from 'react';
import type { StyleSpecification } from 'maplibre-gl';

/**
 * Basemap styles for the map. OpenFreeMap serves the open-source CARTO
 * cartography (Positron light / dark) as MapLibre vector styles — free for
 * commercial use, no API key. The widget's design uses the *nolabels*
 * variants, so we fetch the style JSON once and strip its symbol (label)
 * layers before handing it to the map.
 */

const STYLE_URLS: Record<'light' | 'dark', string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

const cache: Partial<Record<'light' | 'dark', StyleSpecification>> = {};

const stripLabels = (style: StyleSpecification): StyleSpecification => ({
  ...style,
  layers: style.layers.filter((layer) => layer.type !== 'symbol'),
});

export const useBasemapStyle = (mode: 'light' | 'dark'): StyleSpecification | null => {
  const [style, setStyle] = useState<StyleSpecification | null>(cache[mode] ?? null);

  useEffect(() => {
    const cached = cache[mode];
    if (cached) {
      setStyle(cached);
      return;
    }
    let cancelled = false;
    fetch(STYLE_URLS[mode])
      .then((response) => response.json())
      .then((json: StyleSpecification) => {
        const noLabels = stripLabels(json);
        cache[mode] = noLabels;
        if (!cancelled) setStyle(noLabels);
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn('[LocationMap] basemap style fetch failed', error);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return style;
};
