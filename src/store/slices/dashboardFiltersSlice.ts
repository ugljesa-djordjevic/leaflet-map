import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICustomerLocation } from 'src/models/Customer';

interface DashboardFiltersState {
  currentLocationFilter: ICustomerLocation | null;
}

const initialState: DashboardFiltersState = {
  currentLocationFilter: null,
};

/** Preview copy of the host app's dashboard filters slice (location only). */
const dashboardFiltersSlice = createSlice({
  name: 'dashboardFilters',
  initialState,
  reducers: {
    locationFilterChanged: (state, action: PayloadAction<ICustomerLocation | null>) => {
      state.currentLocationFilter = action.payload;
    },
  },
});

export const { locationFilterChanged } = dashboardFiltersSlice.actions;

export const selectCurrentLocationFilter = (state: {
  dashboardFilters: DashboardFiltersState;
}): ICustomerLocation | null => state.dashboardFilters.currentLocationFilter;

export const dashboardFiltersReducer = dashboardFiltersSlice.reducer;
