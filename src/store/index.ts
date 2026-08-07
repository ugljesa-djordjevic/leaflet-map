import { configureStore } from '@reduxjs/toolkit';
import { dashboardFiltersReducer } from './slices/dashboardFiltersSlice';
import { locationMapApi } from 'src/services/locationMapService';

export const store = configureStore({
  reducer: {
    dashboardFilters: dashboardFiltersReducer,
    [locationMapApi.reducerPath]: locationMapApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(locationMapApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
