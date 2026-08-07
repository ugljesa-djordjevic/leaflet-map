import { IMapCity, IMapCountry, IMapSite, IMapState } from 'src/models';

/**
 * Deterministic mock estate mirroring the Cosmos containers the Azure
 * Functions query. Countries/states/cities are hand-seeded; sites are
 * generated per city with a seeded PRNG so every reload looks identical.
 */

const geo = (lat: number, lng: number) => ({
  type: 'Point' as const,
  coordinates: [lng, lat], // GeoJSON order
});

/** mulberry32 — tiny deterministic PRNG. */
const makeRandom = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

type CountrySeed = [code: string, lat: number, lng: number, availability: number];

const COUNTRY_SEEDS: CountrySeed[] = [
  ['USA', 39.8, -98.6, 87],
  ['CAN', 56.1, -106.3, 91],
  ['MEX', 23.6, -102.5, 74],
  ['BRA', -14.2, -51.9, 68],
  ['GBR', 54.0, -2.5, 93],
  ['IRL', 53.4, -8.2, 96],
  ['FRA', 46.6, 2.2, 82],
  ['DEU', 51.2, 10.4, 89],
  ['ESP', 40.4, -3.7, 77],
  ['ITA', 42.8, 12.8, 63],
  ['SWE', 62.2, 17.6, 95],
  ['POL', 52.1, 19.4, 84],
  ['ZAF', -30.6, 22.9, 55],
  ['IND', 21.0, 78.0, 71],
  ['JPN', 36.2, 138.3, 97],
  ['AUS', -25.3, 133.8, 88],
];

export const mockCountries: IMapCountry[] = COUNTRY_SEEDS.map(([code, lat, lng, availability]) => ({
  id: `country-${code}`,
  organizationId: 'org-ncr-preview',
  customerNbr: '100045',
  countryCode: code,
  percentAvailable: availability,
  geoPosition: geo(lat, lng),
}));

// ---------------------------------------------------------------------------
// USA states
// ---------------------------------------------------------------------------

type StateSeed = [code: string, name: string, lat: number, lng: number, availability: number];

const STATE_SEEDS: StateSeed[] = [
  ['CA', 'California', 36.78, -119.42, 82],
  ['TX', 'Texas', 31.0, -99.9, 90],
  ['NY', 'New York', 42.9, -75.5, 76],
  ['FL', 'Florida', 27.99, -81.76, 88],
  ['WA', 'Washington', 47.4, -120.5, 94],
  ['IL', 'Illinois', 40.0, -89.2, 71],
  ['GA', 'Georgia', 32.9, -83.4, 85],
  ['CO', 'Colorado', 39.1, -105.4, 92],
  ['AZ', 'Arizona', 34.2, -111.6, 66],
  ['NC', 'North Carolina', 35.6, -79.4, 79],
  ['OH', 'Ohio', 40.4, -82.8, 58],
  ['PA', 'Pennsylvania', 41.0, -77.6, 83],
];

export const mockStates: IMapState[] = STATE_SEEDS.map(([code, name, lat, lng, availability]) => ({
  stateCode: code,
  stateName: name,
  countryCode: 'USA',
  percentAvailable: availability,
  geoPosition: geo(lat, lng),
}));

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

type CitySeed = [
  country: string,
  name: string,
  lat: number,
  lng: number,
  availability: number,
  stateCode?: string,
  stateName?: string,
];

