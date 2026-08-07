import { MenuItem, TextField } from '@mui/material';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  locationFilterChanged,
  selectCurrentLocationFilter,
} from 'src/store/slices/dashboardFiltersSlice';
import { ICustomerLocation } from 'src/models/Customer';

/**
 * Preview stand-in for the host app's LocationSwitcher: a small preset list
 * covering every filter level, dispatching the same Redux action the real
 * switcher uses — exercises the filter→map sync paths (useFilterSync /
 * usePendingNavigation) end to end.
 */

const PRESETS: Array<{ key: string; label: string; location: ICustomerLocation | null }> = [
  { key: 'all', label: 'All locations', location: null },
  {
    key: 'country-usa',
    label: 'United States (Country)',
    location: { displayName: 'United States', value: 'USA', level: 'Country' },
  },
  {
    key: 'country-deu',
    label: 'Germany (Country)',
    location: { displayName: 'Germany', value: 'DEU', level: 'Country' },
  },
  {
    key: 'state-tx',
    label: 'Texas (State)',
    location: { displayName: 'Texas', value: 'TX', level: 'State', countryCode: 'USA' },
  },
  {
    key: 'city-seattle',
    label: 'Seattle (City)',
    location: {
      displayName: 'Seattle',
      value: 'Seattle',
      level: 'City',
      countryCode: 'USA',
      stateCode: 'WA',
    },
  },
  {
    key: 'city-london',
    label: 'London (City)',
    location: { displayName: 'London', value: 'London', level: 'City', countryCode: 'GBR' },
  },
  {
    key: 'store-9901',
    label: 'New York City #9901 (Store)',
    location: {
      displayName: 'New York City #9901',
      value: '9901',
      level: 'Store',
      countryCode: 'USA',
      stateCode: 'NY',
      cityName: 'New York City',
    },
  },
];

export const LocationSwitcher = () => {
  const dispatch = useAppDispatch();
  const filter = useAppSelector(selectCurrentLocationFilter);

  const selectedKey =
    PRESETS.find((p) => p.location?.value === filter?.value && p.location?.level === filter?.level)
      ?.key ?? 'all';

  return (
    <TextField
      select
      size='small'
      label='Location'
      value={selectedKey}
      onChange={(event) => {
        const preset = PRESETS.find((p) => p.key === event.target.value);
        dispatch(locationFilterChanged(preset?.location ?? null));
      }}
      sx={{ minWidth: 260 }}
    >
      {PRESETS.map((preset) => (
        <MenuItem key={preset.key} value={preset.key}>
          {preset.label}
        </MenuItem>
      ))}
    </TextField>
  );
};
