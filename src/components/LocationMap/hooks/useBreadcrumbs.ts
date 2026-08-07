import { useCallback, useMemo } from 'react';
import { CityMarker, CountryMarker, StateMarker, StoreMarker, isUSA } from '../types';

export interface Breadcrumb {
  label: string;
  onClick?: () => void;
}

interface UseBreadcrumbsParams {
  selectedCountry: CountryMarker | null;
  selectedState: StateMarker | null;
  selectedCity: CityMarker | null;
  selectedStore: StoreMarker | null;
  navigateToWorld: () => void;
  navigateToCountryOrStates: () => void;
  navigateToState: () => void;
  handleStoreSelect: (store: StoreMarker) => void;
}

/** Builds the breadcrumb trail (World → Country → State → City → Store) for the current selection. */
export const useBreadcrumbs = ({
  selectedCountry,
  selectedState,
  selectedCity,
  selectedStore,
  navigateToWorld,
  navigateToCountryOrStates,
  navigateToState,
  handleStoreSelect,
}: UseBreadcrumbsParams): Breadcrumb[] => {
  const handleStoreBreadcrumbClick = useCallback(() => {
    if (selectedStore && selectedCity) handleStoreSelect(selectedStore);
  }, [handleStoreSelect, selectedCity, selectedStore]);

  return useMemo(() => {
    const crumbs: Breadcrumb[] = [{ label: 'World', onClick: navigateToWorld }];

    if (selectedCountry) {
      const label = isUSA(selectedCountry) ? 'United States' : selectedCountry.name || 'Country';
      crumbs.push({ label, onClick: navigateToCountryOrStates });
    }

    if (selectedState) {
      crumbs.push({
        label: selectedState.name || selectedState.stateCode || 'State',
        onClick: navigateToState,
      });
    }

    if (selectedCity) {
      crumbs.push({ label: selectedCity.name || 'City' });
    }

    if (selectedStore) {
      crumbs.push({ label: selectedStore.name, onClick: handleStoreBreadcrumbClick });
    }

    return crumbs;
  }, [
    navigateToWorld,
    navigateToCountryOrStates,
    navigateToState,
    selectedCountry,
    selectedState,
    selectedCity,
    selectedStore,
    handleStoreBreadcrumbClick,
  ]);
};