const CITY_SEEDS: CitySeed[] = [
  // USA — keyed to states
  ['USA', 'Los Angeles', 34.05, -118.24, 78, 'CA', 'California'],
  ['USA', 'San Francisco', 37.77, -122.42, 85, 'CA', 'California'],
  ['USA', 'Sacramento', 38.58, -121.49, 90, 'CA', 'California'],
  ['USA', 'Houston', 29.76, -95.37, 92, 'TX', 'Texas'],
  ['USA', 'Dallas', 32.78, -96.8, 88, 'TX', 'Texas'],
  ['USA', 'Austin', 30.27, -97.74, 95, 'TX', 'Texas'],
  ['USA', 'New York City', 40.71, -74.01, 72, 'NY', 'New York'],
  ['USA', 'Buffalo', 42.89, -78.88, 81, 'NY', 'New York'],
  ['USA', 'Miami', 25.76, -80.19, 86, 'FL', 'Florida'],
  ['USA', 'Orlando', 28.54, -81.38, 91, 'FL', 'Florida'],
  ['USA', 'Seattle', 47.61, -122.33, 96, 'WA', 'Washington'],
  ['USA', 'Spokane', 47.66, -117.43, 89, 'WA', 'Washington'],
  ['USA', 'Chicago', 41.88, -87.63, 68, 'IL', 'Illinois'],
  ['USA', 'Atlanta', 33.75, -84.39, 84, 'GA', 'Georgia'],
  ['USA', 'Denver', 39.74, -104.99, 93, 'CO', 'Colorado'],
  ['USA', 'Phoenix', 33.45, -112.07, 62, 'AZ', 'Arizona'],
  ['USA', 'Charlotte', 35.23, -80.84, 80, 'NC', 'North Carolina'],
  ['USA', 'Columbus', 39.96, -83.0, 54, 'OH', 'Ohio'],
  ['USA', 'Philadelphia', 39.95, -75.17, 82, 'PA', 'Pennsylvania'],
  // Canada
  ['CAN', 'Toronto', 43.65, -79.38, 92],
  ['CAN', 'Vancouver', 49.28, -123.12, 94],
  ['CAN', 'Montreal', 45.5, -73.57, 87],
  ['CAN', 'Calgary', 51.04, -114.07, 89],
  // Mexico
  ['MEX', 'Mexico City', 19.43, -99.13, 76],
  ['MEX', 'Guadalajara', 20.66, -103.35, 71],
  ['MEX', 'Monterrey', 25.69, -100.32, 74],
  // Brazil
  ['BRA', 'Sao Paulo', -23.55, -46.63, 70],
  ['BRA', 'Rio de Janeiro', -22.91, -43.17, 64],
  ['BRA', 'Brasilia', -15.79, -47.88, 69],
  // UK
  ['GBR', 'London', 51.51, -0.13, 94],
  ['GBR', 'Manchester', 53.48, -2.24, 91],
  ['GBR', 'Edinburgh', 55.95, -3.19, 95],
  ['GBR', 'Birmingham', 52.49, -1.89, 90],
  // Ireland
  ['IRL', 'Dublin', 53.35, -6.26, 96],
  ['IRL', 'Cork', 51.9, -8.47, 97],
  // France
  ['FRA', 'Paris', 48.86, 2.35, 84],
  ['FRA', 'Lyon', 45.76, 4.84, 80],
  ['FRA', 'Marseille', 43.3, 5.37, 78],
  // Germany
  ['DEU', 'Berlin', 52.52, 13.41, 90],
  ['DEU', 'Munich', 48.14, 11.58, 92],
  ['DEU', 'Hamburg', 53.55, 9.99, 86],
  ['DEU', 'Frankfurt', 50.11, 8.68, 88],
  // Spain
  ['ESP', 'Madrid', 40.42, -3.7, 79],
  ['ESP', 'Barcelona', 41.39, 2.17, 75],
  ['ESP', 'Valencia', 39.47, -0.38, 77],
  // Italy
  ['ITA', 'Rome', 41.9, 12.5, 65],
  ['ITA', 'Milan', 45.46, 9.19, 61],
  ['ITA', 'Naples', 40.85, 14.27, 58],
  // Sweden
  ['SWE', 'Stockholm', 59.33, 18.07, 96],
  ['SWE', 'Gothenburg', 57.71, 11.97, 94],
  // Poland
  ['POL', 'Warsaw', 52.23, 21.01, 85],
  ['POL', 'Krakow', 50.06, 19.94, 83],
  // South Africa
  ['ZAF', 'Johannesburg', -26.2, 28.05, 57],
  ['ZAF', 'Cape Town', -33.92, 18.42, 53],
  // India
  ['IND', 'Mumbai', 19.08, 72.88, 73],
  ['IND', 'Delhi', 28.61, 77.21, 69],
  ['IND', 'Bengaluru', 12.97, 77.59, 75],
  // Japan
  ['JPN', 'Tokyo', 35.68, 139.69, 98],
  ['JPN', 'Osaka', 34.69, 135.5, 96],
  ['JPN', 'Nagoya', 35.18, 136.91, 97],
  // Australia
  ['AUS', 'Sydney', -33.87, 151.21, 89],
  ['AUS', 'Melbourne', -37.81, 144.96, 87],
  ['AUS', 'Brisbane', -27.47, 153.03, 90],
];

export const mockCities: IMapCity[] = CITY_SEEDS.map(
  ([countryCode, cityName, lat, lng, availability, stateCode, stateName]) => ({
    cityName,
    countryCode,
    stateCode,
    stateName: stateName ?? '',
    percentAvailable: availability,
    geoPosition: geo(lat, lng),
  })
);

// ---------------------------------------------------------------------------
// Sites (generated per city, deterministic)
// ---------------------------------------------------------------------------

const buildSites = (): IMapSite[] => {
  const sites: IMapSite[] = [];
  let siteCounter = 1000;

  CITY_SEEDS.forEach(([countryCode, cityName, lat, lng, cityAvailability, stateCode, stateName], cityIndex) => {
    const rand = makeRandom(cityIndex + 1);
    const count = 5 + Math.floor(rand() * 9); // 5–13 stores per city

    for (let i = 0; i < count; i++) {
      siteCounter += 1;
      const storeNbr = String(siteCounter);
      // Availability clusters around the city's own number, with outliers.
      const spread = rand();
      const availability =
        spread < 0.12
          ? Math.round(10 + rand() * 25) // occasional critical store
          : Math.min(100, Math.max(5, Math.round(cityAvailability + (rand() - 0.5) * 24)));

      sites.push({
        id: `site-${storeNbr}`,
        organizationId: 'org-ncr-preview',
        customerNbr: '100045',
        customerSiteNbr: `CS-${storeNbr}`,
        storeNbr,
        storeName: `${cityName} #${storeNbr}`,
        cityName,
        stateName: stateName ?? '',
        stateCode,
        countryCode,
        siteId: `SITE-${storeNbr}`,
        percentAvailable: availability,
        geoPosition: geo(lat + (rand() - 0.5) * 0.12, lng + (rand() - 0.5) * 0.12),
      });
    }
  });

  // Two co-located stores (same mall) in New York City — exercises the
  // overlapping-marker fan-out that replaces markercluster's spiderfy.
  const nyc = CITY_SEEDS.find(([, name]) => name === 'New York City')!;
  const colocated: Array<[string, number]> = [
    ['9901', 44],
    ['9902', 83],
  ];
  colocated.forEach(([storeNbr, availability]) => {
    sites.push({
      id: `site-${storeNbr}`,
      organizationId: 'org-ncr-preview',
      customerNbr: '100045',
      customerSiteNbr: `CS-${storeNbr}`,
      storeNbr,
      storeName: `New York City #${storeNbr}`,
      cityName: 'New York City',
      stateName: 'New York',
      stateCode: 'NY',
      countryCode: 'USA',
      siteId: `SITE-${storeNbr}`,
      percentAvailable: availability,
      geoPosition: geo(nyc[2] + 0.012, nyc[3] + 0.012),
    });
  });

  return sites;
};

export const mockSites: IMapSite[] = buildSites();
