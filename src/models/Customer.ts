/** Location filter payload shared by the LocationSwitcher, Redux and the map. */
export type LocationLevel = 'Region' | 'Country' | 'State' | 'City' | 'Store' | 'Store Nbr';

export interface ICustomerLocation {
  displayName: string;
  value: string;
  level: LocationLevel;
  countryCode?: string;
  stateCode?: string;
  cityName?: string;
}
