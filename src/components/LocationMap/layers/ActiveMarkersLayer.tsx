import type { LngLatBounds } from 'maplibre-gl';
import { MarkersLayer } from './MarkersLayer';
import { useMapDataContext } from '../MapContext';

type Props = {
  /** Viewport culling only applies to the denser country/city marker sets. */
  viewportBounds: LngLatBounds | null;
};

/**
 * Picks the marker set, click handler and "is this level selectable" guard for
 * the active navigation level and renders a single `MarkersLayer`. Replaces four
 * near-identical per-level wrapper components (world/usa-states/country/city),
 * which differed only in which context fields they read.
 */
export const ActiveMarkersLayer = ({ viewportBounds }: Props) => {
  const {
    view,
    countries,
    usaStates,
    cities,
    stores,
    selectedCountry,
    selectedState,
    selectedCity,
    onCountryClick,
    onStateClick,
    onCityClick,
    onStoreClick,
  } = useMapDataContext();

  switch (view) {
    case 'world':
      return <MarkersLayer markers={countries} view='world' onSelect={onCountryClick} />;

    case 'usa-states':
      return selectedCountry ? (
        <MarkersLayer markers={usaStates} view='usa-states' onSelect={onStateClick} />
      ) : null;

    case 'country':
      return selectedCountry || selectedState ? (
        <MarkersLayer
          markers={cities}
          view='country'
          onSelect={onCityClick}
          viewportBounds={viewportBounds}
        />
      ) : null;

    case 'city':
      return selectedCity ? (
        <MarkersLayer
          markers={stores}
          view='city'
          onSelect={onStoreClick}
          viewportBounds={viewportBounds}
        />
      ) : null;

    default:
      return null;
  }
};
