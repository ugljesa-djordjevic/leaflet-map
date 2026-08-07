import { useMemo } from 'react';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';
import { HeaderTitle, NoData } from 'src/modules/shared/components';
import { CircularProgressWithContent } from '../CircularProgressWithContent';
import { LocationMapAvailabilityWidgetItem } from './LocationMapAvailabilityWidgetItem';
import { useMapDataContext, useMapHoverContext } from './MapContext';
import { getAvailabilityStatus } from './availability';
import { COUNTRY_LIST_LIMIT, Z_INDEX } from './mapConstants';
import { CityMarker, CountryMarker, MapView, StateMarker, StoreMarker } from './types';

type WidgetItem = {
  id: string;
  name: string;
  availability: number;
  onClick: () => void;
};

type Props = {
  view: MapView;
  itemsPerPage: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  countries: CountryMarker[];
  usaStates: StateMarker[];
  cities: CityMarker[];
  stores: StoreMarker[];
  selectedCountry: CountryMarker | null;
  selectedState: StateMarker | null;
  selectedCity: CityMarker | null;
  isNoData?: boolean;
};

const averageAvailability = (items: { availability: number }[]): number | null =>
  items.length
    ? Math.round(items.reduce((sum, item) => sum + item.availability, 0) / items.length)
    : null;

export const LocationMapAvailabilityWidget = ({
  view,
  itemsPerPage,
  page,
  setPage,
  countries,
  usaStates,
  cities,
  stores,
  selectedCountry,
  selectedState,
  selectedCity,
  isNoData = false,
}: Props) => {
  const theme = useTheme();
  const { hoveredId, setHoveredId } = useMapHoverContext();
  const { onCountryClick, onStateClick, onCityClick, onStoreClick } = useMapDataContext();

  /** The marker list backing the current view. */
  const activeMarkers = useMemo(() => {
    if (view === 'city') return stores;
    if (view === 'country') return cities;
    if (view === 'usa-states') return usaStates;
    return countries;
  }, [view, stores, cities, usaStates, countries]);

  const overallAvailability = useMemo(() => averageAvailability(activeMarkers), [activeMarkers]);

  const currentTitle = useMemo(() => {
    if (view === 'city' && selectedCity) return selectedCity.name;
    if (view === 'country' && selectedState) return selectedState.name;
    if (view === 'country' && selectedCountry) return selectedCountry.name;
    if (view === 'usa-states') return 'United States';
    return 'World';
  }, [view, selectedCountry, selectedState, selectedCity]);

  const listItems = useMemo<WidgetItem[]>(() => {
    const toItem = (
      marker: { id: string; name: string; availability: number },
      onClick: () => void
    ): WidgetItem => ({
      id: marker.id,
      name: marker.name,
      availability: marker.availability,
      onClick,
    });

    if (view === 'city') return stores.map((s) => toItem(s, () => onStoreClick(s)));
    if (view === 'usa-states') return usaStates.map((s) => toItem(s, () => onStateClick(s)));
    if (view === 'country') return cities.map((c) => toItem(c, () => onCityClick(c)));
    return countries.map((c) => toItem(c, () => onCountryClick(c))).slice(0, COUNTRY_LIST_LIMIT);
  }, [
    view,
    stores,
    usaStates,
    cities,
    countries,
    onStoreClick,
    onStateClick,
    onCityClick,
    onCountryClick,
  ]);

  const sortedItems = useMemo(
    () => [...listItems].sort((a, b) => a.availability - b.availability),
    [listItems]
  );
  const paginatedItems = useMemo(
    () => sortedItems.slice(page * itemsPerPage, (page + 1) * itemsPerPage),
    [sortedItems, page, itemsPerPage]
  );
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const hasNoData = isNoData || overallAvailability === null;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '283px',
        backgroundColor: theme.palette.background.paper,
        border: 1,
        borderColor: theme.palette.divider,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ padding: '0 8px 6px 8px' }}>
        <HeaderTitle title='AVAILABILITY' subTitle={view === 'world' ? 'REGIONS' : currentTitle} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!hasNoData && (
            <>
              <CircularProgressWithContent value={overallAvailability!} content={''} />
              <Typography variant='display1'>{overallAvailability}%</Typography>
            </>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          borderTop: 1,
          borderColor: theme.palette.divider,
          borderRadius: '4px',
          flex: 1,
          overflow: 'auto',
          ...(hasNoData && { display: 'flex', justifyContent: 'center', alignItems: 'center' }),
        }}
      >
        {hasNoData ? (
          <NoData />
        ) : (
          <>
            <Box sx={{ p: '6px 16px' }}>
              <Typography variant='overline'>OVERALL DEVICE AVAILABILITY</Typography>
            </Box>
            <Box sx={{ pb: '52px' }}>
              {paginatedItems.map((item) => (
                <LocationMapAvailabilityWidgetItem
                  key={item.id}
                  item={item}
                  status={getAvailabilityStatus(item.availability)}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  isHovered={hoveredId === item.id}
                />
              ))}
            </Box>

            <Box
              sx={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '52px',
                pl: '24px',
                pr: '6px',
                borderTop: 1,
                borderColor: theme.palette.divider,
                backgroundColor: theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: Z_INDEX.sidebarFooter,
              }}
            >
              <Typography>
                {page * itemsPerPage + 1}–{Math.min((page + 1) * itemsPerPage, sortedItems.length)}{' '}
                of {sortedItems.length}
              </Typography>
              <Box sx={{ pl: '20px' }}>
                <Button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  sx={{
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                    borderRadius: 1,
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <ChevronLeftOutlined fontSize='small' />
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  sx={{
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                    borderRadius: 1,
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                >
                  <ChevronRightOutlined fontSize='small' />
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};
