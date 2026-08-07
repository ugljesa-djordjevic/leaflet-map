/**
 * Raw Cosmos DB record shapes returned by the location-map Azure Functions
 * (see location-map/map-*.ts for the SELECT column lists these mirror).
 */

export interface IGeoPosition {
  type: 'Point';
  /** GeoJSON order: [longitude, latitude]. */
  coordinates: number[];
}

export interface IMapCountry {
  id: string;
  organizationId: string;
  customerNbr: string;
  countryCode: string;
  percentAvailable: number;
  geoPosition: IGeoPosition;
}

export interface IMapState {
  stateCode: string;
  stateName: string;
  countryCode: string;
  percentAvailable: number;
  geoPosition: IGeoPosition;
}

export interface IMapCity {
  cityName: string;
  stateCode?: string;
  stateName: string;
  countryCode: string;
  percentAvailable: number;
  geoPosition: IGeoPosition;
}

export interface IMapSite {
  id: string;
  organizationId: string;
  customerNbr: string;
  customerSiteNbr: string;
  storeNbr: string;
  storeName: string;
  cityName: string;
  stateName: string;
  stateCode?: string;
  countryCode: string;
  siteId: string;
  percentAvailable: number;
  geoPosition: IGeoPosition;
}

/** Marker model shared with other dashboard widgets. */
export interface StoresMarker {
  id: string;
  name: string;
  availability: number;
  lat: number;
  lng: number;
}

export type { ICustomerLocation, LocationLevel } from './Customer';
